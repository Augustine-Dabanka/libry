"use client";

import { useState } from "react";
import Mascot, { type MascotMood } from "@/components/Mascot";
import SeasonalScene, { SEASON_KEYS } from "@/components/SeasonalScene";

const MOODS: { m: MascotMood; t: string }[] = [
  { m: "idle", t: "Idle" },
  { m: "wave", t: "Wave" },
  { m: "cheer", t: "Cheer" },
  { m: "think", t: "Think" },
  { m: "sad", t: "Sad" },
];

export default function KoalaLab() {
  const [mood, setMood] = useState<MascotMood>("idle");
  const [book, setBook] = useState(true);
  const [season, setSeason] = useState<string>("christmas");
  return (
    <div style={{ display: "grid", gap: "1.2rem", justifyItems: "center" }}>
      <div style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 24, padding: "2rem 1rem 1.2rem", width: "100%", display: "grid", justifyItems: "center", gap: "0.6rem" }}>
        <Mascot mood={mood} size={220} follow interactive prop={book ? "book" : undefined} label={`Koala, ${mood}`} />
        <p style={{ margin: 0, color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.85rem", textAlign: "center" }}>
          Move your finger (or tilt the tablet). Press and hold to squash, let go to cheer.
        </p>
      </div>
      <div role="group" aria-label="Mood" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center" }}>
        {MOODS.map((x) => (
          <button key={x.m} type="button" className="btn" aria-pressed={mood === x.m} onClick={() => setMood(x.m)}
            style={{ padding: "0.55rem 1rem", borderRadius: 999, border: `1px solid ${mood === x.m ? "var(--gold)" : "var(--border)"}`, background: mood === x.m ? "rgba(196,163,90,0.15)" : "transparent", color: "var(--ivory)", fontFamily: "var(--sans)" }}>
            {x.t}
          </button>
        ))}
        <button type="button" className="btn" onClick={() => setBook((b) => !b)}
          style={{ padding: "0.55rem 1rem", borderRadius: 999, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", fontFamily: "var(--sans)" }}>
          {book ? "Hide book" : "Show book"}
        </button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
        {MOODS.map((x) => <Mascot key={x.m} mood={x.m} size={96} follow />)}
      </div>
      <h2 style={{ fontFamily: "var(--serif)", margin: "1.2rem 0 0" }}>Holiday loading screens</h2>
      <div role="group" aria-label="Season" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center" }}>
        {SEASON_KEYS.map((k) => (
          <button key={k} type="button" className="btn" aria-pressed={season === k} onClick={() => setSeason(k)}
            style={{ padding: "0.5rem 0.9rem", borderRadius: 999, border: `1px solid ${season === k ? "var(--gold)" : "var(--border)"}`, background: season === k ? "rgba(196,163,90,0.15)" : "transparent", color: "var(--ivory)", fontFamily: "var(--sans)", textTransform: "capitalize" }}>
            {k}
          </button>
        ))}
      </div>
      <SeasonalScene key={season} season={season} label="Kumasi Book Fair" />
    </div>
  );
}
