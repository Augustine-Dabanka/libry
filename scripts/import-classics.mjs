import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Seeds the catalog with real, full-length, public-domain classics from Project
// Gutenberg. Fetches each book, parses it into clean chapters, and upserts it as
// a free, published title. Run:  node scripts/import-classics.mjs
const ROOT = "C:/xampp/htdocs/Libry/web";
const env = readFileSync(ROOT + "/.env.local", "utf8");
const key = (env.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(\S+)/) || [])[1];
const url = (env.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(\S+)/) || [])[1];
if (!key || !url) { console.error("Missing SUPABASE creds in .env.local"); process.exit(1); }
const supabase = createClient(url, key, { auth: { persistSession: false } });

// ---- Robust Gutenberg parser -------------------------------------------------
// Handles "CHAPTER X" and roman-numeral heading styles, drops the table of
// contents / front matter by chapter-body length, frees headings trapped inside
// illustration brackets, un-wraps hard line breaks, and renumbers cleanly.
function parseBook(raw) {
  let t = raw.replace(/\r\n/g, "\n");
  const s = t.match(/\*\*\*\s*START OF (THE|THIS) PROJECT GUTENBERG EBOOK[^*]*\*\*\*/i);
  if (s) t = t.slice(s.index + s[0].length);
  const e = t.search(/\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG EBOOK/i);
  if (e > -1) t = t.slice(0, e);
  t = t.replace(/(CHAPTER\s+[IVXLCDM\d]+\b\.?)([ \t]*)\]/gi, "]$2$1"); // free trapped heading
  t = t.replace(/\[Illustration[\s\S]*?\]/g, "");                       // drop illustrations
  t = t.replace(/_/g, "");                                               // italic markers

  const blocks = t.split(/\n[ \t]*\n/)
    .map((b) => b.split("\n").map((l) => l.trim()).join(" ").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const heading = (b) => {
    if (b.length > 90) return null;
    if (/^chapter\b/i.test(b)) return { title: b.replace(/^chapter\s+[a-z0-9\-]+\.?\s*[-–—:.]*\s*/i, "").trim() };
    let m = b.match(/^([IVXLCDM]{1,7})\.\s*(.*)$/i);
    if (m) return { title: m[2].trim() };
    m = b.match(/^(\d{1,3})\.\s+(.+)$/);
    if (m) return { title: m[2].trim() };
    return null;
  };
  const marks = blocks.map((b) => ({ b, h: heading(b) }));

  const chapters = [];
  for (let i = 0; i < marks.length; i++) {
    if (!marks[i].h) continue;
    const body = [];
    let j = i + 1;
    for (; j < marks.length && !marks[j].h; j++) body.push(marks[j].b);
    const bodyText = body.join("\n\n");
    if (bodyText.length > 400) chapters.push({ title: marks[i].h.title, body: bodyText });
    i = j - 1;
  }
  const content = chapters.map((c, idx) => {
    const head = c.title ? `Chapter ${idx + 1} — ${c.title}` : `Chapter ${idx + 1}`;
    return `${head}\n\n${c.body}`;
  }).join("\n\n").trim();
  return { chapters: chapters.length, content };
}

