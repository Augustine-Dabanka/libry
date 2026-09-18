"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitProductReview, deleteProductReview } from "@/app/actions/productReviews";
import Stars from "@/components/Stars";

export type PReview = { id?: number; user_name: string | null; rating: number; body: string | null; user_id?: string };

export default function ProductReviews({
  productId, reviews, myReview, canReview, signedIn,
}: {
  productId: number; reviews: PReview[]; myReview: PReview | null; canReview: boolean; signedIn: boolean;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(myReview?.rating || 0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState(myReview?.body || "");
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [editing, setEditing] = useState(!myReview);
  const [pending, start] = useTransition();
  const taRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function submit() {
    setErr(null);
    if (!rating) { setErr("Pick a star rating first."); return; }
    start(async () => {
      const res = await submitProductReview(productId, rating, body);
      if (res?.error) { setErr(res.error); return; }
      setEditing(false);
      router.refresh();
    });
  }
  function del() {
    start(async () => {
      const res = await deleteProductReview(productId);
      if (res?.error) { setErr(res.error); return; }
      setConfirmDel(false); setMenuOpen(false); setBody(""); setRating(0); setEditing(true);
      router.refresh();
    });
  }

  const others = reviews.filter((r) => !myReview || r.user_id !== myReview.user_id);
  const menuItem: React.CSSProperties = { display: "block", width: "100%", textAlign: "left", background: "transparent", border: "none", cursor: "pointer", padding: "0.5rem 0.6rem", borderRadius: 7, color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.85rem" };

  const composer = (
    <div style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.2rem 1.3rem", marginBottom: "1.4rem" }}>
      <div style={{ fontFamily: "var(--sans)", fontWeight: 700, marginBottom: "0.6rem" }}>{myReview ? "Update your review" : "Write a review"}</div>
      <div style={{ display: "flex", gap: "0.2rem", marginBottom: "0.8rem" }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" onClick={() => setRating(i)} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)} aria-label={`${i} star${i > 1 ? "s" : ""}`}
            style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "1.6rem", lineHeight: 1, color: "var(--gold-hi, #C5A059)", opacity: i <= (hover || rating) ? 1 : 0.28, padding: 0 }}>★</button>
        ))}
      </div>
      <textarea ref={taRef} value={body} onChange={(e) => setBody(e.target.value)} placeholder="What did you think? (optional)" rows={3}
        style={{ width: "100%", boxSizing: "border-box", background: "var(--charcoal)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--ivory)", fontFamily: "var(--sans)", fontSize: "0.92rem", padding: "0.7rem 0.9rem", outline: "none", resize: "vertical" }} />
      <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginTop: "0.8rem" }}>
        <button type="button" className="btn btn-gold" onClick={submit} disabled={pending} style={{ padding: "0.55rem 1.3rem" }}>{pending ? "Saving…" : myReview ? "Update review" : "Post review"}</button>
        {myReview ? <button type="button" className="btn btn-outline" onClick={() => { setEditing(false); setBody(myReview.body || ""); setRating(myReview.rating); }} style={{ padding: "0.55rem 1.1rem" }}>Cancel</button> : null}
        {err ? <span style={{ color: "var(--terracotta)", fontFamily: "var(--sans)", fontSize: "0.85rem" }}>{err}</span> : null}
      </div>
    </div>
  );

  const myCard = myReview ? (
    <div style={{ background: "var(--stone)", border: "1px solid var(--gold, #C5A059)", borderRadius: 12, padding: "1rem 1.2rem", marginBottom: "1.4rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.6rem" }}>
        <span style={{ fontFamily: "var(--sans)", fontWeight: 700, color: "var(--ivory)" }}>{myReview.user_name || "Reader"} <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: "0.8rem" }}>· you</span></span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Stars value={myReview.rating} size={14} />
          <div ref={menuRef} style={{ position: "relative" }}>
            <button type="button" aria-label="Review options" onClick={() => setMenuOpen((v) => !v)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--ivory-muted)", fontSize: "1.3rem", lineHeight: 1, padding: "0 0.3rem" }}>⋯</button>
            {menuOpen ? (
              <div role="menu" style={{ position: "absolute", right: 0, top: "1.9rem", minWidth: 150, background: "var(--charcoal)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 18px 40px rgba(0,0,0,0.4)", padding: "0.35rem", zIndex: 30 }}>
                {confirmDel ? (
                  <div style={{ padding: "0.4rem 0.5rem", fontFamily: "var(--sans)", fontSize: "0.82rem" }}>
                    <p style={{ color: "var(--muted)", marginBottom: "0.5rem" }}>Delete your review?</p>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button type="button" onClick={del} disabled={pending} style={{ ...menuItem, color: "var(--terracotta)", border: "1px solid var(--border)", textAlign: "center" }}>{pending ? "…" : "Delete"}</button>
                      <button type="button" onClick={() => setConfirmDel(false)} style={{ ...menuItem, border: "1px solid var(--border)", textAlign: "center" }}>Keep</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button type="button" onClick={() => { setMenuOpen(false); setEditing(true); setTimeout(() => taRef.current?.focus(), 60); }} style={menuItem}>✎ Edit</button>
                    <button type="button" onClick={async () => { setMenuOpen(false); try { await navigator.clipboard.writeText(myReview.body || ""); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} }} disabled={!myReview.body} style={menuItem}>⧉ {copied ? "Copied" : "Copy"}</button>
                    <button type="button" onClick={() => setConfirmDel(true)} style={{ ...menuItem, color: "var(--terracotta)" }}>🗑 Delete</button>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {myReview.body ? <p style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.92rem", marginTop: "0.5rem", lineHeight: 1.6 }}>{myReview.body}</p> : null}
    </div>
  ) : null;

  return (
    <section style={{ marginTop: "2.4rem" }}>
      <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>Reviews {reviews.length ? <span style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "1rem" }}>({reviews.length})</span> : null}</h2>

      {canReview ? (editing ? composer : myCard) : (
        <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", marginBottom: "1.2rem" }}>
          {signedIn ? "Get this product to leave a review." : <><a href="/login" style={{ color: "var(--gold)" }}>Sign in</a> to leave a review.</>}
        </p>
      )}

      {others.length === 0 && !myReview ? (
        <p style={{ color: "var(--muted)" }}>No reviews yet — be the first.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          {others.map((r, i) => (
            <div key={r.id ?? i} style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 12, padding: "1rem 1.2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--sans)", fontWeight: 700, color: "var(--ivory)" }}>{r.user_name || "Reader"}</span>
                <Stars value={r.rating} size={14} />
              </div>
              {r.body ? <p style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.92rem", marginTop: "0.5rem", lineHeight: 1.6 }}>{r.body}</p> : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
