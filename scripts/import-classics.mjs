import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Seed the catalog with real, full-length public-domain classics from Project
// Gutenberg. Legal, free, complete books with real chapters — so the store
// reads as a real store, not a demo.
//
//   node scripts/import-classics.mjs         # fetch + import into Supabase
//   node scripts/import-classics.mjs --dry   # fetch + parse only, no DB writes
const DRY = process.argv.includes("--dry");

const ROOT = "C:/xampp/htdocs/Libry/web";
const env = readFileSync(ROOT + "/.env.local", "utf8");
const key = (env.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(\S+)/) || [])[1];
const url = (env.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(\S+)/) || [])[1];

// Curated set — id is the Libry book id (301+), gid is the Gutenberg ebook id.
const CLASSICS = [
  { id: 301, gid: 1342, title: "Pride and Prejudice", author: "Jane Austen", category: "Romance",
    description: "Elizabeth Bennet and the proud Mr. Darcy spar their way toward one of literature's most beloved romances. Wit, class, and the slow undoing of first impressions." },
  { id: 302, gid: 1661, title: "The Adventures of Sherlock Holmes", author: "Arthur Conan Doyle", category: "Mystery",
    description: "Twelve cases for the world's greatest detective. Deduction, disguise, and the fog of Victorian London, narrated by the faithful Dr. Watson." },
  { id: 303, gid: 84, title: "Frankenstein", author: "Mary Shelley", category: "Horror",
    description: "A young scientist gives life to a creature he cannot love — and cannot escape. The original story of ambition, abandonment, and the price of playing god." },
  { id: 304, gid: 345, title: "Dracula", author: "Bram Stoker", category: "Horror",
    description: "Told in letters and diaries, the tale of a count who leaves his Carpathian castle for England — and the handful of souls who realise what he is." },
  { id: 305, gid: 11, title: "Alice's Adventures in Wonderland", author: "Lewis Carroll", category: "Fantasy",
    description: "Down the rabbit hole and into a world with its own impossible logic. Nonsense, riddles, and a very late white rabbit." },
  { id: 306, gid: 174, title: "The Picture of Dorian Gray", author: "Oscar Wilde", category: "Literary",
    description: "A portrait ages while its beautiful subject does not. Wilde's only novel — a glittering, poisonous study of vanity and its cost." },
  { id: 307, gid: 98, title: "A Tale of Two Cities", author: "Charles Dickens", category: "Historical",
    description: "London and Paris on the eve of revolution. Sacrifice, resurrection, and the best and worst of times." },
  { id: 308, gid: 1260, title: "Jane Eyre", author: "Charlotte Brontë", category: "Romance",
    description: "An orphan grows into a governess, and into her own fierce conscience, at the shadowed house of Thornfield. A love story with a will of iron." },
  { id: 309, gid: 76, title: "Adventures of Huckleberry Finn", author: "Mark Twain", category: "Adventure",
    description: "A boy and a runaway man raft down the Mississippi, and America looks at itself. Funny, wrenching, and endlessly quoted." },
  { id: 310, gid: 35, title: "The Time Machine", author: "H. G. Wells", category: "Science Fiction",
    description: "A Victorian inventor travels to the year 802,701 and finds humanity split in two. The book that launched the time-travel story." },
  { id: 311, gid: 36, title: "The War of the Worlds", author: "H. G. Wells", category: "Science Fiction",
    description: "Cylinders fall from Mars, and the might of Empire proves useless. The template for every alien-invasion story since." },
  { id: 312, gid: 1952, title: "The Yellow Wallpaper", author: "Charlotte Perkins Gilman", category: "Literary",
    description: "A woman confined for her own good writes in secret, and watches the wallpaper. A short, chilling landmark of feminist fiction." },
  { id: 313, gid: 43, title: "The Strange Case of Dr Jekyll and Mr Hyde", author: "Robert Louis Stevenson", category: "Horror",
    description: "A respectable doctor, a monstrous double, and the potion between them. The story that gave us a phrase for the divided self." },
  { id: 314, gid: 55, title: "The Wonderful Wizard of Oz", author: "L. Frank Baum", category: "Fantasy",
    description: "A Kansas cyclone, a yellow brick road, and a wizard who isn't what he seems. The first great American fairy tale." },
  { id: 315, gid: 2701, title: "Moby-Dick", author: "Herman Melville", category: "Adventure",
    description: "Call me Ishmael. One captain's ruinous hunt for the white whale — an obsession that swallows a whole ship. Vast, strange, and unforgettable." },
];

