"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buyCoinPack } from "@/app/actions/coins";
import { type CoinPackId } from "@/lib/coins";

const PAYSTACK_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";
const PAYSTACK_CURRENCY = process.env.NEXT_PUBLIC_PAYSTACK_CURRENCY || "USD";
const PAYSTACK_RATE = Number(process.env.NEXT_PUBLIC_PAYSTACK_USD_RATE || "1") || 1;

function loadPaystack(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    if (w.PaystackPop) return resolve(w.PaystackPop);
    const s = document.createElement("script");
    s.src = "https://js.paystack.co/v1/inline.js";
    s.onload = () => resolve(w.PaystackPop);
    s.onerror = () => reject(new Error("Could not load Paystack."));
    document.body.appendChild(s);
  });
}

// Pay for a coin pack with Paystack. Coins are only added after the server
// verifies the payment with Paystack's secret key (see buyCoinPack), and each
// payment reference can be used once.
export default function CoinPackBuy({ packId, price, label, email, userId, live }: { packId: CoinPackId; price: number; label: string; email: string | null; userId: string | null; live: boolean }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();
  const ready = live && !!email && !!PAYSTACK_KEY;

  async function pay() {
    if (!ready || !email) return;
    setMsg(null);
    setBusy(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Paystack: any = await loadPaystack();
      const ref = `libry-coins-${packId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      Paystack.setup({
        key: PAYSTACK_KEY,
        email,
        amount: Math.round(price * PAYSTACK_RATE * 100),
        currency: PAYSTACK_CURRENCY,
        ref,
        // Lets the webhook credit the right account if this tab closes early.
        metadata: { kind: "coins", pack: packId, user_id: userId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callback: (resp: any) => {
          buyCoinPack(packId, String(resp?.reference || ref)).then((r) => {
            setBusy(false);
            if (r && "error" in r && r.error) setMsg(r.error);
            else { setMsg(`${label} added.`); router.refresh(); }
          });
        },
        onClose: () => setBusy(false),
      }).openIframe();
    } catch {
      setBusy(false);
      setMsg("Couldn't open checkout. Try again.");
    }
  }

  return (
    <div style={{ display: "grid", gap: "0.4rem" }}>
      <button type="button" className="btn btn-gold" onClick={pay} disabled={!ready || busy} style={{ width: "100%", justifyContent: "center" }}>
        {!ready ? "Coming soon" : busy ? "Opening…" : `Buy for ${PAYSTACK_CURRENCY} ${(price * PAYSTACK_RATE).toFixed(2)}`}
      </button>
      {msg ? <span role="status" style={{ fontFamily: "var(--sans)", fontSize: "0.8rem", color: "var(--muted)" }}>{msg}</span> : null}
    </div>
  );
}
