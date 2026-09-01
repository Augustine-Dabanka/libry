import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import StatsHUD from "@/components/StatsHUD";
import LearningPath from "@/components/LearningPath";
import SaleBanner from "@/components/SaleBanner";
import BookCard from "@/components/BookCard";
import { loadGamification } from "@/lib/gamification";
import { allowedRatings } from "@/lib/content";
import { type Book } from "@/lib/types";

type PromoRow = { priority: number; books: Book | Book[] | null };

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
  // show_mature is added by migration 0006 — guard for pre-migration.
  const sm = await supabase.from("profiles").select("show_mature").eq("id", user.id).maybeSingle();
  const allowed = allowedRatings(sm.data?.show_mature ?? false);

  const { stats, quests } = await loadGamification(user.id);

  const primaryBooks = await supabase
    .from("books")
    .select("id, title, author, price, type, age_rating")
    .in("age_rating", allowed)
    .limit(12);
  let books: Book[];
  if (primaryBooks.error) {
    // age_rating not migrated yet — show unfiltered.
    const alt = await supabase.from("books").select("id, title, author, price, type").limit(12);
    books = (alt.data ?? []) as Book[];
  } else {
    books = (primaryBooks.data ?? []) as Book[];
  }

  // Recommended = active promoted books (by priority), the paid-placement engine.
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
            Welcome back{firstName ? <span>, {firstName}</span> : null}.
          </h1>
          <p>Pick up where you left off, or discover your next read.</p>
          <div className="hero-actions">
            <a href="/catalog" className="btn btn-gold">
              Browse Catalog
            </a>
          </div>
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
                <span
                  className="badge"
                  style={{ position: "absolute", top: 10, left: 10, zIndex: 2, background: "var(--gold)", color: "#20180a" }}
                >
                  ★ Promoted
                </span>
                <BookCard book={b} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section" style={{ paddingTop: "1.5rem" }}>
        <div className="section-header">
          <h2>Your reading path</h2>
        </div>
        <LearningPath books={books} />
      </section>
    </>
  );
}
