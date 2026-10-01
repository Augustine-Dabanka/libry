"use client";

import { useTransition } from "react";
import { refillTokens } from "@/app/actions/gamification";

export default function RefillButton({ label = "Refill now ⚡", small = false }: { label?: string; small?: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      className="btn btn-gold lb-press"
      type="button"
      disabled={pending}
      onClick={() => start(async () => { await refillTokens(); })}
      style={small ? { padding: "0.3rem 0.9rem", fontSize: "0.8rem" } : undefined}
    >
      {pending ? "Refilling…" : label}
    </button>
  );
}
