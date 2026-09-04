import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const ROOT = "C:/xampp/htdocs/Libry/web";
const env = readFileSync(ROOT + "/.env.local", "utf8");
const key = (env.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(\S+)/) || [])[1];
const url = (env.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(\S+)/) || [])[1];
if (!key || !url) { console.error("Missing SUPABASE creds"); process.exit(1); }
const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data, error } = await supabase
  .from("books")
  .select("id, title, author, price, type, status, is_published, content, created_by")
  .order("id", { ascending: true });
if (error) { console.error("QUERY ERROR:", error.message); process.exit(1); }

console.log("Total books:", data.length);
console.log("");
for (const b of data) {
  const len = b.content ? b.content.length : 0;
  const free = !b.price || b.price <= 0;
  console.log(
    `#${b.id} | ${free ? "FREE " : "PAID "} | author="${b.author ?? ""}" | created_by="${b.created_by ?? ""}" | pub=${b.is_published} | contentLen=${len} | ${b.title}`
  );
}

// Distinct authors among free books
const freeAuthors = [...new Set(data.filter(b => !b.price || b.price <= 0).map(b => b.author))];
console.log("\nDistinct FREE-book authors:", JSON.stringify(freeAuthors));

// Chapters table snapshot
const { data: chs, error: che } = await supabase
  .from("chapters")
  .select("book_id, chapter_number, title")
  .order("book_id", { ascending: true });
if (che) { console.log("\nchapters query error:", che.message); }
else {
  const byBook = {};
  for (const c of chs) (byBook[c.book_id] = byBook[c.book_id] || []).push(c.chapter_number);
  console.log("\nBooks with chapter rows:", Object.keys(byBook).length);
  for (const [bid, nums] of Object.entries(byBook)) console.log(`  book ${bid}: ${nums.length} chapters`);
}
