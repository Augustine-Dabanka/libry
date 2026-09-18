"use client";

import { useState } from "react";

const field: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem 1rem",
  background: "var(--charcoal)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  color: "var(--ivory)",
  fontFamily: "var(--sans)",
  fontSize: "1rem",
  outline: "none",
  marginTop: "0.35rem",
};
const label: React.CSSProperties = {
  display: "block",
  fontSize: "0.85rem",
  color: "var(--muted)",
  fontFamily: "var(--sans)",
  marginTop: "1.1rem",
};

export default function RoyaltyCalculator() {
  const [price, setPrice] = useState("4.99");
  const [sales, setSales] = useState("100");
  const [fee, setFee] = useState("35");

  const p = Math.max(0, parseFloat(price) || 0);
  const s = Math.max(0, parseFloat(sales) || 0);
  const f = Math.min(100, Math.max(0, parseFloat(fee) || 0));

  const gross = p * s;
  const platformCut = gross * (f / 100);
  const payout = gross - platformCut;
  const yearly = payout * 12;
  const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem", maxWidth: 720 }}>
      <div
        style={{
          background: "var(--stone)",
          border: "1px solid var(--border)",
          borderRadius: 18,
          padding: "1.6rem",
        }}
      >
        <label style={{ ...label, marginTop: 0 }}>Book price (USD)</label>
        <input style={field} type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />

        <label style={label}>Estimated monthly sales</label>
        <input style={field} type="number" min="0" step="1" value={sales} onChange={(e) => setSales(e.target.value)} />

        <label style={label}>Platform fee (%)</label>
        <input style={field} type="number" min="0" max="100" step="1" value={fee} onChange={(e) => setFee(e.target.value)} />
        <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.82rem", marginTop: "0.5rem" }}>
          Libry&apos;s standard fee is 35% — a 30% platform cut plus a 5% platform &amp; infra fee (you keep 65%).
        </p>
      </div>

      <div
        style={{
          background: "linear-gradient(150deg, rgba(196,163,90,0.14), rgba(180,83,9,0.10))",
          border: "1px solid rgba(196,163,90,0.35)",
          borderRadius: 18,
          padding: "1.6rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--sans)", color: "var(--muted)", marginBottom: "0.5rem" }}>
          <span>Gross revenue / mo</span>
          <span>{money(gross)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--sans)", color: "var(--muted)", marginBottom: "0.9rem" }}>
          <span>Platform fee ({f}%)</span>
          <span>−{money(platformCut)}</span>
        </div>
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.9rem", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontFamily: "var(--sans)", fontWeight: 700 }}>Your payout / mo</span>
          <span style={{ fontFamily: "var(--sans)", fontWeight: 800, fontSize: "1.9rem", color: "var(--gold)" }}>{money(payout)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--sans)", color: "var(--muted)", marginTop: "0.5rem" }}>
          <span>Projected / year</span>
          <span style={{ color: "var(--ivory)", fontWeight: 700 }}>{money(yearly)}</span>
        </div>
      </div>
    </div>
  );
}
