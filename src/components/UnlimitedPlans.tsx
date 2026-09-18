"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { subscribeUnlimited, updateSubscriptionPrefs, cancelSubscription } from "@/app/actions/subscription";
import { paystackReady } from "@/app/actions/purchases";
import { type Plan, PLAN_PRICE, PLAN_LABEL, PLAN_UNIT } from "@/lib/plans";
import { formatPrice } from "@/lib/types";
import { GENRES } from "@/lib/content";

const PAYSTACK_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";
const PAYSTACK_CURRENCY = process.env.NEXT_PUBLIC_PAYSTACK_CURRENCY || "USD";
const PAYSTACK_RATE = Number(process.env.NEXT_PUBLIC_PAYSTACK_USD_RATE || "1") || 1;
const AGES = ["Everyone", "13+", "16+", "18+"];

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

export type ActiveSub = { plan: Plan; genres: string[]; max_age: string; picks_per_cycle: number; current_period_end: string | null } | null;

export default function UnlimitedPlans({ email, sub }: { email?: string; sub: ActiveSub }) {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan>(sub?.plan ?? "monthly");
  const [genres, setGenres] = useState<string[]>(sub?.genres ?? []);
  const [maxAge, setMaxAge] = useState(sub?.max_age ?? "Everyone");
  const [picks, setPicks] = useState(sub?.picks_per_cycle ?? 4);
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const active = !!sub;

  useEffect(() => { paystackReady().then(setLive).catch(() => setLive(false)); }, []);

  function toggleGenre(g: string) {
    setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : prev.length >= 12 ? prev : [...prev, g]));
  }

  async function finish(reference: string) {
    const res = await subscribeUnlimited({ plan, genres, maxAge, picks, reference });
    setBusy(false);
    if (res?.error) { setErr(res.error); return; }
    setMsg("You're all set — your book box is active.");
    router.refresh();
  }

  async function subscribe() {
    setErr(null); setMsg(null); setBusy(true);
    const price = PLAN_PRICE[plan];
    if (price > 0 && live && email && PAYSTACK_KEY) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Paystack: any = await loadPaystack();
        Paystack.setup({
          key: PAYSTACK_KEY, email,
          amount: Math.round(price * PAYSTACK_RATE * 100), currency: PAYSTACK_CURRENCY,
          ref: `libry-sub-${Date.now()}`,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: (resp: any) => finish(resp.reference || `paystack-${Date.now()}`),
          onClose: () => setBusy(false),
        }).openIframe();
      } catch (e) { setBusy(false); setErr(e instanceof Error ? e.message : "Checkout failed."); }
      return;
    }
    await finish(`demo-${Date.now()}`);
  }

  async function savePrefs() {
    setErr(null); setMsg(null); setBusy(true);
    const res = await updateSubscriptionPrefs({ genres, maxAge, picks });
    setBusy(false);
    if (res?.error) { setErr(res.error); return; }
    setMsg("Preferences saved.");
    router.refresh();
  }

  async function cancel() {
    if (!confirm("Cancel your Libry Unlimited box?")) return;
    setBusy(true);
    const res = await cancelSubscription();
    setBusy(false);
    if (res?.error) { setErr(res.error); return; }
    router.refresh();
  }

  const chip = (label: string, on: boolean, onClick: () => void) => (
    <button type="button" key={label} onClick={onClick}
      style={{ padding: "0.4rem 0.85rem", borderRadius: 999, cursor: "pointer", fontFamily: "var(--sans)", fontWeight: 600, fontSize: "0.82rem", border: "1px solid var(--border)", background: on ? "var(--gold)" : "transparent", color: on ? "#12100E" : "var(--ivory-muted)" }}>
      {label}
    </button>
  );

  return (
    <div style={{ display: "grid", gap: "1.6rem" }}>
      {active ? (
        <div style={{ background: "rgba(95,160,104,0.10)", border: "1px solid rgba(95,160,104,0.4)", borderRadius: 14, padding: "1rem 1.2rem", fontFamily: "var(--sans)" }}>
          <strong style={{ color: "var(--ivory)" }}>✓ Your box is active</strong>
          <span style={{ color: "var(--muted)", fontSize: "0.88rem" }}>
            {" "}· {PLAN_LABEL[sub!.plan]} plan{sub!.current_period_end ? ` · renews ${new Date(sub!.current_period_end).toLocaleDateString()}` : ""}
          </span>
        </div>
      ) : null}

      {/* Cadence */}
      <div>
        <div style={{ fontFamily: "var(--sans)", fontWeight: 700, marginBottom: "0.6rem" }}>Choose how often</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.7rem" }}>
          {(["weekly", "monthly", "yearly"] as Plan[]).map((p) => (
            <button key={p} type="button" onClick={() => setPlan(p)}
              style={{ textAlign: "left", cursor: "pointer", borderRadius: 14, padding: "1rem 1.1rem", border: `1.5px solid ${plan === p ? "var(--gold)" : "var(--border)"}`, background: plan === p ? "rgba(197,160,89,0.10)" : "var(--stone)" }}>
              <div style={{ fontFamily: "var(--sans)", fontWeight: 700, color: "var(--ivory)" }}>{PLAN_LABEL[p]}</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: "1.6rem", color: "var(--gold)" }}>{formatPrice(PLAN_PRICE[p])}<span style={{ fontSize: "0.8rem", color: "var(--muted)", fontFamily: "var(--sans)" }}> {PLAN_UNIT[p]}</span></div>
              {p === "yearly" ? <div style={{ fontFamily: "var(--sans)", fontSize: "0.75rem", color: "#7DBE86" }}>Best value</div> : null}
            </button>
          ))}
        </div>
      </div>

      {/* Genres */}
      <div>
        <div style={{ fontFamily: "var(--sans)", fontWeight: 700, marginBottom: "0.3rem" }}>Pick your genres</div>
        <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.84rem", marginBottom: "0.6rem" }}>We&apos;ll curate each box from these. Choose as many as you like.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
          {GENRES.filter((g) => g !== "Fiction" && g !== "Non-Fiction").map((g) => chip(g, genres.includes(g), () => toggleGenre(g)))}
        </div>
      </div>

      {/* Age + picks */}
      <div style={{ display: "flex", gap: "1.6rem", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "var(--sans)", fontWeight: 700, marginBottom: "0.5rem" }}>Max age rating</div>
          <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
            {AGES.map((a) => chip(a, maxAge === a, () => setMaxAge(a)))}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: "var(--sans)", fontWeight: 700, marginBottom: "0.5rem" }}>Books to keep each cycle</div>
          <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
            {[2, 4, 6, 10].map((n) => chip(String(n), picks === n, () => setPicks(n)))}
          </div>
        </div>
      </div>

      {err ? <p style={{ color: "var(--terracotta)", fontFamily: "var(--sans)", fontSize: "0.86rem" }}>{err}</p> : null}
      {msg ? <p style={{ color: "#7DBE86", fontFamily: "var(--sans)", fontSize: "0.86rem" }}>{msg}</p> : null}

      <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
        {active ? (
          <>
            <button type="button" className="btn btn-gold" onClick={savePrefs} disabled={busy} style={{ padding: "0.6rem 1.4rem" }}>{busy ? "Saving…" : "Save preferences"}</button>
            <button type="button" className="btn btn-outline" onClick={cancel} disabled={busy} style={{ padding: "0.6rem 1.2rem", color: "var(--terracotta)" }}>Cancel box</button>
          </>
        ) : (
          <button type="button" className="btn btn-gold" onClick={subscribe} disabled={busy || genres.length === 0} style={{ padding: "0.7rem 1.7rem", fontSize: "1rem" }}>
            {busy ? "Processing…" : genres.length === 0 ? "Pick a genre to start" : `Start ${PLAN_LABEL[plan]} — ${formatPrice(PLAN_PRICE[plan])}`}
          </button>
        )}
      </div>
      <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.78rem" }}>
        {live ? "🔒 Secured by Paystack. " : ""}Cancel anytime. Writers keep their 65% of everything read from your box.
      </p>
    </div>
  );
}
