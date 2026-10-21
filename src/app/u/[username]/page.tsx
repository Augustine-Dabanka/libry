import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import BookMini from "@/components/BookMini";
import KoalaAvatar from "@/components/KoalaAvatar";
import ChannelView, { type ChannelVideo } from "@/components/ChannelView";
import CreatorBadge, { type BadgeTier } from "@/components/CreatorBadge";
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
  // Only public columns are readable (0048). Finished count + privacy come from
  // profile_finished_count(), which never reveals the email behind them.
  const { data } = await supabase
    .from("profiles")
    .select("id, username, full_name, pen_name, avatar_url, creator_avatar_url, bio, is_creator, created_at")
    .eq("username", username)
    .maybeSingle();
  return (data as Profile) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const p = await getProfile(decodeURIComponent(username));
  if (!p) return { title: "Profile — Lybry" };
  const name = p.pen_name || p.full_name || p.username || "Reader";
  return { title: `${name} — Lybry`, description: p.bio || `${name} on Lybry.` };
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const p = await getProfile(decodeURIComponent(username));
  if (!p) notFound();

  const supabase = await createClient();
  const name = p.pen_name || p.full_name || p.username || "Reader";
  const avatar = p.creator_avatar_url || p.avatar_url;
  const initial = (name.trim()[0] || "?").toUpperCase();
  const fc = await supabase.rpc("profile_finished_count", { p_user: p.id });
  const hideActivity = fc.error ? true : fc.data === null;

  // Koala avatar + pronouns (0046). Read separately so the page still works before it's run.
  let koala: unknown = null;
  let pronouns: string | null = null;
  {
    const ex = await supabase.from("profiles").select("avatar, pronouns").eq("id", p.id).maybeSingle();
    if (!ex.error && ex.data) {
      koala = (ex.data as { avatar?: unknown }).avatar ?? null;
      pronouns = (ex.data as { pronouns?: string | null }).pronouns ?? null;
    }
  }

  // Channel extras (0049): banner, tagline, linked videos. Guarded.
  let banner: string | null = null;
  let tagline: string | null = null;
  let videos: ChannelVideo[] = [];
  {
    const ch = await supabase.from("profiles").select("banner, tagline").eq("id", p.id).maybeSingle();
    if (!ch.error && ch.data) { banner = (ch.data as { banner?: string | null }).banner ?? null; tagline = (ch.data as { tagline?: string | null }).tagline ?? null; }
    if (p.is_creator) {
      const vq = await supabase.from("creator_videos").select("id, provider, video_id, title, created_at").eq("user_id", p.id).order("created_at", { ascending: false }).limit(60);
      if (!vq.error && vq.data) videos = vq.data as ChannelVideo[];
    }
  }
  const { data: { user: viewer } } = await supabase.auth.getUser();
  const isOwner = viewer?.id === p.id;

  // Creator badge from real follower counts (0047); hidden if not run yet.
  let badge: BadgeTier | null = null;
  if (p.is_creator && p.pen_name) {
    const ms = await supabase.rpc("creator_milestones", { p_author: p.pen_name });
    if (!ms.error && ms.data) badge = ((ms.data as { tier?: BadgeTier | null }).tier) ?? null;
  }

  // Published books (if creator).
  let books: Book[] = [];
  if (p.is_creator) {
    const { data } = await supabase
      .from("books")
      .select("id, title, author, price, type, category, cover_url, rating")
      .eq("user_id", p.id)
      .eq("is_published", true)
      .order("id", { ascending: false })
      .limit(60);
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

  // Books finished (0 if hidden or not migrated yet).
  const finished = !hideActivity && typeof fc.data === "number" ? fc.data : 0;

  return (
    <>
      <AppNav />
      <section className="section" style={{ maxWidth: 1000, marginInline: "auto" }}>
        {banner || tagline || p.is_creator ? (
          <div className={`ch-banner${banner ? " has-img" : ""}`} style={{ marginBottom: "1.2rem" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {banner ? <img src={banner} alt="" /> : null}
            {tagline ? <div className="ch-tagline">{tagline}</div> : null}
            {isOwner ? <a href="/creator#channel" className="btn btn-outline" style={{ position: "absolute", right: 12, top: 12, padding: "0.35rem 0.8rem", fontSize: "0.82rem", background: "color-mix(in srgb, var(--stone) 85%, transparent)" }}>Change banner</a> : null}
          </div>
        ) : null}
        <div style={{ display: "flex", gap: "1.3rem", alignItems: "center", flexWrap: "wrap", marginBottom: "1.6rem" }}>
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={name} style={{ width: 84, height: 84, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border)" }} />
          ) : koala ? (
            <KoalaAvatar look={koala} size={84} />
          ) : (
            <div style={{ width: 84, height: 84, borderRadius: "50%", background: "var(--gold)", color: "var(--on-gold)", display: "grid", placeItems: "center", fontSize: "2rem", fontFamily: "var(--sans)", fontWeight: 900 }}>{initial}</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "clamp(1.6rem,4vw,2.2rem)", margin: 0 }}>{name}</h1>
              {badge ? <CreatorBadge tier={badge} size={28} /> : null}
              {p.is_creator ? <span className="badge" style={{ background: "color-mix(in srgb, var(--gold) 16%, transparent)", color: "var(--gold)", borderColor: "color-mix(in srgb, var(--gold) 35%, transparent)" }}>✦ Creator</span> : null}
            </div>
            {p.username ? <div style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem" }}>@{p.username}{pronouns ? ` · ${pronouns}` : ""}</div> : null}
            <div style={{ display: "flex", gap: "1.2rem", marginTop: "0.5rem", color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.86rem" }}>
              {reviews.length ? <span><b style={{ color: "var(--ivory)" }}>{reviews.length}</b> review{reviews.length === 1 ? "" : "s"}</span> : null}
              {!hideActivity && finished > 0 ? <span><b style={{ color: "var(--ivory)" }}>{finished}</b> finished</span> : null}
              {books.length ? <span><b style={{ color: "var(--ivory)" }}>{books.length}</b> published</span> : null}
              {videos.length ? <span><b style={{ color: "var(--ivory)" }}>{videos.length}</b> video{videos.length === 1 ? "" : "s"}</span> : null}
            </div>
          </div>
          {p.is_creator && p.pen_name ? (
            <a href={`/author/${encodeURIComponent(p.pen_name)}`} className="btn btn-outline" style={{ padding: "0.45rem 1rem" }}>Creator page →</a>
          ) : null}
        </div>

        {p.is_creator ? (
          <ChannelView
            books={books}
            videos={videos}
            isOwner={isOwner}
            reviews={reviews.length ? (
          <div>
            
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
                    ) : <p style={{ color: "var(--muted)", fontWeight: 700 }}>No reviews yet.</p>}
            about={(
              <div style={{ display: "grid", gap: "0.8rem", maxWidth: 640 }}>
                {p.bio ? <p style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", lineHeight: 1.7, margin: 0 }}>{p.bio}</p> : <p style={{ color: "var(--muted)", margin: 0 }}>No bio yet.</p>}
                {p.created_at ? <p style={{ color: "var(--muted)", fontWeight: 700, margin: 0 }}>On Lybry since {new Date(p.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p> : null}
              </div>
            )}
          />
        ) : (
          <>
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
          </>
        )}
      </section>
    </>
  );
}
