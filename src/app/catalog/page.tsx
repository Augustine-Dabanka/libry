import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import BookCard from "@/components/BookCard";
import { allowedRatings } from "@/lib/content";
import { type Book } from "@/lib/types";

type CatBook = Book & { is_free?: boolean | null };

function Shelf({ title, href, books }: { title: string; href: string; books: CatBook[] }) {
  if (books.length === 0) return null;
  return (
    <section className="section" style={{ paddingTop: "1.2rem", paddingBottom: 0 }}>
      <div className="section-header">
        <h2>{title}</h2>
        <a href={href} style={{ color: "var(--gold)", fontFamily: "var(--sans)" }}>
          View all →
        </a>
      </div>
      <div className="book-grid">
        {books.slice(0, 12).map((b) => (
          <BookCard key={b.id} book={b} />
        ))}
      </div>
    </section>
  );
}

export default async function Catalog({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; free?: string; paid?: string }>;
}) {
  const { q, type, free, paid } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sm = await supabase.from("profiles").select("show_mature").eq("id", user.id).maybeSingle();
  const allowed = allowedRatings(sm.data?.show_mature ?? false);

  const term = (q ?? "").trim();
  const safe = term.replace(/[,()*]/g, " ").trim();
  const typeFilter = (type ?? "").trim();
  const freeOnly = free === "1" || free === "true";
  const paidOnly = paid === "1" || paid === "true";
  const filtered = !!(safe || typeFilter || freeOnly || paidOnly);

  const runQuery = (withAge: boolean) => {
    let query = supabase
      .from("books")
      .select(withAge ? "id, title, author, price, type, is_free, age_rating" : "id, title, author, price, type, is_free");
    if (withAge) query = query.eq("is_published", true).in("age_rating", allowed);
    if (typeFilter) query = query.eq("type", typeFilter);
    if (freeOnly) query = query.or("price.eq.0,is_free.eq.true");
    if (paidOnly) query = query.gt("price", 0);
    if (safe) query = query.or(`title.ilike.%${safe}%,author.ilike.%${safe}%`);
    return query.limit(filtered ? 48 : 80);
  };
  let res = await runQuery(true);
  if (res.error) res = await runQuery(false); // age_rating not migrated yet
  const books = (res.data ?? []) as unknown as CatBook[];

  // ---------- Filtered / search view: a single flat grid ----------
  if (filtered) {
    const heading = term ? `Results for “${term}”` : freeOnly ? "Free to Read" : paidOnly ? "Premium Reads" : typeFilter ? `${typeFilter} stories` : "Catalog";
    return (
      <>
        <AppNav />
        <section className="section">
          <div className="section-header">
            <h2>{heading}</h2>
          </div>
          {books.length > 0 ? (
            <div className="book-grid">
              {books.map((b) => <BookCard key={b.id} book={b} />)}
            </div>
          ) : (
            <div style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "3rem 2rem", textAlign: "center", background: "var(--stone)" }}>
              <p style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>{term ? "No books match your search." : "Nothing here yet."}</p>
              <p style={{ color: "var(--muted)", maxWidth: 440, margin: "0 auto" }}>
                {term ? "Try a different title or author." : "Published books will appear here."}
              </p>
            </div>
          )}
        </section>
      </>
    );
  }

  // ---------- Default view: shelves, like the home page ----------
  const isFree = (b: CatBook) => (b.price ?? 0) <= 0 || b.is_free === true;
  const isInteractive = (b: CatBook) => (b.type || "").toLowerCase() === "interactive";
  const interactive = books.filter(isInteractive);
  const freeReads = books.filter((b) => isFree(b) && !isInteractive(b));
  const premium = books.filter((b) => !isFree(b) && !isInteractive(b));

  return (
    <>
      <AppNav />
      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="section-header">
          <h2>Catalog</h2>
        </div>
        {books.length === 0 ? (
          <div style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "3rem 2rem", textAlign: "center", background: "var(--stone)" }}>
            <p style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>The catalog is empty for now.</p>
            <p style={{ color: "var(--muted)", maxWidth: 440, margin: "0 auto" }}>Published books will appear here.</p>
          </div>
        ) : null}
      </section>

      <Shelf title="Interactive Stories" href="/catalog?type=Interactive" books={interactive} />
      <Shelf title="Free to Read" href="/catalog?free=1" books={freeReads} />
      <Shelf title="Premium Reads" href="/catalog?paid=1" books={premium} />

      <div style={{ paddingBottom: "3rem" }} />
    </>
  );
}
