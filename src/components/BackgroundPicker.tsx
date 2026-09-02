"use client";

import { useEffect, useState } from "react";
import type { BgKind } from "@/components/BackgroundFX";

const OPTS: { v: BgKind; label: string; icon: string }[] = [
  { v: "none", label: "None", icon: "—" },
  { v: "shapes", label: "Floating shapes", icon: "◆" },
  { v: "books", label: "Floating books", icon: "📚" },
  { v: "clouds", label: "Clouds", icon: "☁️" },
];

export default function BackgroundPicker() {
  const [kind, setKind] = useState<BgKind>("none");

  useEffect(() => {
    try {
      setKind((localStorage.getItem("libry-bg") as BgKind) || "none");
    } catch {}
  }, []);

  function pick(v: BgKind) {
    setKind(v);
    try {
      localStorage.setItem("libry-bg", v);
    } catch {}
    window.dispatchEvent(new CustomEvent("libry:bg"));
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.7rem" }}>
      {OPTS.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => pick(o.v)}
          style={{
            padding: "0.85rem",
            borderRadius: 12,
            cursor: "pointer",
            fontFamily: "var(--sans)",
            fontWeight: 600,
            fontSize: "0.88rem",
            background: kind === o.v ? "rgba(196,163,90,0.16)" : "var(--charcoal)",
            border: `1.5px solid ${kind === o.v ? "var(--gold)" : "var(--border)"}`,
            color: kind === o.v ? "var(--gold)" : "var(--ivory-muted)",
          }}
        >
          <span style={{ marginRight: "0.4rem" }}>{o.icon}</span>
          {o.label}
        </button>
      ))}
    </div>
  );
}
