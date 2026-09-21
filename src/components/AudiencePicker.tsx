"use client";

import { useState } from "react";
import BookMini from "@/components/BookMini";
import { type Book } from "@/lib/types";

export type AudienceGroup = { key: string; label: string; emoji: string; books: Book[] };

// "For you" audience picker (mockup): Kids / Teen / YA / Adult tabs that swap the
// shelf below without a page load. Groups are pre-built server-side from the
// age-filtered catalog, so a reader with mature content off simply sees fewer
// tabs populated.
export default function AudiencePicker({ groups }: { groups: AudienceGroup[] }) {
  const withBooks = groups.filter((g) => g.books.length > 0);
  const initial = withBooks[0]?.key ?? groups[0]?.key ?? "";
  const [active, setActive] = useState(initial);
  if (withBooks.length === 0) return null;

  const current = groups.find((g) => g.key === active) ?? withBooks[0];

  return (
    <section className="carousel-section">
      <div className="carousel-head" style={{ marginBottom: "0.7rem" }}>
        <h2 style={{ fontSize: "clamp(1.1rem,3.4vw,1.4rem)", margin: 0 }}>✦ For you</h2>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem", marginBottom: "0.4rem" }}>
        {groups.map((g) => {
          const empty = g.books.length === 0;
          const on = g.key === current.key;
          return (
            <button
              key={g.key}
              type="button"
              onClick={() => !empty && setActive(g.key)}
              disabled={empty}
              style={{
                flexShrink: 0,
                cursor: empty ? "default" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                border: `1px solid ${on ? "var(--gold)" : "var(--border)"}`,
                background: on ? "var(--gold)" : "var(--stone)",
                color: on ? "#12100E" : empty ? "var(--muted)" : "var(--ivory)",
                opacity: empty ? 0.5 : 1,
                borderRadius: 999,
                padding: "0.45rem 1rem",
                fontFamily: "var(--sans)",
                fontSize: "0.88rem",
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              <span aria-hidden="true">{g.emoji}</span> {g.label}
            </button>
          );
        })}
      </div>

      <div className="book-carousel">
        {current.books.map((b) => (
          <div key={b.id} className="cc-slot">
            <BookMini book={b} />
          </div>
        ))}
      </div>
    </section>
  );
}
