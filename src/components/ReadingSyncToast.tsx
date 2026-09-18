"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Live cross-device nudge: while you read, if the SAME book's progress jumps
// ahead on another device (Supabase Realtime on reading_progress), offer to
// hop there. Clicking dispatches `libry:reader-jump` which the reader handles.
// Fully guarded — silent if Realtime isn't enabled for the table.
export default function ReadingSyncToast({ userEmail, bookId }: { userEmail: string; bookId: string }) {
  const [pct, setPct] = useState<number | null>(null);
  const lastLocal = useRef(0);

  // The reader tells us where THIS device is, so we never nudge on our own saves.
  useEffect(() => {
    const onLocal = (e: Event) => { lastLocal.current = (e as CustomEvent).detail ?? lastLocal.current; };
    window.addEventListener("libry:local-progress", onLocal);
    return () => window.removeEventListener("libry:local-progress", onLocal);
  }, []);

  useEffect(() => {
    if (!userEmail) return;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
    try {
      const supabase = createClient();
      channel = supabase
        .channel(`reading-${bookId}-${userEmail}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "reading_progress", filter: `book_id=eq.${bookId}` },
          (payload: { new?: { user_email?: string; progress_percentage?: number } }) => {
            const row = payload.new;
            if (!row || row.user_email !== userEmail) return;
            const next = Math.round(Number(row.progress_percentage) || 0);
            // Only nudge when another device is meaningfully ahead of us.
            if (next > lastLocal.current + 4 && next <= 100) setPct(next);
          }
        )
        .subscribe();
    } catch {
      /* realtime not enabled — no-op */
    }
    return () => { if (channel) channel.unsubscribe(); };
  }, [userEmail, bookId]);

  if (pct == null) return null;

  return (
    <div role="status" style={{ position: "fixed", left: "50%", bottom: "calc(1.2rem + env(safe-area-inset-bottom))", transform: "translateX(-50%)", zIndex: 1400, display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.7rem 0.9rem 0.7rem 1.1rem", background: "var(--stone)", color: "var(--ivory)", border: "1px solid var(--border)", borderRadius: 999, boxShadow: "0 16px 40px rgba(0,0,0,0.45)", fontFamily: "var(--sans)", fontSize: "0.88rem", maxWidth: "calc(100vw - 2rem)" }}>
      <span>You&apos;re at <strong>{pct}%</strong> on another device.</span>
      <button
        type="button"
        onClick={() => { window.dispatchEvent(new CustomEvent("libry:reader-jump", { detail: pct })); setPct(null); }}
        style={{ background: "var(--gold)", color: "#12100E", border: "none", borderRadius: 999, padding: "0.35rem 0.8rem", fontFamily: "var(--sans)", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", whiteSpace: "nowrap" }}
      >
        Jump there
      </button>
      <button type="button" onClick={() => setPct(null)} aria-label="Dismiss" style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "1.1rem", lineHeight: 1, padding: "0 0.2rem" }}>×</button>
    </div>
  );
}
