"use client";

import { useState } from "react";

// Share a book. Uses the native share sheet on mobile; falls back to copying
// the link on desktop. `path` is resolved to an absolute URL client-side so it
// works on any origin (prod, preview, local).
export default function ShareButton({
  path,
  title,
  label = "Share",
  variant = "outline",
}: {
  path: string;
  title?: string;
  label?: string;
  variant?: "outline" | "ghost" | "chip";
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = typeof window !== "undefined" ? new URL(path, window.location.origin).toString() : path;
    const data = { title: title || "Libry", text: title ? `${title} — on Libry` : "Read on Libry", url };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = navigator as any;
    if (nav.share) {
      try { await nav.share(data); return; } catch { /* cancelled → fall through to copy */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* ignore */ }
  }

  if (variant === "chip") {
    return (
      <button type="button" onClick={share} title="Share" aria-label="Share" style={chip}>
        {copied ? "Copied ✓" : "↗ Share"}
      </button>
    );
  }

  return (
    <button type="button" className={variant === "ghost" ? "btn btn-ghost" : "btn btn-outline"} onClick={share}>
      {copied ? "Link copied ✓" : `↗ ${label}`}
    </button>
  );
}

const chip: React.CSSProperties = {
  background: "transparent",
  border: "1px solid var(--bar, rgba(255,255,255,0.2))",
  color: "inherit",
  borderRadius: 999,
  padding: "0.3rem 0.7rem",
  fontSize: "0.8rem",
  cursor: "pointer",
  fontFamily: "var(--sans)",
  whiteSpace: "nowrap",
};
