"use client";

import { useState, useTransition } from "react";
import { redeemCoupon } from "@/app/actions/coins";

export default function CouponForm() {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!code.trim()) return;
        start(async () => {
          const r = await redeemCoupon(code);
          setMsg({ ok: r.ok, text: r.ok ? `${r.message} +${r.coins} coins.` : r.message });
          if (r.ok) setCode("");
        });
      }}
      style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "flex-start" }}
    >
      <label htmlFor="coupon" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Coupon code</label>
      <input
        id="coupon"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Enter a code"
        autoComplete="off"
        maxLength={32}
        style={{ flex: "1 1 200px", height: 46, borderRadius: 12, border: "1px solid var(--border)", background: "var(--charcoal)", color: "var(--ivory)", padding: "0 0.9rem", fontFamily: "var(--sans)", letterSpacing: "0.06em", fontWeight: 700 }}
      />
      <button type="submit" className="btn btn-gold" disabled={pending || !code.trim()}>{pending ? "Checking…" : "Redeem"}</button>
      {msg ? <p role="status" style={{ flexBasis: "100%", margin: 0, fontFamily: "var(--sans)", color: msg.ok ? "var(--gold)" : "var(--terracotta)" }}>{msg.text}</p> : null}
    </form>
  );
}
