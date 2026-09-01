"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { refillTokens } from "@/app/actions/gamification";

const REGEN_MS = 30 * 60 * 1000; // 30 min per token

// Live token meter: ticks a countdown to the next token and auto-refreshes when
// one regenerates. Shows a "Refill" affordance when below the cap.
export default function TokenBadge({
  tokens,
  cap,
  updatedAt,
}: {
  tokens: number;
  cap: number;
  updatedAt: string;
}) {
  const router = useRouter();
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (tokens >= cap) return;
    const base = new Date(updatedAt).getTime();
    const tick = () => {
      const elapsed = Date.now() - base;
      const rem = REGEN_MS - (elapsed % REGEN_MS);
      setRemaining(rem);
      // A token just regenerated — pull fresh server state.
      if (elapsed > 0 && elapsed % REGEN_MS < 1000) router.refresh();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tokens, cap, updatedAt, router]);

  const mm = Math.floor(remaining / 60000);
  const ss = Math.floor((remaining % 60000) / 1000)
    .toString()
    .padStart(2, "0");

  return (
    <span
      className="lb-pop"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.45rem",
        background: "rgba(196,163,90,0.16)",
        color: "var(--gold)",
        borderRadius: 999,
        padding: "0.4rem 0.9rem",
        fontWeight: 800,
        fontFamily: "var(--sans)",
        fontSize: "0.95rem",
        animationDelay: "0.12s",
      }}
    >
      ⚡ {tokens}/{cap}
      {tokens < cap ? (
        <>
          <span style={{ color: "var(--muted)", fontWeight: 600, fontSize: "0.8rem" }}>
            +1 in {mm}:{ss}
          </span>
          <button
            type="button"
            onClick={() => refillTokens()}
            title="Instant refill"
            style={{
              border: "none",
              background: "var(--gold)",
              color: "#20180a",
              borderRadius: 999,
              width: 20,
              height: 20,
              cursor: "pointer",
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            +
          </button>
        </>
      ) : null}
    </span>
  );
}
