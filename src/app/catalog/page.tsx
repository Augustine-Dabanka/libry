import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import BookCard from "@/components/BookCard";
import { allowedRatings } from "@/lib/content";
import { type Book } from "@/lib/types";

export default async function Catalog({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("prefs")
    .eq("id", user.id)
    .maybeSingle();
  const agePref = (profile?.prefs as { age?: string } | null)?.age ?? null;
  const allowed = allowedRatings(agePref);

  const term = (q ?? "").trim();
  // Strip chars that would break PostgREST's or() filter grammar.
  const safe = term.replace(/[,()*]/g, " ").trim();

  const runQuery = (withAge: boolean) => {
    let query = supabase
      .from("books")
      .select(withAge ? "id, title, author, price, type, age_rating" : "id, title, author, price, type");
    if (withAge) query = query.in("age_rating", allowed);
    if (safe) query = query.or(`title.ilike.%${safe}%,author.ilike.%${safe}%`);
    return query.limit(48);
  };
  let res = await runQuery(true);
  if (res.error) res = await runQuery(false); // age_rating not migrated yet
  const books = (res.data ?? []) as unknown as Book[];

  return (
    <>
      <AppNav />
      <section className="section">
        <div className="section-header">
          <h2>{term ? `Results for “${term}”` : "Catalog"}</h2>
        </div>

        {books.length > 0 ? (
          <div className="book-grid">
            {books.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        ) : (
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "3rem 2rem",
              textAlign: "center",
              background: "var(--stone)",
            }}
          >
            <p style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
              {term ? "No books match your search." : "No stories yet."}
            </p>
            <p style={{ color: "var(--muted)", maxWidth: 440, margin: "0 auto" }}>
              {term
                ? "Try a different title or author."
                : "The catalog is empty for now — published books will appear here."}
            </p>
          </div>
        )}
      </section>
    </>
  );
}
