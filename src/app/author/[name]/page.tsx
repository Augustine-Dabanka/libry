import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import BookMini from "@/components/BookMini";
import BackButton from "@/components/BackButton";
import FollowButton from "@/components/FollowButton";
import Stars from "@/components/Stars";
import { type Book } from "@/lib/types";
import { AUTHOR_BIOS } from "@/lib/authorBios";

export default async function AuthorPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const author = decodeURIComponent(name);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Published titles by this author.
  const res = await supabase
    .from("books")
    .select("id, title, author, price, type, rating, category, cover_url")
    .eq("is_published", true)
    .eq("author", author)
    .order("id", { ascending: false });
  const books = (res.data ?? []) as Book[];

  // Follower state (guarded — table may be pre-migration).
  let followers = 0;
  let following = false;
  const fc = await supabase.from("author_follows").select("follower_id").eq("author", author);
  if (!fc.error) {
    followers = (fc.data ?? []).length;
    following = !!user && (fc.data ?? []).some((r: { follower_id: string }) => r.follower_id === user.id);
  }

  // A bio for the header: a real creator's profile bio (matched by pen name or
  // full name), else the curated bio for classics and the Libry Originals brand.
  let profileBio: string | null = null;
  let profileAvatar: string | null = null;
  {
    const pr = await supabase.from("profiles").select("bio, avatar_url, pen_name, full_name").or(`pen_name.eq.${author},full_name.eq.${author}`).limit(1).maybeSingle();
    if (!pr.error && pr.data) {
      profileBio = (pr.data as { bio?: string | null }).bio ?? null;
      profileAvatar = (pr.data as { avatar_url?: string | null }).avatar_url ?? null;
    }
  }
  const bio = profileBio || AUTHOR_BIOS[author] || null;

  const rated = books.filter((b) => (b.rating ?? 0) > 0);
  const avg = rated.length ? rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length : 0;
  const initial = (author.trim()[0] || "?").toUpperCase();

  return (
    <>
      <AppNav />
      <section className="section">
        <div style={{ marginBottom: "1.5rem" }}>
          <BackButton fallback="/catalog" />
        </div>

        <div style={{ display: "flex", gap: "1.4rem", alignItems: "center", flexWrap: "wrap", marginBottom: "2.4rem" }}>
          {profileAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profileAvatar} alt={author} style={{ width: 76, height: 76, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--gold)", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 76, height: 76, borderRadius: "50%", background: "var(--stone)", border: "1px solid var(--border)", display: "grid", placeItems: "center", fontFamily: "var(--serif)", fontSize: "1.9rem", color: "var(--gold)", flexShrink: 0 }}>
              {initial}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 220 }}>
            <h1 style={{ fontSize: "clamp(1.7rem, 4vw, 2.4rem)", marginBottom: "0.3rem" }}>{author}</h1>
            <div style={{ display: "flex", gap: "1.2rem", alignItems: "center", flexWrap: "wrap", color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem" }}>
              <span>{books.length} {books.length === 1 ? "title" : "titles"}</span>
              <span>{followers} {followers === 1 ? "follower" : "followers"}</span>
              {avg > 0 ? <Stars value={avg} size={14} showValue /> : null}
            </div>
          </div>
          {user ? <FollowButton author={author} initialFollowing={following} /> : (
            <a href="/login" className="btn btn-gold" style={{ padding: "0.5rem 1.3rem" }}>Sign in to follow</a>
          )}
        </div>

        {bio ? (
          <p style={{ maxWidth: 720, color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.98rem", lineHeight: 1.7, marginBottom: "2.4rem" }}>
            {bio}
          </p>
        ) : null}

        {books.length > 0 ? (
          <div className="book-grid-mini">
            {books.map((b) => <BookMini key={b.id} book={b} />)}
          </div>
        ) : (
          <p style={{ color: "var(--muted)" }}>No published titles from {author} yet.</p>
        )}
      </section>
    </>
  );
}
