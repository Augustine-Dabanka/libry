"use client";

import { useEffect, useState } from "react";
import { getVolume, play, setVolume } from "@/lib/sound";

// One control: mute, minus, a level you can drag, plus. Steps of 10%.
export default function VolumeControl({
  label = "Interface sounds",
  value,
  onChange,
  preview = "press",
}: {
  label?: string;
  value?: number;
  onChange?: (v: number) => void;
  preview?: "press" | "none";
}) {
  const controlled = typeof value === "number";
  const [own, setOwn] = useState(0.4);
  const [last, setLast] = useState(0.4);
  const vol = controlled ? value! : own;

  useEffect(() => {
    if (controlled) return;
    setOwn(getVolume());
    const on = () => setOwn(getVolume());
    window.addEventListener("leep:sound", on);
    return () => window.removeEventListener("leep:sound", on);
  }, [controlled]);

  function set(v: number) {
    const n = Math.max(0, Math.min(1, Math.round(v * 10) / 10));
    if (n > 0) setLast(n);
    if (controlled) onChange?.(n);
    else { setVolume(n); setOwn(n); if (preview === "press") play("press"); }
  }

  const pct = Math.round(vol * 100);
  const btn: React.CSSProperties = {
    width: 40, height: 40, borderRadius: 12, border: "2px solid var(--edge)", background: "var(--stone)", color: "var(--ivory)",
    display: "grid", placeItems: "center", cursor: "pointer", fontWeight: 900, fontSize: "1.2rem", boxShadow: "0 3px 0 var(--edge)", flexShrink: 0,
  };

  return (
    <div role="group" aria-label={label} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.45rem", borderRadius: 18, border: "2px solid var(--border)", background: "var(--charcoal)", maxWidth: 420 }}>
      <button type="button" data-sound="off" aria-label={vol > 0 ? "Mute" : "Unmute"} aria-pressed={vol === 0} onClick={() => set(vol > 0 ? 0 : last || 0.4)} style={{ ...btn, color: vol > 0 ? "var(--gold)" : "var(--muted)" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" fillOpacity="0.2" />
          {vol === 0 ? <path d="m16 9 5 6m0-6-5 6" /> : <><path d="M15.5 8.5a5 5 0 0 1 0 7" />{vol > 0.5 ? <path d="M18.5 5.5a9 9 0 0 1 0 13" /> : null}</>}
        </svg>
      </button>
      <button type="button" data-sound="off" aria-label="Quieter" onClick={() => set(vol - 0.1)} disabled={vol <= 0} style={btn}>−</button>
      <input type="range" min={0} max={100} step={10} value={pct} aria-label={`${label} volume`} aria-valuetext={`${pct}%`} onChange={(e) => set(Number(e.target.value) / 100)}
        style={{ flex: 1, minWidth: 60, accentColor: "var(--gold)", height: 28 }} />
      <button type="button" data-sound="off" aria-label="Louder" onClick={() => set(vol + 0.1)} disabled={vol >= 1} style={btn}>+</button>
      <span aria-hidden="true" style={{ width: 42, textAlign: "right", fontWeight: 900, fontSize: "0.85rem", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
    </div>
  );
}
