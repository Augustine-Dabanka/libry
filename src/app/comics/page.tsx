import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import BookMini from "@/components/BookMini";
import { allowedRatings } from "@/lib/content";
import { type Book } from "@/lib/types";

import Glyph from "@/components/Glyph";
import { ORIGINAL_COMICS } from "@/lib/originalComics";
import { agePill } from "@/lib/content";
export const metadata = { title: "Comics — Lybry" };

// First-class Comics browse surface. Comics are ordinary books with a comic
// `type`; the reader routes them to the panel/webtoon ComicReader.
export default async function ComicsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let allowed = allowedRatings(false);
  if (user) {
    const sm = await supabase.from("my_profile").select("show_mature").eq("id", user.id).maybeSingle();
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

  const originalComics = ORIGINAL_COMICS.filter((comic) => allowed.includes(comic.ageRating));

  return (
    <>
      <AppNav />
      <section className="section" style={{ maxWidth: 1040, marginInline: "auto" }}>
        <div style={{ fontFamily: "var(--sans)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--gold)", marginBottom: "0.5rem" }}><Glyph e="💥" /> Comics</div>
        <h1 style={{ fontSize: "clamp(2rem, 5.5vw, 3rem)", lineHeight: 1.08, marginBottom: "0.6rem" }}>Visual stories, infinite worlds.</h1>
        <p style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "1.05rem", marginBottom: "2rem", maxWidth: 560 }}>
          Read panel by panel, or scroll the whole thing webtoon-style — your place is kept either way.
        </p>

        <section style={{ marginBottom: "3rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <div>
              <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.65rem", margin: "0 0 .3rem" }}>Lybry Originals</h2>
              <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: ".86rem", margin: 0 }}>Original visual stories across fantasy, sci-fi, comedy, mystery, school life, and more.</p>
            </div>
            <span style={{ color: "var(--gold)", fontFamily: "var(--sans)", fontSize: ".78rem" }}>{originalComics.length} original stories</span>
          </div>
          <div className="book-grid-mini">
            {originalComics.map((comic) => (
              <a key={comic.slug} href={"/comics/original/" + comic.slug} className="book-card book-card-v2" style={{ display: "block", padding: "1rem", textDecoration: "none" }}>
                <div style={{ position: "relative", aspectRatio: "2 / 3", borderRadius: 10, overflow: "hidden", background: "var(--stone)", border: "1px solid color-mix(in srgb, var(--gold) 28%, transparent)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={"/api/comic-art?slug=" + encodeURIComponent(comic.slug) + "&page=0"} alt={"Original cover art for " + comic.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ padding: ".85rem .25rem .2rem" }}>
                  <h3 style={{ fontFamily: "var(--serif)", fontSize: "1.02rem", color: "var(--ivory)", lineHeight: 1.25, margin: "0 0 .35rem" }}>{comic.title}</h3>
                  <div style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: ".78rem", marginBottom: ".5rem" }}>{comic.category}</div>
                  <p style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: ".8rem", lineHeight: 1.5, margin: "0 0 .6rem" }}>{comic.logline}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: ".4rem", flexWrap: "wrap" }}>
                    <span className="badge">Original</span><span className="badge">{agePill(comic.ageRating)}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.65rem", margin: "0 0 1rem" }}>Community comics</h2>
          {comics.length === 0 ? (
            <div style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "2rem 1.5rem", textAlign: "center", background: "var(--stone)" }}>
              <p style={{ fontSize: "1.05rem", marginBottom: "0.4rem", color: "var(--ivory)" }}>No community comics published yet.</p>
              <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", maxWidth: 440, margin: "0 auto 1.1rem" }}>Create your own comic and upload original panels, or publish artwork you have permission to use.</p>
              <a href="/creator" className="btn btn-gold">Publish a comic →</a>
            </div>
          ) : (
            <div className="book-grid-mini">
              {comics.map((b) => <BookMini key={b.id} book={b} />)}
            </div>
          )}
        </section>
      </section>
      <div style={{ paddingBottom: "3rem" }} />
    </>
  );
}
