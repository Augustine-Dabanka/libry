import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import BookMini from "@/components/BookMini";
import { allowedRatings } from "@/lib/content";
import { type Book } from "@/lib/types";

export const metadata = { title: "Search — Libry" };

// Server-side full-text search (Postgres tsvector + GIN via the search_books
// RPC): title-weighted, typo-forgiving, mature-aware, ranked. Real data only.
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let allowed = allowedRatings(false);
  if (user) {
    const sm = await supabase.from("profiles").select("show_mature").eq("id", user.id).maybeSingle();
    allowed = allowedRatings(sm.data?.show_mature ?? false);
  }

  let results: Book[] = [];
  if (query) {
    const { data, error } = await supabase.rpc("search_books", { q: query, ratings: allowed, lim: 48 });
    if (!error && data) results = data as Book[];
  }

  return (
    <>
      <AppNav />
      <section className="section" style={{ maxWidth: 1040, marginInline: "auto" }}>
        <form action="/search" method="get" className="hero-search" style={{ maxWidth: 560, marginBottom: "1.6rem" }}>
          <input name="q" type="text" defaultValue={query} placeholder="Search titles, authors, tags…" aria-label="Search" autoFocus />
          <button type="submit">Search</button>
        </form>

        {!query ? (
          <div style={{ color: "var(--muted)", fontFamily: "var(--sans)", padding: "2rem 0" }}>
            <p style={{ fontSize: "1.05rem", color: "var(--ivory)", marginBottom: "0.4rem" }}>Find your next story.</p>
            <p>Search by title, author, or a trope like <a href="/search?q=enemies+to+lovers" style={{ color: "var(--gold)" }}>enemies to lovers</a> or <a href="/search?q=dark+romance" style={{ color: "var(--gold)" }}>dark romance</a>.</p>
          </div>
        ) : results.length === 0 ? (
          <div style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "2.6rem 1.6rem", textAlign: "center", background: "var(--stone)" }}>
            <div style={{ fontSize: "1.8rem", marginBottom: "0.4rem" }}>🔍</div>
            <p style={{ color: "var(--ivory)", marginBottom: "0.3rem" }}>No stories match &ldquo;{query}&rdquo;.</p>
            <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem" }}>Try a different title, author, or trope — or <a href="/catalog" style={{ color: "var(--gold)" }}>browse the catalog</a>.</p>
          </div>
        ) : (
          <>
            <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", marginBottom: "1rem" }}>
              {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;<span style={{ color: "var(--ivory)" }}>{query}</span>&rdquo;
            </p>
            <div className="book-grid-mini">
              {results.map((b) => (
                <BookMini key={b.id} book={b} />
              ))}
            </div>
          </>
        )}
      </section>
      <div style={{ paddingBottom: "3rem" }} />
    </>
  );
}
