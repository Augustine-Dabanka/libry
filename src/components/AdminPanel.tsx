"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setPartnerStatus, markPayoutPaid, rejectPayout, sendPayoutNow, adminLogout } from "@/app/actions/admin";
import { formatPrice } from "@/lib/types";

export type PartnerApp = {
  id: string;
  name: string;
  applied_at: string | null;
  net_earned: number;
  payout: { method: string; provider: string | null; account_name: string | null; account_number: string | null } | null;
};

export type PayoutReq = {
  id: number;
  creator_id: string;
  creator_name: string;
  amount: number;
  requested_at: string;
  payout: { method: string; provider: string | null; account_name: string | null; account_number: string | null } | null;
};

export default function AdminPanel({ apps, payouts }: { apps: PartnerApp[]; payouts: PayoutReq[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run(key: string, fn: () => Promise<unknown>) {
    setBusy(key); setErr(null);
    const res = await fn();
    setBusy(null);
    if (res && typeof res === "object" && "error" in res && (res as { error?: string }).error) {
      setErr((res as { error: string }).error); return;
    }
    router.refresh();
  }

  const methodLabel: Record<string, string> = { momo: "MoMo", bank: "Bank", paypal: "PayPal", wise: "Wise/Intl" };
  const acct = (p: PartnerApp["payout"]) =>
    p ? `${methodLabel[p.method] || p.method} · ${p.provider || "—"} · ${p.account_name || "—"} · ${p.account_number || "—"}` : "No payout details on file";

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1.2rem 4rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem" }}>Admin · Libry</h1>
          <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem" }}>Partnership reviews & payout processing. Staff only.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => run("logout", adminLogout)} style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}>Sign out</button>
      </div>

      {err ? <p style={{ color: "var(--terracotta)", fontFamily: "var(--sans)", marginBottom: "1rem" }}>{err}</p> : null}

      {/* Partnership applications */}
      <section style={{ marginBottom: "2.6rem" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Partnership applications ({apps.length})</h2>
        {apps.length === 0 ? (
          <p style={{ color: "var(--muted)", fontFamily: "var(--sans)" }}>No pending applications.</p>
        ) : (
          <div style={{ display: "grid", gap: "0.8rem" }}>
            {apps.map((a) => (
              <div key={a.id} style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 12, padding: "1rem 1.2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                  <div>
                    <strong style={{ fontFamily: "var(--sans)", color: "var(--ivory)" }}>{a.name}</strong>
                    <div style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.82rem", marginTop: "0.2rem" }}>
                      Applied {a.applied_at ? new Date(a.applied_at).toLocaleDateString() : "—"} · Earned to date {formatPrice(a.net_earned)}
                    </div>
                    <div style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.82rem", marginTop: "0.3rem" }}>{acct(a.payout)}</div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <button type="button" className="btn btn-gold" disabled={busy === `ap-${a.id}`} onClick={() => run(`ap-${a.id}`, () => setPartnerStatus(a.id, "approved"))} style={{ padding: "0.4rem 1rem", fontSize: "0.82rem" }}>Approve</button>
                    <button type="button" className="btn btn-outline" disabled={busy === `rp-${a.id}`} onClick={() => run(`rp-${a.id}`, () => setPartnerStatus(a.id, "rejected"))} style={{ padding: "0.4rem 1rem", fontSize: "0.82rem", color: "var(--terracotta)" }}>Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Payout requests */}
      <section>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Payout requests ({payouts.length})</h2>
        <div style={{ background: "rgba(217,164,65,0.10)", border: "1px solid rgba(217,164,65,0.35)", borderRadius: 10, padding: "0.8rem 1rem", marginBottom: "1rem", fontFamily: "var(--sans)", fontSize: "0.84rem", color: "var(--ivory-muted)", lineHeight: 1.55 }}>
          <strong style={{ color: "var(--ivory)" }}>How to pay out:</strong> On a Paystack <em>Starter</em> account, automated <strong>Send now</strong> is disabled. Until Transfers is enabled (register a business, then enable it in Paystack), pay the creator directly via MoMo/bank using the details below, then click <strong>Mark paid</strong>. Accepting customer payments is unaffected.
        </div>
        {payouts.length === 0 ? (
          <p style={{ color: "var(--muted)", fontFamily: "var(--sans)" }}>No pending payouts.</p>
        ) : (
          <div style={{ display: "grid", gap: "0.8rem" }}>
            {payouts.map((p) => (
              <div key={p.id} style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 12, padding: "1rem 1.2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                  <div>
                    <strong style={{ fontFamily: "var(--sans)", color: "var(--ivory)" }}>{p.creator_name} — {formatPrice(p.amount)}</strong>
                    <div style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.82rem", marginTop: "0.2rem" }}>Requested {new Date(p.requested_at).toLocaleDateString()}</div>
                    <div style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.82rem", marginTop: "0.3rem" }}>{acct(p.payout)}</div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <button type="button" className="btn btn-gold" disabled={busy === `sp-${p.id}`} onClick={() => run(`sp-${p.id}`, () => sendPayoutNow(p.id))} style={{ padding: "0.4rem 1rem", fontSize: "0.82rem" }}>{busy === `sp-${p.id}` ? "Sending…" : "Send now"}</button>
                    <button type="button" className="btn btn-outline" disabled={busy === `pp-${p.id}`} onClick={() => run(`pp-${p.id}`, () => markPayoutPaid(p.id))} style={{ padding: "0.4rem 1rem", fontSize: "0.82rem" }}>Mark paid</button>
                    <button type="button" className="btn btn-outline" disabled={busy === `xp-${p.id}`} onClick={() => run(`xp-${p.id}`, () => rejectPayout(p.id))} style={{ padding: "0.4rem 1rem", fontSize: "0.82rem", color: "var(--terracotta)" }}>Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
