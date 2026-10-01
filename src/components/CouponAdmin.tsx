"use client";

import { useState, useTransition } from "react";
import { createCoupon, setCouponActive } from "@/app/actions/coins";

export type CouponRow = { code: string; coins: number; max_uses: number; used: number; ends_at: string | null; active: boolean };

// Staff: create and pause coin coupons. Every redemption is limited to one per
// account and counted in the database.
export default function CouponAdmin({ initial }: { initial: CouponRow[] }) {
  const [code, setCode] = useState("");
  const [coins, setCoins] = useState(50);
  const [maxUses, setMaxUses] = useState(100);
  const [endsAt, setEndsAt] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const field = { height: 42, borderRadius: 10, border: "1px solid var(--border)", background: "var(--charcoal)", color: "var(--ivory)", padding: "0 0.7rem", fontFamily: "var(--sans)" } as const;
  const lbl = { display: "grid", gap: "0.3rem", fontFamily: "var(--sans)", fontSize: "0.8rem", color: "var(--muted)" } as const;

  return (
    <section style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1.2rem" }}>
      <h2 style={{ marginBottom: "0.3rem" }}>Coupons</h2>
      <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", marginBottom: "1rem" }}>Codes give bonus coins, once per account. Bonus coins never turn into creator payouts.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            setMsg(null);
            const r = await createCoupon({ code, coins, maxUses, endsAt: endsAt || null });
            setMsg(r && "error" in r && r.error ? r.error : `Created ${code.toUpperCase()}.`);
            if (r && "ok" in r) setCode("");
          });
        }}
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.8rem", alignItems: "end", marginBottom: "1rem" }}
      >
        <label style={lbl}>Code<input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="LIBRY-LAUNCH" maxLength={32} style={field} /></label>
        <label style={lbl}>Coins<input type="number" min={1} max={10000} value={coins} onChange={(e) => setCoins(Number(e.target.value))} style={field} /></label>
        <label style={lbl}>Max uses<input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(Number(e.target.value))} style={field} /></label>
        <label style={lbl}>Ends (optional)<input type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} style={field} /></label>
        <button type="submit" className="btn btn-gold" disabled={pending || code.trim().length < 4}>{pending ? "Creating…" : "Create coupon"}</button>
      </form>
      {msg ? <p role="status" style={{ fontFamily: "var(--sans)", color: "var(--muted)", marginBottom: "1rem" }}>{msg}</p> : null}
      <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        {initial.length === 0 ? (
          <p style={{ padding: "1rem", fontFamily: "var(--sans)", color: "var(--muted)", margin: 0 }}>No coupons yet.</p>
        ) : initial.map((c) => (
          <div key={c.code} style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem", alignItems: "center", padding: "0.8rem 1rem", borderTop: "1px solid var(--border)", fontFamily: "var(--sans)" }}>
            <b style={{ flex: "1 1 160px" }}>{c.code}</b>
            <span>{c.coins} coins</span>
            <span style={{ color: "var(--muted)" }}>{c.used} of {c.max_uses} used</span>
            <span style={{ color: "var(--muted)" }}>{c.ends_at ? `Ends ${c.ends_at.slice(0, 10)}` : "No end date"}</span>
            <button type="button" className="btn btn-outline" onClick={() => start(async () => { await setCouponActive(c.code, !c.active); })}>
              {c.active ? "Pause" : "Resume"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
