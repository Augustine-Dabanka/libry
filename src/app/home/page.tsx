import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import BookCard from "@/components/BookCard";
import HeroArt from "@/components/HeroArt";
import StreakCard from "@/components/StreakCard";
import { allowedRatings } from "@/lib/content";
import { type Book } from "@/lib/types";
import { rankBooks, type BookSignals } from "@/lib/ranking";

function Shelf({ title, books, href = "/catalog" }: { title: string; books: Book[]; href?: string }) {
  if (books.length === 0) return null;
  return (
    <section className="section" style={{ paddingTop: "1.5rem", paddingBottom: 0 }}>
      <div className="section-header">
        <h2>{title}</h2>
        <a href={href} style={{ color: "var(--gold)", fontFamily: "var(--sans)" }}>
          View all →
        </a>
      </div>
      <div className="book-grid">
        {books.map((b) => (
          <BookCard key={b.id} book={b} />
        ))}
      </div>
    </section>
  );
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username")
    .eq("id", user.id)
    .maybeSingle();
  const firstName = (profile?.full_name || profile?.username || "").split(" ")[0];
  const sm = await supabase.from("profiles").select("show_mature").eq("id", user.id).maybeSingle();
  const allowed = allowedRatings(sm.data?.show_mature ?? false);

  const primaryBooks = await supabase
    .from("books")
    .select("id, title, author, price, type, age_rating, rating, category")
    .eq("is_published", true)
    .in("age_rating", allowed)
    .limit(24);
  let books: Book[];
  if (primaryBooks.error) {
    const alt = await supabase.from("books").select("id, title, author, price, type, rating, category").limit(24);
    books = (alt.data ?? []) as Book[];
  } else {
    books = (primaryBooks.data ?? []) as Book[];
  }
  const freeBooks = books.filter((b) => !b.price || b.price <= 0);
  const premiumBooks = books.filter((b) => (b.price ?? 0) > 0);

  // Featured this week — a deterministic weekly rotation (changes every 7 days,
  // no backend job). Rotates a window of 5 through the age-filtered catalog.
  const weekNo = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7));
  let featured: Book[] = [];
  if (books.length) {
    const start = (weekNo * 5) % books.length;
    for (let i = 0; i < Math.min(5, books.length); i++) featured.push(books[(start + i) % books.length]);
  }

  // --- Trending on Libry: our own ranking algorithm over real signals ---
  let trending: Book[] = [];
  {
    // Global reading signals (all readers) → reach + completion per book.
    const prog = await supabase.from("reading_progress").select("book_id, user_email, progress_percentage").limit(5000);
    const rows = prog.data ?? [];
    const readersBy = new Map<number, Set<string>>();
    const finishersBy = new Map<number, number>();
    for (const r of rows as { book_id: number; user_email: string; progress_percentage: number | null }[]) {
      const bid = Number(r.book_id);
      if (!readersBy.has(bid)) readersBy.set(bid, new Set());
      readersBy.get(bid)!.add(r.user_email);
      if (Number(r.progress_percentage ?? 0) >= 100) finishersBy.set(bid, (finishersBy.get(bid) ?? 0) + 1);
    }
    // Review counts (guarded).
    const reviewsBy = new Map<number, number>();
    const revq = await supabase.from("reviews").select("book_id");
    if (!revq.error) for (const r of (revq.data ?? []) as { book_id: number }[]) reviewsBy.set(Number(r.book_id), (reviewsBy.get(Number(r.book_id)) ?? 0) + 1);

    // Candidate pool (published, age-filtered) with category for affinity.
    type PoolBook = Book & { category?: string | null };
    let pool: PoolBook[] = [];
    const rp = await supabase.from("books").select("id, title, author, price, type, rating, category").eq("is_published", true).in("age_rating", allowed).limit(80);
    if (rp.error) {
      const rp2 = await supabase.from("books").select("id, title, author, price, type, rating, category").eq("is_published", true).limit(80);
      pool = (rp2.data ?? []) as PoolBook[];
    } else {
      pool = (rp.data ?? []) as PoolBook[];
    }

    const signals = new Map<number, BookSignals>();
    const catByBook = new Map<number, string>();
    for (const b of pool) {
      const bid = Number(b.id);
      signals.set(bid, { readers: readersBy.get(bid)?.size ?? 0, finishers: finishersBy.get(bid) ?? 0, reviews: reviewsBy.get(bid) ?? 0 });
      if (b.category) catByBook.set(bid, b.category);
    }

    // This reader's taste → top categories they actually read.
    const myBooks = new Set((rows as { book_id: number; user_email: string }[]).filter((r) => r.user_email === user.email).map((r) => Number(r.book_id)));
    const affCount = new Map<string, number>();
    for (const bid of myBooks) { const c = catByBook.get(bid); if (c) affCount.set(c, (affCount.get(c) ?? 0) + 1); }
    const affinity = new Set([...affCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map((e) => e[0]));

    trending = rankBooks(pool, signals, { affinity }).slice(0, 8) as Book[];
  }

  // Top rated across the whole catalog.
  let topRated: Book[] = [];
  {
    const tr = await supabase
      .from("books")
      .select("id, title, author, price, type, rating, category")
      .eq("is_published", true)
      .gt("rating", 0)
      .order("rating", { ascending: false })
      .limit(8);
    if (!tr.error) topRated = (tr.data ?? []) as Book[];
  }

  // New from authors the reader follows.
  let followedNew: Book[] = [];
  {
    const fol = await supabase.from("author_follows").select("author").eq("follower_id", user.id);
    if (!fol.error) {
      const authors = [...new Set((fol.data ?? []).map((f: { author: string }) => f.author))];
      if (authors.length) {
        const fn = await supabase
          .from("books")
          .select("id, title, author, price, type, rating, category")
          .eq("is_published", true)
          .in("author", authors)
          .order("id", { ascending: false })
          .limit(8);
        if (!fn.error) followedNew = (fn.data ?? []) as Book[];
      }
    }
  }

  // "Because you read X" — recommend from the reader's most recent book.
  let becauseTitle = "";
  let becauseBooks: Book[] = [];
  {
    const prog = await supabase
      .from("reading_progress")
      .select("book_id")
      .eq("user_email", user.email ?? "")
      .order("book_id", { ascending: false });
    const readIds = [...new Set((prog.data ?? []).map((p: { book_id: number }) => p.book_id))];
    if (readIds.length) {
      const seed = await supabase.from("books").select("id, title, category, type").eq("id", readIds[0]).maybeSingle();
      if (seed.data) {
        becauseTitle = seed.data.title as string;
        let q = supabase.from("books").select("id, title, author, price, type, rating, category").eq("is_published", true).neq("id", readIds[0]).limit(12);
        if (seed.data.category) q = q.eq("category", seed.data.category as string);
        else if (seed.data.type) q = q.eq("type", seed.data.type as string);
        const rec = await q;
        becauseBooks = ((rec.data ?? []) as Book[]).filter((b) => !readIds.includes(Number(b.id))).slice(0, 8);
      }
    }
  }

  return (
    <>
      <AppNav />

      <section className="hero">
        <div className="hero-content">
          <h1>
            Welcome back, <span style={{ fontStyle: "italic" }}>{firstName || "reader"}</span>
          </h1>
          <p>We&apos;ve lined up beautiful, character-driven fiction — picked for you below.</p>
          <form className="hero-search" action="/catalog" method="get">
            <input name="q" type="text" placeholder="Search titles, authors, worlds…" aria-label="Search books" />
            <button type="submit">Search</button>
          </form>
          <div className="hero-actions" style={{ marginTop: "1.2rem" }}>
            <a href="/catalog" className="btn btn-gold">
              Browse Catalog
            </a>
            <a href="/my-library" className="btn btn-outline">
              My Library
            </a>
          </div>
        </div>
        <div>
          <HeroArt />
        </div>
      </section>

      <div className="section" style={{ paddingTop: "1.6rem", paddingBottom: 0 }}>
        <div style={{ maxWidth: 680 }}>
          <StreakCard />
        </div>
      </div>

      <Shelf title="✦ Featured this week" books={featured} />
      <Shelf title="Trending on Libry" books={trending.length ? trending : books.slice(0, 8)} />
      {followedNew.length > 0 ? (
        <Shelf title="New from authors you follow" books={followedNew} />
      ) : null}
      {becauseBooks.length > 0 ? (
        <Shelf title={`Because you read ${becauseTitle}`} books={becauseBooks} />
      ) : null}
      <Shelf title="Top Rated on Libry" books={topRated} href="/catalog?sort=rating" />
      <Shelf title="Free to Read" books={freeBooks} href="/catalog?free=1" />
      <Shelf title="Premium Reads" books={premiumBooks} href="/catalog?paid=1" />

      {books.length === 0 ? (
        <section className="section" style={{ paddingTop: "1.5rem" }}>
          <div style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "3rem 2rem", textAlign: "center", background: "var(--stone)" }}>
            <p style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>No stories yet.</p>
            <p style={{ color: "var(--muted)", maxWidth: 440, margin: "0 auto" }}>
              Once creators publish, their books show up here.
            </p>
          </div>
        </section>
      ) : (
        <div style={{ paddingBottom: "3rem" }} />
      )}
    </>
  );
}
