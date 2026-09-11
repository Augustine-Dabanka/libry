import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import BookCard from "@/components/BookCard";
import CatalogSort from "@/components/CatalogSort";
import { allowedRatings, GENRES } from "@/lib/content";
import { type Book } from "@/lib/types";

// A curated, reader-friendly subset shown as browse chips (the full list lives
// in GENRES for the editor).
const BROWSE_GENRES = ["Romance", "Fantasy", "Sci-Fi", "Mystery", "Thriller", "Horror", "Historical", "Young Adult", "Adventure", "Non-Fiction"];

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

function Controls({ q, active, sort, genre }: { q: string; active: string; sort: string; genre: string }) {
  const base = (extra: Record<string, string>) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    Object.entries(extra).forEach(([k, v]) => v && p.set(k, v));
    const str = p.toString();
    return `/catalog${str ? "?" + str : ""}`;
  };
  const chips = [
    { label: "All", href: base({}), key: "all" },
    { label: "Interactive", href: base({ type: "Interactive" }), key: "Interactive" },
    { label: "Fiction", href: base({ type: "Fiction" }), key: "Fiction" },
    { label: "Non-Fiction", href: base({ type: "Non-Fiction" }), key: "Non-Fiction" },
    { label: "Free", href: base({ free: "1" }), key: "free" },
    { label: "Premium", href: base({ paid: "1" }), key: "paid" },
  ];
  // Show the curated genres, plus the active one if it isn't in the shortlist.
  const genreChips = [...new Set([...BROWSE_GENRES, ...(genre && !BROWSE_GENRES.includes(genre) ? [genre] : [])])].filter((g) => GENRES.includes(g as (typeof GENRES)[number]) || g === genre);
  const inputStyle: React.CSSProperties = { background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 999, color: "var(--ivory)", fontFamily: "var(--sans)", padding: "0.6rem 1rem", outline: "none" };
  const chip = (label: string, href: string, on: boolean) => (
    <a key={label} href={href} style={{ textDecoration: "none", padding: "0.4rem 0.95rem", fontSize: "0.85rem", borderRadius: 999, fontFamily: "var(--sans)", fontWeight: 600, background: on ? "var(--gold)" : "rgba(95,160,104,0.12)", color: on ? "#12100E" : "var(--ivory-muted)", border: "1px solid var(--border)", whiteSpace: "nowrap" }}>{label}</a>
  );
  return (
    <section className="section" style={{ paddingTop: "1.2rem", paddingBottom: 0 }}>
      <form action="/catalog" method="get" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1rem", maxWidth: 660 }}>
        <input name="q" defaultValue={q} type="text" placeholder="Search titles or authors…" aria-label="Search books" style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
        <input type="hidden" name="sort" value={sort} />
        <CatalogSort value={sort} />
        <button type="submit" className="btn btn-gold" style={{ padding: "0.6rem 1.3rem" }}>Search</button>
      </form>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.7rem" }}>
        {chips.map((c) => chip(c.label, c.href, active === c.key && !genre))}
      </div>
      <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", fontFamily: "var(--sans)", margin: "0.2rem 0 0.5rem" }}>Genres</div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {genreChips.map((g) => chip(g, base({ genre: g }), genre === g))}
      </div>
    </section>
  );
}

export default async function Catalog({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; free?: string; paid?: string; sort?: string; genre?: string }>;
}) {
  const { q, type, free, paid, sort, genre } = await searchParams;
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
  const genreFilter = (genre ?? "").trim();
  const freeOnly = free === "1" || free === "true";
  const paidOnly = paid === "1" || paid === "true";
  const sortKey = (sort ?? "").trim();
  const filtered = !!(safe || typeFilter || genreFilter || freeOnly || paidOnly);
  const activeChip = typeFilter === "Interactive" ? "Interactive" : typeFilter === "Fiction" ? "Fiction" : typeFilter === "Non-Fiction" ? "Non-Fiction" : freeOnly ? "free" : paidOnly ? "paid" : "all";

  const runQuery = (withAge: boolean) => {
    let query = supabase
      .from("books")
      .select(withAge ? "id, title, author, price, type, is_free, age_rating, rating, category" : "id, title, author, price, type, is_free, rating, category");
    if (withAge) query = query.eq("is_published", true).in("age_rating", allowed);
    if (typeFilter) query = query.eq("type", typeFilter);
    if (genreFilter) query = query.eq("category", genreFilter);
    if (freeOnly) query = query.or("price.eq.0,is_free.eq.true");
    if (paidOnly) query = query.gt("price", 0);
    if (safe) query = query.or(`title.ilike.%${safe}%,author.ilike.%${safe}%`);
    if (sortKey === "title") query = query.order("title", { ascending: true });
    else if (sortKey === "rating") query = query.order("rating", { ascending: false });
    else if (sortKey === "price-asc") query = query.order("price", { ascending: true });
    else if (sortKey === "price-desc") query = query.order("price", { ascending: false });
    else query = query.order("id", { ascending: false });
    return query.limit(filtered ? 48 : 80);
  };
  let res = await runQuery(true);
  if (res.error) res = await runQuery(false); // age_rating not migrated yet
  const books = (res.data ?? []) as unknown as CatBook[];

  // ---------- Filtered / search view: a single flat grid ----------
  if (filtered) {
    const heading = term ? `Results for “${term}”` : genreFilter ? `${genreFilter}` : freeOnly ? "Free to Read" : paidOnly ? "Premium Reads" : typeFilter ? `${typeFilter} stories` : "Catalog";
    return (
      <>
        <AppNav />
        <Controls q={term} active={activeChip} sort={sortKey} genre={genreFilter} />
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
      <Controls q={term} active={activeChip} sort={sortKey} genre={genreFilter} />
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