// ---- The catalogue -----------------------------------------------------------
const CLASSICS = [
  { id: 301, gid: 1342, title: "Pride and Prejudice", author: "Jane Austen", category: "Romance", rating: 4.8, desc: "Elizabeth Bennet and the proud Mr. Darcy spar their way toward love in Austen's sparkling comedy of manners." },
  { id: 302, gid: 84, title: "Frankenstein", author: "Mary Shelley", category: "Horror", rating: 4.6, desc: "A young scientist creates life — and unleashes a tragedy — in Mary Shelley's founding work of science fiction." },
  { id: 303, gid: 345, title: "Dracula", author: "Bram Stoker", category: "Horror", rating: 4.6, desc: "Told in letters and journals, Count Dracula comes to England and a small band races to stop him. The vampire novel." },
  { id: 304, gid: 1661, title: "The Adventures of Sherlock Holmes", author: "Arthur Conan Doyle", category: "Mystery", rating: 4.8, desc: "Twelve classic cases for the world's greatest detective and his friend Dr. Watson." },
  { id: 305, gid: 11, title: "Alice's Adventures in Wonderland", author: "Lewis Carroll", category: "Fantasy", rating: 4.7, desc: "Down the rabbit-hole into a world of riddles, tea parties, and a very cross Queen." },
  { id: 306, gid: 174, title: "The Picture of Dorian Gray", author: "Oscar Wilde", category: "Fiction", rating: 4.6, desc: "A portrait ages while its beautiful subject does not — Wilde's dark fable of vanity and corruption." },
  { id: 307, gid: 1260, title: "Jane Eyre", author: "Charlotte Brontë", category: "Romance", rating: 4.7, desc: "An orphan governess, a brooding master, and a secret in the attic — Brontë's fierce, beloved romance." },
  { id: 308, gid: 74, title: "The Adventures of Tom Sawyer", author: "Mark Twain", category: "Adventure", rating: 4.5, desc: "Whitewashed fences, buried treasure, and boyhood mischief along the Mississippi." },
  { id: 309, gid: 1400, title: "Great Expectations", author: "Charles Dickens", category: "Fiction", rating: 4.6, desc: "A blacksmith's boy, a mysterious fortune, and the strange Miss Havisham — Dickens' tale of ambition and the heart." },
  { id: 310, gid: 35, title: "The Time Machine", author: "H. G. Wells", category: "Sci-Fi", rating: 4.5, desc: "A Victorian inventor travels to the year 802,701 — and far beyond — in Wells' pioneering time-travel novel." },
  { id: 311, gid: 55, title: "The Wonderful Wizard of Oz", author: "L. Frank Baum", category: "Fantasy", rating: 4.6, desc: "A cyclone, a yellow brick road, and a wizard who isn't quite what he seems." },
  { id: 312, gid: 768, title: "Wuthering Heights", author: "Emily Brontë", category: "Romance", rating: 4.5, desc: "Heathcliff and Catherine's wild, doomed love haunts the Yorkshire moors." },
];

let ok = 0;
for (const c of CLASSICS) {
  try {
    const res = await fetch(`https://www.gutenberg.org/cache/epub/${c.gid}/pg${c.gid}.txt`, {
      headers: { "User-Agent": "Mozilla/5.0 LibryImport/1.0" },
    });
    if (!res.ok) { console.error(`  ✗ ${c.title}: HTTP ${res.status}`); continue; }
    const { chapters, content } = parseBook(await res.text());
    if (chapters < 2 || content.length < 20000) { console.error(`  ✗ ${c.title}: parse looked wrong (${chapters} ch)`); continue; }

    const firstPara = content.split("\n").slice(2).find((l) => l.trim().length > 60) || "";
    const sneak = firstPara.slice(0, 200).trim() + (firstPara.length > 200 ? "…" : "");

    const row = {
      id: c.id, title: c.title, author: c.author, price: 0, type: "Fiction", category: c.category,
      is_free: true, description: c.desc, sneak_peek: sneak, content, pages: chapters,
      status: "Ongoing", language: "English", rating: c.rating, reviews: 0,
      created_by: c.author, age_rating: "Everyday",
    };

    let payload = { ...row, is_published: true };
    let { error } = await supabase.from("books").upsert(payload, { onConflict: "id" });
    if (error && /is_published|age_rating|category|sneak_peek|pages/i.test(error.message)) {
      // Retry without columns a leaner schema might not have.
      const { is_published, age_rating, sneak_peek, ...lean } = payload;
      ({ error } = await supabase.from("books").upsert(lean, { onConflict: "id" }));
    }
    if (error) { console.error(`  ✗ ${c.title}: ${error.message}`); continue; }

    console.log(`  ✓ ${c.title} — ${chapters} chapters, ${(content.length / 1000).toFixed(0)}k`);
    ok++;
    await new Promise((r) => setTimeout(r, 400)); // be polite to Gutenberg
  } catch (e) {
    console.error(`  ✗ ${c.title}: ${e.message}`);
  }
}

console.log(`\nImported ${ok}/${CLASSICS.length} classics as free, published titles (ids 301–312).`);
process.exit(ok === CLASSICS.length ? 0 : 1);
