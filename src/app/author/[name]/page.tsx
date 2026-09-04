import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import BookCard from "@/components/BookCard";
import BackButton from "@/components/BackButton";
import FollowButton from "@/components/FollowButton";
import Stars from "@/components/Stars";
import { type Book } from "@/lib/types";

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
    .select("id, title, author, price, type, rating")
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
          <div style={{ width: 76, height: 76, borderRadius: "50%", background: "var(--stone)", border: "1px solid var(--border)", display: "grid", placeItems: "center", fontFamily: "var(--serif)", fontSize: "1.9rem", color: "var(--gold)", flexShrink: 0 }}>
            {initial}
          </div>
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

        {books.length > 0 ? (
          <div className="book-grid">
            {books.map((b) => <BookCard key={b.id} book={b} />)}
          </div>
        ) : (
          <p style={{ color: "var(--muted)" }}>No published titles from {author} yet.</p>
        )}
      </section>
    </>
  );
}
