"use client";

import { useEffect, useState } from "react";

// Font style + UI layout, picked in the sign-up "Customise" step or in
// Settings → Personalisation. Saved on this device and applied before paint by
// the boot script in layout.tsx (<html data-font / data-ui>).
//
// Font styles change headings and buttons only. Body text and books stay in
// the reading fonts, because a handwriting or retro face is fun in a title and
// tiring across a page.

export const FONT_STYLES = [
  { key: "classic", name: "Classic", sample: "Aa", family: "'Nunito', system-ui, sans-serif" },
  { key: "robot", name: "Robot", sample: "Aa", family: "'Space Grotesk', system-ui, sans-serif" },
  { key: "freehand", name: "Freehand", sample: "Aa", family: "'Patrick Hand', 'Comic Sans MS', cursive" },
  { key: "roman", name: "Roman", sample: "Aa", family: "'Literata', Georgia, serif" },
  { key: "retro", name: "Retro", sample: "Aa", family: "'Righteous', system-ui, sans-serif" },
] as const;
export const LAYOUTS = [
  { key: "classic", name: "Classic" },
  { key: "glass", name: "Glass" },
  { key: "pop", name: "Pop" },
  { key: "outline", name: "Outline" },
] as const;

export function applyFont(k: string) {
  try { localStorage.setItem("leep-font", k); } catch { /* ignore */ }
  const r = document.documentElement;
  if (k === "classic") r.removeAttribute("data-font"); else r.setAttribute("data-font", k);
}
export function applyLayout(k: string) {
  try { localStorage.setItem("leep-ui", k); } catch { /* ignore */ }
  const r = document.documentElement;
  r.classList.add("ui-switching");
  if (k === "classic") r.removeAttribute("data-ui"); else r.setAttribute("data-ui", k);
  window.setTimeout(() => r.classList.remove("ui-switching"), 380);
}

const tile = (on: boolean): React.CSSProperties => ({
  display: "grid", justifyItems: "center", gap: 4, padding: "0.7rem 0.4rem", borderRadius: 14, cursor: "pointer", minWidth: 0,
  background: on ? "var(--gold-tint)" : "var(--stone)", color: on ? "var(--gold)" : "var(--ivory)",
  border: `2px solid ${on ? "var(--gold)" : "var(--edge)"}`, boxShadow: `0 3px 0 ${on ? "var(--gold-shade)" : "var(--edge)"}`,
});

export function FontStylePicker() {
  const [v, setV] = useState("classic");
  useEffect(() => { try { setV(localStorage.getItem("leep-font") || "classic"); } catch { /* ignore */ } }, []);
  return (
    <div role="radiogroup" aria-label="Font style" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(84px, 1fr))", gap: "0.55rem" }}>
      {FONT_STYLES.map((f) => (
        <button key={f.key} type="button" role="radio" aria-checked={v === f.key} onClick={() => { setV(f.key); applyFont(f.key); }} style={tile(v === f.key)}>
          <span aria-hidden="true" style={{ fontFamily: f.family, fontSize: "1.6rem", lineHeight: 1, fontWeight: 700 }}>{f.sample}</span>
          <span style={{ fontFamily: f.family, fontWeight: 700, fontSize: "0.85rem" }}>{f.name}</span>
        </button>
      ))}
    </div>
  );
}

export function LayoutPicker() {
  const [v, setV] = useState("classic");
  useEffect(() => { try { setV(localStorage.getItem("leep-ui") || "classic"); } catch { /* ignore */ } }, []);
  const mini: Record<string, React.CSSProperties> = {
    classic: { background: "var(--stone-light, #F4EDE4)", border: "1px solid var(--border)" },
    glass: { background: "linear-gradient(135deg, color-mix(in srgb, var(--gold) 30%, #fff), rgba(255,255,255,.6))", border: "1px solid rgba(255,255,255,.8)" },
    pop: { background: "#fff", border: "2px solid #1D1A17", boxShadow: "3px 3px 0 var(--gold)" },
    outline: { background: "transparent", border: "1.5px solid var(--muted)" },
  };
  return (
    <div role="radiogroup" aria-label="UI layout" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(84px, 1fr))", gap: "0.55rem" }}>
      {LAYOUTS.map((l) => (
        <button key={l.key} type="button" role="radio" aria-checked={v === l.key} onClick={() => { setV(l.key); applyLayout(l.key); }} style={tile(v === l.key)}>
          <span aria-hidden="true" style={{ width: 46, height: 30, borderRadius: 8, display: "block", ...mini[l.key] }} />
          <span style={{ fontWeight: 800, fontSize: "0.85rem" }}>{l.name}</span>
        </button>
      ))}
    </div>
  );
}
