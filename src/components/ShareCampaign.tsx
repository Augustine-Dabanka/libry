"use client";

import { useState } from "react";

// Copy-the-link widget for a book's public campaign page.
export default function ShareCampaign({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState(path);

  // Resolve to an absolute URL on the client so the copied link is shareable.
  if (typeof window !== "undefined" && url === path) {
    setUrl(window.location.origin + path);
  }

  function copy() {
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
      <input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        style={{ flex: 1, minWidth: 200, padding: "0.6rem 0.9rem", background: "var(--charcoal)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--ivory)", fontFamily: "var(--sans)", fontSize: "0.85rem", outline: "none" }}
      />
      <button type="button" className="btn btn-gold" onClick={copy} style={{ padding: "0.55rem 1.1rem" }}>
        {copied ? "Copied ✓" : "Copy link"}
      </button>
    </div>
  );
}