const UA = { headers: { "User-Agent": "Mozilla/5.0 (LibryCatalogSeed/1.0)" } };

async function fetchText(gid) {
  const urls = [
    `https://www.gutenberg.org/cache/epub/${gid}/pg${gid}.txt`,
    `https://www.gutenberg.org/files/${gid}/${gid}-0.txt`,
    `https://www.gutenberg.org/ebooks/${gid}.txt.utf-8`,
  ];
  for (const u of urls) {
    try {
      const r = await fetch(u, UA);
      if (r.ok) {
        const t = await r.text();
        if (t && t.length > 2000) return t;
      }
    } catch { /* try next */ }
  }
  return null;
}

// Strip Gutenberg boilerplate and rewrap hard-wrapped lines into clean
// paragraphs separated by blank lines (which is what the reader splits on).
function clean(raw) {
  let t = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const start = t.search(/\*\*\*\s*START OF TH(E|IS) PROJECT GUTENBERG[^\n]*\*\*\*/i);
  if (start !== -1) t = t.slice(t.indexOf("\n", start) + 1);
  const end = t.search(/\*\*\*\s*END OF TH(E|IS) PROJECT GUTENBERG[^\n]*\*\*\*/i);
  if (end !== -1) t = t.slice(0, end);
  // drop a leading "Produced by ..." credit line if present
  t = t.replace(/^\s*Produced by[^\n]*\n/i, "");
  const blocks = t
    .split(/\n[ \t]*\n/)
    .map((b) => b.replace(/\n+/g, " ").replace(/[ \t]{2,}/g, " ").trim())
    .filter(Boolean);
  return blocks.join("\n\n").trim();
}

function estimatePages(content) {
  // ~275 words per printed page — a realistic page count for the card.
  const words = content.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 275));
}

const rows = [];
for (const c of CLASSICS) {
  process.stdout.write(`Fetching #${c.id} ${c.title} (gutenberg ${c.gid})… `);
  const raw = await fetchText(c.gid);
  if (!raw) { console.log("FAILED to download — skipped."); continue; }
  const content = clean(raw);
  const firstPara = (content.split("\n\n").find((p) => p.length > 80) || content).slice(0, 200).trim();
  console.log(`ok (${(content.length / 1000).toFixed(0)}k chars, ~${estimatePages(content)} pages)`);
  rows.push({
    id: c.id, title: c.title, author: c.author, price: 0, type: "Fiction",
    category: c.category, is_free: true, description: c.description,
    sneak_peek: firstPara + "…", content, pages: estimatePages(content),
    status: "Completed", language: "English", rating: 0, reviews: 0,
    created_by: c.author, age_rating: "Everyday",
  });
  await new Promise((r) => setTimeout(r, 600)); // be polite to Gutenberg
}

console.log(`\nParsed ${rows.length}/${CLASSICS.length} classics.`);

if (DRY) { console.log("Dry run — no database writes."); process.exit(0); }

if (!key || !url) { console.error("Missing SUPABASE creds in .env.local"); process.exit(1); }
const supabase = createClient(url, key, { auth: { persistSession: false } });

// Try full payload; fall back if optional columns / status value aren't accepted.
async function upsert(payload) {
  return supabase.from("books").upsert(payload, { onConflict: "id" }).select("id");
}
let payload = rows.map((r) => ({ ...r, is_published: true }));
let { data, error } = await upsert(payload);
if (error && /is_published/i.test(error.message)) {
  payload = rows;
  ({ data, error } = await upsert(payload));
}
if (error && /status/i.test(error.message)) {
  payload = payload.map((r) => ({ ...r, status: "Ongoing" }));
  ({ data, error } = await upsert(payload));
}
if (error) { console.error("IMPORT ERROR:", error.message, error.details || ""); process.exit(1); }
console.log(`Imported/updated ${data.length} classics:`, data.map((d) => d.id).join(", "));
