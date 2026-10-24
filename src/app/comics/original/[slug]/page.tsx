import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import ComicReader from "@/components/ComicReader";
import { getOriginalComic } from "@/lib/originalComics";
import { isMatureRating } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function OriginalComicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const comic = getOriginalComic(slug);
  if (!comic) {
    return <main className="section"><h1>Comic not found</h1><a href="/comics">Back to comics →</a></main>;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (isMatureRating(comic.ageRating)) {
    let showMature = false;
    if (user) {
      const prefs = await supabase.from("my_profile").select("show_mature").eq("id", user.id).maybeSingle();
      showMature = !!prefs.data?.show_mature;
    }
    if (!showMature) {
      return (
        <>
          <AppNav />
          <main className="section" style={{ maxWidth: 520, margin: "2rem auto", textAlign: "center" }}>
            <div style={{ fontSize: "2.4rem", marginBottom: ".7rem" }}>🔞</div>
            <h1>This comic has a mature rating</h1>
            <p style={{ color: "var(--muted)", lineHeight: 1.7, margin: "1rem 0 1.4rem" }}>This title is hidden by default. Enable mature content in Settings if you meet the age requirement.</p>
            <a className="btn btn-gold" href="/settings">Open Settings</a>{" "}
            <a className="btn btn-outline" href="/comics">Back to comics</a>
          </main>
        </>
      );
    }
  }

  const pages = [1, 2, 3].map((page) => ({
    kind: "image" as const,
    src: `/api/comic-art?slug=${encodeURIComponent(comic.slug)}&page=${page}`,
    caption: `${comic.title} · Part ${page}`,
  }));

  return (
    <ComicReader
      bookId={`original-${comic.slug}`}
      title={comic.title}
      author="Lybry Originals"
      pages={pages}
      userEmail={null}
      signedIn={!!user}
      price={0}
      defaultMode="scroll"
    />
  );
}
