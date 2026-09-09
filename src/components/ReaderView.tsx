"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sanitizeHtml, looksLikeHtml } from "@/lib/sanitize";
import { RICH_CSS } from "@/lib/richStyles";
import ShareButton from "@/components/ShareButton";
import FinishChallenge from "@/components/FinishChallenge";
import CommentTray, { type ParaComment } from "@/components/CommentTray";

type Theme = "dark" | "sepia";

const PALETTES: Record<Theme, { bg: string; fg: string; muted: string; bar: string }> = {
  dark: { bg: "#1C1917", fg: "#EDE7DE", muted: "#A8A29E", bar: "rgba(250,247,242,0.12)" },
  sepia: { bg: "#F5F1E8", fg: "#241f1b", muted: "#7a7268", bar: "rgba(20,16,13,0.12)" },
};

export default function ReaderView({
  bookId,
  title,
  author,
  content,
  userEmail,
  userId = null,
  userName = null,
  sample = false,
  signedIn = false,
  locked = false,
  price = null,
}: {
  bookId: string;
  title: string;
  author: string | null;
  content: string;
  userEmail: string | null;
  userId?: string | null;
  userName?: string | null;
  sample?: boolean;
  signedIn?: boolean;
  locked?: boolean;
  price?: number | null;
}) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [fontSize, setFontSize] = useState(1.14);
  const [progress, setProgress] = useState(0);
  const [showFinish, setShowFinish] = useState(false);
  const finishShown = useRef(false);
  const [commentsByPara, setCommentsByPara] = useState<Map<number, ParaComment[]>>(new Map());
  const [openPara, setOpenPara] = useState<number | null>(null);
  const [commentBusy, setCommentBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isHtml = useMemo(() => looksLikeHtml(content), [content]);
  const safeHtml = useMemo(() => (isHtml ? sanitizeHtml(content) : ""), [isHtml, content]);
  const paragraphs = useMemo(
    () =>
      isHtml
        ? []
        : content
            .split(/\n+/)
            .map((p) => p.trim())
            .filter(Boolean),
    [isHtml, content]
  );

  const pal = PALETTES[theme];

  // Restore saved progress once on mount (not while reading a sample).
  useEffect(() => {
    if (!userEmail || sample) return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("reading_progress")
        .select("progress_percentage")
        .eq("user_email", userEmail)
        .eq("book_id", bookId)
        .maybeSingle();
      const pct = Number(data?.progress_percentage ?? 0);
      const el = scrollRef.current;
      if (!cancelled && el && pct > 3) {
        el.scrollTop = (pct / 100) * (el.scrollHeight - el.clientHeight);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookId, userEmail]);

  // Load paragraph comments once (plain-text reader only; guarded).
  useEffect(() => {
    if (isHtml) return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("paragraph_comments")
        .select("id, para_index, user_id, user_name, body, created_at")
        .eq("book_id", Number(bookId))
        .order("created_at", { ascending: true });
      if (cancelled || error || !data) return;
      const map = new Map<number, ParaComment[]>();
      for (const c of data as ParaComment[]) {
        const arr = map.get(c.para_index) ?? [];
        arr.push(c);
        map.set(c.para_index, arr);
      }
      setCommentsByPara(map);
    })();
    return () => { cancelled = true; };
  }, [bookId, isHtml]);

  async function addComment(body: string) {
    if (openPara == null || !userId) return;
    setCommentBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("paragraph_comments")
      .insert({ book_id: Number(bookId), para_index: openPara, user_id: userId, user_name: userName, body })
      .select("id, para_index, user_id, user_name, body, created_at")
      .single();
    setCommentBusy(false);
    if (error || !data) return;
    setCommentsByPara((prev) => {
      const next = new Map(prev);
      const arr = [...(next.get(openPara) ?? []), data as ParaComment];
      next.set(openPara, arr);
      return next;
    });
  }

  async function deleteComment(id: number) {
    if (openPara == null) return;
    const supabase = createClient();
    const { error } = await supabase.from("paragraph_comments").delete().eq("id", id);
    if (error) return;
    setCommentsByPara((prev) => {
      const next = new Map(prev);
      next.set(openPara, (next.get(openPara) ?? []).filter((c) => c.id !== id));
      return next;
    });
  }

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const pct = max > 0 ? Math.min(100, Math.round((el.scrollTop / max) * 100)) : 0;
    setProgress(pct);

    // Reached the end → post-reading challenge (once, for a real signed-in read).
    if (pct >= 99 && userEmail && !sample && !finishShown.current) {
      finishShown.current = true;
      setShowFinish(true);
    }

    if (!userEmail || sample) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const supabase = createClient();
      await supabase.from("reading_progress").upsert(
        {
          user_email: userEmail,
          book_id: bookId,
          current_chapter: 1,
          progress_percentage: pct,
        },
        { onConflict: "user_email,book_id" }
      );
    }, 1200);
  }

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      style={{
        position: "fixed",
        inset: 0,
        overflowY: "auto",
        background: pal.bg,
        color: pal.fg,
        transition: "background 0.3s, color 0.3s",
      }}
    >
      {/* progress bar */}
      <div style={{ position: "sticky", top: 0, height: 4, background: pal.bar, zIndex: 5 }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#C4A35A,#B45309)" }} />
      </div>

      {/* top bar */}
      <div
        style={{
          position: "sticky",
          top: 4,
          zIndex: 5,
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          padding: "0.7rem clamp(1rem,4vw,2rem)",
          background: theme === "dark" ? "rgba(28,25,23,0.85)" : "rgba(245,241,232,0.9)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${pal.bar}`,
        }}
      >
        <a href={`/book/${bookId}`} style={{ color: pal.muted, fontSize: "0.85rem", textDecoration: "none" }}>
          ← Back
        </a>
        <span
          style={{
            flex: 1,
            textAlign: "center",
            fontFamily: "var(--serif)",
            fontStyle: "italic",
            fontSize: "0.98rem",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </span>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", "--bar": pal.bar } as React.CSSProperties}>
          <button onClick={() => setFontSize((s) => Math.max(0.9, s - 0.08))} style={ctrl(pal)} aria-label="Smaller text">
            A−
          </button>
          <button onClick={() => setFontSize((s) => Math.min(1.6, s + 0.08))} style={ctrl(pal)} aria-label="Larger text">
            A+
          </button>
          <button
            onClick={() => setTheme((t) => (t === "dark" ? "sepia" : "dark"))}
            style={ctrl(pal)}
            aria-label="Toggle reading theme"
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <ShareButton path={`/book/${bookId}`} title={title} variant="chip" />
        </div>
      </div>

      {/* content */}
      <article
        style={{
          maxWidth: 680,
          margin: "0 auto",
          padding: "2.5rem clamp(1.1rem,4vw,2rem) 6rem",
        }}
      >
        <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(1.8rem,4vw,2.5rem)", marginBottom: "0.3rem" }}>{title}</h1>
        <p style={{ color: pal.muted, fontFamily: "var(--sans)", marginBottom: "2.2rem" }}>by {author || "Unknown author"}</p>
        {isHtml ? (
          <>
            <style dangerouslySetInnerHTML={{ __html: RICH_CSS }} />
            <div className="le-body" style={{ fontSize: `${fontSize}rem` }} dangerouslySetInnerHTML={{ __html: safeHtml }} />
          </>
        ) : paragraphs.length > 0 ? (
          paragraphs.map((p, i) => {
            // Image blocks: ![caption](url) or a bare image URL on its own line.
            const md = p.match(/^!\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/);
            const url = md ? md[2] : /^https?:\/\/\S+\.(png|jpe?g|gif|webp|svg)(\?\S*)?$/i.test(p) ? p : null;
            if (url) {
              return (
                <figure key={i} style={{ margin: "1.6rem 0" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={md?.[1] || ""} style={{ maxWidth: "100%", borderRadius: 12, display: "block", margin: "0 auto" }} />
                  {md?.[1] ? (
                    <figcaption style={{ textAlign: "center", color: pal.muted, fontSize: "0.85rem", marginTop: "0.4rem", fontFamily: "var(--sans)" }}>
                      {md[1]}
                    </figcaption>
                  ) : null}
                </figure>
              );
            }
            // Chapter headings render as headings and get no comment chip.
            const isHeading = /^chapter\b/i.test(p) && p.length <= 60;
            if (isHeading) {
              return (
                <h2 key={i} style={{ fontFamily: "var(--serif)", fontSize: `${Math.min(1.6, fontSize * 1.25)}rem`, lineHeight: 1.3, margin: "2rem 0 1rem" }}>
                  {p}
                </h2>
              );
            }
            const cs = commentsByPara.get(i) ?? [];
            return (
              <p key={i} style={{ fontFamily: "var(--serif)", fontSize: `${fontSize}rem`, lineHeight: 1.95, marginBottom: "1.3rem" }}>
                {p}{" "}
                <button
                  type="button"
                  onClick={() => setOpenPara(i)}
                  title="Comment on this passage"
                  aria-label={cs.length ? `${cs.length} comment${cs.length === 1 ? "" : "s"} on this passage` : "Comment on this passage"}
                  style={{ verticalAlign: "baseline", marginLeft: 3, padding: "0 5px", border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--sans)", fontSize: "0.66em", color: cs.length ? "#C4A35A" : pal.muted, opacity: cs.length ? 1 : 0.4 }}
                >
                  💬{cs.length ? ` ${cs.length}` : ""}
                </button>
              </p>
            );
          })
        ) : (
          <p style={{ color: pal.muted }}>This story has no readable content yet.</p>
        )}

        {sample ? (
          <div style={{ marginTop: "2.6rem", padding: "1.9rem 1.6rem", borderRadius: 16, border: `1px solid ${pal.bar}`, background: theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", textAlign: "center", fontFamily: "var(--sans)" }}>
            <div style={{ fontFamily: "var(--serif)", fontSize: "1.35rem", marginBottom: "0.5rem", color: pal.fg }}>End of the free sample</div>
            {locked ? (
              <>
                <p style={{ color: pal.muted, marginBottom: "1.4rem", maxWidth: 460, marginInline: "auto", lineHeight: 1.6 }}>
                  That&apos;s the free first chapter. Buy the book to keep reading — it&apos;s yours forever.
                </p>
                <div style={{ display: "flex", gap: "0.7rem", justifyContent: "center", flexWrap: "wrap" }}>
                  <a href={`/book/${bookId}`} className="btn btn-gold">
                    Buy to keep reading{price && price > 0 ? ` — $${Number(price).toFixed(2)}` : ""}
                  </a>
                  <a href={`/book/${bookId}`} className="btn btn-outline">Back to book</a>
                </div>
              </>
            ) : (
              <>
                <p style={{ color: pal.muted, marginBottom: "1.4rem", maxWidth: 460, marginInline: "auto", lineHeight: 1.6 }}>
                  {signedIn
                    ? "That's the free first chapter. Keep going to read the rest."
                    : "That's the free first chapter — create a free account to keep reading. No card required."}
                </p>
                <div style={{ display: "flex", gap: "0.7rem", justifyContent: "center", flexWrap: "wrap" }}>
                  <a href={signedIn ? `/reader/${bookId}` : "/onboarding"} className="btn btn-gold">
                    {signedIn ? "Continue reading →" : "Create free account →"}
                  </a>
                  <a href={`/book/${bookId}`} className="btn btn-outline">Back to book</a>
                </div>
              </>
            )}
          </div>
        ) : null}
      </article>

      {showFinish ? (
        <FinishChallenge bookId={Number(bookId)} title={title} onClose={() => setShowFinish(false)} />
      ) : null}

      {!isHtml ? (
        <CommentTray
          open={openPara != null}
          paraText={openPara != null ? paragraphs[openPara] ?? "" : ""}
          comments={openPara != null ? commentsByPara.get(openPara) ?? [] : []}
          canComment={!!userId}
          currentUserId={userId}
          busy={commentBusy}
          onClose={() => setOpenPara(null)}
          onAdd={addComment}
          onDelete={deleteComment}
        />
      ) : null}
    </div>
  );
}

function ctrl(pal: { fg: string; bar: string }): React.CSSProperties {
  return {
    background: "transparent",
    border: `1px solid ${pal.bar}`,
    color: pal.fg,
    borderRadius: 999,
    padding: "0.3rem 0.6rem",
    fontSize: "0.8rem",
    cursor: "pointer",
    fontFamily: "var(--sans)",
  };
}
