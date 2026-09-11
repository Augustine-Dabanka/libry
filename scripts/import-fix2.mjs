import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const ROOT = "C:/xampp/htdocs/Libry/web";
const env = readFileSync(ROOT + "/.env.local", "utf8");
const key = (env.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(\S+)/) || [])[1];
const url = (env.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(\S+)/) || [])[1];
const supabase = createClient(url, key, { auth: { persistSession: false } });

// Enhanced parser: also detects ALL-CAPS section titles (Jekyll) and roman
// numerals with trailing dot-leaders (Treasure Island TOC lines are dropped by
// the body-length filter). Only used to fix the two that the main parser missed.
function parseBook(raw) {
  let t = raw.replace(/\r\n/g, "\n");
  const s = t.match(/\*\*\*\s*START OF (THE|THIS) PROJECT GUTENBERG EBOOK[^*]*\*\*\*/i);
  if (s) t = t.slice(s.index + s[0].length);
  const e = t.search(/\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG EBOOK/i);
  if (e > -1) t = t.slice(0, e);
  t = t.replace(/\[Illustration[\s\S]*?\]/g, "").replace(/_/g, "");

  const raw0 = t.split(/\n[ \t]*\n/)
    .map((b) => b.split("\n").map((l) => l.trim()).join(" ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  // Merge a lone numeral/roman block with the following short title block
  // ("1" + "The Old Sea-dog…" → "1. The Old Sea-dog…") — Treasure Island style.
  const blocks = [];
  for (let i = 0; i < raw0.length; i++) {
    if (/^([IVXLCDM]{1,7}|\d{1,3})$/i.test(raw0[i]) && raw0[i + 1] && raw0[i + 1].length <= 70 && /[A-Za-z]/.test(raw0[i + 1])) {
      blocks.push(`${raw0[i]}. ${raw0[i + 1]}`); i++;
    } else blocks.push(raw0[i]);
  }

  const heading = (b) => {
    if (b.length > 75) return null;
    if (/^chapter\b/i.test(b)) return { title: b.replace(/^chapter\s+[a-z0-9\-]+\.?\s*[-–—:.]*\s*/i, "").trim() };
    // Roman numeral heading: strip trailing dot-leaders + page numbers.
    let m = b.match(/^([IVXLCDM]{1,7})\.\s+(.+)$/i);
    if (m && /^[ivxlcdm]+$/i.test(m[1])) {
      const title = m[2].replace(/\s*\.{2,}.*$/, "").replace(/\s+\d+\s*$/, "").trim();
      if (title) return { title };
    }
    m = b.match(/^(\d{1,3})\.\s+(.+)$/);
    if (m) return { title: m[2].replace(/\s*\.{2,}.*$/, "").replace(/\s+\d+\s*$/, "").trim() };
    // ALL-CAPS section title (has a space, no sentence punctuation, all caps).
    const letters = b.replace(/[^A-Za-z]/g, "");
    if (letters.length >= 4 && letters === letters.toUpperCase() && /\s/.test(b) && !/[.!?,:;]$/.test(b) && b === b.toUpperCase()) {
      return { title: b.replace(/\s+/g, " ").trim() };
    }
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
    if (bodyText.length > 500) chapters.push({ title: marks[i].h.title, body: bodyText });
    i = j - 1;
  }
  const content = chapters.map((c, idx) => `Chapter ${idx + 1} — ${c.title}\n\n${c.body}`).join("\n\n").trim();
  return { chapters, count: chapters.length, content };
}

const BOOKS = [
  { id: 331, gid: 43, title: "The Strange Case of Dr. Jekyll and Mr. Hyde", author: "Robert Louis Stevenson", category: "Horror", rating: 4.5, desc: "A respectable doctor and a monstrous stranger share one terrible secret in Stevenson's classic of the divided self." },
  // Treasure Island (gid 120) omitted — its Gutenberg text doesn't separate
  // chapter headings from body text, so it won't chapter cleanly.
];

const DRY = process.argv.includes("--dry");
for (const c of BOOKS) {
  const res = await fetch(`https://www.gutenberg.org/cache/epub/${c.gid}/pg${c.gid}.txt`, { headers: { "User-Agent": "Mozilla/5.0" } });
  const { chapters, count, content } = parseBook(await res.text());
  console.log(`\n${c.title}: ${count} chapters, ${(content.length / 1000).toFixed(0)}k`);
  console.log("  titles:", chapters.slice(0, 4).map((x) => x.title).join(" | "));
  if (DRY) continue;
  if (count < 2 || content.length < 10000) { console.log("  ✗ skipped (parse looked wrong)"); continue; }
  const firstPara = content.split("\n").slice(2).find((l) => l.trim().length > 60) || "";
  const sneak = firstPara.slice(0, 200).trim() + (firstPara.length > 200 ? "…" : "");
  const payload = { id: c.id, title: c.title, author: c.author, price: 0, type: "Fiction", category: c.category, is_free: true, description: c.desc, sneak_peek: sneak, content, pages: count, status: "Ongoing", language: "English", rating: c.rating, reviews: 0, created_by: c.author, age_rating: "Everyday", is_published: true };
  const { error } = await supabase.from("books").upsert(payload, { onConflict: "id" });
  console.log(error ? `  ✗ ${error.message}` : `  ✓ inserted #${c.id}`);
}
process.exit(0);
