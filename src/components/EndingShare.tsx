"use client";

import { useState } from "react";

// A spoiler-safe interactive result card + share (spec §16/§17). The reader sees
// their own ending on screen, but the SHARE payload only reveals the ending
// NUMBER ("Ending 3 of 9") and the story — never the ending's name or content —
// so a friend can open the story and find their own path. Powers the loop:
// ending → share → friend opens → different path → share → discovery.
export default function EndingShare({
  bookId,
  title,
  endingNumber,
  totalEndings,
}: {
  bookId: string;
  title: string;
  endingNumber: number;
  totalEndings: number;
}) {
  const [copied, setCopied] = useState(false);

  const url = typeof window !== "undefined" ? `${window.location.origin}/book/${bookId}` : `/book/${bookId}`;
  const nLabel = totalEndings > 1 ? `Ending ${endingNumber} of ${totalEndings}` : "an ending";
  const shareText = `I reached ${nLabel} in "${title}" on Libry. Which ending will you get?`;

  async function share() {
    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    if (nav && typeof nav.share === "function") {
      try {
        await nav.share({ title: `${title} — Libry`, text: shareText, url });
        return;
      } catch {
        /* user dismissed — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard blocked — nothing we can do silently */
    }
  }

  return (
    <div style={{ marginTop: "1.4rem" }}>
      {/* Spoiler-safe result badge the reader can screenshot */}
      <div
        aria-label={`You reached ${nLabel}`}
        style={{
          margin: "0 auto 1.2rem",
          maxWidth: 340,
          borderRadius: 16,
          padding: "1.2rem 1.4rem",
          background: "radial-gradient(120% 90% at 80% 0%, rgba(196,163,90,0.22), transparent 60%), linear-gradient(160deg,#2a2118,#141019)",
          border: "1px solid rgba(196,163,90,0.35)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#DCC088" }}>✦ Your result</div>
        <div style={{ fontFamily: "var(--serif, Georgia, serif)", fontStyle: "italic", fontSize: "1.5rem", color: "#FAF7F2", margin: "0.4rem 0 0.2rem" }}>{nLabel}</div>
        <div style={{ fontSize: "0.82rem", color: "#C6BEB2" }}>{title}</div>
        <div style={{ fontSize: "0.72rem", color: "#8a7d70", marginTop: "0.5rem" }}>Which ending will you get?</div>
      </div>

      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", flexWrap: "wrap" }}>
        <button type="button" onClick={share} className="btn btn-gold">{copied ? "✓ Link copied" : "↗ Share your ending"}</button>
        <a href={`/book/${bookId}#reviews`} className="btn btn-outline">💬 Discuss this ending</a>
      </div>
      <p style={{ fontFamily: "var(--sans)", fontSize: "0.74rem", color: "#8a7d70", textAlign: "center", marginTop: "0.7rem" }}>
        Spoiler-safe — friends see the story, not your ending.
      </p>
    </div>
  );
}
