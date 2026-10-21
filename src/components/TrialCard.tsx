"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import Mascot from "@/components/Mascot";
import { startTrial, type BoxStatus } from "@/app/actions/trial";

// Free trial of Unlimited. No card, nothing to cancel, it simply ends.
// What you keep during the trial stays yours.
function daysLeft(iso: string | null) {
  if (!iso) return 0;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

export default function TrialCard({ status, signedIn }: { status: BoxStatus | null; signedIn: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const router = useRouter();
  if (!status) return null; // trial migration not run yet

  const card: React.CSSProperties = {
    display: "grid", gridTemplateColumns: "auto 1fr", gap: "1.2rem", alignItems: "center",
    background: "linear-gradient(135deg, color-mix(in srgb, var(--gold) 16%, transparent), color-mix(in srgb, var(--gold) 4%, transparent))",
    border: "1px solid color-mix(in srgb, var(--gold) 45%, transparent)", borderRadius: 18, padding: "1.3rem 1.4rem", marginBottom: "1.6rem",
  };
  const title: React.CSSProperties = { fontFamily: "var(--serif)", fontSize: "1.35rem", margin: "0 0 0.3rem", color: "var(--ivory)" };
  const body: React.CSSProperties = { fontFamily: "var(--sans)", color: "var(--ivory-muted)", margin: 0, lineHeight: 1.55 };

  if (status.kind === "trial") {
    const d = daysLeft(status.endsAt);
    const left = Math.max(0, status.picksTotal - status.picksUsed);
    return (
      <div style={card} role="status">
        <Mascot mood="cheer" hat="party" size={86} />
        <div>
          <p style={title}>Your free trial: {d} {d === 1 ? "day" : "days"} left</p>
          <p style={body}>
            {left > 0 ? <>You can keep <strong style={{ color: "var(--gold)" }}>{left} more {left === 1 ? "book" : "books"}</strong> for good.</> : <>You&apos;ve kept all your trial books. They stay yours.</>}
            {" "}Nothing renews and there&apos;s nothing to cancel.
          </p>
          {left > 0 ? <a className="btn btn-gold" href="/catalog?unlimited=1" style={{ marginTop: "0.8rem", display: "inline-flex", gap: 8 }}><Icon name="library-big" size={18} /> Pick your books</a> : null}
        </div>
      </div>
    );
  }

  if (status.kind === "none" && status.trialAvailable) {
    return (
      <div style={card}>
        <Mascot mood="wave" size={86} />
        <div>
          <p style={title}>Try Unlimited free for {status.trialDays} days</p>
          <p style={body}>
            No card, nothing to cancel. Keep <strong style={{ color: "var(--gold)" }}>{status.trialPicks} books</strong> for good, chosen from the Unlimited shelf.
          </p>
          {signedIn ? (
            <button type="button" className="btn btn-gold" disabled={pending} style={{ marginTop: "0.8rem" }}
              onClick={() => start(async () => {
                const r = await startTrial();
                setMsg({ ok: r.ok, text: r.message });
                if (r.ok) router.refresh();
              })}>
              {pending ? "Starting…" : `Start my ${status.trialDays}-day trial`}
            </button>
          ) : (
            <a className="btn btn-gold" href="/login?next=/unlimited" style={{ marginTop: "0.8rem", display: "inline-block" }}>Create a free account to start</a>
          )}
          <p style={{ ...body, marginTop: "0.6rem", fontSize: "0.78rem" }}>
            One trial per person. Kept books stay yours. See <a href="/terms" style={{ color: "var(--gold)" }}>Terms §4a</a>.
          </p>
          {msg ? <p role="alert" style={{ ...body, marginTop: "0.6rem", color: msg.ok ? "var(--success)" : "var(--danger)" }}>{msg.text}</p> : null}
        </div>
      </div>
    );
  }
  return null;
}
