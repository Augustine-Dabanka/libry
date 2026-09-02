import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const ROOT = "C:/xampp/htdocs/Libry";

// Run the old browser seed file in a function scope and capture the books array
// (it self-attaches full story content + expanded catalog by the end).
const dataJs = readFileSync(ROOT + "/Libry Bookstore/js/data.js", "utf8");
const books = new Function(dataJs + "\n;return books;")();

// Service-role key from web/.env.local (bypasses RLS for a one-off seed).
const env = readFileSync(ROOT + "/web/.env.local", "utf8");
const key = (env.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(\S+)/) || [])[1];
const url = (env.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(\S+)/) || [])[1];
if (!key || !url) {
  console.error("Missing SUPABASE creds in web/.env.local");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const rows = books.map((b) => ({
  id: b.id,
  title: b.title,
  author: b.author,
  price: b.price ?? 0,
  type: b.type ?? null,
  category: b.category ?? null,
  cover: b.cover ?? null,
  description: b.description ?? null,
  sneak_peek: b.sneakPeek ?? null,
  content: Array.isArray(b.content) ? b.content.join("\n\n") : b.sneakPeek || b.description || "",
  pages: b.pages ?? 0,
  status: "Ongoing",
  language: b.language ?? "English",
  is_free: !!b.isFree,
  rating: b.rating ?? 0,
  reviews: b.reviews ?? 0,
  created_by: b.author,
  age_rating: "Everyday",
}));

const { data, error } = await supabase.from("books").upsert(rows, { onConflict: "id" }).select("id");
if (error) {
  console.error("IMPORT ERROR:", error.message, error.details || "");
  process.exit(1);
}
console.log("Imported/updated", data.length, "books.");
