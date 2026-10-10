"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";

// Settings → Interface style + icon weight. Saved on this device, applied to
// <html data-ui / data-icons> right away and before paint on later visits
// (see the boot script in layout.tsx). Styles live in globals.css.
const STYLES = [
  { key: "classic", name: "Classic", blurb: "Solid, calm panels" },
  { key: "glass", name: "Glass", blurb: "Frosted and see-through" },
  { key: "soft", name: "Soft", blurb: "Raised, pillowy surfaces" },
  { key: "outline", name: "Outline", blurb: "Flat, just lines" },
  { key: "pop", name: "Pop", blurb: "Bold borders, comic energy" },
] as const;
const ICONS = [
  { key: "thin", name: "Thin", w: 1.2 },
  { key: "line", name: "Regular", w: 1.75 },
  { key: "bold", name: "Bold", w: 2.4 },
] as const;

function Preview({ k }: { k: string }) {
  // Hand-drawn mini mock of each style (independent of the live page style).
  const base: React.CSSProperties = { height: 64, borderRadius: 12, position: "relative", overflow: "hidden", marginBottom: "0.6rem" };
  const panel: Record<string, React.CSSProperties> = {
    classic: { background: "var(--stone-light)", border: "1px solid var(--border)" },
    glass: { background: "linear-gradient(135deg, color-mix(in srgb, var(--gold) 45%, transparent), color-mix(in srgb, #9D4EDD 40%, transparent))" },
    soft: { background: "var(--charcoal)", boxShadow: "inset 0 0 0 1px transparent" },
    outline: { background: "transparent", border: "1.5px solid color-mix(in srgb, var(--ivory) 30%, transparent)" },
    pop: { background: "var(--charcoal)" },
  };
  const card: Record<string, React.CSSProperties> = {
    classic: { background: "var(--stone)", border: "1px solid var(--border)" },
    glass: { background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.28)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" },
    soft: { background: "var(--charcoal)", boxShadow: "4px 4px 9px var(--soft-lo), -3px -3px 8px var(--soft-hi)" },
    outline: { background: "transparent", border: "1.5px solid color-mix(in srgb, var(--ivory) 35%, transparent)" },
    pop: { background: "var(--stone)", border: "2px solid var(--ivory)", boxShadow: "3px 3px 0 var(--gold)" },
  };
  return (
    <span style={{ ...base, ...panel[k], display: "block" }}>
      <span style={{ position: "absolute", left: 10, top: 10, right: 34, bottom: 10, borderRadius: 9, ...card[k] }} />
      <span style={{ position: "absolute", right: 8, bottom: 10, width: 20, height: 20, borderRadius: k === "pop" ? 6 : 999, background: "var(--gold)", border: k === "pop" ? "2px solid var(--ivory)" : undefined }} />
    </span>
  );
}

export default function InterfaceStylePicker() {
  const [ui, setUi] = useState("classic");
  const [icons, setIcons] = useState("line");

  useEffect(() => {
    try {
      setUi(localStorage.getItem("leep-ui") || "classic");
      setIcons(localStorage.getItem("leep-icons") || "line");
    } catch { /* storage blocked */ }
  }, []);

  function pickUi(k: string) {
    setUi(k);
    try { localStorage.setItem("leep-ui", k); } catch { /* ignore */ }
    const r = document.documentElement;
    // A quick cross-fade so the switch feels deliberate, not jarring.
    r.classList.add("ui-switching");
    if (k === "classic") r.removeAttribute("data-ui"); else r.setAttribute("data-ui", k);
    window.setTimeout(() => r.classList.remove("ui-switching"), 380);
  }
  function pickIcons(k: string) {
    setIcons(k);
    try { localStorage.setItem("leep-icons", k); } catch { /* ignore */ }
    const r = document.documentElement;
    if (k === "line") r.removeAttribute("data-icons"); else r.setAttribute("data-icons", k);
  }

  return (
    <div style={{ display: "grid", gap: "1.1rem" }}>
      <div role="radiogroup" aria-label="Interface style" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.8rem" }}>
        {STYLES.map((s) => {
          const on = ui === s.key;
          return (
            <button key={s.key} type="button" role="radio" aria-checked={on} onClick={() => pickUi(s.key)}
              style={{ textAlign: "left", background: "transparent", border: `2px solid ${on ? "var(--gold)" : "var(--border)"}`, borderRadius: 14, padding: "0.7rem", cursor: "pointer", color: "var(--ivory)" }}>
              <Preview k={s.key} />
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--sans)", fontWeight: 700, fontSize: "0.9rem" }}>
                {s.name} {on ? <Icon name="check" size={16} /> : null}
              </span>
              <span style={{ fontFamily: "var(--sans)", fontSize: "0.75rem", color: "var(--muted)" }}>{s.blurb}</span>
            </button>
          );
        })}
      </div>
      {ui === "glass" ? <p style={{ margin: 0, fontFamily: "var(--sans)", fontSize: "0.8rem", color: "var(--muted)" }}>Glass uses a bit more battery on older phones.</p> : null}
      <div>
        <p style={{ margin: "0 0 0.5rem", fontFamily: "var(--sans)", fontWeight: 700, fontSize: "0.9rem" }}>Icon weight</p>
        <div role="radiogroup" aria-label="Icon weight" style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          {ICONS.map((i) => {
            const on = icons === i.key;
            return (
              <button key={i.key} type="button" role="radio" aria-checked={on} onClick={() => pickIcons(i.key)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.55rem 0.9rem", borderRadius: 999, border: `2px solid ${on ? "var(--gold)" : "var(--border)"}`, background: "transparent", color: "var(--ivory)", fontFamily: "var(--sans)", cursor: "pointer" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={i.w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3zM21 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7z" />
                </svg>
                {i.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
