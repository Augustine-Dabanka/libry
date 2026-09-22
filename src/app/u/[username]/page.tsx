import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import BookMini from "@/components/BookMini";
import { type Book } from "@/lib/types";

type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  pen_name: string | null;
  avatar_url: string | null;
  creator_avatar_url: string | null;
  bio: string | null;
  is_creator: boolean | null;
  created_at: string | null;
  email?: string | null;
  prefs?: { hide_activity?: boolean } | null;
};

async function getProfile(username: string): Promise<Profile | null> {
  const supabase = await createClient();
  // Only ever select public-safe columns for display; email/prefs are used
  // server-side for counts and privacy, never rendered.
  const { data } = await supabase
    .from("profiles")
    .select("id, username, full_name, pen_name, avatar_url, creator_avatar_url, bio, is_creator, created_at, email, prefs")
    .eq("username", username)
    .maybeSingle();
  return (data as Profile) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const p = await getProfile(decodeURIComponent(username));
  if (!p) return { title: "Profile — Libry" };
  const name = p.pen_name || p.full_name || p.username || "Reader";
  return { title: `${name} — Libry`, description: p.bio || `${name} on Libry.` };
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const p = await getProfile(decodeURIComponent(username));
  if (!p) notFound();

  const supabase = await createClient();
  const name = p.pen_name || p.full_name || p.username || "Reader";
  const avatar = p.creator_avatar_url || p.avatar_url;
  const initial = (name.trim()[0] || "?").toUpperCase();
  const hideActivity = !!p.prefs?.hide_activity;

  // Published books (if creator).
  let books: Book[] = [];
  if (p.is_creator) {
    const { data } = await supabase
      .from("books")
      .select("id, title, author, price, type, category, cover_url, rating")
      .eq("user_id", p.id)
      .eq("is_published", true)
      .order("id", { ascending: false })
      .limit(12);
    if (data) books = data as Book[];
  }

  // Reviews written (public content the user authored).
  type Rev = { id: number; book_id: number; rating: number; body: string | null; created_at: string };
  let reviews: Rev[] = [];
  const titleById = new Map<number, string>();
  {
    const { data } = await supabase.from("reviews").select("id, book_id, rating, body, created_at").eq("user_id", p.id).order("created_at", { ascending: false }).limit(10);
    reviews = (data ?? []) as Rev[];
    if (reviews.length) {
      const ids = [...new Set(reviews.map((r) => r.book_id))];
      const { data: bs } = await supabase.from("books").select("id, title").in("id", ids);
      for (const b of (bs ?? []) as { id: number; title: string }[]) titleById.set(Number(b.id), b.title);
    }
  }

  // Reading counts (server-side via email; hidden if the user opted out).
  let finished = 0;
  if (!hideActivity && p.email) {
    const fin = await supabase.from("reading_progress").select("book_id", { count: "exact", head: true }).eq("user_email", p.email).gte("progress_percentage", 100);
    finished = fin.count ?? 0;
  }

  return (
    <>
      <AppNav />
      <section className="section" style={{ maxWidth: 900, marginInline: "auto" }}>
        <div style={{ display: "flex", gap: "1.3rem", alignItems: "center", flexWrap: "wrap", marginBottom: "1.6rem" }}>
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={name} style={{ width: 84, height: 84, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border)" }} />
          ) : (
            <div style={{ width: 84, height: 84, borderRadius: "50%", background: "var(--gold)", color: "#12100E", display: "grid", placeItems: "center", fontSize: "2rem", fontFamily: "var(--serif)", fontWeight: 700 }}>{initial}</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "clamp(1.6rem,4vw,2.2rem)", margin: 0 }}>{name}</h1>
              {p.is_creator ? <span className="badge" style={{ background: "rgba(196,163,90,0.16)", color: "var(--gold)", borderColor: "rgba(196,163,90,0.35)" }}>✦ Creator</span> : null}
            </div>
            {p.username ? <div style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem" }}>@{p.username}</div> : null}
            <div style={{ display: "flex", gap: "1.2rem", marginTop: "0.5rem", color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.86rem" }}>
              {reviews.length ? <span><b style={{ color: "var(--ivory)" }}>{reviews.length}</b> review{reviews.length === 1 ? "" : "s"}</span> : null}
              {!hideActivity && finished > 0 ? <span><b style={{ color: "var(--ivory)" }}>{finished}</b> finished</span> : null}
              {books.length ? <span><b style={{ color: "var(--ivory)" }}>{books.length}</b> published</span> : null}
            </div>
          </div>
          {p.is_creator && p.pen_name ? (
            <a href={`/author/${encodeURIComponent(p.pen_name)}`} className="btn btn-outline" style={{ padding: "0.45rem 1rem" }}>Creator page →</a>
          ) : null}
        </div>

        {p.bio ? <p style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", lineHeight: 1.7, maxWidth: 620, marginBottom: "2rem" }}>{p.bio}</p> : null}

        {books.length > 0 ? (
          <div style={{ marginBottom: "2.4rem" }}>
            <div className="section-header"><h2>Published stories</h2></div>
            <div className="book-grid-mini">
              {books.map((b) => <BookMini key={b.id} book={b} />)}
            </div>
          </div>
        ) : null}

        {reviews.length > 0 ? (
          <div>
            <div className="section-header"><h2>Reviews</h2></div>
            <div style={{ display: "grid", gap: "0.8rem" }}>
              {reviews.map((r) => (
                <a key={r.id} href={`/book/${r.book_id}`} style={{ textDecoration: "none", background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 12, padding: "0.9rem 1.1rem", display: "block" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.8rem", marginBottom: "0.3rem" }}>
                    <span style={{ fontFamily: "var(--serif)", color: "var(--ivory)" }}>{titleById.get(r.book_id) ?? "A story"}</span>
                    <span style={{ color: "var(--gold)", flexShrink: 0, fontSize: "0.9rem" }}>{"★".repeat(Math.round(r.rating))}</span>
                  </div>
                  {r.body ? <p style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", margin: 0, lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{r.body}</p> : null}
                </a>
              ))}
            </div>
          </div>
        ) : null}

        {books.length === 0 && reviews.length === 0 ? (
          <div style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "2.6rem 1.6rem", textAlign: "center", background: "var(--stone)", color: "var(--muted)" }}>
            <p style={{ color: "var(--ivory)", marginBottom: "0.3rem" }}>{name} is just getting started.</p>
            <p style={{ fontFamily: "var(--sans)", fontSize: "0.9rem" }}>Reviews and published stories will show up here.</p>
          </div>
        ) : null}
      </section>
    </>
  );
}
