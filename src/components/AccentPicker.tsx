"use client";

import { useEffect, useState } from "react";

// Reader accent: recolours highlights (progress, active tabs, chips). The brand
// colour (Laterite) stays on the logo and main buttons, so Lybry always looks
// like Lybry. Stored per device in localStorage "leep-accent"; applied before
// paint by the boot script in app/layout.tsx.
export const ACCENTS = [
  { key: "laterite", name: "Laterite", note: "Lybry orange", swatch: "#C8471F" },
  { key: "adire", name: "Adire", note: "Indigo", swatch: "#3446D4" },
  { key: "palm", name: "Palm", note: "Green", swatch: "#1E7F5C" },
  { key: "sobolo", name: "Sobolo", note: "Hibiscus", swatch: "#C42B6B" },
  { key: "marigold", name: "Marigold", note: "Gold", swatch: "#9A6200" },
] as const;

export default function AccentPicker() {
  const [active, setActive] = useState<string>("laterite");

  useEffect(() => {
    try {
      setActive(localStorage.getItem("leep-accent") || "laterite");
    } catch {}
  }, []);

  function pick(key: string) {
    setActive(key);
    try {
      localStorage.setItem("leep-accent", key);
    } catch {}
    if (key === "laterite") document.documentElement.removeAttribute("data-accent");
    else document.documentElement.setAttribute("data-accent", key);
  }

  return (
    <div role="radiogroup" aria-label="Accent color" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.7rem" }}>
      {ACCENTS.map((a) => {
        const on = active === a.key;
        return (
          <button
            key={a.key}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => pick(a.key)}
            style={{
              display: "flex", alignItems: "center", gap: "0.6rem", textAlign: "left",
              padding: "0.7rem 0.8rem", borderRadius: 14, cursor: "pointer",
              background: "var(--stone)", color: "var(--ivory)", fontFamily: "var(--sans)",
              border: `2px solid ${on ? a.swatch : "var(--edge)"}`,
              boxShadow: `0 4px 0 ${on ? a.swatch : "var(--edge)"}`,
            }}
          >
            <span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: 8, background: a.swatch, flexShrink: 0, boxShadow: "inset 0 -4px 0 rgba(0,0,0,0.18)" }} />
            <span style={{ display: "grid", lineHeight: 1.2 }}>
              <span style={{ fontWeight: 800, fontSize: "0.9rem" }}>{a.name}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600 }}>{a.note}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
