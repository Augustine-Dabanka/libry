"use client";

import { useEffect, useState } from "react";

type Mode = "dark" | "light" | "system";

function apply(mode: Mode) {
  const theme = mode === "system"
    ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
    : mode;
  document.documentElement.setAttribute("data-theme", theme);
}

// Appearance: Dark / Light / System, persisted in localStorage and applied live.
export default function AppearanceMode() {
  const [mode, setMode] = useState<Mode>("system");

  useEffect(() => {
    try {
      setMode((localStorage.getItem("libry-theme") as Mode) || "system");
    } catch {}
  }, []);

  function pick(m: Mode) {
    setMode(m);
    try {
      localStorage.setItem("libry-theme", m);
    } catch {}
    apply(m);
  }

  const opts: { v: Mode; label: string; icon: string }[] = [
    { v: "dark", label: "Dark", icon: "🌙" },
    { v: "light", label: "Light", icon: "☀️" },
    { v: "system", label: "System", icon: "🖥️" },
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
            background: mode === o.v ? "rgba(196,163,90,0.16)" : "var(--charcoal)",
            border: `1.5px solid ${mode === o.v ? "var(--gold)" : "var(--border)"}`,
            color: mode === o.v ? "var(--gold)" : "var(--ivory-muted)",
          }}
        >
          <span style={{ marginRight: "0.4rem" }}>{o.icon}</span>
          {o.label}
        </button>
      ))}
    </div>
  );
}
