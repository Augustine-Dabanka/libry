"use client";

import { useEffect, useState } from "react";
import { DEFAULT_SEASONS, LOOKS, seasonFor } from "@/lib/themes";

// Genre looks (full palette in dark mode, accent in light mode) plus the
// switch for automatic seasonal themes. Saved on this device.
export default function LookPicker() {
  const [look, setLook] = useState<string>("");
  const [seasonal, setSeasonal] = useState(true);
  const [manualSeason, setManualSeason] = useState("auto");

  useEffect(() => {
    try {
      setLook(localStorage.getItem("libry-look") || "");
      setSeasonal(localStorage.getItem("libry-seasonal") !== "off");
      setManualSeason(localStorage.getItem("libry-manual-season") || "auto");
    } catch { /* storage blocked */ }
  }, []);

  function pick(key: string) {
    setLook(key);
    try {
      if (key) localStorage.setItem("libry-look", key);
      else localStorage.removeItem("libry-look");
    } catch { /* storage blocked */ }
    const r = document.documentElement;
    if (key) r.setAttribute("data-look", key);
    else r.removeAttribute("data-look");
  }

  function toggleSeasonal() {
    const next = !seasonal;
    setSeasonal(next);
    try { localStorage.setItem("libry-seasonal", next ? "on" : "off"); } catch { /* storage blocked */ }
    // Turning it off removes today's holiday theme right away; turning it on
    // takes effect on the next page load (the boot script checks the date).
    if (!next) {
      document.documentElement.removeAttribute("data-season");
      try { localStorage.setItem("libry-manual-season", "auto"); setManualSeason("auto"); } catch { /* storage blocked */ }
    } else if (manualSeason !== "auto") {
      document.documentElement.setAttribute("data-season", manualSeason);
    } else {
      const active = seasonFor(DEFAULT_SEASONS, new Date());
      if (active) document.documentElement.setAttribute("data-season", active);
    }
  }

  function pickSeason(key: string) {
    setManualSeason(key);
    try { localStorage.setItem("libry-manual-season", key); } catch { /* storage blocked */ }
    if (key === "auto") {
      document.documentElement.removeAttribute("data-season");
      if (seasonal) {
        const active = seasonFor(DEFAULT_SEASONS, new Date());
        if (active) document.documentElement.setAttribute("data-season", active);
      }
      return;
    }
    document.documentElement.setAttribute("data-season", key);
  }

  const options = [{ key: "", name: "None", accent: "var(--border)", blurb: "Use your accent theme" }, ...LOOKS];
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.9rem" }}>
        {options.map((t) => {
          const on = look === t.key;
          return (
            <button
              key={t.key || "none"}
              type="button"
              onClick={() => pick(t.key)}
              aria-pressed={on}
              style={{ textAlign: "left", background: "var(--stone)", border: `2px solid ${on ? "var(--gold)" : "var(--border)"}`, borderRadius: 14, padding: "0.9rem 1rem", cursor: "pointer", color: "var(--ivory)" }}
            >
              <span style={{ display: "block", height: 30, borderRadius: 8, marginBottom: "0.6rem", background: t.accent }} />
              <span style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: "0.9rem", display: "block" }}>{t.name}</span>
              <span style={{ fontFamily: "var(--sans)", fontSize: "0.75rem", color: "var(--muted)" }}>{t.blurb}</span>
            </button>
          );
        })}
      </div>
      <section aria-label="Seasonal theme preview" style={{ display: "grid", gap: "0.55rem" }}>
        <b style={{ fontFamily: "var(--sans)" }}>Seasonal theme preview</b>
        <p style={{ color: "var(--muted)", fontSize: "0.82rem" }}>Choose a theme temporarily, or return to the automatic holiday calendar.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          <button type="button" className="btn btn-outline" aria-pressed={manualSeason === "auto"} onClick={() => pickSeason("auto")}>Automatic</button>
          {DEFAULT_SEASONS.filter((s) => s.key !== "collab").map((s) => <button key={s.key} type="button" className="btn btn-outline" aria-pressed={manualSeason === s.key} onClick={() => pickSeason(s.key)}>{s.name}</button>)}
        </div>
      </section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "0.8rem 1rem", border: "1px solid var(--border)", borderRadius: 14 }}>
        <span id="seasonal-lbl" style={{ fontFamily: "var(--sans)", fontSize: "0.9rem" }}>
          <b>Holiday themes</b>
          <span style={{ display: "block", color: "var(--muted)", fontSize: "0.8rem" }}>Halloween, Christmas and more switch on by date, then off again.</span>
        </span>
        <button type="button" role="switch" aria-checked={seasonal} aria-labelledby="seasonal-lbl" onClick={toggleSeasonal}
          style={{ width: 52, height: 32, borderRadius: 16, border: "none", padding: 3, cursor: "pointer", background: seasonal ? "var(--gold)" : "var(--border)", display: "flex", flexShrink: 0 }}>
          <span style={{ width: 26, height: 26, borderRadius: "50%", background: "#fff", transform: seasonal ? "translateX(20px)" : "none", transition: "transform 180ms cubic-bezier(.3,1.4,.5,1)" }} />
        </button>
      </div>
    </div>
  );
}
