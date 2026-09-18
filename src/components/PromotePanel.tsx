"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPromotion } from "@/app/actions/promotions";
import { paystackReady } from "@/app/actions/purchases";
import { PROMO_DURATIONS, promoPrice, promoLabel, promoBlurb, type PromoKind } from "@/lib/promo";
import { formatPrice } from "@/lib/types";

const PAYSTACK_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";
const PAYSTACK_CURRENCY = process.env.NEXT_PUBLIC_PAYSTACK_CURRENCY || "USD";
const PAYSTACK_RATE = Number(process.env.NEXT_PUBLIC_PAYSTACK_USD_RATE || "1") || 1;

function loadPaystack(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).PaystackPop) return resolve((window as any).PaystackPop);
    const s = document.createElement("script");
    s.src = "https://js.paystack.co/v1/inline.js";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    s.onload = () => resolve((window as any).PaystackPop);
    s.onerror = () => reject(new Error("Could not load Paystack."));
    document.body.appendChild(s);
  });
}

type MiniBook = { id: number; title: string };
type ActivePromo = { id: number; book_id: number; kind: string; ends_at: string; title: string };

export default function PromotePanel({ email, books, active }: { email?: string; books: MiniBook[]; active: ActivePromo[] }) {
  const router = useRouter();
  const [kind, setKind] = useState<PromoKind>("boost");
  const [days, setDays] = useState<number>(7);
  const [bookId, setBookId] = useState<number | "">(books[0]?.id ?? "");
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => { paystackReady().then(setLive).catch(() => setLive(false)); }, []);

  const price = promoPrice(kind, days);

  async function finish(reference: string) {
    const res = await createPromotion({ bookId: Number(bookId), kind, days, reference });
    setBusy(false);
    if (res?.error) { setErr(res.error); return; }
    setDone(true);
    router.refresh();
  }

  async function pay() {
    setErr(null);
    if (!bookId) { setErr("Pick a book to promote."); return; }
    setBusy(true);
    if (live && email && PAYSTACK_KEY) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Paystack: any = await loadPaystack();
        Paystack.setup({
          key: PAYSTACK_KEY,
          email,
          amount: Math.round(price * PAYSTACK_RATE * 100),
          currency: PAYSTACK_CURRENCY,
          ref: `promo-${Date.now()}`,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: (resp: any) => finish(resp.reference || `promo-${Date.now()}`),
          onClose: () => setBusy(false),
        }).openIframe();
      } catch (e) {
        setBusy(false);
        setErr(e instanceof Error ? e.message : "Checkout failed.");
      }
      return;
    }
    // Simulated (pre-launch) — no charge.
    await finish(`demo-${Date.now()}`);
  }

  const card: React.CSSProperties = { background: "var(--charcoal)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.1rem" };
  const pill = (on: boolean): React.CSSProperties => ({
    padding: "0.5rem 0.9rem", borderRadius: 999, cursor: "pointer", fontFamily: "var(--sans)", fontWeight: 700, fontSize: "0.85rem",
    border: `1px solid ${on ? "var(--gold)" : "var(--border)"}`, background: on ? "rgba(95,160,104,0.14)" : "transparent", color: on ? "var(--gold)" : "var(--ivory-muted)",
  });

  if (books.length === 0) {
    return (
      <div style={card}>
        <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem" }}>
          Publish a book first, then you can promote it here.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      {active.length > 0 ? (
        <div>
          <h3 style={{ marginBottom: "0.8rem" }}>Active promotions</h3>
          <div style={{ display: "grid", gap: "0.6rem" }}>
            {active.map((p) => {
              const left = Math.max(0, Math.ceil((+new Date(p.ends_at) - Date.now()) / 86400_000));
              return (
                <div key={p.id} style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.8rem", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontFamily: "var(--serif)", color: "var(--ivory)" }}>{p.title}</div>
                    <div style={{ fontFamily: "var(--sans)", fontSize: "0.8rem", color: "var(--muted)" }}>{promoLabel(p.kind as PromoKind)}</div>
                  </div>
                  <span className="badge" style={{ background: "rgba(95,160,104,0.2)", color: "#7DBE86", fontWeight: 700 }}>{left} day{left === 1 ? "" : "s"} left</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div style={card}>
        {done ? (
          <div style={{ textAlign: "center", padding: "1.4rem 0.5rem", fontFamily: "var(--sans)" }}>
            <div style={{ fontSize: "2rem", color: "#7DBE86", marginBottom: "0.5rem" }}>✓</div>
            <p style={{ color: "var(--ivory)", marginBottom: "0.9rem" }}>Your book is now in the Discover Spotlight.</p>
            <button type="button" className="btn btn-outline" onClick={() => setDone(false)}>Promote another</button>
          </div>
        ) : (
          <>
            <h3 style={{ marginBottom: "0.3rem" }}>Promote a book</h3>
            <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.88rem", marginBottom: "1.1rem" }}>
              A clearly-labelled Spotlight placement on Discover for a set number of days. Flat pricing, no bidding.
            </p>

            <label style={{ display: "block", fontFamily: "var(--sans)", fontSize: "0.8rem", color: "var(--muted)", marginBottom: "0.3rem" }}>Book</label>
            <select value={bookId} onChange={(e) => setBookId(e.target.value ? Number(e.target.value) : "")} style={{ width: "100%", padding: "0.6rem 0.7rem", borderRadius: 10, border: "1px solid var(--border)", background: "var(--stone)", color: "var(--ivory)", fontFamily: "var(--sans)", fontSize: "0.92rem", marginBottom: "1rem" }}>
              {books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>

            <label style={{ display: "block", fontFamily: "var(--sans)", fontSize: "0.8rem", color: "var(--muted)", marginBottom: "0.4rem" }}>Type</label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.4rem" }}>
              {(["boost", "prerelease"] as PromoKind[]).map((k) => (
                <button key={k} type="button" onClick={() => setKind(k)} style={pill(kind === k)}>{promoLabel(k)}</button>
              ))}
            </div>
            <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.8rem", marginBottom: "1rem", lineHeight: 1.5 }}>{promoBlurb(kind)}</p>

            <label style={{ display: "block", fontFamily: "var(--sans)", fontSize: "0.8rem", color: "var(--muted)", marginBottom: "0.4rem" }}>Duration</label>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.2rem" }}>
              {PROMO_DURATIONS.map((d) => (
                <button key={d} type="button" onClick={() => setDays(d)} style={pill(days === d)}>{d} days</button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ fontFamily: "var(--sans)" }}>
                <span style={{ color: "var(--muted)", fontSize: "0.82rem" }}>Total</span>
                <div className="price" style={{ fontSize: "1.4rem", fontWeight: 700 }}>{formatPrice(price)}</div>
              </div>
              <button type="button" className="btn btn-gold" onClick={pay} disabled={busy} style={{ opacity: busy ? 0.7 : 1 }}>
                {busy ? "Processing…" : live ? `Pay ${formatPrice(price)} & promote` : "Promote (free while we finish payments)"}
              </button>
            </div>
            {err ? <p style={{ color: "var(--terracotta)", fontFamily: "var(--sans)", fontSize: "0.85rem", marginTop: "0.8rem" }}>{err}</p> : null}
          </>
        )}
      </div>
    </div>
  );
}
