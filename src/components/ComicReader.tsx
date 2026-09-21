"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type ComicPage } from "@/lib/comic";

type Mode = "scroll" | "pages";

// A comic reader: vertical webtoon strip by default, or one page at a time.
// Saves reading progress into the same reading_progress table the prose reader
// uses, so a comic shows up under "Continue reading" like any other book.
export default function ComicReader({
  bookId,
  title,
  author,
  pages,
  userEmail,
  sample = false,
  locked = false,
  signedIn = false,
  price,
}: {
  bookId: string;
  title: string;
  author: string;
  pages: ComicPage[];
  userEmail: string | null;
  sample?: boolean;
  locked?: boolean;
  signedIn?: boolean;
  price?: number | null;
}) {
  const [mode, setMode] = useState<Mode>("scroll");
  const imageIndexes = useMemo(() => pages.map((p, i) => (p.kind === "image" ? i : -1)).filter((i) => i >= 0), [pages]);
  const total = imageIndexes.length;
  const [pageAt, setPageAt] = useState(0); // index into imageIndexes (pages mode)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const restored = useRef(false);

  const save = useCallback(
    (pct: number) => {
      if (!userEmail || sample) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          const supabase = createClient();
          await supabase.from("reading_progress").upsert(
            { user_email: userEmail, book_id: bookId, current_chapter: 1, progress_percentage: Math.max(0, Math.min(100, Math.round(pct))) },
            { onConflict: "user_email,book_id" },
          );
        } catch {
          /* not migrated / offline — ignore */
        }
      }, 900);
    },
    [userEmail, sample, bookId],
  );

  // Restore last position once.
  useEffect(() => {
    if (restored.current || !userEmail) return;
    restored.current = true;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.from("reading_progress").select("progress_percentage").eq("user_email", userEmail).eq("book_id", bookId).maybeSingle();
        const pct = Number(data?.progress_percentage ?? 0);
        if (pct > 0 && total > 0) setPageAt(Math.min(total - 1, Math.floor((pct / 100) * total)));
      } catch {
        /* ignore */
      }
    })();
  }, [userEmail, bookId, total]);

  // Scroll-mode progress.
  useEffect(() => {
    if (mode !== "scroll") return;
    const onScroll = () => {
      const el = document.scrollingElement || document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      const pct = max > 0 ? (el.scrollTop / max) * 100 : 0;
      save(pct);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [mode, save]);

  const go = useCallback(
    (dir: 1 | -1) => {
      setPageAt((p) => {
        const next = Math.max(0, Math.min(total - 1, p + dir));
        if (total > 0) save(((next + 1) / total) * 100);
        return next;
      });
    },
    [total, save],
  );

  // Keyboard nav in pages mode.
  useEffect(() => {
    if (mode !== "pages") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") go(1);
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, go]);

  const LockCta = locked ? (
    <div style={{ textAlign: "center", padding: "3rem 1.4rem", maxWidth: 460, margin: "0 auto" }}>
      <div style={{ fontSize: "2rem", marginBottom: "0.6rem" }}>🔒</div>
      <h2 style={{ marginBottom: "0.5rem" }}>Keep reading {title}</h2>
      <p style={{ color: "var(--muted)", marginBottom: "1.3rem" }}>
        You&apos;re reading a free preview. {price ? `Unlock the full comic for GHS ${Number(price).toFixed(2)}.` : "Unlock the full comic to continue."}
      </p>
      <a href={`/book/${bookId}`} className="btn btn-gold">{signedIn ? "Unlock the full comic →" : "Sign up to keep reading →"}</a>
    </div>
  ) : null;

  const bar = (
    <div style={{ position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.7rem 1rem", background: "rgba(18,16,14,0.86)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
      <a href={`/book/${bookId}`} aria-label="Back" style={{ color: "var(--ivory)", textDecoration: "none", fontSize: "1.2rem", flexShrink: 0 }}>←</a>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--serif)", color: "var(--ivory)", fontSize: "0.98rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
        <div style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{author}</div>
      </div>
      <div style={{ display: "flex", gap: "0.3rem", background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 999, padding: "0.2rem", flexShrink: 0 }}>
        {(["scroll", "pages"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            style={{ cursor: "pointer", border: "none", borderRadius: 999, padding: "0.35rem 0.75rem", fontFamily: "var(--sans)", fontSize: "0.78rem", fontWeight: 700, background: mode === m ? "var(--gold)" : "transparent", color: mode === m ? "#12100E" : "var(--ivory-muted)" }}
          >
            {m === "scroll" ? "Scroll" : "Pages"}
          </button>
        ))}
      </div>
    </div>
  );

  if (total === 0) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--charcoal)" }}>
        {bar}
        <div style={{ textAlign: "center", padding: "4rem 1.4rem", color: "var(--muted)" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.6rem" }}>💥</div>
          <p>This comic doesn&apos;t have any pages yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0c0b0a" }}>
      {bar}

      {mode === "scroll" ? (
        <div ref={scrollRef} style={{ maxWidth: 820, margin: "0 auto" }}>
          {pages.map((p, i) =>
            p.kind === "divider" ? (
              <div key={`d${i}`} style={{ textAlign: "center", padding: "1.6rem 1rem", color: "var(--gold)", fontFamily: "var(--serif)", fontSize: "1.15rem", letterSpacing: "0.02em" }}>
                — {p.label} —
              </div>
            ) : (
              <figure key={`i${i}`} style={{ margin: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt={p.caption || `${title} — page`} loading="lazy" style={{ display: "block", width: "100%", height: "auto" }} />
                {p.caption ? <figcaption style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.85rem", textAlign: "center", padding: "0.5rem 1rem 1.1rem" }}>{p.caption}</figcaption> : null}
              </figure>
            ),
          )}
          {LockCta}
          <div style={{ height: "3rem" }} />
        </div>
      ) : (
        <div style={{ position: "relative", maxWidth: 820, margin: "0 auto", minHeight: "70vh", display: "grid", placeItems: "center" }}>
          {(() => {
            const idx = imageIndexes[pageAt];
            const p = idx === undefined ? undefined : pages[idx];
            if (!p || p.kind !== "image") return null;
            return (
              <figure style={{ margin: 0, width: "100%" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt={p.caption || `${title} — page ${pageAt + 1}`} style={{ display: "block", width: "100%", height: "auto" }} />
                {p.caption ? <figcaption style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.85rem", textAlign: "center", padding: "0.6rem 1rem" }}>{p.caption}</figcaption> : null}
              </figure>
            );
          })()}

          {/* Tap zones */}
          <button type="button" aria-label="Previous page" onClick={() => go(-1)} disabled={pageAt === 0} style={{ position: "absolute", inset: "0 66% 0 0", background: "transparent", border: "none", cursor: pageAt === 0 ? "default" : "pointer" }} />
          <button type="button" aria-label="Next page" onClick={() => go(1)} disabled={pageAt >= total - 1} style={{ position: "absolute", inset: "0 0 0 66%", background: "transparent", border: "none", cursor: pageAt >= total - 1 ? "default" : "pointer" }} />

          <div style={{ position: "fixed", bottom: 14, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: "0.9rem", background: "rgba(18,16,14,0.9)", border: "1px solid var(--border)", borderRadius: 999, padding: "0.4rem 0.7rem", zIndex: 20 }}>
            <button type="button" onClick={() => go(-1)} disabled={pageAt === 0} style={{ cursor: pageAt === 0 ? "default" : "pointer", background: "none", border: "none", color: pageAt === 0 ? "var(--muted)" : "var(--ivory)", fontSize: "1.1rem" }}>‹</button>
            <span style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.8rem", minWidth: 64, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{pageAt + 1} / {total}</span>
            <button type="button" onClick={() => go(1)} disabled={pageAt >= total - 1} style={{ cursor: pageAt >= total - 1 ? "default" : "pointer", background: "none", border: "none", color: pageAt >= total - 1 ? "var(--muted)" : "var(--ivory)", fontSize: "1.1rem" }}>›</button>
          </div>

          {pageAt >= total - 1 && locked ? <div style={{ position: "absolute", inset: 0, background: "rgba(12,11,10,0.82)", display: "grid", placeItems: "center" }}>{LockCta}</div> : null}
        </div>
      )}
    </div>
  );
}
