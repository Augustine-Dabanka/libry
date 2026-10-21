"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { keepBook, type BoxStatus } from "@/app/actions/trial";

// On a paid book that's part of Unlimited: keep it with a trial/box pick, or
// a nudge to start the free trial.
export default function KeepWithUnlimited({ bookId, status }: { bookId: number; status: BoxStatus | null }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();
  if (!status) return null;
  const left = Math.max(0, status.picksTotal - status.picksUsed);

  if (status.kind !== "none" && left > 0) {
    return (
      <div style={{ display: "grid", gap: 6 }}>
        <button type="button" className="btn btn-gold" disabled={pending} style={{ display: "inline-flex", gap: 8, alignItems: "center" }}
          onClick={() => start(async () => {
            const r = await keepBook(bookId);
            setMsg(r.message);
            if (r.ok) router.refresh();
          })}>
          <Icon name="save" size={18} /> {pending ? "Keeping…" : `Keep with ${status.kind === "trial" ? "your trial" : "Unlimited"} (${left} left)`}
        </button>
        {msg ? <span role="status" style={{ fontFamily: "var(--sans)", fontSize: "0.82rem", color: "var(--muted)" }}>{msg}</span> : null}
      </div>
    );
  }
  if (status.kind === "none" && status.trialAvailable) {
    return (
      <a className="btn btn-outline" href="/unlimited" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
        <Icon name="sparkles" size={18} /> Free with a {status.trialDays}-day trial
      </a>
    );
  }
  return null;
}
