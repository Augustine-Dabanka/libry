import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import CommunityCreate from "@/components/CommunityCreate";

export const metadata = { title: "Communities — Libry" };

type Community = { id: number; slug: string; name: string; description: string | null; emoji: string | null; is_official: boolean };

export default async function CommunitiesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/communities");

  const { data: comms } = await supabase.from("communities").select("id, slug, name, description, emoji, is_official").order("is_official", { ascending: false }).order("created_at", { ascending: true });
  const communities = (comms ?? []) as Community[];

  // Member counts + which the user has joined.
  const counts = new Map<number, number>();
  const mine = new Set<number>();
  {
    const { data: members } = await supabase.from("community_members").select("community_id, user_id");
    for (const m of (members ?? []) as { community_id: number; user_id: string }[]) {
      counts.set(m.community_id, (counts.get(m.community_id) ?? 0) + 1);
      if (m.user_id === user.id) mine.add(m.community_id);
    }
  }

  return (
    <>
      <AppNav />
      <section className="section" style={{ maxWidth: 900, marginInline: "auto" }}>
        <div className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          <div>
            <h1>Communities</h1>
            <p style={{ color: "var(--muted)", fontFamily: "var(--sans)" }}>Join a room, share your work, climb the leaderboard. Or start your own.</p>
          </div>
          <CommunityCreate />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
          {communities.map((c) => (
            <a key={c.id} href={`/c/${c.slug}`} style={{ textDecoration: "none", background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.3rem 1.4rem", display: "block", transition: "border-color 0.15s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "1.6rem" }}>{c.emoji || "📚"}</span>
                <div>
                  <div style={{ fontFamily: "var(--serif)", color: "var(--ivory)", fontSize: "1.1rem" }}>{c.name}</div>
                  <div style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.78rem" }}>
                    {counts.get(c.id) ?? 0} member{(counts.get(c.id) ?? 0) === 1 ? "" : "s"}{mine.has(c.id) ? " · Joined" : ""}
                  </div>
                </div>
              </div>
              {c.description ? <p style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.88rem", lineHeight: 1.55, margin: 0 }}>{c.description}</p> : null}
              <div style={{ marginTop: "0.9rem", color: "var(--gold)", fontFamily: "var(--sans)", fontSize: "0.85rem", fontWeight: 600 }}>{mine.has(c.id) ? "Open →" : "View & join →"}</div>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
