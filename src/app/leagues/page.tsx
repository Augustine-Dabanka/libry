import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";

type Row = {
  user_id: string;
  weekly_xp: number;
  league: string;
  streak_count: number;
};

const LEAGUE_COLOR: Record<string, string> = {
  Bronze: "#B08D57",
  Silver: "#C0C4C8",
  Gold: "#D9B44A",
  Diamond: "#7FD7E6",
};

export default async function Leagues() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: statsData } = await supabase
    .from("user_stats")
    .select("user_id, weekly_xp, league, streak_count")
    .order("weekly_xp", { ascending: false })
    .limit(25);
  const rows = (statsData ?? []) as Row[];

  const ids = rows.map((r) => r.user_id);
  const nameMap = new Map<string, string>();
  if (ids.length) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, username, full_name")
      .in("id", ids);
    (profs ?? []).forEach((p: { id: string; username: string | null; full_name: string | null }) =>
      nameMap.set(p.id, p.full_name || p.username || "Reader")
    );
  }

  return (
    <>
      <AppNav />
      <section className="section">
        <div className="section-header">
          <h2>Leagues</h2>
        </div>
        <p style={{ color: "var(--muted)", marginTop: "-1.5rem", marginBottom: "2rem" }}>
          Weekly XP standings. Read and finish books to climb Bronze → Silver → Gold → Diamond.
        </p>

        {rows.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No readers ranked yet — be the first.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: 640 }}>
            {rows.map((r, i) => {
              const me = r.user_id === user.id;
              return (
                <div
                  key={r.user_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "0.85rem 1.1rem",
                    borderRadius: 14,
                    background: me ? "rgba(196,163,90,0.12)" : "var(--stone)",
                    border: `1px solid ${me ? "rgba(196,163,90,0.4)" : "var(--border)"}`,
                  }}
                >
                  <span style={{ width: 28, textAlign: "center", fontWeight: 800, color: "var(--muted)" }}>
                    {i + 1}
                  </span>
                  <span style={{ flex: 1, fontFamily: "var(--sans)", fontWeight: 600 }}>
                    {nameMap.get(r.user_id) || "Reader"}
                    {me ? <span style={{ color: "var(--gold)" }}> · you</span> : null}
                  </span>
                  <span style={{ fontSize: "0.82rem", color: "var(--muted)", fontFamily: "var(--sans)" }}>
                    🔥 {r.streak_count}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      color: LEAGUE_COLOR[r.league] || "var(--muted)",
                      fontFamily: "var(--sans)",
                    }}
                  >
                    {r.league}
                  </span>
                  <span style={{ fontWeight: 800, color: "var(--gold)", fontFamily: "var(--sans)", minWidth: 64, textAlign: "right" }}>
                    {r.weekly_xp} XP
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
