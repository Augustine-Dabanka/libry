"use client";

import { useState, useTransition } from "react";
import { promoteBook } from "@/app/actions/monetization";

const TIER_OPTIONS = [
  { key: "Boost", blurb: "3 days · priority spot", price: "$4" },
  { key: "Featured", blurb: "7 days · higher up", price: "$8" },
  { key: "Spotlight", blurb: "7 days · top of home", price: "$15" },
];

export default function PromoteButton({
  bookId,
  promoted,
}: {
  bookId: number;
  promoted?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  if (promoted) {
    return (
      <span
        className="badge"
        style={{ background: "rgba(196,163,90,0.2)", color: "var(--gold)" }}
        title="Active home-page promotion"
      >
        ★ {promoted}
      </span>
    );
  }

  if (!open) {
    return (
      <button
        className="btn btn-outline lb-press"
        style={{ padding: "0.3rem 0.9rem", fontSize: "0.8rem", boxShadow: "none" }}
        onClick={() => setOpen(true)}
        type="button"
      >
        ★ Promote
      </button>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.4rem",
        background: "var(--charcoal)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "0.6rem",
        minWidth: 220,
      }}
    >
      {TIER_OPTIONS.map((t) => (
        <button
          key={t.key}
          type="button"
          disabled={pending}
          onClick={() => start(() => promoteBook(bookId, t.key))}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "0.6rem",
            background: "var(--stone)",
            border: "1px solid var(--border)",
            borderRadius: 9,
            padding: "0.5rem 0.7rem",
            cursor: "pointer",
            color: "var(--ivory)",
            fontFamily: "var(--sans)",
            textAlign: "left",
          }}
        >
          <span>
            <b>{t.key}</b>
            <br />
            <span style={{ color: "var(--muted)", fontSize: "0.78rem" }}>{t.blurb}</span>
          </span>
          <span style={{ color: "var(--gold)", fontWeight: 800 }}>{t.price}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => setOpen(false)}
        style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "0.78rem", marginTop: "0.2rem" }}
      >
        Cancel
      </button>
    </div>
  );
}
