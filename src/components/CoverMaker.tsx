"use client";

import { useEffect, useRef, useState } from "react";

// A tiny in-app cover designer (canvas → JPEG data-URI). Lets creators make a
// real, on-brand cover in seconds instead of shipping a generated placeholder —
// the single biggest "looks legit vs looks like slop" lever. Output plugs into
// the same cover_url fields as an upload (inline data-URI, no external link).

const BGS = [
  ["#3a2740", "#7c4d6e"], // plum
  ["#23414d", "#2f6f79"], // teal
  ["#3a2c1a", "#8a5a2a"], // bronze
  ["#3a1f22", "#8a3a3a"], // wine
  ["#213a2b", "#3f6543"], // forest
  ["#25233f", "#4b3f7c"], // indigo
  ["#20191a", "#14100f"], // obsidian
  ["#2a2118", "#141019"], // ember
];

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines.slice(0, 5);
}

export default function CoverMaker({ onDone, onCancel, initialTitle = "" }: { onDone: (dataUri: string) => void; onCancel?: () => void; initialTitle?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [title, setTitle] = useState(initialTitle);
  const [subtitle, setSubtitle] = useState("");
  const [bg, setBg] = useState(0);
  const [serif, setSerif] = useState(true);
  const [light, setLight] = useState(true);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);

    const [a, b] = BGS[bg] ?? BGS[0]!;
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, a!);
    g.addColorStop(1, b!);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // soft radial glow top-right
    const rg = ctx.createRadialGradient(W * 0.8, H * 0.12, 0, W * 0.8, H * 0.12, W * 0.9);
    rg.addColorStop(0, "rgba(255,255,255,0.18)");
    rg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);

    // frame
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 3;
    ctx.strokeRect(24, 24, W - 48, H - 48);

    const ink = light ? "#FAF7F2" : "#1a1410";
    const dim = light ? "rgba(250,247,242,0.72)" : "rgba(26,20,16,0.72)";

    // top eyebrow
    ctx.fillStyle = dim;
    ctx.font = `600 ${Math.round(W * 0.045)}px 'Plus Jakarta Sans', sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("L I B R Y", W / 2, H * 0.13);

    // title (wrapped)
    ctx.fillStyle = ink;
    const fam = serif ? "'Fraunces', Georgia, serif" : "'Plus Jakarta Sans', sans-serif";
    const size = Math.round(W * (title.length > 22 ? 0.12 : 0.155));
    ctx.font = `${serif ? "600 italic" : "800"} ${size}px ${fam}`;
    const lines = wrap(ctx, title || "Your Title", W * 0.78);
    const lh = size * 1.12;
    let y = H / 2 - ((lines.length - 1) * lh) / 2;
    for (const ln of lines) { ctx.fillText(ln, W / 2, y); y += lh; }

    if (subtitle) {
      ctx.fillStyle = dim;
      ctx.font = `500 ${Math.round(W * 0.05)}px ${fam}`;
      ctx.fillText(subtitle, W / 2, Math.min(H * 0.86, y + size * 0.5));
    }
  }, [title, subtitle, bg, serif, light]);

  const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "var(--charcoal)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--ivory)", fontFamily: "var(--sans)", fontSize: "0.9rem", padding: "0.55rem 0.8rem", outline: "none" };

  return (
    <div style={{ display: "flex", gap: "1.2rem", flexWrap: "wrap", alignItems: "flex-start" }}>
      <canvas ref={ref} width={600} height={900} style={{ width: 150, height: 225, borderRadius: 10, border: "1px solid var(--border)", flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 220, display: "grid", gap: "0.6rem" }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Cover title" style={field} maxLength={60} />
        <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Subtitle (optional)" style={field} maxLength={40} />
        <div>
          <div style={{ fontFamily: "var(--sans)", fontSize: "0.74rem", color: "var(--muted)", marginBottom: "0.35rem" }}>Background</div>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {BGS.map((pair, i) => (
              <button key={i} type="button" onClick={() => setBg(i)} aria-label={`Background ${i + 1}`} style={{ width: 30, height: 30, borderRadius: 8, cursor: "pointer", border: bg === i ? "2px solid var(--gold)" : "1px solid var(--border)", background: `linear-gradient(135deg, ${pair[0]}, ${pair[1]})` }} />
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button type="button" onClick={() => setSerif((v) => !v)} className="btn btn-outline" style={{ padding: "0.35rem 0.8rem", fontSize: "0.82rem" }}>{serif ? "Serif" : "Sans"} font</button>
          <button type="button" onClick={() => setLight((v) => !v)} className="btn btn-outline" style={{ padding: "0.35rem 0.8rem", fontSize: "0.82rem" }}>{light ? "Light" : "Dark"} text</button>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.2rem" }}>
          <button type="button" className="btn btn-gold" style={{ padding: "0.5rem 1.1rem" }} onClick={() => { const c = ref.current; if (c) onDone(c.toDataURL("image/jpeg", 0.85)); }}>Use this cover</button>
          {onCancel ? <button type="button" className="btn btn-outline" style={{ padding: "0.5rem 1rem" }} onClick={onCancel}>Cancel</button> : null}
        </div>
      </div>
    </div>
  );
}
