"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitReview, deleteReview } from "@/app/actions/reviews";
import Stars from "@/components/Stars";

export type Review = { user_name: string | null; rating: number; body: string | null; created_at?: string | null; user_id?: string };

function rvBtn(color = "var(--muted)"): React.CSSProperties {
  return { background: "transparent", border: "1px solid var(--border)", borderRadius: 8, padding: "0.3rem 0.6rem", cursor: "pointer", color, fontFamily: "var(--sans)", fontSize: "0.78rem", fontWeight: 600 };
}

export default function ReviewsSection({
  bookId,
  reviews,
  canReview,
  myReview,
}: {
  bookId: number;
  reviews: Review[];
  canReview: boolean;
  myReview: Review | null;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(myReview?.rating || 0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState(myReview?.body || "");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function startEdit() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => textareaRef.current?.focus(), 350);
  }

  async function copyReview(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  function del() {
    start(async () => {
      const res = await deleteReview(bookId);
      if (res?.error) { setErr(res.error); return; }
      setConfirmDel(false);
      setBody("");
      setRating(0);
      router.refresh();
    });
  }

  function submit() {
    setErr(null);
    if (!rating) { setErr("Pick a star rating first."); return; }
    start(async () => {
      const res = await submitReview(bookId, rating, body);
      if (res?.error) { setErr(res.error); return; }
      setDone(true);
      router.refresh();
    });
  }

  const others = reviews.filter((r) => !myReview || r.user_id !== myReview.user_id);

  return (
    <section style={{ marginTop: "3rem" }}>
      <h2 style={{ fontSize: "1.4rem", marginBottom: "1rem" }}>
        Reviews {reviews.length ? <span style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "1rem" }}>({reviews.length})</span> : null}
      </h2>

      {canReview ? (
        <div ref={formRef} style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.3rem 1.4rem", marginBottom: "1.6rem" }}>
          <div style={{ fontFamily: "var(--sans)", fontWeight: 700, marginBottom: "0.6rem" }}>{myReview ? "Update your review" : "Write a review"}</div>
          <div style={{ display: "flex", gap: "0.2rem", marginBottom: "0.8rem" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i)}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(0)}
                aria-label={`${i} star${i > 1 ? "s" : ""}`}
                style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "1.6rem", lineHeight: 1, color: "var(--gold-hi, #C5A059)", opacity: i <= (hover || rating) ? 1 : 0.28, padding: 0 }}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What did you think? (optional)"
            rows={3}
            style={{ width: "100%", background: "var(--charcoal)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--ivory)", fontFamily: "var(--sans)", fontSize: "0.92rem", padding: "0.7rem 0.9rem", outline: "none", resize: "vertical" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginTop: "0.8rem" }}>
            <button type="button" className="btn btn-gold" onClick={submit} disabled={pending} style={{ padding: "0.55rem 1.3rem" }}>
              {pending ? "Saving…" : myReview ? "Update review" : "Post review"}
            </button>
            {done ? <span style={{ color: "#7DBE86", fontFamily: "var(--sans)", fontSize: "0.85rem" }}>Saved ✓</span> : null}
            {err ? <span style={{ color: "var(--terracotta)", fontFamily: "var(--sans)", fontSize: "0.85rem" }}>{err}</span> : null}
          </div>
        </div>
      ) : (
        <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", marginBottom: "1.4rem" }}>
          <a href="/login" style={{ color: "var(--gold)" }}>Sign in</a> to leave a review.
        </p>
      )}

      {reviews.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No reviews yet — be the first.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[...(myReview ? [myReview] : []), ...others].map((r, i) => (
            <div key={i} style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 12, padding: "1rem 1.2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--sans)", fontWeight: 700, color: "var(--ivory)" }}>
                  {r.user_name || "Reader"} {myReview && r.user_id === myReview.user_id ? <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: "0.8rem" }}>· you</span> : null}
                </span>
                <Stars value={r.rating} size={14} />
              </div>
              {r.body ? <p style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.92rem", marginTop: "0.5rem", lineHeight: 1.6 }}>{r.body}</p> : null}
              {myReview && r.user_id === myReview.user_id ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.7rem", flexWrap: "wrap" }}>
                  {confirmDel ? (
                    <>
                      <span style={{ fontFamily: "var(--sans)", fontSize: "0.82rem", color: "var(--muted)" }}>Delete your review?</span>
                      <button type="button" onClick={del} disabled={pending} style={rvBtn("var(--terracotta)")}>{pending ? "…" : "Yes, delete"}</button>
                      <button type="button" onClick={() => setConfirmDel(false)} style={rvBtn()}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={startEdit} style={rvBtn()}>✎ Edit</button>
                      <button type="button" onClick={() => copyReview(r.body || "")} disabled={!r.body} style={rvBtn()}>⧉ {copied ? "Copied" : "Copy"}</button>
                      <button type="button" onClick={() => setConfirmDel(true)} style={rvBtn("var(--terracotta)")}>🗑 Delete</button>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
