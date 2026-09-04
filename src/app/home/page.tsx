import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import BookCard from "@/components/BookCard";
import HeroArt from "@/components/HeroArt";
import { allowedRatings } from "@/lib/content";
import { type Book } from "@/lib/types";

function Shelf({ title, books }: { title: string; books: Book[] }) {
  if (books.length === 0) return null;
  return (
    <section className="section" style={{ paddingTop: "1.5rem", paddingBottom: 0 }}>
      <div className="section-header">
        <h2>{title}</h2>
        <a href="/catalog" style={{ color: "var(--gold)", fontFamily: "var(--sans)" }}>
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
    .select("id, title, author, price, type, age_rating")
    .eq("is_published", true)
    .in("age_rating", allowed)
    .limit(24);
  let books: Book[];
  if (primaryBooks.error) {
    const alt = await supabase.from("books").select("id, title, author, price, type").limit(24);
    books = (alt.data ?? []) as Book[];
  } else {
    books = (primaryBooks.data ?? []) as Book[];
  }
  const freeBooks = books.filter((b) => !b.price || b.price <= 0);
  const premiumBooks = books.filter((b) => (b.price ?? 0) > 0);

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
      <Shelf title="Free to Read" books={freeBooks} />
      <Shelf title="Premium Reads" books={premiumBooks} />

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
