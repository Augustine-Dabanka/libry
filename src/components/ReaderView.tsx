"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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

// A small pool of literary epigraphs (all long-public-domain / historical voices),
// shown once at the top of a read as a "book-opening" flourish. Chosen
// deterministically per book so it never flickers or mismatches on hydration.
const EPIGRAPHS: { text: string; who: string }[] = [
  { text: "A room without books is like a body without a soul.", who: "Cicero" },
  { text: "There is no frigate like a book to take us lands away.", who: "Emily Dickinson" },
  { text: "Once you learn to read, you will be forever free.", who: "Frederick Douglass" },
  { text: "Reading is to the mind what exercise is to the body.", who: "Joseph Addison" },
  { text: "Read the best books first, or you may not have a chance to read them at all.", who: "Henry David Thoreau" },
  { text: "A good book is the precious life-blood of a master spirit.", who: "John Milton" },
];

function pickIndex(seed: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return mod > 0 ? h % mod : 0;
}

// Reader-only presentation polish: drop cap, chapter ornaments, title-page rule.
// Scoped to .rd-scope so nothing here leaks into the rest of the app.
const READER_ENHANCE_CSS = `
.rd-header { text-align: center; margin-bottom: 2.2rem; }
.rd-kicker { font-family: var(--sans); font-size: 0.7rem; letter-spacing: 0.24em; text-transform: uppercase; opacity: 0.55; }
.rd-title { font-family: var(--serif); font-size: clamp(1.9rem, 4vw, 2.6rem); line-height: 1.14; margin: 0.55rem 0 0.5rem; }
.rd-byline { font-family: var(--sans); font-size: 0.92rem; opacity: 0.72; }
.rd-meta { font-family: var(--sans); font-size: 0.78rem; opacity: 0.5; margin-top: 0.35rem; letter-spacing: 0.02em; }
.rd-rule { display: flex; align-items: center; justify-content: center; gap: 0.9rem; margin: 1.5rem auto 0; max-width: 240px; }
.rd-rule::before, .rd-rule::after { content: ""; height: 1px; flex: 1; background: currentColor; opacity: 0.28; }
.rd-rule span { font-size: 0.95rem; color: #C4A35A; opacity: 0.9; }
.rd-epigraph { font-family: var(--serif); font-style: italic; text-align: center; opacity: 0.78; max-width: 460px; margin: 0 auto 2.6rem; line-height: 1.7; font-size: 1.02rem; }
.rd-epigraph cite { display: block; font-style: normal; font-family: var(--sans); font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.65; margin-top: 0.7rem; }
.rd-drop::first-letter,
.rd-scope .le-body > p:first-of-type::first-letter {
  font-family: var(--serif); float: left; font-size: 3.3em; line-height: 0.76;
  padding: 0.04em 0.12em 0 0; font-weight: 600; color: #C4A35A;
}
.rd-orn { text-align: center; font-size: 1rem; letter-spacing: 0.4em; opacity: 0.45; color: #C4A35A; margin: 2.6rem 0 0.2rem; }
`;

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
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>("dark");
  const [fontSize, setFontSize] = useState(1.14);

  // Back to the book. If we arrived from the book page, pop it off history
  // (router.back) so a second Back doesn't bounce back into the reader; else go
  // to the book page directly.
  function goBackToBook() {
    const ref = typeof document !== "undefined" ? document.referrer : "";
    const cameFromBook = new RegExp(`/book/${bookId}(?:[/?#]|$)`).test(ref);
    if (cameFromBook && typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push(`/book/${bookId}`);
  }
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

  // Reading-time estimate (~220 wpm) and the index of the first real body
  // paragraph (so only it gets the drop cap, not a heading or an image).
  const isImagePara = (p: string) =>
    /^!\[.*?\]\((https?:\/\/[^\s)]+)\)$/.test(p) || /^https?:\/\/\S+\.(png|jpe?g|gif|webp|svg)(\?\S*)?$/i.test(p);
  const isHeadingPara = (p: string) => /^chapter\b/i.test(p) && p.length <= 60;
  const readingMinutes = useMemo(() => {
    const words = (isHtml ? content.replace(/<[^>]+>/g, " ") : content).trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 220));
  }, [isHtml, content]);
  const firstBodyIndex = useMemo(
    () => paragraphs.findIndex((p) => !isImagePara(p) && !isHeadingPara(p)),
    [paragraphs]
  );
  const epigraph = EPIGRAPHS[pickIndex(String(bookId), EPIGRAPHS.length)]!;

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
        <button type="button" onClick={goBackToBook} style={{ background: "transparent", border: "none", color: pal.muted, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
          ← Back
        </button>
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
          <span aria-label={`${progress} percent read`} style={{ fontFamily: "var(--sans)", fontSize: "0.72rem", color: pal.muted, minWidth: 34, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
            {progress}%
          </span>
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
      <style dangerouslySetInnerHTML={{ __html: READER_ENHANCE_CSS }} />
      <article
        className="rd-scope"
        style={{
          maxWidth: 680,
          margin: "0 auto",
          padding: "3rem clamp(1.1rem,4vw,2rem) 6rem",
        }}
      >
        <header className="rd-header">
          <div className="rd-kicker">{sample ? "Free sample" : "Now reading"}</div>
          <h1 className="rd-title">{title}</h1>
          <div className="rd-byline">by {author || "Unknown author"}</div>
          <div className="rd-meta">{readingMinutes} min read{sample ? " · first chapter" : ""}</div>
          <div className="rd-rule" aria-hidden="true"><span>❦</span></div>
        </header>

        <p className="rd-epigraph">
          “{epigraph.text}”
          <cite>{epigraph.who}</cite>
        </p>

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
            // Chapter headings render as headings, prefaced by an ornament.
            const isHeading = /^chapter\b/i.test(p) && p.length <= 60;
            if (isHeading) {
              return (
                <div key={i}>
                  <div className="rd-orn" aria-hidden="true">❦ ❦ ❦</div>
                  <h2 style={{ fontFamily: "var(--serif)", textAlign: "center", fontSize: `${Math.min(1.6, fontSize * 1.25)}rem`, lineHeight: 1.3, margin: "0.4rem 0 1.4rem" }}>
                    {p}
                  </h2>
                </div>
              );
            }
            const cs = commentsByPara.get(i) ?? [];
            return (
              <p key={i} className={i === firstBodyIndex ? "rd-drop" : undefined} style={{ fontFamily: "var(--serif)", fontSize: `${fontSize}rem`, lineHeight: 1.95, marginBottom: "1.3rem" }}>
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
