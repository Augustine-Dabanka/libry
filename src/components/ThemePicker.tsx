"use client";

import { useEffect, useState } from "react";

const THEMES = [
  { key: "obsidian", name: "Obsidian Neon", accent: "#7C83FF" },
  { key: "emerald", name: "Emerald Royale", accent: "#34D399" },
  { key: "gold", name: "Cyber Gold", accent: "#D4AF37" },
  { key: "amethyst", name: "Amethyst Glow", accent: "#C084FC" },
];

export default function ThemePicker() {
  const [active, setActive] = useState<string>("gold");

  useEffect(() => {
    try {
      const b = localStorage.getItem("libry-brand");
      if (b) setActive(b);
    } catch {}
  }, []);

  function pick(key: string) {
    setActive(key);
    try {
      localStorage.setItem("libry-brand", key);
    } catch {}
    document.documentElement.setAttribute("data-brand", key);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.9rem" }}>
      {THEMES.map((t) => {
        const on = active === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => pick(t.key)}
            style={{
              textAlign: "left",
              background: "var(--stone)",
              border: `2px solid ${on ? t.accent : "var(--border)"}`,
              borderRadius: 14,
              padding: "0.9rem 1rem",
              cursor: "pointer",
              boxShadow: on ? `0 0 0 3px ${t.accent}33` : "none",
              transition: "border-color 0.15s ease, box-shadow 0.15s ease",
            }}
          >
            <span
              style={{
                display: "block",
                height: 34,
                borderRadius: 8,
                marginBottom: "0.6rem",
                background: `linear-gradient(135deg, ${t.accent}, ${t.accent}66)`,
              }}
            />
            <span style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: "0.9rem", color: "var(--ivory)" }}>
              {t.name}
            </span>
            {on ? <span style={{ color: t.accent, fontSize: "0.78rem", display: "block", fontFamily: "var(--sans)" }}>Active</span> : null}
          </button>
        );
      })}
    </div>
  );
}
