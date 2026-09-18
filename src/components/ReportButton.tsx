"use client";

import { useState, useTransition } from "react";
import { submitReport } from "@/app/actions/reports";

const REASONS = ["Spam or scam", "Copyright violation", "Inappropriate / mislabeled content", "Something else"];

export default function ReportButton({ bookId, canReport }: { bookId: number; canReport: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function send() {
    setErr(null);
    if (!reason) { setErr("Pick a reason."); return; }
    start(async () => {
      const res = await submitReport(bookId, reason, note);
      if (res?.error) { setErr(res.error); return; }
      setDone(true);
    });
  }

  const linkStyle: React.CSSProperties = { background: "transparent", border: "none", color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.82rem", cursor: "pointer", padding: 0 };

  if (done) {
    return <span style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.82rem" }}>Thanks — our team will take a look. ✓</span>;
  }

  if (!open) {
    return (
      <button type="button" style={linkStyle} onClick={() => setOpen(true)}>⚑ Report this book</button>
    );
  }

  return (
    <div style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 12, padding: "1rem 1.1rem", maxWidth: 440 }}>
      <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.6rem" }}>Report this book</div>
      {!canReport ? (
        <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.85rem", margin: 0 }}>
          <a href="/login" style={{ color: "var(--gold)" }}>Sign in</a> to report a book.
        </p>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "0.7rem" }}>
            {REASONS.map((r) => (
              <label key={r} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontFamily: "var(--sans)", fontSize: "0.86rem", color: "var(--ivory-muted)", cursor: "pointer" }}>
                <input type="radio" name="report-reason" value={r} checked={reason === r} onChange={() => setReason(r)} />
                {r}
              </label>
            ))}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything else we should know? (optional)"
            rows={2}
            style={{ width: "100%", background: "var(--charcoal)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--ivory)", fontFamily: "var(--sans)", fontSize: "0.86rem", padding: "0.55rem 0.7rem", outline: "none", resize: "vertical" }}
          />
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginTop: "0.7rem" }}>
            <button type="button" className="btn btn-gold" onClick={send} disabled={pending} style={{ padding: "0.45rem 1.1rem", fontSize: "0.85rem" }}>
              {pending ? "Sending…" : "Submit report"}
            </button>
            <button type="button" style={linkStyle} onClick={() => setOpen(false)}>Cancel</button>
            {err ? <span style={{ color: "var(--terracotta)", fontFamily: "var(--sans)", fontSize: "0.8rem" }}>{err}</span> : null}
          </div>
        </>
      )}
    </div>
  );
}
