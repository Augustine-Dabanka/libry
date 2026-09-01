"use client";

import { useState, useTransition } from "react";
import { promoteBook } from "@/app/actions/monetization";

const TIER_OPTIONS = [
  { key: "Boost", blurb: "3 days · a Featured slot", price: "$4" },
  { key: "Featured", blurb: "7 days · higher placement", price: "$8" },
  { key: "Spotlight", blurb: "7 days · top of Featured Stories", price: "$15" },
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
      <span className="badge" style={{ background: "rgba(196,163,90,0.2)", color: "var(--gold)" }} title="Active home-page promotion">
        ★ {promoted}
      </span>
    );
  }

  function choose(tier: string) {
    start(async () => {
      await promoteBook(bookId, tier);
      setOpen(false);
    });
  }

  return (
    <>
      <button
        className="btn btn-outline lb-press"
        style={{ padding: "0.3rem 0.9rem", fontSize: "0.8rem", boxShadow: "none" }}
        onClick={() => setOpen(true)}
        type="button"
      >
        ★ Promote
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: "rgba(0,0,0,0.65)",
            display: "grid",
            placeItems: "center",
            padding: "1rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 440,
              background: "var(--stone)",
              border: "1px solid var(--border)",
              borderRadius: 18,
              padding: "1.8rem",
              boxShadow: "var(--shadow)",
            }}
          >
            <h3 style={{ marginBottom: "0.3rem" }}>Promote this book</h3>
            <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", marginBottom: "1.3rem" }}>
              Sponsor a slot in the <strong style={{ color: "var(--gold)" }}>Featured Stories</strong> carousel on the
              home page. Placement is separate from organic ranking.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {TIER_OPTIONS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  disabled={pending}
                  onClick={() => choose(t.key)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "0.6rem",
                    background: "var(--charcoal)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: "0.85rem 1rem",
                    cursor: "pointer",
                    color: "var(--ivory)",
                    fontFamily: "var(--sans)",
                    textAlign: "left",
                  }}
                >
                  <span>
                    <b>{t.key}</b>
                    <br />
                    <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{t.blurb}</span>
                  </span>
                  <span style={{ color: "var(--gold)", fontWeight: 800, fontSize: "1.05rem" }}>{t.price}</span>
                </button>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.3rem" }}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn btn-outline"
                style={{ padding: "0.4rem 1.1rem", fontSize: "0.85rem" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
