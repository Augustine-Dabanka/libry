"use client";

import { useState, useTransition, type CSSProperties } from "react";
import { claimQuest } from "@/app/actions/gamification";
import { playPop } from "@/lib/sfx";

const COLORS = ["#C4A35A", "#B45309", "#7DBE86", "#B7B7E6", "#E08A3C", "#FAF7F2"];
// 12 particles fanned out in a circle.
const PARTICLES = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  const dist = 26 + (i % 3) * 8;
  return { x: Math.cos(a) * dist, y: Math.sin(a) * dist, c: COLORS[i % COLORS.length] };
});

export default function ClaimButton({ questId, reward }: { questId: number; reward: number }) {
  const [pending, start] = useTransition();
  const [burst, setBurst] = useState(false);

  function onClaim() {
    playPop();
    setBurst(true);
    start(() => claimQuest(questId));
    setTimeout(() => setBurst(false), 900);
  }

  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <button
        className="btn btn-gold lb-press"
        style={{ padding: "0.3rem 0.9rem", fontSize: "0.8rem" }}
        type="button"
        onClick={onClaim}
        disabled={pending}
      >
        {pending ? "…" : "Claim"}
      </button>
      {burst && (
        <span aria-hidden="true">
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              className="lb-confetti"
              style={{ background: p.c, ["--tx" as string]: `${p.x}px`, ["--ty" as string]: `${p.y}px` } as CSSProperties}
            />
          ))}
          <span className="lb-reward">+{reward}⚡</span>
        </span>
      )}
    </span>
  );
}
