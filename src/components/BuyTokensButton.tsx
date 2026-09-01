"use client";

import { useTransition } from "react";
import { buyTokens } from "@/app/actions/monetization";
import { playPop } from "@/lib/sfx";

export default function BuyTokensButton({ amount, label }: { amount: number; label?: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      className="btn btn-gold lb-press"
      type="button"
      disabled={pending}
      onClick={() => {
        playPop();
        start(() => buyTokens(amount));
      }}
    >
      {pending ? "…" : label || `Buy ${amount}⚡`}
    </button>
  );
}
