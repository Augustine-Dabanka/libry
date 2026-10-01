import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import Icon from "@/components/Icon";
import LeaderboardToggle from "@/components/LeaderboardToggle";

export const metadata = { title: "Weekly leaderboard · Libry" };

type Row = { rank: number; display_name: string; avatar_url: string | null; minutes: number; is_me: boolean };

// Weekly reading leaderboard. Ranked by minutes actually read (counted by the
// reader, one per active minute), resets every Monday, and is opt-in: nobody
// appears unless they switch it on. Never ranks by spending.
export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let rows: Row[] = [];
  {
    const { data, error } = await supabase.rpc("leaderboard_week", { p_limit: 25 });
    if (!error && Array.isArray(data)) rows = data as Row[];
  }

  let optedIn = false;
  let myMinutes = 0;
  if (user) {
    const p = await supabase.from("profiles").select("prefs").eq("id", user.id).maybeSingle();
    optedIn = (p.data?.prefs as Record<string, unknown> | null)?.leaderboard === "on";
    const monday = new Date();
    const dow = (monday.getUTCDay() + 6) % 7;
    monday.setUTCDate(monday.getUTCDate() - dow);
    const since = monday.toISOString().slice(0, 10);
    const rd = await supabase.from("reading_days").select("minutes").gte("day", since);
    if (!rd.error) myMinutes = (rd.data ?? []).reduce((a: number, r: { minutes: number }) => a + (r.minutes || 0), 0);
  }

  return (
    <>
      <AppNav />
      <section className="section" style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ marginBottom: "0.3rem" }}>Weekly leaderboard</h1>
        <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", marginBottom: "1.4rem" }}>
          Ranked by minutes read since Monday. Resets every week. Only readers who opt in appear.
        </p>

        {user ? (
          <div style={{ display: "grid", gap: "0.8rem", marginBottom: "1.6rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", padding: "0.9rem 1rem", borderRadius: 14, background: "var(--stone)", border: "1px solid var(--border)", fontFamily: "var(--sans)" }}>
              <span style={{ color: "var(--gold)" }}><Icon name="streak" size={22} /></span>
              <span>You&apos;ve read <b>{myMinutes}</b> {myMinutes === 1 ? "minute" : "minutes"} this week.</span>
            </div>
            <LeaderboardToggle initial={optedIn} />
          </div>
        ) : (
          <p style={{ fontFamily: "var(--sans)", marginBottom: "1.6rem" }}>
            <a href="/login?next=/leaderboard">Sign in</a> to track your minutes and join the board.
          </p>
        )}

        {rows.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2.4rem 1rem", border: "1px dashed var(--border)", borderRadius: 16, color: "var(--muted)", fontFamily: "var(--sans)" }}>
            <div style={{ color: "var(--gold)", marginBottom: "0.5rem" }}><Icon name="trophy" size={30} /></div>
            No one is on this week&apos;s board yet. Read a chapter and switch yourself on.
          </div>
        ) : (
          <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.4rem" }}>
            {rows.map((r) => (
              <li key={`${r.rank}-${r.display_name}`} style={{ display: "flex", alignItems: "center", gap: "0.9rem", padding: "0.7rem 0.9rem", borderRadius: 12, background: r.is_me ? "rgba(95,160,104,0.12)" : "var(--stone)", border: `1px solid ${r.is_me ? "var(--gold)" : "transparent"}`, fontFamily: "var(--sans)" }}>
                <span style={{ width: 28, textAlign: "center", fontFamily: "var(--serif)", fontWeight: 600, fontSize: "1.1rem", color: r.rank <= 3 ? "var(--gold)" : "var(--muted)" }}>{r.rank}</span>
                {r.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.avatar_url} alt="" width={34} height={34} style={{ borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <span style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--border)", display: "grid", placeItems: "center", fontSize: "0.75rem", fontWeight: 700 }}>{r.display_name.slice(0, 2).toUpperCase()}</span>
                )}
                <span style={{ flex: 1, fontWeight: 600 }}>{r.is_me ? `${r.display_name} (you)` : r.display_name}</span>
                <span style={{ color: "var(--ivory-muted)", fontSize: "0.9rem", fontVariantNumeric: "tabular-nums" }}>{r.minutes} min</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
