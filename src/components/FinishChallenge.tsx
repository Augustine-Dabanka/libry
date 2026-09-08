"use client";

import { useEffect, useRef, useState } from "react";
import { completeReadingChallenge } from "@/app/actions/challenge";

// Shown once when a reader reaches the end of a book. A light "reflection"
// challenge that records completion (→ achievements) and awards XP + tokens.
export default function FinishChallenge({
  bookId,
  title,
  onClose,
}: {
  bookId: number;
  title: string;
  onClose: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [word, setWord] = useState("");
  const [state, setState] = useState<"ask" | "done" | "already">("ask");
  const [busy, setBusy] = useState(false);
  const fired = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function complete() {
    if (fired.current) return;
    fired.current = true;
    setBusy(true);
    const res = await completeReadingChallenge(bookId);
    setBusy(false);
    setState(res.already ? "already" : "done");
  }

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(8,7,6,0.72)", display: "grid", placeItems: "center", padding: "1.2rem", backdropFilter: "blur(4px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="lb-float-in"
        style={{ width: "100%", maxWidth: 420, background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 20, padding: "1.9rem 1.7rem", textAlign: "center", boxShadow: "0 30px 80px rgba(0,0,0,0.55)" }}
      >
        {state === "ask" ? (
          <>
            <div style={{ fontSize: "2.4rem", marginBottom: "0.4rem" }}>🎉</div>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.5rem", marginBottom: "0.3rem" }}>You finished it!</h2>
            <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.92rem", marginBottom: "1.3rem" }}>
              A quick reflection on <em style={{ color: "var(--ivory)" }}>{title}</em> — then claim your reward.
            </p>

            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontFamily: "var(--sans)", fontSize: "0.8rem", color: "var(--muted)", marginBottom: "0.4rem" }}>How was it?</div>
              <div style={{ display: "flex", gap: "0.3rem", justifyContent: "center" }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(n)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.7rem", lineHeight: 1, color: (hover || rating) >= n ? "var(--gold)" : "var(--border)" }}
                    aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <input
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="One word that stayed with you…"
              maxLength={40}
              style={{ width: "100%", boxSizing: "border-box", padding: "0.7rem 0.9rem", background: "var(--charcoal)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--ivory)", fontFamily: "var(--sans)", fontSize: "0.95rem", outline: "none", marginBottom: "1.3rem", textAlign: "center" }}
            />

            <button type="button" className="btn btn-gold" onClick={complete} disabled={busy} style={{ width: "100%", justifyContent: "center" }}>
              {busy ? "Saving…" : "Complete challenge — claim +30 XP"}
            </button>
            <button type="button" onClick={onClose} style={{ display: "block", margin: "0.8rem auto 0", background: "none", border: "none", color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.85rem", cursor: "pointer" }}>
              Maybe later
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: "2.6rem", marginBottom: "0.4rem" }}>{state === "already" ? "✓" : "🏅"}</div>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.5rem", marginBottom: "0.5rem" }}>
              {state === "already" ? "Already claimed" : "Challenge complete!"}
            </h2>
            <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.92rem", marginBottom: "1.4rem" }}>
              {state === "already"
                ? "You've already logged this book. It still counts toward your achievements."
                : "+30 XP and 6 energy added. This counts toward your reading challenges."}
            </p>
            <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/achievements" className="btn btn-gold">See achievements →</a>
              <button type="button" onClick={onClose} className="btn btn-outline">Keep reading</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
