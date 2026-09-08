"use client";

import { useEffect, useState } from "react";

export type ParaComment = {
  id: number;
  para_index: number;
  user_id: string | null;
  user_name: string | null;
  body: string;
  created_at: string;
};

// Slide-over tray showing the comments on one paragraph, with an input to add
// one. Presentational — the reader owns the data and the add/delete calls.
export default function CommentTray({
  open,
  paraText,
  comments,
  canComment,
  currentUserId,
  busy,
  onClose,
  onAdd,
  onDelete,
}: {
  open: boolean;
  paraText: string;
  comments: ParaComment[];
  canComment: boolean;
  currentUserId: string | null;
  busy: boolean;
  onClose: () => void;
  onAdd: (body: string) => void;
  onDelete: (id: number) => void;
}) {
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function submit() {
    const b = draft.trim();
    if (!b) return;
    onAdd(b);
    setDraft("");
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity 0.25s", zIndex: 40 }}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-label="Paragraph comments"
        style={{
          position: "fixed", top: 0, right: 0, height: "100dvh", width: "min(400px, 92vw)",
          background: "var(--charcoal)", borderLeft: "1px solid var(--border)", boxShadow: "-24px 0 60px rgba(0,0,0,0.5)",
          transform: open ? "translateX(0)" : "translateX(100%)", transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          zIndex: 41, display: "flex", flexDirection: "column", color: "var(--ivory)",
        }}
      >
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.1rem 1.3rem", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: "1.05rem", fontFamily: "var(--serif)" }}>Comments {comments.length ? `(${comments.length})` : ""}</h3>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: "transparent", border: "none", color: "var(--muted)", fontSize: "1.5rem", cursor: "pointer", lineHeight: 1 }}>×</button>
        </header>

        {/* the paragraph being discussed */}
        <div style={{ padding: "1rem 1.3rem", borderBottom: "1px solid var(--border)", background: "var(--stone)" }}>
          <div style={{ fontFamily: "var(--sans)", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "0.4rem" }}>On this passage</div>
          <p style={{ fontFamily: "var(--serif)", fontSize: "0.92rem", color: "var(--ivory-muted)", lineHeight: 1.6, margin: 0, maxHeight: 120, overflow: "hidden" }}>
            “{paraText.length > 220 ? paraText.slice(0, 220) + "…" : paraText}”
          </p>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.3rem", display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          {comments.length === 0 ? (
            <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", textAlign: "center", marginTop: "1.5rem" }}>
              No comments yet. {canComment ? "Start the conversation." : "Sign in to start the conversation."}
            </p>
          ) : (
            comments.map((c) => (
              <div key={c.id} style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 12, padding: "0.75rem 0.85rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.5rem" }}>
                  <span style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: "0.85rem", color: "var(--ivory)" }}>{c.user_name || "Reader"}</span>
                  <span style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.72rem" }}>{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                <p style={{ fontFamily: "var(--sans)", fontSize: "0.92rem", color: "var(--ivory-muted)", lineHeight: 1.55, margin: "0.35rem 0 0", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{c.body}</p>
                {currentUserId && c.user_id === currentUserId ? (
                  <button type="button" onClick={() => onDelete(c.id)} style={{ background: "transparent", border: "none", color: "var(--terracotta)", fontFamily: "var(--sans)", fontSize: "0.75rem", cursor: "pointer", padding: 0, marginTop: "0.4rem" }}>Delete</button>
                ) : null}
              </div>
            ))
          )}
        </div>

        {canComment ? (
          <div style={{ padding: "0.9rem 1.3rem 1.2rem", borderTop: "1px solid var(--border)" }}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a comment…"
              maxLength={1000}
              style={{ width: "100%", boxSizing: "border-box", minHeight: 64, resize: "vertical", padding: "0.65rem 0.8rem", background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--ivory)", fontFamily: "var(--sans)", fontSize: "0.92rem", outline: "none" }}
            />
            <button
              type="button"
              onClick={submit}
              disabled={busy || !draft.trim()}
              style={{ marginTop: "0.6rem", width: "100%", padding: "0.7rem", background: "var(--gold)", color: "#12100E", border: "none", borderRadius: 10, fontFamily: "var(--sans)", fontWeight: 700, fontSize: "0.9rem", cursor: busy || !draft.trim() ? "default" : "pointer", opacity: busy || !draft.trim() ? 0.6 : 1 }}
            >
              {busy ? "Posting…" : "Post comment"}
            </button>
          </div>
        ) : (
          <div style={{ padding: "1rem 1.3rem 1.2rem", borderTop: "1px solid var(--border)", textAlign: "center" }}>
            <a href="/login" className="btn btn-gold" style={{ width: "100%", justifyContent: "center" }}>Sign in to comment</a>
          </div>
        )}
      </aside>
    </>
  );
}
