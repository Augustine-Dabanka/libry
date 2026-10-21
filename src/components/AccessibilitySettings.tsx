"use client";

import { useEffect, useState } from "react";

// Device-level comfort settings. Applied before paint by layout.tsx.
const SIZES = [
  { v: "90", label: "Small" },
  { v: "100", label: "Default" },
  { v: "115", label: "Large" },
  { v: "130", label: "Extra large" },
];

export default function AccessibilitySettings() {
  const [size, setSize] = useState("100");
  const [calm, setCalm] = useState(false);
  useEffect(() => {
    try {
      setSize(localStorage.getItem("leep-text") || "100");
      setCalm(localStorage.getItem("leep-motion") === "reduce");
    } catch { /* ignore */ }
  }, []);

  function pickSize(v: string) {
    setSize(v);
    try { localStorage.setItem("leep-text", v); } catch { /* ignore */ }
    document.documentElement.style.fontSize = v === "100" ? "" : `${v}%`;
  }
  function pickCalm(on: boolean) {
    setCalm(on);
    try { localStorage.setItem("leep-motion", on ? "reduce" : "full"); } catch { /* ignore */ }
    if (on) document.documentElement.setAttribute("data-motion", "reduce");
    else document.documentElement.removeAttribute("data-motion");
  }

  return (
    <div style={{ display: "grid", gap: "1.2rem" }}>
      <div>
        <div style={{ fontWeight: 900, marginBottom: "0.5rem" }}>Text size</div>
        <div role="radiogroup" aria-label="Text size" style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
          {SIZES.map((s, i) => (
            <button key={s.v} type="button" role="radio" aria-checked={size === s.v} onClick={() => pickSize(s.v)}
              style={{ padding: "0.5rem 0.85rem", borderRadius: 12, cursor: "pointer", fontFamily: "var(--sans)", fontWeight: 800, fontSize: `${0.82 + i * 0.1}rem`,
                border: `2px solid ${size === s.v ? "var(--gold)" : "var(--edge)"}`, background: size === s.v ? "var(--gold-tint)" : "var(--stone)", color: size === s.v ? "var(--gold)" : "var(--ivory)" }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <label style={{ display: "flex", gap: "0.7rem", alignItems: "flex-start", cursor: "pointer" }}>
        <input type="checkbox" checked={calm} onChange={(e) => pickCalm(e.target.checked)} style={{ accentColor: "var(--gold)", width: 20, height: 20, marginTop: 2 }} />
        <span>
          <strong style={{ display: "block", fontWeight: 900 }}>Reduce motion</strong>
          <span style={{ color: "var(--muted)", fontSize: "0.88rem", fontWeight: 600 }}>Turns off bouncing, sliding and background animation. Your device&apos;s own &quot;reduce motion&quot; setting is always respected too.</span>
        </span>
      </label>
    </div>
  );
}
