"use client";

import { useRef, useState, useTransition } from "react";
import { submitExitFeedback } from "@/app/actions/feedback";

const REASONS = [
  { v: "bug", label: "Hit a bug or error" },
  { v: "slow", label: "Felt slow or laggy" },
  { v: "confusing", label: "Something was confusing" },
  { v: "content", label: "Couldn’t find a book I wanted" },
  { v: "break", label: "Just taking a break" },
];

// "Log out" that first offers a small, skippable exit survey. The survey is a
// courtesy — every path (skip, send, or just the close button) leaves the user
// in control, and logout only happens when they choose it.
export default function LogoutSurvey({ style, className }: { style?: React.CSSProperties; className?: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function logoutNow() {
    formRef.current?.submit();
  }

  function sendAndLogout() {
    start(async () => {
      await submitExitFeedback({ reason, note });
      logoutNow();
    });
  }

  return (
    <>
      {/* Real sign-out POST — submitted programmatically after the survey. */}
      <form ref={formRef} action="/auth/signout" method="post" style={{ display: "contents" }}>
        <button type="button" style={style} className={className} onClick={() => setOpen(true)}>
          Log out
        </button>
      </form>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Before you go"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 3000, display: "grid", placeItems: "center",
            padding: "1.2rem", background: "rgba(10,8,6,0.6)", backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              width: "100%", maxWidth: 420, background: "var(--stone)", color: "var(--ivory)",
              border: "1px solid var(--border)", borderRadius: 18, padding: "1.6rem 1.5rem",
              boxShadow: "0 30px 80px rgba(0,0,0,0.5)", fontFamily: "var(--sans)",
            }}
          >
            <h3 style={{ fontFamily: "var(--serif)", fontSize: "1.4rem", margin: 0 }}>Before you go</h3>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: "0.4rem 0 1.1rem", lineHeight: 1.5 }}>
              Anything we could do better? Totally optional — you can just log out.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.9rem" }}>
              {REASONS.map((r) => {
                const on = reason === r.v;
                return (
                  <button
                    key={r.v}
                    type="button"
                    onClick={() => setReason(on ? "" : r.v)}
                    style={{
                      padding: "0.4rem 0.8rem", borderRadius: 999, cursor: "pointer",
                      fontFamily: "var(--sans)", fontSize: "0.82rem", fontWeight: 600,
                      border: `1px solid ${on ? "var(--gold)" : "var(--border)"}`,
                      background: on ? "rgba(197,160,89,0.16)" : "transparent",
                      color: on ? "var(--ivory)" : "var(--muted)",
                    }}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
              placeholder="Anything you’d change, or a bug to report? (optional)"
              style={{
                width: "100%", minHeight: 76, resize: "vertical", padding: "0.7rem 0.9rem",
                background: "var(--charcoal)", border: "1px solid var(--border)", borderRadius: 12,
                color: "var(--ivory)", fontFamily: "var(--sans)", fontSize: "0.9rem", outline: "none",
              }}
            />

            <div style={{ display: "flex", gap: "0.6rem", marginTop: "1.1rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn-gold"
                disabled={pending}
                onClick={sendAndLogout}
                style={{ flex: 1, justifyContent: "center", minWidth: 140 }}
              >
                {pending ? "…" : "Send & log out"}
              </button>
              <button type="button" className="btn btn-outline" onClick={logoutNow} style={{ justifyContent: "center" }}>
                Just log out
              </button>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{ display: "block", margin: "0.9rem auto 0", background: "transparent", border: "none", color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.82rem", cursor: "pointer" }}
            >
              Stay signed in
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
