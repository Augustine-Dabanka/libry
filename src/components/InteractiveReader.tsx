"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { type IStory, resolveEnding } from "@/lib/interactive";
import EndingShare from "@/components/EndingShare";
import ReaderCompanion from "@/components/ReaderCompanion";

const PAL = { bg: "#1C1917", fg: "#EDE7DE", muted: "#A8A29E", bar: "rgba(250,247,242,0.12)", gold: "#C5A059" };

export default function InteractiveReader({
  bookId,
  title,
  author,
  story,
  userEmail,
}: {
  bookId: string;
  title: string;
  author: string | null;
  story: IStory;
  userEmail: string | null;
}) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [path, setPath] = useState<number[]>([]);

  // Back to the book without the history "trap": if we arrived from the book
  // page, pop it off history (so browser-Back doesn't bounce into the reader
  // again); otherwise navigate there directly.
  function goBackToBook() {
    const ref = typeof document !== "undefined" ? document.referrer : "";
    const cameFromBook = new RegExp(`/book/${bookId}(?:[/?#]|$)`).test(ref);
    if (cameFromBook && typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push(`/book/${bookId}`);
  }
  const total = story.chapters.length;
  const atEnd = idx >= total;
  const endingIdx = atEnd ? resolveEnding(path, story.endings.length) : -1;
  const ending = endingIdx >= 0 ? story.endings[endingIdx] : null;
  const chapter = !atEnd ? story.chapters[idx] : null;
  const progress = atEnd ? 100 : Math.round((idx / Math.max(1, total)) * 100);

  async function save(pct: number) {
    if (!userEmail) return;
    try {
      const sb = createClient();
      await sb.from("reading_progress").upsert(
        { user_email: userEmail, book_id: bookId, current_chapter: idx + 1, progress_percentage: pct },
        { onConflict: "user_email,book_id" }
      );
    } catch { /* progress is best-effort */ }
  }

  useEffect(() => { if (atEnd) save(100); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [atEnd]);

  function advance(choice: number | null) {
    if (choice !== null) setPath((p) => [...p, choice]);
    const next = idx + 1;
    setIdx(next);
    save(Math.min(100, Math.round((next / Math.max(1, total)) * 100)));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function restart() { setIdx(0); setPath([]); if (typeof window !== "undefined") window.scrollTo({ top: 0 }); }

  const btn: React.CSSProperties = {
    display: "block", width: "100%", textAlign: "left", background: "transparent",
    border: `1px solid ${PAL.bar}`, borderRadius: 12, padding: "1rem 1.2rem", cursor: "pointer",
    color: PAL.fg, fontFamily: "var(--serif)", fontSize: "1.05rem", lineHeight: 1.5, marginBottom: "0.7rem",
    transition: "border-color 0.15s, background 0.15s",
  };

  return (
    <div style={{ position: "fixed", inset: 0, overflowY: "auto", background: PAL.bg, color: PAL.fg }}>
      <div style={{ position: "sticky", top: 0, height: 4, background: PAL.bar, zIndex: 5 }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#5FA068,#C5A059)", transition: "width 0.4s ease" }} />
      </div>
      <div style={{ position: "sticky", top: 4, zIndex: 5, display: "flex", alignItems: "center", gap: "1rem", padding: "0.7rem clamp(1rem,4vw,2rem)", background: "rgba(28,25,23,0.85)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${PAL.bar}` }}>
        <button type="button" onClick={goBackToBook} style={{ background: "transparent", border: "none", color: PAL.muted, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>← Back</button>
        <button type="button" onClick={goBackToBook} title="Back to the book page" aria-label={`${title} — back to the book page`} style={{ flex: 1, minWidth: 0, textAlign: "center", fontFamily: "var(--serif)", fontStyle: "italic", fontSize: "0.98rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", background: "transparent", border: "none", color: "inherit", cursor: "pointer", padding: 0 }}>{title}</button>
        <span style={{ color: PAL.muted, fontFamily: "var(--sans)", fontSize: "0.78rem", flexShrink: 0 }}>{atEnd ? "The End" : `${idx + 1} / ${total}`}</span>
      </div>

      <article data-rc-book style={{ maxWidth: 680, margin: "0 auto", padding: "2.5rem clamp(1.1rem,4vw,2rem) 6rem" }}>
        {atEnd ? (
          <>
            <div style={{ textAlign: "center", fontFamily: "var(--sans)", fontSize: "0.78rem", letterSpacing: "0.14em", textTransform: "uppercase", color: PAL.gold, marginBottom: "0.5rem" }}>Your ending</div>
            <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(1.8rem,4vw,2.5rem)", textAlign: "center", marginBottom: "1.8rem", color: PAL.fg }}>
              {ending ? ending.label : "The End"}
            </h1>
            {(ending?.text ?? []).map((p, i) => (
              <p key={i} style={{ fontFamily: "var(--serif)", fontSize: "1.14rem", lineHeight: 1.95, marginBottom: "1.3rem" }}>{p}</p>
            ))}
            <div style={{ marginTop: "2.5rem", padding: "1.6rem", borderRadius: 16, border: `1px solid ${PAL.bar}`, textAlign: "center", fontFamily: "var(--sans)" }}>
              <p style={{ color: PAL.muted, marginBottom: "1.2rem" }}>
                Your choices led here — this story has <strong style={{ color: PAL.fg }}>{story.endings.length} endings</strong>. Take a different path to find the others.
              </p>
              <div style={{ display: "flex", gap: "0.7rem", justifyContent: "center", flexWrap: "wrap" }}>
                <button type="button" onClick={restart} className="btn btn-gold">↺ Explore another path</button>
                <a href={`/book/${bookId}`} className="btn btn-outline">Back to book</a>
              </div>

              <EndingShare
                bookId={String(bookId)}
                title={title}
                endingNumber={endingIdx >= 0 ? endingIdx + 1 : 1}
                totalEndings={story.endings.length}
              />
            </div>
          </>
        ) : chapter ? (
          <>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: "clamp(1.4rem,3.5vw,1.9rem)", marginBottom: "1.4rem", color: PAL.fg }}>{chapter.title}</h2>
            {chapter.prose.map((p, i) => {
              const md = p.match(/^!\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/);
              if (md) {
                // eslint-disable-next-line @next/next/no-img-element
                return <img key={i} src={md[2]} alt={md[1] || ""} style={{ maxWidth: "100%", borderRadius: 12, display: "block", margin: "1.6rem auto" }} />;
              }
              return <p key={i} style={{ fontFamily: "var(--serif)", fontSize: "1.14rem", lineHeight: 1.95, marginBottom: "1.3rem" }}>{p}</p>;
            })}
            <div style={{ marginTop: "2rem" }}>
              {chapter.choices.length >= 2 ? (
                <>
                  <div style={{ fontFamily: "var(--sans)", fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", color: PAL.gold, marginBottom: "0.9rem" }}>What do you do?</div>
                  {chapter.choices.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => advance(i)}
                      style={btn}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = PAL.gold; e.currentTarget.style.background = "rgba(197,160,89,0.06)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = PAL.bar; e.currentTarget.style.background = "transparent"; }}
                    >
                      <span style={{ color: PAL.gold, marginRight: "0.6rem" }}>▸</span>{c}
                    </button>
                  ))}
                </>
              ) : (
                <button type="button" onClick={() => advance(null)} className="btn btn-gold">Continue →</button>
              )}
            </div>
          </>
        ) : null}
      </article>
      <ReaderCompanion dark />
    </div>
  );
}
