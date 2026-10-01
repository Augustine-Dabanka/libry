"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { unlockBookWithCoins } from "@/app/actions/coins";

// "Unlock for N coins" on a paid book. The price and balance are checked in the
// database; this only asks.
export default function CoinUnlockButton({ bookId, cost, balance }: { bookId: number; cost: number; balance: number }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const short = balance < cost;
  return (
    <div style={{ display: "grid", gap: "0.4rem" }}>
      <button
        type="button"
        className="btn btn-outline"
        disabled={pending || short}
        onClick={() => start(async () => {
          const r = await unlockBookWithCoins(bookId);
          setMsg(r.ok ? "Unlocked. Enjoy the book." : r.message);
          if (r.ok) router.refresh();
        })}
      >
        {pending ? "Unlocking…" : `Unlock for ${cost} coins`}
      </button>
      <span style={{ fontFamily: "var(--sans)", fontSize: "0.8rem", color: "var(--muted)" }}>
        {short ? <>You have {balance} coins. <a href="/wallet">Get more</a></> : `You have ${balance} coins.`}
      </span>
      {msg ? <span role="status" style={{ fontFamily: "var(--sans)", fontSize: "0.85rem" }}>{msg}</span> : null}
    </div>
  );
}
