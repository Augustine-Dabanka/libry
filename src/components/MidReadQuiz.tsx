"use client";

import { useEffect, useState } from "react";

type Question = { question: string; options: string[]; answer: number };
type State = "loading" | "ready" | "unavailable" | "answered" | "continued";

export default function MidReadQuiz({ bookId, checkpoint }: { bookId: string; checkpoint: 25 | 50 | 75 }) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [state, setState] = useState<State>("loading");
  const [choice, setChoice] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/book/${encodeURIComponent(bookId)}/question?at=${checkpoint}`, { credentials: "same-origin" })
      .then(async (res) => res.ok ? res.json() : { available: false })
      .then((data) => {
        if (!active) return;
        if (data?.available && typeof data.question === "string" && Array.isArray(data.options) && Number.isInteger(data.answer)) {
          setQuestion({ question: data.question, options: data.options.map(String), answer: data.answer });
          setState("ready");
        } else {
          setState("unavailable");
        }
      })
      .catch(() => { if (active) setState("unavailable"); });
    return () => { active = false; };
  }, [bookId, checkpoint]);

  if (state === "continued") {
    return <div style={{ margin: "2rem 0", padding: "0.8rem 1rem", border: "1px solid var(--border)", borderRadius: 12, color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.84rem" }}>✓ Reading checkpoint completed · {checkpoint}%</div>;
  }

  const shell: React.CSSProperties = {
    margin: "2.2rem 0", padding: "1.25rem clamp(1rem, 4vw, 1.6rem)", borderRadius: 18,
    border: "1px solid color-mix(in srgb, var(--gold) 30%, var(--border))",
    background: "linear-gradient(145deg, color-mix(in srgb, var(--gold) 7%, var(--stone)), var(--stone))",
    fontFamily: "var(--sans)",
  };

  return (
    <section aria-label={`Reading checkpoint at ${checkpoint} percent`} style={shell}>
      <div style={{ color: "var(--gold)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "0.45rem" }}>
        Reading checkpoint · {checkpoint}%
      </div>
      {state === "loading" ? (
        <p style={{ color: "var(--muted)", margin: 0 }}>Preparing a question from the story you have read…</p>
      ) : state === "unavailable" || !question ? (
        <>
          <h3 style={{ fontFamily: "var(--serif)", fontSize: "1.2rem", margin: "0 0 0.45rem" }}>Pause for a moment</h3>
          <p style={{ color: "var(--muted)", lineHeight: 1.65, margin: "0 0 1rem" }}>What has changed for the main character so far, and what do you think might happen next?</p>
          <button type="button" className="btn btn-gold" onClick={() => setState("continued")}>Continue the story →</button>
        </>
      ) : (
        <>
          <h3 style={{ fontFamily: "var(--serif)", fontSize: "1.2rem", lineHeight: 1.4, margin: "0 0 0.9rem" }}>{question.question}</h3>
          <div style={{ display: "grid", gap: "0.55rem" }}>
            {question.options.map((option, index) => {
              const selected = choice === index;
              const reveal = state === "answered";
              const correct = reveal && index === question.answer;
              const wrong = reveal && selected && index !== question.answer;
              return (
                <button key={`${checkpoint}-${index}`} type="button" disabled={reveal} onClick={() => { setChoice(index); setState("answered"); }}
                  style={{ textAlign: "left", borderRadius: 11, padding: "0.75rem 0.9rem", border: `1px solid ${correct ? "var(--gold)" : wrong ? "var(--danger)" : "var(--border)"}`, background: correct ? "color-mix(in srgb, var(--gold) 12%, transparent)" : "transparent", color: "var(--ivory)", cursor: reveal ? "default" : "pointer", font: "inherit" }}>
                  <span style={{ color: "var(--gold)", marginRight: "0.55rem" }}>{String.fromCharCode(65 + index)}.</span>{option}
                </button>
              );
            })}
          </div>
          {state === "answered" ? (
            <div role="status" style={{ marginTop: "0.9rem" }}>
              <p style={{ color: choice === question.answer ? "var(--gold)" : "var(--muted)", margin: "0 0 0.8rem", lineHeight: 1.5 }}>
                {choice === question.answer ? "That's right. Great reading!" : `Not quite — the correct answer is ${String.fromCharCode(65 + question.answer)}.`}
              </p>
              <button type="button" className="btn btn-gold" onClick={() => setState("continued")}>Continue the story →</button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
