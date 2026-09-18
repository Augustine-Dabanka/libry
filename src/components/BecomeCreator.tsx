"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { becomeCreator } from "@/app/actions/creator";

// Upgrade prompt shown to readers. Turning it on unlocks the publishing tools.
export default function BecomeCreator({ variant = "full" }: { variant?: "full" | "row" }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function upgrade() {
    setErr(null);
    start(async () => {
      const res = await becomeCreator();
      if (res.error) { setErr(res.error); return; }
      router.refresh();
    });
  }

  if (variant === "row") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem" }}>
          You have a reader account. Become a creator to publish your own stories.
        </div>
        <button type="button" className="btn btn-gold" onClick={upgrade} disabled={pending}>
          {pending ? "Upgrading…" : "Become a creator"}
        </button>
        {err ? <span style={{ color: "var(--terracotta)", fontSize: "0.8rem", width: "100%" }}>{err}</span> : null}
      </div>
    );
  }

  return (
    <div style={{ background: "var(--stone)", border: "1px solid var(--gold)", borderRadius: 18, padding: "2rem 1.8rem", textAlign: "center", maxWidth: 560, margin: "2rem auto" }}>
      <div style={{ fontSize: "2.2rem", marginBottom: "0.4rem" }}>✍️</div>
      <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.6rem", marginBottom: "0.5rem" }}>Become a creator</h2>
      <p style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.95rem", marginBottom: "1.4rem", lineHeight: 1.6 }}>
        You&apos;re signed in as a reader. Switch on a creator account to publish prose, comics and interactive stories —
        and keep <strong style={{ color: "var(--ivory)" }}>65%</strong> of every sale. It&apos;s free, and you keep your reading account.
      </p>
      <button type="button" className="btn btn-gold" onClick={upgrade} disabled={pending} style={{ fontSize: "1rem", padding: "0.8rem 1.6rem" }}>
        {pending ? "Setting you up…" : "Become a creator →"}
      </button>
      {err ? <p style={{ color: "var(--terracotta)", fontSize: "0.85rem", marginTop: "0.8rem" }}>{err}</p> : null}
    </div>
  );
}
