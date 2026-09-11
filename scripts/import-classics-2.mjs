import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Round 2: more full-length, public-domain classics, chosen to fill out the
// genres (Romance, Sci-Fi, Fantasy, Mystery, Horror, Adventure, Historical,
// Young Adult, Thriller). Run:  node scripts/import-classics-2.mjs
const ROOT = "C:/xampp/htdocs/Libry/web";
const env = readFileSync(ROOT + "/.env.local", "utf8");
const key = (env.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(\S+)/) || [])[1];
const url = (env.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(\S+)/) || [])[1];
if (!key || !url) { console.error("Missing SUPABASE creds in .env.local"); process.exit(1); }
const supabase = createClient(url, key, { auth: { persistSession: false } });

function parseBook(raw) {
  let t = raw.replace(/\r\n/g, "\n");
  const s = t.match(/\*\*\*\s*START OF (THE|THIS) PROJECT GUTENBERG EBOOK[^*]*\*\*\*/i);
  if (s) t = t.slice(s.index + s[0].length);
  const e = t.search(/\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG EBOOK/i);
  if (e > -1) t = t.slice(0, e);
  t = t.replace(/(CHAPTER\s+[IVXLCDM\d]+\b\.?)([ \t]*)\]/gi, "]$2$1");
  t = t.replace(/\[Illustration[\s\S]*?\]/g, "");
  t = t.replace(/_/g, "");

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

const CLASSICS = [
  { id: 320, gid: 161, title: "Sense and Sensibility", author: "Jane Austen", category: "Romance", rating: 4.6, desc: "The Dashwood sisters — sensible Elinor and passionate Marianne — navigate love and heartbreak in Austen's first novel." },
  { id: 321, gid: 158, title: "Emma", author: "Jane Austen", category: "Romance", rating: 4.6, desc: "A clever, well-meaning matchmaker keeps getting it wrong — most of all about her own heart." },
  { id: 322, gid: 514, title: "Little Women", author: "Louisa May Alcott", category: "Romance", rating: 4.7, desc: "The four March sisters grow up through love, loss and ambition in Alcott's beloved family classic." },
  { id: 323, gid: 45, title: "Anne of Green Gables", author: "L. M. Montgomery", category: "Young Adult", rating: 4.7, desc: "A red-haired orphan with a runaway imagination turns a quiet farm — and a whole town — upside down." },
  { id: 324, gid: 36, title: "The War of the Worlds", author: "H. G. Wells", category: "Sci-Fi", rating: 4.5, desc: "Martians land in England and humanity's reign is suddenly, terrifyingly over. The original alien invasion." },
  { id: 325, gid: 164, title: "Twenty Thousand Leagues Under the Sea", author: "Jules Verne", category: "Sci-Fi", rating: 4.5, desc: "Captain Nemo and the Nautilus voyage beneath the oceans in Verne's dazzling undersea adventure." },
  { id: 326, gid: 5230, title: "The Invisible Man", author: "H. G. Wells", category: "Sci-Fi", rating: 4.4, desc: "A scientist discovers invisibility — and slowly loses his mind — in Wells' chilling tale of power unchecked." },
  { id: 327, gid: 16, title: "Peter Pan", author: "J. M. Barrie", category: "Fantasy", rating: 4.6, desc: "Second star to the right and straight on till morning — to Neverland, pirates, and the boy who never grew up." },
  { id: 328, gid: 12, title: "Through the Looking-Glass", author: "Lewis Carroll", category: "Fantasy", rating: 4.6, desc: "Alice steps through the mirror into a backwards world of chess, talking flowers, and Jabberwocky." },
  { id: 329, gid: 2852, title: "The Hound of the Baskervilles", author: "Arthur Conan Doyle", category: "Mystery", rating: 4.8, desc: "A spectral hound stalks the moors and Sherlock Holmes takes his most famous case." },
  { id: 330, gid: 155, title: "The Moonstone", author: "Wilkie Collins", category: "Mystery", rating: 4.5, desc: "A cursed diamond vanishes and a country house fills with suspects — often called the first detective novel." },
  { id: 331, gid: 43, title: "The Strange Case of Dr. Jekyll and Mr. Hyde", author: "Robert Louis Stevenson", category: "Horror", rating: 4.5, desc: "A respectable doctor and a monstrous stranger share one terrible secret." },
  { id: 332, gid: 120, title: "Treasure Island", author: "Robert Louis Stevenson", category: "Adventure", rating: 4.6, desc: "A map, a one-legged cook, and a boy's voyage after buried gold. The pirate adventure." },
  { id: 333, gid: 215, title: "The Call of the Wild", author: "Jack London", category: "Adventure", rating: 4.6, desc: "Stolen from a sunny ranch into the frozen North, a dog named Buck answers the ancient call of the wild." },
  { id: 334, gid: 103, title: "Around the World in Eighty Days", author: "Jules Verne", category: "Adventure", rating: 4.5, desc: "A cool-headed gentleman wagers his fortune on a breathless race around the globe." },
  { id: 335, gid: 98, title: "A Tale of Two Cities", author: "Charles Dickens", category: "Historical", rating: 4.6, desc: "Love and sacrifice across London and revolutionary Paris — \u201cit was the best of times, it was the worst of times.\u201d" },
  { id: 336, gid: 558, title: "The Thirty-Nine Steps", author: "John Buchan", category: "Thriller", rating: 4.3, desc: "An ordinary man, a dead spy, and a race across the moors one step ahead of a shadowy conspiracy." },
];

let ok = 0;
for (const c of CLASSICS) {
  try {
    const res = await fetch(`https://www.gutenberg.org/cache/epub/${c.gid}/pg${c.gid}.txt`, {
      headers: { "User-Agent": "Mozilla/5.0 LibryImport/1.0" },
    });
    if (!res.ok) { console.error(`  ✗ ${c.title}: HTTP ${res.status}`); continue; }
    const { chapters, content } = parseBook(await res.text());
    if (chapters < 2 || content.length < 15000) { console.error(`  ✗ ${c.title}: parse looked wrong (${chapters} ch, ${content.length}c)`); continue; }

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
      const { is_published, age_rating, sneak_peek, ...lean } = payload;
      ({ error } = await supabase.from("books").upsert(lean, { onConflict: "id" }));
    }
    if (error) { console.error(`  ✗ ${c.title}: ${error.message}`); continue; }

    console.log(`  ✓ ${c.title} [${c.category}] — ${chapters} chapters, ${(content.length / 1000).toFixed(0)}k`);
    ok++;
    await new Promise((r) => setTimeout(r, 400));
  } catch (e) {
    console.error(`  ✗ ${c.title}: ${e.message}`);
  }
}

console.log(`\nImported ${ok}/${CLASSICS.length} more classics (ids 320+).`);
process.exit(0);
