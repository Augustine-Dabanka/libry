import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import BookMini from "@/components/BookMini";
import { allowedRatings } from "@/lib/content";
import { type Book } from "@/lib/types";

export const metadata = { title: "Comics — Libry" };

// First-class Comics browse surface. Comics are ordinary books with a comic
// `type`; the reader routes them to the panel/webtoon ComicReader.
export default async function ComicsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let allowed = allowedRatings(false);
  if (user) {
    const sm = await supabase.from("profiles").select("show_mature").eq("id", user.id).maybeSingle();
    allowed = allowedRatings(sm.data?.show_mature ?? false);
  }

  const comicTypes = ["comic", "comics", "graphic novel", "webtoon"];
  let comics: Book[] = [];
  {
    const q = await supabase
      .from("books")
      .select("id, title, author, price, type, rating, category, cover_url, age_rating")
      .eq("is_published", true)
      .or(comicTypes.map((t) => `type.ilike.${t}`).join(","))
      .limit(120);
    if (!q.error && q.data) {
      comics = (q.data as (Book & { age_rating?: string | null })[]).filter((b) => allowed.includes((b.age_rating ?? "Everyone").trim())) as Book[];
    }
  }

  return (
    <>
      <AppNav />
      <section className="section" style={{ maxWidth: 1040, marginInline: "auto" }}>
        <div style={{ fontFamily: "var(--sans)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--gold)", marginBottom: "0.5rem" }}>💥 Comics</div>
        <h1 style={{ fontSize: "clamp(2rem, 5.5vw, 3rem)", lineHeight: 1.08, marginBottom: "0.6rem" }}>Visual stories, infinite worlds.</h1>
        <p style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "1.05rem", marginBottom: "2rem", maxWidth: 560 }}>
          Read panel by panel, or scroll the whole thing webtoon-style — your place is kept either way.
        </p>

        {comics.length === 0 ? (
          <div style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "3rem 2rem", textAlign: "center", background: "var(--stone)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.6rem" }}>💥</div>
            <p style={{ fontSize: "1.15rem", marginBottom: "0.4rem", color: "var(--ivory)" }}>No comics published yet.</p>
            <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", maxWidth: 440, margin: "0 auto 1.3rem" }}>
              Comics land here the moment a creator publishes one. Want to be first?
            </p>
            <a href="/creator" className="btn btn-gold">Publish a comic →</a>
          </div>
        ) : (
          <div className="book-grid-mini">
            {comics.map((b) => (
              <BookMini key={b.id} book={b} />
            ))}
          </div>
        )}
      </section>
      <div style={{ paddingBottom: "3rem" }} />
    </>
  );
}
