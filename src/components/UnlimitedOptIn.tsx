"use client";

import { useState, useTransition } from "react";
import { setAllowUnlimited } from "@/app/actions/unlimitedOptIn";

// Creator switch on the book editor. Honest trade-off spelled out: a reader who
// keeps the book through Unlimited doesn't pay per book.
export default function UnlimitedOptIn({ bookId, initial }: { bookId: number; initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.1rem", border: "1px solid var(--border)", borderRadius: 14, background: "var(--stone)", margin: "1rem 0" }}>
      <span id={`ul-${bookId}`} style={{ fontFamily: "var(--sans)", fontSize: "0.9rem" }}>
        <b>Include in Lybry Unlimited</b>
        <span style={{ display: "block", color: "var(--muted)", fontSize: "0.82rem", marginTop: 2 }}>
          Trial and Unlimited readers can keep this book without buying it. More readers find you; you aren&apos;t paid per copy kept this way.
        </span>
        {msg ? <span role="status" style={{ display: "block", color: "var(--gold)", fontSize: "0.8rem", marginTop: 4 }}>{msg}</span> : null}
      </span>
      <button type="button" role="switch" aria-checked={on} aria-labelledby={`ul-${bookId}`} disabled={pending}
        onClick={() => { const next = !on; setOn(next); start(async () => { const r = await setAllowUnlimited(bookId, next); setMsg(r.message); if (!r.ok) setOn(!next); }); }}
        style={{ width: 52, height: 32, borderRadius: 16, border: "none", padding: 3, cursor: "pointer", background: on ? "var(--gold)" : "var(--border)", display: "flex", flexShrink: 0 }}>
        <span style={{ width: 26, height: 26, borderRadius: "50%", background: "#fff", transform: on ? "translateX(20px)" : "none", transition: "transform 180ms cubic-bezier(.3,1.4,.5,1)" }} />
      </button>
    </div>
  );
}
