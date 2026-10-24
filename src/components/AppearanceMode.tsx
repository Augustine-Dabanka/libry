"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
type Mode = "dark" | "light" | "system";

function apply(mode: Mode) {
  const theme = mode === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : mode;
  document.documentElement.setAttribute("data-theme", theme);
}

// Appearance: Dark / Light / System, persisted in localStorage and applied live.
export default function AppearanceMode() {
  const [mode, setMode] = useState<Mode>("light");

  useEffect(() => {
    try { setMode((localStorage.getItem("libry-theme") as Mode) || "light"); } catch {}
  }, []);

  function pick(m: Mode) {
    setMode(m);
    try {
      localStorage.setItem("libry-theme", m);
    } catch {}
    apply(m);
  }

  const opts = [
    { v: "light" as const, label: "Light", Icon: Sun },
    { v: "dark" as const, label: "Dark", Icon: Moon },
    { v: "system" as const, label: "System", Icon: Monitor },
  ];

  return (
    <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => pick(o.v)}
          style={{
            flex: "1 1 120px",
            padding: "0.9rem",
            borderRadius: 12,
            cursor: "pointer",
            fontFamily: "var(--sans)",
            fontWeight: 600,
            fontSize: "0.9rem",
            background: mode === o.v ? "color-mix(in srgb, var(--gold) 16%, transparent)" : "var(--charcoal)",
            border: `1.5px solid ${mode === o.v ? "var(--gold)" : "var(--border)"}`,
            color: mode === o.v ? "var(--gold)" : "var(--ivory-muted)",
          }}
        >
          <span style={{ marginRight: "0.4rem", display: "inline-flex", verticalAlign: "middle" }}><o.Icon size={18} strokeWidth={2} fill={mode === o.v && o.v !== "system" ? "currentColor" : "none"} /></span>
          {o.label}
        </button>
      ))}
    </div>
  );
}
