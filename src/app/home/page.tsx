import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import BookCard from "@/components/BookCard";
import HeroArt from "@/components/HeroArt";
import { allowedRatings } from "@/lib/content";
import { type Book } from "@/lib/types";

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
    .select("id, title, author, price, type, age_rating, rating")
    .eq("is_published", true)
    .in("age_rating", allowed)
    .limit(24);
  let books: Book[];
  if (primaryBooks.error) {
    const alt = await supabase.from("books").select("id, title, author, price, type, rating").limit(24);
    books = (alt.data ?? []) as Book[];
  } else {
    books = (primaryBooks.data ?? []) as Book[];
  }
  const freeBooks = books.filter((b) => !b.price || b.price <= 0);
  const premiumBooks = books.filter((b) => (b.price ?? 0) > 0);

  // Top rated across the whole catalog.
  let topRated: Book[] = [];
  {
    const tr = await supabase
      .from("books")
      .select("id, title, author, price, type, rating")
      .eq("is_published", true)
      .gt("rating", 0)
      .order("rating", { ascending: false })
      .limit(8);
    if (!tr.error) topRated = (tr.data ?? []) as Book[];
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
        let q = supabase.from("books").select("id, title, author, price, type, rating").eq("is_published", true).neq("id", readIds[0]).limit(12);
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

      <Shelf title="Chosen for you" books={books.slice(0, 8)} />
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
