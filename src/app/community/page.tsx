import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import CommunityFeed from "@/components/CommunityFeed";

export const metadata = { title: "Community — Libry" };

export default async function CommunityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/community");

  const { data: profile } = await supabase.from("profiles").select("full_name, username, avatar_url").eq("id", user.id).maybeSingle();
  const name = profile?.full_name || profile?.username || user.email?.split("@")[0] || "Reader";

  // Rooms to jump into (guarded pre-migration).
  type Comm = { id: number; slug: string; name: string; emoji: string | null };
  let rooms: Comm[] = [];
  { const { data } = await supabase.from("communities").select("id, slug, name, emoji").order("is_official", { ascending: false }).limit(6); rooms = (data ?? []) as Comm[]; }

  return (
    <>
      <AppNav />
      <section className="section" style={{ maxWidth: 720, marginInline: "auto" }}>
        <div className="dashboard-header" style={{ marginBottom: "1.2rem" }}>
          <h1>Community</h1>
          <p style={{ color: "var(--muted)", fontFamily: "var(--sans)" }}>
            Jump into a room, or share to the whole of Libry below.
          </p>
        </div>

        {rooms.length > 0 ? (
          <div style={{ marginBottom: "1.8rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.7rem" }}>
              <h2 style={{ fontSize: "1.05rem" }}>Rooms</h2>
              <a href="/communities" style={{ color: "var(--gold)", fontFamily: "var(--sans)", fontSize: "0.85rem" }}>All communities →</a>
            </div>
            <div style={{ display: "flex", gap: "0.6rem", overflowX: "auto", paddingBottom: "0.3rem" }}>
              {rooms.map((r) => (
                <a key={r.id} href={`/c/${r.slug}`} style={{ flexShrink: 0, textDecoration: "none", display: "flex", alignItems: "center", gap: "0.45rem", background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 999, padding: "0.5rem 0.9rem", color: "var(--ivory)", fontFamily: "var(--sans)", fontSize: "0.88rem", fontWeight: 600, whiteSpace: "nowrap" }}>
                  <span>{r.emoji || "📚"}</span> {r.name}
                </a>
              ))}
            </div>
          </div>
        ) : null}

        <h2 style={{ fontSize: "1.05rem", marginBottom: "0.8rem" }}>Everyone on Libry</h2>
        <CommunityFeed userId={user.id} userName={name} avatarUrl={profile?.avatar_url ?? null} />
      </section>
    </>
  );
}
