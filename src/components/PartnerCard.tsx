"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { applyForPartner, withdrawPartner } from "@/app/actions/partner";

export type PartnerStatus = "none" | "pending" | "approved" | "rejected";

const META: Record<PartnerStatus, { label: string; tone: string; heading: string; blurb: string }> = {
  none: { label: "Not enrolled", tone: "var(--muted)", heading: "Join the Libry Partnership Program", blurb: "Earnings accrue from your first sale. To withdraw them, join the Partnership Program — a quick review of your identity and payout details, so we can send money safely and stay compliant." },
  pending: { label: "Under review", tone: "#D9A441", heading: "Your application is under review", blurb: "We're reviewing your account and payout details. This usually takes a few days. You'll keep earning in the meantime — payouts unlock the moment you're approved." },
  approved: { label: "Partner", tone: "#7DBE86", heading: "You're a Libry Partner", blurb: "Your payouts are enabled. Once you request one, Libry processes it to your saved account via Paystack — no manual back-and-forth." },
  rejected: { label: "Needs attention", tone: "#E0836B", heading: "We couldn't approve you yet", blurb: "Something in your application needs another look — usually payout details. Update your payout account and re-apply, or contact support." },
};

export default function PartnerCard({ status }: { status: PartnerStatus }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const m = META[status] || META.none;

  function apply() {
    setErr(null);
    start(async () => {
      const res = await applyForPartner();
      if (res?.error) { setErr(res.error); return; }
      router.refresh();
    });
  }
  function withdraw() {
    start(async () => {
      const res = await withdrawPartner();
      if (res?.error) { setErr(res.error); return; }
      router.refresh();
    });
  }

  return (
    <div style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.6rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", marginBottom: "0.7rem", flexWrap: "wrap" }}>
        <span style={{ fontSize: "1.3rem" }}>🤝</span>
        <strong style={{ fontFamily: "var(--sans)", color: "var(--ivory)", fontSize: "1.05rem" }}>{m.heading}</strong>
        <span className="badge" style={{ background: "rgba(255,255,255,0.06)", color: m.tone, fontWeight: 700 }}>{m.label}</span>
      </div>
      <p style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.1rem" }}>{m.blurb}</p>

      <ul style={{ margin: "0 0 1.2rem", paddingLeft: "1.1rem", color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.86rem", lineHeight: 1.7 }}>
        <li>Keep <strong style={{ color: "var(--ivory)" }}>65%</strong> of every book and product sale.</li>
        <li>Payouts settle in GHS via Paystack, processed by the platform once you&apos;re a Partner.</li>
        <li>Stay in good standing under the <a href="/terms" style={{ color: "var(--gold)" }}>Terms</a> — no plagiarism, fraud, or policy breaches.</li>
      </ul>

      {status === "none" || status === "rejected" ? (
        <button type="button" className="btn btn-gold" onClick={apply} disabled={pending} style={{ padding: "0.55rem 1.3rem" }}>
          {pending ? "Submitting…" : status === "rejected" ? "Re-apply" : "Apply to the program"}
        </button>
      ) : status === "pending" ? (
        <button type="button" className="btn btn-outline" onClick={withdraw} disabled={pending} style={{ padding: "0.55rem 1.3rem" }}>
          {pending ? "…" : "Withdraw application"}
        </button>
      ) : null}
      {err ? <p style={{ color: "var(--terracotta)", fontFamily: "var(--sans)", fontSize: "0.84rem", marginTop: "0.7rem" }}>{err}</p> : null}
    </div>
  );
}
