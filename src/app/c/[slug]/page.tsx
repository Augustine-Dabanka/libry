import { notFound } from "next/navigation";
import CommunityGlyph from "@/components/CommunityGlyph";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import CommunityRoom, { type LeaderRow } from "@/components/CommunityRoom";

export default async function CommunityRoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: community } = await supabase.from("communities").select("id, slug, name, description, emoji, cover_url").eq("slug", slug).maybeSingle();
  if (!community) notFound();

  // Guests get the room's intro and a way in; posts stay members-only.
  if (!user) {
    const { count } = await supabase.from("community_members").select("user_id", { count: "exact", head: true }).eq("community_id", community.id);
    return (
      <>
        <AppNav />
        <section className="section" style={{ maxWidth: 720, marginInline: "auto" }}>
          <a href="/communities" style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.88rem", fontWeight: 600 }}>← All communities</a>
          <div style={{ marginTop: "1rem", padding: "2rem 1.6rem", borderRadius: 20, border: "1px solid var(--border)", background: "var(--stone)", display: "grid", gap: "0.8rem", justifyItems: "start" }}>
            <h1 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.6rem" }}><CommunityGlyph value={community.emoji} /> {community.name}</h1>
            {community.description ? <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", margin: 0 }}>{community.description}</p> : null}
            {count ? <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", margin: 0, fontSize: "0.9rem" }}>{count} {count === 1 ? "member" : "members"}</p> : null}
            <a className="btn btn-gold" href={`/login?next=/c/${community.slug}`}>Join free to read and post</a>
          </div>
        </section>
      </>
    );
  }

  const { data: profile } = await supabase.from("profiles").select("full_name, username, avatar_url").eq("id", user.id).maybeSingle();
  const name = profile?.full_name || profile?.username || user.email?.split("@")[0] || "Reader";

  const [{ data: mem }, { count }, lb] = await Promise.all([
    supabase.from("community_members").select("user_id").eq("community_id", community.id).eq("user_id", user.id).maybeSingle(),
    supabase.from("community_members").select("user_id", { count: "exact", head: true }).eq("community_id", community.id),
    supabase.rpc("community_leaderboard", { cid: community.id }),
  ]);
  const leaderboard = ((lb.data ?? []) as { user_id: string; name: string; score: number }[]).map((r): LeaderRow => ({ user_id: r.user_id, name: r.name, score: Number(r.score) }));

  return (
    <>
      <AppNav />
      <section className="section" style={{ maxWidth: 1000, marginInline: "auto" }}>
        <a href="/communities" style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.88rem", fontWeight: 600 }}>← All communities</a>
        <div className="dashboard-header" style={{ margin: "0.8rem 0 1.5rem" }}>
          <h1 style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}><CommunityGlyph value={community.emoji} /> {community.name}</h1>
          {community.description ? <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", maxWidth: 640 }}>{community.description}</p> : null}
        </div>
        <CommunityRoom
          communityId={community.id}
          userId={user.id}
          userName={name}
          avatarUrl={profile?.avatar_url ?? null}
          isMember={!!mem}
          memberCount={count ?? 0}
          leaderboard={leaderboard}
        />
      </section>
    </>
  );
}
