"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/types";

export type LibBook = {
  id: number | string;
  title: string;
  author: string | null;
  type: string | null;
  price: number | null;
  pct: number;
};

type Tab = "reading" | "finished";

function Card({ b }: { b: LibBook }) {
  const done = b.pct >= 100;
  return (
    <div className="book-card" style={{ padding: "1.3rem", cursor: "default", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <a href={`/reader/${b.id}`} style={{ textDecoration: "none" }}>
        <h3 style={{ marginBottom: "0.15rem" }}>{b.title}</h3>
      </a>
      <div style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.86rem" }}>
        {b.author || "Unknown author"}
      </div>
      <div className="book-meta" style={{ marginTop: "0.1rem" }}>
        <span className="price">{formatPrice(b.price)}</span>
        {b.type ? <span className="badge">{b.type}</span> : null}
      </div>

      <div style={{ marginTop: "auto", paddingTop: "0.7rem" }}>
        <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.max(2, b.pct)}%`, background: "linear-gradient(90deg,#C4A35A,#B45309)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.55rem" }}>
          <span style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.8rem" }}>
            {b.pct}% read
          </span>
          <a href={`/reader/${b.id}`} style={{ color: "var(--gold)", fontFamily: "var(--sans)", fontSize: "0.85rem", fontWeight: 600 }}>
            {done ? "Read again →" : "Continue reading →"}
          </a>
        </div>
      </div>
    </div>
  );
}

export default function LibraryTabs({ reading, finished }: { reading: LibBook[]; finished: LibBook[] }) {
  const [tab, setTab] = useState<Tab>(reading.length === 0 && finished.length > 0 ? "finished" : "reading");
  const list = tab === "reading" ? reading : finished;

  const tabBtn = (t: Tab, label: string, n: number): React.CSSProperties => ({
    border: "none",
    background: tab === t ? "var(--gold)" : "transparent",
    color: tab === t ? "#20180a" : "var(--muted)",
    fontFamily: "var(--sans)",
    fontWeight: 700,
    fontSize: "0.9rem",
    padding: "0.5rem 1.1rem",
    borderRadius: 999,
    cursor: "pointer",
  });

  return (
    <>
      <div
        style={{
          display: "inline-flex",
          gap: "0.3rem",
          background: "var(--charcoal)",
          border: "1px solid var(--border)",
          borderRadius: 999,
          padding: "0.25rem",
          marginBottom: "1.8rem",
        }}
      >
        <button type="button" style={tabBtn("reading", "Currently reading", reading.length)} onClick={() => setTab("reading")}>
          Currently reading ({reading.length})
        </button>
        <button type="button" style={tabBtn("finished", "Finished", finished.length)} onClick={() => setTab("finished")}>
          Finished ({finished.length})
        </button>
      </div>

      {list.length > 0 ? (
        <div className="book-grid">
          {list.map((b) => (
            <Card key={b.id} b={b} />
          ))}
        </div>
      ) : (
        <div style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "3rem 2rem", textAlign: "center", background: "var(--stone)" }}>
          <p style={{ fontSize: "1.15rem", marginBottom: "0.5rem" }}>
            {tab === "reading" ? "Nothing in progress." : "Nothing finished yet."}
          </p>
          <p style={{ color: "var(--muted)", maxWidth: 440, margin: "0 auto" }}>
            Open a story from the{" "}
            <a href="/catalog" style={{ color: "var(--gold)" }}>
              catalog
            </a>{" "}
            and it shows up here as you read.
          </p>
        </div>
      )}
    </>
  );
}
