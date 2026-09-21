import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import BookCarousel from "@/components/BookCarousel";
import ProductMini, { type ProductCard } from "@/components/ProductMini";
import HeroArt from "@/components/HeroArt";
import StreakCard from "@/components/StreakCard";
import AudiencePicker, { type AudienceGroup } from "@/components/AudiencePicker";
import ContinueReading, { type ResumeItem } from "@/components/ContinueReading";
import CommunityCover from "@/components/CommunityCover";
import { allowedRatings } from "@/lib/content";
import { type Book } from "@/lib/types";
import { rankBooks, type BookSignals } from "@/lib/ranking";

// Shelves are horizontal carousels now (compact cards, snap-scroll) so several
// categories fit on one mobile screen. The .section wrapper keeps the gutter.
function Shelf({ title, books, href = "/catalog" }: { title: string; books: Book[]; href?: string }) {
  if (books.length === 0) return null;
  return (
    <div className="section" style={{ paddingTop: "1rem", paddingBottom: 0 }}>
      <BookCarousel title={title} books={books} href={href} />
    </div>
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
    const alt = await supabase.from("books").select("id, title, author, price, type, rating, category, cover_url").limit(24);
    books = (alt.data ?? []) as Book[];
  } else {
    books = (primaryBooks.data ?? []) as Book[];
  }
  const freeBooks = books.filter((b) => !b.price || b.price <= 0);
  const premiumBooks = books.filter((b) => (b.price ?? 0) > 0);

  // Digital products from creators (guarded pre-migration).
  let products: ProductCard[] = [];
  {
    const pp = await supabase.from("products").select("id, title, type, price, cover_url, category").eq("is_published", true).order("created_at", { ascending: false }).limit(12);
    if (!pp.error && pp.data) products = pp.data as ProductCard[];
  }

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
    const rp = await supabase.from("books").select("id, title, author, price, type, rating, category, cover_url").eq("is_published", true).in("age_rating", allowed).limit(80);
    if (rp.error) {
      const rp2 = await supabase.from("books").select("id, title, author, price, type, rating, category, cover_url").eq("is_published", true).limit(80);
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
      .select("id, title, author, price, type, rating, category, cover_url")
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
          .select("id, title, author, price, type, rating, category, cover_url")
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
        let q = supabase.from("books").select("id, title, author, price, type, rating, category, cover_url").eq("is_published", true).neq("id", readIds[0]).limit(12);
        if (seed.data.category) q = q.eq("category", seed.data.category as string);
        else if (seed.data.type) q = q.eq("type", seed.data.type as string);
        const rec = await q;
        becauseBooks = ((rec.data ?? []) as Book[]).filter((b) => !readIds.includes(Number(b.id))).slice(0, 8);
      }
    }
  }

  // --- Continue reading: books this reader has started but not finished ---
  let continueItems: ResumeItem[] = [];
  {
    const cp = await supabase
      .from("reading_progress")
      .select("book_id, progress_percentage, current_chapter")
      .eq("user_email", user.email ?? "")
      .order("book_id", { ascending: false })
      .limit(60);
    if (!cp.error && cp.data) {
      const ids: number[] = [];
      const pctById = new Map<number, number>();
      const chapById = new Map<number, number>();
      for (const r of cp.data as { book_id: number; progress_percentage: number | null; current_chapter: number | null }[]) {
        const p = Number(r.progress_percentage ?? 0);
        const id = Number(r.book_id);
        if (p > 0 && p < 100 && !ids.includes(id)) {
          ids.push(id);
          pctById.set(id, p);
          chapById.set(id, Number(r.current_chapter ?? 0));
        }
      }
      const top = ids.slice(0, 12);
      if (top.length) {
        const cb = await supabase.from("books").select("id, title, author, price, type, rating, category, cover_url").in("id", top);
        if (!cb.error && cb.data) {
          const byId = new Map((cb.data as Book[]).map((b) => [Number(b.id), b]));
          continueItems = top
            .map((id) => {
              const book = byId.get(id);
              if (!book) return null;
              const chap = chapById.get(id) ?? 0;
              const label = chap > 1 ? `Chapter ${chap}` : book.category || book.type || "Reading now";
              return { book, pct: pctById.get(id) ?? 0, label } as ResumeItem;
            })
            .filter(Boolean) as ResumeItem[];
        }
      }
    }
  }

  // --- "For you" audience groups (Kids / Teen / YA / Adult), age-gated ---
  let audienceGroups: AudienceGroup[] = [];
  {
    const ab = await supabase
      .from("books")
      .select("id, title, author, price, type, rating, category, cover_url, age_rating")
      .eq("is_published", true)
      .in("age_rating", allowed)
      .limit(160);
    const list = (!ab.error ? (ab.data ?? []) : []) as (Book & { age_rating?: string | null })[];
    const pick = (ratings: string[]) => list.filter((b) => ratings.includes((b.age_rating ?? "").trim())).slice(0, 12);
    audienceGroups = [
      { key: "kids", label: "Kids", emoji: "🧸", books: pick(["Everyone", "9+"]) },
      { key: "teen", label: "Teen", emoji: "🎒", books: pick(["13+"]) },
      { key: "ya", label: "YA", emoji: "🔥", books: pick(["16+"]) },
      { key: "adult", label: "Adult", emoji: "🌙", books: pick(["18+"]) },
    ];
  }

  // --- Popular communities row (public read) ---
  type HomeComm = { id: number; slug: string; name: string; emoji: string | null; cover_url: string | null; member_count: number };
  let communities: HomeComm[] = [];
  {
    const cc = await supabase
      .from("communities")
      .select("id, slug, name, emoji, cover_url, member_count, is_official")
      .order("is_official", { ascending: false })
      .order("member_count", { ascending: false })
      .limit(6);
    if (!cc.error && cc.data) communities = cc.data as HomeComm[];
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
        <div className="hero-art-wrap" style={{ width: "100%", maxWidth: 400, display: "flex", justifyContent: "center", flexShrink: 0 }}>
          <HeroArt />
        </div>
      </section>

      <div className="section" style={{ paddingTop: "1.6rem", paddingBottom: 0 }}>
        <div style={{ maxWidth: 680 }}>
          <StreakCard />
        </div>
      </div>

      <ContinueReading items={continueItems} />

      {/* Trending tropes — the hooky genres readers chase. */}
      <div className="section" style={{ paddingTop: "1.4rem", paddingBottom: 0 }}>
        <div className="section-header"><h2>🔥 Trending tropes</h2></div>
        <div style={{ display: "flex", gap: "0.55rem", overflowX: "auto", paddingBottom: "0.4rem" }}>
          {[
            { g: "Comics", e: "💥", href: "/comics" },
            { g: "Romance", e: "💛" }, { g: "Dark Romance", e: "🖤" }, { g: "Werewolf", e: "🐺" },
            { g: "Vampire", e: "🧛" }, { g: "Enemies to Lovers", e: "⚔️", q: "q" }, { g: "Paranormal", e: "👻" },
            { g: "New Adult", e: "🔥" }, { g: "Teen Fiction", e: "🎒" }, { g: "LGBTQ+", e: "🏳️‍🌈" }, { g: "Fantasy", e: "🐉" },
          ].map((t) => (
            <a
              key={t.g}
              href={t.href ? t.href : t.q ? `/catalog?q=${encodeURIComponent(t.g)}` : `/catalog?genre=${encodeURIComponent(t.g)}`}
              style={{ flexShrink: 0, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 999, padding: "0.5rem 0.95rem", color: "var(--ivory)", fontFamily: "var(--sans)", fontSize: "0.88rem", fontWeight: 600, whiteSpace: "nowrap" }}
            >
              <span aria-hidden="true">{t.e}</span> {t.g}
            </a>
          ))}
        </div>
      </div>

      <Shelf title="✦ Featured this week" books={featured} />
      <Shelf title="Trending on Libry" books={trending.length ? trending : books.slice(0, 8)} />

      {audienceGroups.some((g) => g.books.length > 0) ? (
        <div className="section" style={{ paddingTop: "1rem", paddingBottom: 0 }}>
          <AudiencePicker groups={audienceGroups} />
        </div>
      ) : null}

      {products.length > 0 ? (
        <div className="section" style={{ paddingTop: "1.4rem", paddingBottom: 0 }}>
          <div className="section-header">
            <h2>🎁 Digital products</h2>
            <a href="/discover" style={{ color: "var(--gold)", fontFamily: "var(--sans)" }}>View all →</a>
          </div>
          <div className="book-grid-mini">
            {products.map((p) => (
              <ProductMini key={p.id} product={p} />
            ))}
          </div>
        </div>
      ) : null}
      {followedNew.length > 0 ? (
        <Shelf title="New from authors you follow" books={followedNew} />
      ) : null}
      {becauseBooks.length > 0 ? (
        <Shelf title={`Because you read ${becauseTitle}`} books={becauseBooks} />
      ) : null}
      <Shelf title="Top Rated on Libry" books={topRated} href="/catalog?sort=rating" />
      <Shelf title="Free to Read" books={freeBooks} href="/catalog?free=1" />
      <Shelf title="Premium Reads" books={premiumBooks} href="/catalog?paid=1" />

      {communities.length > 0 ? (
        <div className="section" style={{ paddingTop: "1.4rem", paddingBottom: 0 }}>
          <div className="section-header">
            <h2>👥 Popular communities</h2>
            <a href="/communities" style={{ color: "var(--gold)", fontFamily: "var(--sans)" }}>View all →</a>
          </div>
          <div style={{ display: "flex", gap: "0.8rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
            {communities.map((c) => (
              <a
                key={c.id}
                href={`/c/${c.slug}`}
                style={{ flexShrink: 0, width: 150, textDecoration: "none", background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}
              >
                <div style={{ position: "relative", height: 66 }}>
                  <CommunityCover name={c.name} emoji={c.emoji} coverUrl={c.cover_url} />
                </div>
                <div style={{ padding: "0.6rem 0.7rem 0.75rem" }}>
                  <div style={{ fontFamily: "var(--sans)", fontWeight: 700, color: "var(--ivory)", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                  <div style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.72rem", marginTop: "0.15rem" }}>👥 {c.member_count.toLocaleString()}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      ) : null}

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
