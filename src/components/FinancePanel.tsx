"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { savePayoutAccount, requestPayout } from "@/app/actions/finance";
import { formatPrice } from "@/lib/types";

type Account = { method: string; provider: string | null; account_name: string | null; account_number: string | null } | null;
type Payout = { id: number; amount: number; status: string; requested_at: string; paid_at: string | null };

const MIN = 5;

export default function FinancePanel({
  net,
  paid,
  pending,
  available,
  account,
  history,
}: {
  net: number;
  paid: number;
  pending: number;
  available: number;
  account: Account;
  history: Payout[];
}) {
  const router = useRouter();
  const [method, setMethod] = useState(account?.method === "bank" ? "bank" : "momo");
  const [provider, setProvider] = useState(account?.provider ?? "");
  const [name, setName] = useState(account?.account_name ?? "");
  const [number, setNumber] = useState(account?.account_number ?? "");
  const [busy, setBusy] = useState(false);
  const [reqBusy, setReqBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const hasAccount = !!account?.account_number;
  const hasPending = history.some((h) => h.status === "pending");
  const canRequest = available >= MIN && hasAccount && !hasPending;

  async function saveAccount() {
    setBusy(true); setErr(null); setMsg(null);
    const res = await savePayoutAccount({ method, provider, accountName: name, accountNumber: number });
    setBusy(false);
    if (res?.error) setErr(res.error);
    else { setMsg("Payout details saved."); router.refresh(); }
  }

  async function request() {
    setReqBusy(true); setErr(null); setMsg(null);
    const res = await requestPayout();
    setReqBusy(false);
    if (res?.error) setErr(res.error);
    else { setMsg("Payout requested — we'll process it and mark it paid here."); router.refresh(); }
  }

  const card: React.CSSProperties = { background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.4rem 1.5rem" };
  const field: React.CSSProperties = { width: "100%", padding: "0.6rem 0.7rem", borderRadius: 10, border: "1px solid var(--border)", background: "var(--charcoal)", color: "var(--ivory)", fontFamily: "var(--sans)", fontSize: "0.92rem", marginTop: "0.3rem" };
  const label: React.CSSProperties = { display: "block", fontFamily: "var(--sans)", fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.8rem" };

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      {/* Balance tiles */}
      <div className="stats-grid">
        <div className="stat-card"><div className="label">Total earned (net 70%)</div><div className="value">{formatPrice(net)}</div><div className="change" style={{ color: "var(--muted)" }}>Your share of all sales</div></div>
        <div className="stat-card"><div className="label">Available</div><div className="value" style={{ color: "var(--gold)" }}>{formatPrice(available)}</div><div className="change" style={{ color: "var(--muted)" }}>Ready to withdraw</div></div>
        <div className="stat-card"><div className="label">Pending</div><div className="value">{formatPrice(pending)}</div><div className="change" style={{ color: "var(--muted)" }}>Requested, not yet paid</div></div>
        <div className="stat-card"><div className="label">Paid out</div><div className="value">{formatPrice(paid)}</div><div className="change" style={{ color: "var(--muted)" }}>Lifetime</div></div>
      </div>

      {/* Request */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h3 style={{ marginBottom: "0.2rem" }}>Withdraw your earnings</h3>
            <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.88rem", margin: 0 }}>
              Minimum {formatPrice(MIN)}. Payouts settle in GHS via Paystack and are processed by hand for now.
            </p>
          </div>
          <button type="button" className="btn btn-gold" disabled={!canRequest || reqBusy} onClick={request} style={{ opacity: !canRequest || reqBusy ? 0.6 : 1, whiteSpace: "nowrap" }}>
            {reqBusy ? "Requesting…" : `Request ${formatPrice(available)}`}
          </button>
        </div>
        {!hasAccount ? <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.82rem", marginTop: "0.7rem" }}>Add your payout details below first.</p> : null}
        {hasPending ? <p style={{ color: "var(--gold-hi)", fontFamily: "var(--sans)", fontSize: "0.82rem", marginTop: "0.7rem" }}>You already have a pending payout — it&apos;ll be marked paid once sent.</p> : null}
      </div>

      {/* Payout details */}
      <div style={card}>
        <h3 style={{ marginBottom: "0.2rem" }}>Payout details</h3>
        <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.88rem", marginBottom: "0.6rem" }}>Where we send your money. Only you can see this.</p>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem" }}>
          {(["momo", "bank"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMethod(m)} style={{ padding: "0.45rem 0.9rem", borderRadius: 999, cursor: "pointer", fontFamily: "var(--sans)", fontWeight: 700, fontSize: "0.82rem", border: `1px solid ${method === m ? "var(--gold)" : "var(--border)"}`, background: method === m ? "rgba(95,160,104,0.14)" : "transparent", color: method === m ? "var(--gold)" : "var(--ivory-muted)" }}>
              {m === "momo" ? "Mobile money" : "Bank"}
            </button>
          ))}
        </div>
        <label style={label}>{method === "momo" ? "Network (MTN, Vodafone, AirtelTigo)" : "Bank name"}</label>
        <input style={field} value={provider} onChange={(e) => setProvider(e.target.value)} placeholder={method === "momo" ? "MTN" : "e.g. GCB Bank"} />
        <label style={label}>Account name</label>
        <input style={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name on the account" />
        <label style={label}>{method === "momo" ? "Mobile money number" : "Account number"}</label>
        <input style={field} value={number} onChange={(e) => setNumber(e.target.value)} placeholder={method === "momo" ? "024…" : "Account number"} inputMode="numeric" />
        <button type="button" className="btn btn-outline" disabled={busy} onClick={saveAccount} style={{ marginTop: "1rem" }}>{busy ? "Saving…" : "Save payout details"}</button>
      </div>

      {msg ? <p style={{ color: "#7DBE86", fontFamily: "var(--sans)", fontSize: "0.88rem" }}>{msg}</p> : null}
      {err ? <p style={{ color: "var(--terracotta)", fontFamily: "var(--sans)", fontSize: "0.88rem" }}>{err}</p> : null}

      {/* History */}
      {history.length > 0 ? (
        <div>
          <h3 style={{ marginBottom: "1rem" }}>Payout history</h3>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead><tr><th>Requested</th><th>Amount</th><th>Status</th><th>Paid</th></tr></thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td>{new Date(h.requested_at).toLocaleDateString()}</td>
                    <td>{formatPrice(h.amount)}</td>
                    <td><span className="badge" style={{ background: h.status === "paid" ? "rgba(78,122,82,0.2)" : h.status === "rejected" ? "rgba(196,85,63,0.2)" : "rgba(217,164,65,0.2)", color: h.status === "paid" ? "#7DBE86" : h.status === "rejected" ? "#E0836B" : "#D9A441" }}>{h.status}</span></td>
                    <td>{h.paid_at ? new Date(h.paid_at).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
