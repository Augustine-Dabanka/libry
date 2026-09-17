"use client";

import { useEffect, useState } from "react";

export type ParaComment = {
  id: number;
  para_index: number;
  parent_id: number | null;
  user_id: string | null;
  user_name: string | null;
  body: string;
  created_at: string;
  pinned?: boolean;
  likes?: number;
  dislikes?: number;
  my_reaction?: number; // -1 | 0 | 1
};

// Slide-over tray for the comments on one paragraph: threaded replies, like /
// dislike reactions, a "Creator" badge on the author's own comments, and
// creator-pinned comments. Presentational — the reader owns the data + writes.
export default function CommentTray({
  open,
  paraText,
  comments,
  canComment,
  currentUserId,
  creatorId,
  busy,
  onClose,
  onAdd,
  onDelete,
  onReact,
  onPin,
}: {
  open: boolean;
  paraText: string;
  comments: ParaComment[];
  canComment: boolean;
  currentUserId: string | null;
  creatorId: string | null;
  busy: boolean;
  onClose: () => void;
  onAdd: (body: string, parentId: number | null) => void;
  onDelete: (id: number) => void;
  onReact: (id: number, value: number) => void;
  onPin: (id: number, pinned: boolean) => void;
}) {
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyDraft, setReplyDraft] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isCreatorViewer = !!currentUserId && currentUserId === creatorId;
  const top = comments
    .filter((c) => c.parent_id == null)
    .sort((a, b) => (Number(b.pinned) - Number(a.pinned)) || (+new Date(a.created_at) - +new Date(b.created_at)));
  const repliesOf = (id: number) => comments.filter((c) => c.parent_id === id).sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));

  function submitTop() {
    const b = draft.trim();
    if (!b) return;
    onAdd(b, null);
    setDraft("");
  }
  function submitReply(parentId: number) {
    const b = replyDraft.trim();
    if (!b) return;
    onAdd(b, parentId);
    setReplyDraft("");
    setReplyTo(null);
  }

  function CommentBody({ c, isReply }: { c: ParaComment; isReply?: boolean }) {
    const mine = !!currentUserId && c.user_id === currentUserId;
    const byCreator = !!c.user_id && c.user_id === creatorId;
    const my = c.my_reaction ?? 0;
    return (
      <div style={{ background: "var(--stone)", border: `1px solid ${c.pinned ? "rgba(197,160,89,0.5)" : "var(--border)"}`, borderRadius: 12, padding: "0.75rem 0.85rem", marginLeft: isReply ? "1.4rem" : 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: "0.85rem", color: "var(--ivory)" }}>{c.user_name || "Reader"}</span>
            {byCreator ? (
              <span style={{ fontFamily: "var(--sans)", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#12100E", background: "var(--gold)", borderRadius: 999, padding: "0.1rem 0.45rem" }}>Creator</span>
            ) : null}
            {c.pinned ? (
              <span style={{ fontFamily: "var(--sans)", fontSize: "0.68rem", color: "var(--gold-hi)" }}>📌 Pinned</span>
            ) : null}
          </span>
          <span style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.72rem" }}>{new Date(c.created_at).toLocaleDateString()}</span>
        </div>
        <p style={{ fontFamily: "var(--sans)", fontSize: "0.92rem", color: "var(--ivory-muted)", lineHeight: 1.55, margin: "0.35rem 0 0.5rem", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{c.body}</p>

        <div style={{ display: "flex", alignItems: "center", gap: "0.9rem", flexWrap: "wrap", fontFamily: "var(--sans)", fontSize: "0.78rem" }}>
          <button type="button" onClick={() => onReact(c.id, 1)} disabled={!canComment} title="Like" style={rxStyle(my === 1)}>
            👍 <span>{c.likes ?? 0}</span>
          </button>
          <button type="button" onClick={() => onReact(c.id, -1)} disabled={!canComment} title="Dislike" style={rxStyle(my === -1)}>
            👎 <span>{c.dislikes ?? 0}</span>
          </button>
          {canComment && !isReply ? (
            <button type="button" onClick={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyDraft(""); }} style={linkBtn}>Reply</button>
          ) : null}
          {isCreatorViewer ? (
            <button type="button" onClick={() => onPin(c.id, !c.pinned)} style={linkBtn}>{c.pinned ? "Unpin" : "Pin"}</button>
          ) : null}
          {mine ? (
            <button type="button" onClick={() => onDelete(c.id)} style={{ ...linkBtn, color: "var(--terracotta)" }}>Delete</button>
          ) : null}
        </div>

        {replyTo === c.id && !isReply ? (
          <div style={{ marginTop: "0.6rem" }}>
            <textarea value={replyDraft} onChange={(e) => setReplyDraft(e.target.value)} placeholder={`Reply to ${c.user_name || "Reader"}…`} maxLength={1000}
              style={{ width: "100%", boxSizing: "border-box", minHeight: 48, resize: "vertical", padding: "0.5rem 0.65rem", background: "var(--charcoal)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--ivory)", fontFamily: "var(--sans)", fontSize: "0.88rem", outline: "none" }} />
            <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.4rem" }}>
              <button type="button" onClick={() => submitReply(c.id)} disabled={busy || !replyDraft.trim()} style={{ padding: "0.4rem 0.9rem", background: "var(--gold)", color: "#12100E", border: "none", borderRadius: 8, fontFamily: "var(--sans)", fontWeight: 700, fontSize: "0.82rem", cursor: busy || !replyDraft.trim() ? "default" : "pointer", opacity: busy || !replyDraft.trim() ? 0.6 : 1 }}>Reply</button>
              <button type="button" onClick={() => { setReplyTo(null); setReplyDraft(""); }} style={linkBtn}>Cancel</button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity 0.25s", zIndex: 40 }} aria-hidden="true" />
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

        <div style={{ padding: "1rem 1.3rem", borderBottom: "1px solid var(--border)", background: "var(--stone)" }}>
          <div style={{ fontFamily: "var(--sans)", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "0.4rem" }}>On this passage</div>
          <p style={{ fontFamily: "var(--serif)", fontSize: "0.92rem", color: "var(--ivory-muted)", lineHeight: 1.6, margin: 0, maxHeight: 120, overflow: "hidden" }}>
            “{paraText.length > 220 ? paraText.slice(0, 220) + "…" : paraText}”
          </p>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.3rem", display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          {top.length === 0 ? (
            <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", textAlign: "center", marginTop: "1.5rem" }}>
              No comments yet. {canComment ? "Start the conversation." : "Sign in to start the conversation."}
            </p>
          ) : (
            top.map((c) => (
              <div key={c.id} style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <CommentBody c={c} />
                {repliesOf(c.id).map((r) => <CommentBody key={r.id} c={r} isReply />)}
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
              onClick={submitTop}
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

const linkBtn: React.CSSProperties = { background: "transparent", border: "none", color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", padding: 0 };
function rxStyle(active: boolean): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: "0.3rem",
    background: active ? "rgba(95,160,104,0.16)" : "transparent",
    border: `1px solid ${active ? "var(--gold)" : "var(--border)"}`,
    color: active ? "var(--gold)" : "var(--ivory-muted)",
    borderRadius: 999, padding: "0.2rem 0.55rem", cursor: "pointer", fontFamily: "var(--sans)", fontSize: "0.78rem",
  };
}
