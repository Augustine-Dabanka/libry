import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const ROOT = "C:/xampp/htdocs/Libry/web";
const env = readFileSync(ROOT + "/.env.local", "utf8");
const key = (env.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(\S+)/) || [])[1];
const url = (env.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(\S+)/) || [])[1];
if (!key || !url) { console.error("Missing SUPABASE creds"); process.exit(1); }
const supabase = createClient(url, key, { auth: { persistSession: false } });

// The old short seed versions (101–111) were superseded by the full
// multi-chapter versions (201–212) under the same titles. Having both is why
// "the chapter isn't reflected" — the catalog showed a stale short duplicate.
// Non-destructive fix: unpublish + mark them Retired so they leave the catalog,
// home, and discover, but stay in the DB (reversible).
const DUPES = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111];

const hide = await supabase
  .from("books")
  .update({ is_published: false, status: "Retired" })
  .in("id", DUPES)
  .select("id, title");
if (hide.error) { console.error("UNPUBLISH ERROR:", hide.error.message); process.exit(1); }
console.log(`Unpublished ${hide.data.length} duplicate short seed books:`);
for (const d of hide.data) console.log(`  #${d.id}  ${d.title}`);

// Fix the garbled title on story 210.
const upd = await supabase.from("books").update({ title: "The Pariahner" }).eq("id", 210).select("id, title");
if (upd.error) console.log("  (title fix skipped:", upd.error.message, ")");
else if (upd.data.length) console.log("Renamed 210 →", upd.data[0].title);

// Make sure every remaining published FREE seed book is attributed to the house
// imprint. (User-authored drafts keep their own author — only touch the ones
// already created_by 'Libry Originals'.)
const fix = await supabase
  .from("books")
  .update({ author: "Libry Originals" })
  .eq("created_by", "Libry Originals")
  .neq("author", "Libry Originals")
  .select("id");
if (!fix.error && fix.data.length) console.log(`Re-attributed ${fix.data.length} seed books to 'Libry Originals'.`);

console.log("\nDone.");
