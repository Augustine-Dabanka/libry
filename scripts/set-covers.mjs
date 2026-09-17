import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Fill in real cover images for published books that don't have one yet, by
// matching title + author against the Open Library search API and using its
// cover. Creator books normally get a cover the author uploads in the editor;
// this is mainly for the public-domain classics, which have no author to upload.
// Books with no confident Open Library match are left with the generated Libry
// cover. Safe to re-run — it only touches books whose cover_url is still empty.
//
//   node scripts/set-covers.mjs            (fill missing covers)
//   node scripts/set-covers.mjs --force    (also overwrite existing covers)
const ROOT = "C:/xampp/htdocs/Libry/web";
const env = readFileSync(ROOT + "/.env.local", "utf8");
const key = (env.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(\S+)/) || [])[1];
const url = (env.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(\S+)/) || [])[1];
if (!key || !url) { console.error("Missing SUPABASE creds in .env.local"); process.exit(1); }
const supabase = createClient(url, key, { auth: { persistSession: false } });
const FORCE = process.argv.includes("--force");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function coverFor(title, author) {
  const params = new URLSearchParams({ title, limit: "5", fields: "title,author_name,cover_i" });
  if (author) params.set("author", author);
  const res = await fetch(`https://openlibrary.org/search.json?${params}`, { headers: { "User-Agent": "Libry/1.0 (cover fetch)" } });
  if (!res.ok) return null;
  const j = await res.json();
  const doc = (j.docs || []).find((d) => d.cover_i);
  return doc?.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null;
}

const { data: books, error } = await supabase
  .from("books")
  .select("id, title, author, cover_url")
  .eq("is_published", true)
  .order("id");
if (error) { console.error(error.message); process.exit(1); }

let set = 0, skipped = 0, missed = 0;
for (const b of books) {
  if (!FORCE && (b.cover_url || "").trim()) { skipped++; continue; }
  try {
    const cover = await coverFor(b.title, b.author);
    if (!cover) { missed++; console.log(`·  no match: ${b.title}`); await sleep(350); continue; }
    const up = await supabase.from("books").update({ cover_url: cover }).eq("id", b.id);
    if (up.error) { console.log(`✗  ${b.title}: ${up.error.message}`); }
    else { set++; console.log(`✓  ${b.title} → ${cover}`); }
  } catch (e) {
    console.log(`✗  ${b.title}: ${e.message}`);
  }
  await sleep(350); // be polite to the Open Library API
}
console.log(`\nDone. Set ${set}, left generated ${missed}, already had ${skipped}.`);
