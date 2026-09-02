"use client";

import { useState } from "react";

// Shows the creator's shareable invite link. New readers who sign up through
// it are recorded as referred by this user (profiles.referred_by).
export default function ReferralLink({
  refCode,
  count,
}: {
  refCode: string;
  count: number;
}) {
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState(`/login?ref=${encodeURIComponent(refCode)}`);

  // Upgrade to an absolute URL once we're in the browser.
  if (typeof window !== "undefined" && link.startsWith("/")) {
    setLink(`${window.location.origin}/login?ref=${encodeURIComponent(refCode)}`);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — the field is selectable as a fallback */
    }
  }

  return (
    <div
      style={{
        background: "var(--stone)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "1.2rem 1.3rem",
        marginBottom: "2rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <h3 style={{ fontSize: "1.05rem" }}>Invite readers</h3>
        <span style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.85rem" }}>
          {count} joined through you
        </span>
      </div>
      <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.88rem", margin: "0.3rem 0 0.9rem" }}>
        Share your link — anyone who signs up through it is credited to you.
      </p>
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          style={{
            flex: 1,
            minWidth: 220,
            padding: "0.6rem 0.9rem",
            background: "var(--charcoal)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            color: "var(--ivory)",
            fontFamily: "var(--sans)",
            fontSize: "0.86rem",
          }}
        />
        <button className="btn btn-gold" type="button" onClick={copy} style={{ padding: "0.6rem 1.2rem" }}>
          {copied ? "Copied ✓" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
