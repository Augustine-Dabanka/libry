"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/types";

export type LibBook = {
  id: number | string;
  title: string;
  author: string | null;
  type: string | null;
  price: number | null;
  pct?: number;
};

type Tab = "reading" | "wishlist" | "purchased";

function ReadingCard({ b }: { b: LibBook }) {
  const pct = b.pct ?? 0;
  const done = pct >= 100;
  return (
    <div className="book-card" style={{ padding: "1.3rem", cursor: "default", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <a href={`/reader/${b.id}`} style={{ textDecoration: "none" }}>
        <h3 style={{ marginBottom: "0.15rem" }}>{b.title}</h3>
      </a>
      <div style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.86rem" }}>{b.author || "Unknown author"}</div>
      <div className="book-meta" style={{ marginTop: "0.1rem" }}>
        <span className="price">{formatPrice(b.price)}</span>
        {b.type ? <span className="badge">{b.type}</span> : null}
      </div>
      <div style={{ marginTop: "auto", paddingTop: "0.7rem" }}>
        <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.max(2, pct)}%`, background: "linear-gradient(90deg,#C4A35A,#B45309)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.55rem" }}>
          <span style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.8rem" }}>{pct}% read</span>
          <a href={`/reader/${b.id}`} style={{ color: "var(--gold)", fontFamily: "var(--sans)", fontSize: "0.85rem", fontWeight: 600 }}>
            {done ? "Read again →" : "Continue reading →"}
          </a>
        </div>
      </div>
    </div>
  );
}

function SimpleCard({ b, cta }: { b: LibBook; cta: string }) {
  return (
    <div className="book-card" style={{ padding: "1.3rem", cursor: "default", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <a href={`/book/${b.id}`} style={{ textDecoration: "none" }}>
        <h3 style={{ marginBottom: "0.15rem" }}>{b.title}</h3>
      </a>
      <div style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.86rem" }}>{b.author || "Unknown author"}</div>
      <div className="book-meta" style={{ marginTop: "0.1rem" }}>
        <span className="price">{formatPrice(b.price)}</span>
        {b.type ? <span className="badge">{b.type}</span> : null}
      </div>
      <div style={{ marginTop: "0.7rem" }}>
        <a href={`/reader/${b.id}`} style={{ color: "var(--gold)", fontFamily: "var(--sans)", fontSize: "0.85rem", fontWeight: 600 }}>{cta} →</a>
      </div>
    </div>
  );
}

export default function LibraryTabs({
  reading,
  wishlist,
  purchased,
  initialTab,
}: {
  reading: LibBook[];
  wishlist: LibBook[];
  purchased: LibBook[];
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab ?? "reading");

  const tabs: { v: Tab; label: string; n: number }[] = [
    { v: "reading", label: "Currently Reading", n: reading.length },
    { v: "wishlist", label: "Wishlist", n: wishlist.length },
    { v: "purchased", label: "Purchased", n: purchased.length },
  ];

  const tabBtn = (v: Tab): React.CSSProperties => ({
    border: "none",
    background: tab === v ? "var(--gold)" : "transparent",
    color: tab === v ? "#20180a" : "var(--muted)",
    fontFamily: "var(--sans)",
    fontWeight: 700,
    fontSize: "0.9rem",
    padding: "0.5rem 1.1rem",
    borderRadius: 999,
    cursor: "pointer",
  });

  const empty = (title: string, body: React.ReactNode) => (
    <div style={{ border: "1px solid var(--border)", borderRadius: 16, padding: "3rem 2rem", textAlign: "center", background: "var(--stone)" }}>
      <p style={{ fontSize: "1.15rem", marginBottom: "0.5rem" }}>{title}</p>
      <p style={{ color: "var(--muted)", maxWidth: 440, margin: "0 auto" }}>{body}</p>
    </div>
  );

  return (
    <>
      <div style={{ display: "inline-flex", gap: "0.3rem", background: "var(--charcoal)", border: "1px solid var(--border)", borderRadius: 999, padding: "0.25rem", marginBottom: "1.8rem", flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button key={t.v} type="button" style={tabBtn(t.v)} onClick={() => setTab(t.v)}>
            {t.label} ({t.n})
          </button>
        ))}
      </div>

      {tab === "reading" &&
        (reading.length ? (
          <div className="book-grid">{reading.map((b) => <ReadingCard key={b.id} b={b} />)}</div>
        ) : (
          empty("Nothing in progress.", <>Open a story from the <a href="/catalog" style={{ color: "var(--gold)" }}>catalog</a> and it shows up here as you read.</>)
        ))}

      {tab === "wishlist" &&
        (wishlist.length ? (
          <div className="book-grid">{wishlist.map((b) => <SimpleCard key={b.id} b={b} cta="View" />)}</div>
        ) : (
          empty("Your wishlist is empty.", <>Tap <strong>♡ Add to wishlist</strong> on any book to save it here.</>)
        ))}

      {tab === "purchased" &&
        (purchased.length ? (
          <div className="book-grid">{purchased.map((b) => <SimpleCard key={b.id} b={b} cta="Read" />)}</div>
        ) : (
          empty("You haven't purchased any books yet.", <>Premium books you buy will live here, ready to read on any device.</>)
        ))}
    </>
  );
}
