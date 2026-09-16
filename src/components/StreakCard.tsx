"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { computeStreak, goalMinutes, nextMilestone, type DayRow, type StreakInfo } from "@/lib/streak";

// The hour-based reading streak. Fetches the reader's daily minutes + goal and
// computes everything client-side. Fully guarded: if the reading_days table
// isn't migrated yet, or the reader has no history, it renders nothing.
export default function StreakCard({ compact = false }: { compact?: boolean }) {
  const [info, setInfo] = useState<StreakInfo | null>(null);
  const [totalHours, setTotalHours] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) { setReady(true); return; }

      const prof = await supabase.from("profiles").select("prefs").eq("id", user.id).maybeSingle();
      const prefs = (prof.data?.prefs && typeof prof.data.prefs === "object" ? prof.data.prefs : {}) as Record<string, unknown>;
      const goal = goalMinutes(typeof prefs.goal === "string" ? prefs.goal : null);

      const res = await supabase.from("reading_days").select("day, minutes");
      if (cancelled) return;
      if (res.error) { setReady(true); return; } // table not migrated → stay hidden
      const rows = (res.data ?? []) as DayRow[];
      const total = rows.reduce((s, r) => s + (r.minutes || 0), 0);
      setTotalHours(total / 60);
      setInfo(computeStreak(rows, goal));
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!ready || !info) return null;

  const hrsWeek = (info.minutesWeek / 60).toFixed(1);
  const started = info.current > 0 || info.minutesToday > 0 || info.longest > 0;
  const ms = nextMilestone(totalHours);
  const msPct = ms.hours > ms.prev ? Math.min(100, Math.round(((totalHours - ms.prev) / (ms.hours - ms.prev)) * 100)) : 100;
  const goalPct = Math.min(100, Math.round((info.minutesToday / info.goalMin) * 100));

  if (compact) {
    // Nav flame: shown only once a streak exists.
    if (info.current < 1) return null;
    return (
      <span title={`${info.current}-day reading streak`} aria-label={`${info.current} day reading streak`}
        style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--sans)", fontSize: "0.85rem", fontWeight: 700, color: "var(--gold)" }}>
        🔥{info.current}
      </span>
    );
  }

  return (
    <div style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 18, padding: "1.4rem 1.5rem" }}>
      {!started ? (
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={flameStyle}>🔥</div>
          <div>
            <div style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", color: "var(--ivory)" }}>Start your reading streak</div>
            <div style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", marginTop: 2 }}>
              Read {info.goalMin} minutes today to light the flame.
            </div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.1rem" }}>
            <div style={flameStyle}>🔥</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--serif)", fontSize: "1.9rem", lineHeight: 1, color: "var(--ivory)" }}>
                {info.current}-day streak
              </div>
              <div style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.82rem", marginTop: 4 }}>
                {hrsWeek} hrs this week · longest {info.longest} {info.longest === 1 ? "day" : "days"}
              </div>
            </div>
          </div>

          {/* week strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 7, marginBottom: "1.1rem" }}>
            {info.week.map((d, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.62rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5, fontFamily: "var(--sans)" }}>{d.label}</div>
                <div
                  style={{
                    height: 32, borderRadius: 9, display: "grid", placeItems: "center", fontSize: "0.7rem", fontFamily: "var(--sans)", fontWeight: 800,
                    background: d.met ? "linear-gradient(180deg,#C5A059,#97692F)" : "transparent",
                    border: d.met ? "1px solid transparent" : `1px solid var(--border)`,
                    color: d.met ? "#20180a" : d.isToday ? "var(--gold)" : "var(--muted)",
                    outline: d.isToday && !d.met ? "1.5px solid var(--gold)" : "none",
                  }}
                >
                  {d.met ? "✓" : d.isToday ? `${d.minutes}′` : "·"}
                </div>
              </div>
            ))}
          </div>

          {/* today's goal ring */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.9rem", padding: "0.9rem 0", borderTop: "1px solid var(--border)" }}>
            <div style={{ width: 46, height: 46, borderRadius: "50%", background: `conic-gradient(var(--gold) ${goalPct * 3.6}deg, rgba(250,247,242,0.10) 0)`, display: "grid", placeItems: "center", flexShrink: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--stone)", display: "grid", placeItems: "center", fontSize: "0.6rem", fontWeight: 800, fontFamily: "var(--sans)", color: "var(--ivory)" }}>
                {info.minutesToday}/{info.goalMin}
              </div>
            </div>
            <div style={{ flex: 1, fontFamily: "var(--sans)", fontSize: "0.86rem", color: "var(--ivory-muted)" }}>
              {info.minutesToday >= info.goalMin ? (
                <>Today&apos;s goal met. Beautifully done.</>
              ) : (
                <>Today: <b style={{ color: "var(--ivory)" }}>{info.minutesToday} of {info.goalMin} min</b><br />
                  <span style={{ color: "var(--muted)" }}>{info.goalMin - info.minutesToday} more minutes keeps the streak alive.</span></>
              )}
            </div>
          </div>

          {/* milestone */}
          <div style={{ paddingTop: "0.9rem", borderTop: "1px solid var(--border)", fontFamily: "var(--sans)", fontSize: "0.82rem", color: "var(--muted)" }}>
            Next badge: <b style={{ color: "var(--ivory)" }}>{ms.name}</b> at {ms.hours} hrs — {totalHours.toFixed(1)} / {ms.hours} hrs
            <div style={{ height: 7, borderRadius: 999, background: "rgba(250,247,242,0.10)", overflow: "hidden", marginTop: 6 }}>
              <div style={{ height: "100%", width: `${msPct}%`, background: "linear-gradient(90deg,var(--green,#5FA068),var(--gold))" }} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const flameStyle: React.CSSProperties = {
  width: 54, height: 54, borderRadius: 15, display: "grid", placeItems: "center", flexShrink: 0,
  fontSize: "1.7rem",
  background: "radial-gradient(circle at 50% 35%, rgba(224,184,76,0.32), rgba(196,85,63,0.14))",
  border: "1px solid rgba(224,184,76,0.4)",
};
