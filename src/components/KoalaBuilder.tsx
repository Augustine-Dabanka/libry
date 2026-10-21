"use client";

import { useState } from "react";
import KoalaAvatar, { BGS, FURS, HATS, KINDS, SCARVES, normalizeLook } from "@/components/KoalaAvatar";
import type { KoalaLook } from "@/components/Mascot";

type Look = Required<KoalaLook>;
type Tab = "kind" | "fur" | "scarf" | "hat" | "extras" | "bg";
const TABS: { key: Tab; label: string }[] = [
  { key: "kind", label: "Style" },
  { key: "fur", label: "Fur" },
  { key: "scarf", label: "Scarf" },
  { key: "hat", label: "Hat" },
  { key: "extras", label: "Extras" },
  { key: "bg", label: "Background" },
];

// Build-your-own koala. Every change shows on the koala at once and it cheers,
// so the reader feels it's theirs before the account is even finished.
export default function KoalaBuilder({ value, onChange }: { value: unknown; onChange: (look: Look) => void }) {
  const look = normalizeLook(value);
  const [tab, setTab] = useState<Tab>("kind");
  const [cheer, setCheer] = useState(0);
  function set(patch: Partial<Look>) {
    onChange({ ...look, ...patch });
    setCheer((n) => n + 1);
  }
  function surprise() {
    const r = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)]!;
    onChange({ fur: r(FURS).key, scarf: r(SCARVES).key, hat: r(HATS).key, glasses: Math.random() < 0.4, book: Math.random() < 0.7, bg: r(BGS), kind: look.kind });
    setCheer((n) => n + 1);
  }

  const chip = (on: boolean): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: "0.45rem", padding: "0.55rem 0.8rem", borderRadius: 12, cursor: "pointer",
    fontFamily: "var(--sans)", fontWeight: 800, fontSize: "0.88rem", background: on ? "var(--gold-tint)" : "var(--stone)",
    color: on ? "var(--gold)" : "var(--ivory)", border: `2px solid ${on ? "var(--gold)" : "var(--edge)"}`,
    boxShadow: `0 3px 0 ${on ? "var(--gold)" : "var(--edge)"}`,
  });
  const dot = (c: string): React.CSSProperties => ({ width: 18, height: 18, borderRadius: "50%", background: c, boxShadow: "inset 0 -3px 0 rgba(0,0,0,0.18)" });

  return (
    <div style={{ display: "grid", gap: "1rem", justifyItems: "center" }}>
      <div key={cheer} style={{ animation: cheer ? "kb-pop 0.35s ease" : undefined }}>
        <KoalaAvatar look={look} size={150} mood={cheer ? "cheer" : "wave"} interactive />
      </div>
      <style>{`@keyframes kb-pop{0%{transform:scale(.92)}60%{transform:scale(1.05)}100%{transform:none}}@media (prefers-reduced-motion:reduce){[style*="kb-pop"]{animation:none!important}}`}</style>

      <div role="tablist" aria-label="Customize your bushbaby" style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", justifyContent: "center" }}>
        {TABS.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
            style={{ border: "none", background: "transparent", cursor: "pointer", padding: "0.4rem 0.7rem", borderRadius: 10, fontFamily: "var(--sans)", fontWeight: 900, fontSize: "0.9rem", color: tab === t.key ? "var(--gold)" : "var(--muted)", borderBottom: `3px solid ${tab === t.key ? "var(--gold)" : "transparent"}` }}>
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center", minHeight: 48 }}>
        {tab === "kind" && KINDS.map((k) => (
          <button key={k.key} type="button" aria-pressed={look.kind === k.key} onClick={() => set({ kind: k.key })} style={chip(look.kind === k.key)}>{k.name}</button>
        ))}
        {tab === "fur" && FURS.map((f) => (
          <button key={f.key} type="button" aria-pressed={look.fur === f.key} onClick={() => set({ fur: f.key })} style={chip(look.fur === f.key)}><span style={dot(f.swatch)} />{f.name}</button>
        ))}
        {tab === "scarf" && SCARVES.map((f) => (
          <button key={f.key} type="button" aria-pressed={look.scarf === f.key} onClick={() => set({ scarf: f.key })} style={chip(look.scarf === f.key)}><span style={dot(f.swatch)} />{f.name}</button>
        ))}
        {tab === "hat" && HATS.map((h) => (
          <button key={h.key} type="button" aria-pressed={look.hat === h.key} onClick={() => set({ hat: h.key })} style={chip(look.hat === h.key)}>{h.name}</button>
        ))}
        {tab === "extras" && (
          <>
            <button type="button" aria-pressed={look.glasses} onClick={() => set({ glasses: !look.glasses })} style={chip(look.glasses)}>Reading glasses</button>
            <button type="button" aria-pressed={look.book} onClick={() => set({ book: !look.book })} style={chip(look.book)}>Holding a book</button>
          </>
        )}
        {tab === "bg" && BGS.map((c) => (
          <button key={c} type="button" aria-label={`Background ${c}`} aria-pressed={look.bg === c} onClick={() => set({ bg: c })}
            style={{ ...chip(look.bg === c), padding: "0.35rem" }}><span style={{ ...dot(c), width: 28, height: 28 }} /></button>
        ))}
      </div>

      <button type="button" onClick={surprise} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--gold)", fontFamily: "var(--sans)", fontWeight: 900, fontSize: "0.9rem" }}>
        Surprise me
      </button>
    </div>
  );
}
