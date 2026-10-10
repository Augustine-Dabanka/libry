"use client";

import { useState, useTransition } from "react";
import { setLeaderboardOptIn } from "@/app/actions/leaderboard";

export default function LeaderboardToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "0.9rem 1rem", border: "1px solid var(--border)", borderRadius: 14 }}>
      <span id="lb-opt" style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: "0.92rem" }}>
        Show me on the leaderboard
        {err ? <span style={{ display: "block", color: "var(--terracotta)", fontWeight: 400, fontSize: "0.8rem" }}>{err}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby="lb-opt"
        disabled={pending}
        onClick={() => {
          const next = !on;
          setOn(next);
          setErr(null);
          start(async () => {
            const r = await setLeaderboardOptIn(next);
            if (r && "error" in r && r.error) { setOn(!next); setErr(r.error); }
          });
        }}
        style={{ width: 52, height: 32, borderRadius: 16, border: "none", padding: 3, cursor: "pointer", background: on ? "var(--gold)" : "var(--border)", display: "flex", flexShrink: 0 }}
      >
        <span style={{ width: 26, height: 26, borderRadius: "50%", background: "#fff", transform: on ? "translateX(20px)" : "none", transition: "transform 180ms cubic-bezier(.3,1.4,.5,1)" }} />
      </button>
    </div>
  );
}
