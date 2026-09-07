"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sanitizeHtml, looksLikeHtml } from "@/lib/sanitize";
import { RICH_CSS } from "@/lib/richStyles";

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
  sample?: boolean;
  signedIn?: boolean;
  locked?: boolean;
  price?: number | null;
}) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [fontSize, setFontSize] = useState(1.14);
  const [progress, setProgress] = useState(0);
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

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const pct = max > 0 ? Math.min(100, Math.round((el.scrollTop / max) * 100)) : 0;
    setProgress(pct);

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
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
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
            return (
              <p key={i} style={{ fontFamily: "var(--serif)", fontSize: `${fontSize}rem`, lineHeight: 1.95, marginBottom: "1.3rem" }}>
                {p}
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
