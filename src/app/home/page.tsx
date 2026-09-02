import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import StatsHUD from "@/components/StatsHUD";
import SaleBanner from "@/components/SaleBanner";
import BookCard from "@/components/BookCard";
import HeroArt from "@/components/HeroArt";
import { loadGamification } from "@/lib/gamification";
import { allowedRatings } from "@/lib/content";
import { type Book } from "@/lib/types";

type PromoRow = { priority: number; books: Book | Book[] | null };

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

  const { stats, quests } = await loadGamification(user.id);

  const primaryBooks = await supabase
    .from("books")
    .select("id, title, author, price, type, age_rating")
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

  const nowIso = new Date().toISOString();
  const primaryPromo = await supabase
    .from("promoted_books")
    .select("priority, books(id, title, author, price, type, age_rating)")
    .gte("ends_at", nowIso)
    .order("priority", { ascending: false })
    .limit(10);
  let promoData: unknown = primaryPromo.data;
  if (primaryPromo.error) {
    const alt = await supabase
      .from("promoted_books")
      .select("priority, books(id, title, author, price, type)")
      .gte("ends_at", nowIso)
      .order("priority", { ascending: false })
      .limit(10);
    promoData = alt.data;
  }
  const recommended = ((promoData ?? []) as unknown as PromoRow[])
    .map((p) => (Array.isArray(p.books) ? p.books[0] : p.books))
    .filter((b): b is Book => b != null && allowed.includes(b.age_rating ?? "Everyday"));

  return (
    <>
      <AppNav />

      <section className="hero">
        <div className="hero-content">
          <h1>
            Stories worth <span>lingering</span> in
          </h1>
          <p>
            {firstName ? `Welcome back, ${firstName}. ` : ""}Discover interactive storybooks and carefully chosen
            ebooks. Read deeply. Support creators.
          </p>
          <div className="hero-actions">
            <a href="/catalog" className="btn btn-gold">
              Browse Catalog
            </a>
            <a href="/discover?filter=editors-pick" className="btn btn-outline">
              Editor&rsquo;s Pick
            </a>
          </div>
        </div>
        <div>
          <HeroArt />
        </div>
      </section>

      <section className="section" style={{ paddingBottom: 0 }}>
        <SaleBanner />
        <StatsHUD stats={stats} quests={quests} />
      </section>

      {recommended.length > 0 ? (
        <section className="section" style={{ paddingTop: "1.5rem", paddingBottom: 0 }}>
          <div className="section-header">
            <h2>Featured Stories</h2>
          </div>
          <div style={{ display: "flex", gap: "1.2rem", overflowX: "auto", paddingBottom: "0.6rem" }}>
            {recommended.map((b) => (
              <div key={b.id} style={{ flex: "0 0 210px", position: "relative" }}>
                <span className="badge" style={{ position: "absolute", top: 10, left: 10, zIndex: 2, background: "var(--gold)", color: "#20180a" }}>
                  ★ Promoted
                </span>
                <BookCard book={b} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <Shelf title="Free to Read" books={freeBooks} />
      <Shelf title="Premium Reads" books={premiumBooks} />

      {books.length === 0 ? (
        <section className="section" style={{ paddingTop: "1.5rem" }}>
          <div
            style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "3rem 2rem", textAlign: "center", background: "var(--stone)" }}
          >
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
