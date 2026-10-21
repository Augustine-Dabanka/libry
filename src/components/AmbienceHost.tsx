"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { customBackground, getAmbience, level, SCENES, start, stop, subscribe, wasPlaying, type AmbState, type Scene } from "@/lib/ambience";

// Lives in the root layout so ambience keeps playing as you move between pages.
// Draws a scene behind the app that moves with the sound (rain gets heavier
// as it gets louder, the fire glows with each crackle), or the reader's own
// picture / video. A small pill lets them pause it from anywhere. The scene is
// hidden in the reader (sound keeps playing) so it never competes with text.
export default function AmbienceHost() {
  const [s, setS] = useState<AmbState>(() => getAmbience());
  const [resume, setResume] = useState(false);
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const path = usePathname() || "";
  const inReader = path.startsWith("/reader");

  useEffect(() => {
    setS(getAmbience());
    if (wasPlaying()) setResume(true); // browsers need a tap before audio can start again
    return subscribe((n) => { setS({ ...n }); if (n.playing) setResume(false); });
  }, []);

  useEffect(() => {
    let url: string | null = null;
    if (s.scene === "custom" || s.customBgName) {
      customBackground().then((b) => { if (b) { url = URL.createObjectURL(b); setBgUrl(url); } else setBgUrl(null); });
    } else setBgUrl(null);
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [s.customBgName, s.scene]);

  const showScene = s.playing && s.backdrop && !inReader && !!s.scene;
  useEffect(() => {
    const r = document.documentElement;
    if (showScene) r.classList.add("has-amb"); else r.classList.remove("has-amb");
    return () => r.classList.remove("has-amb");
  }, [showScene]);

  const name = SCENES.find((x) => x.key === s.scene)?.name;

  return (
    <>
      {showScene ? (
        <div className="amb-layer" aria-hidden="true">
          {bgUrl && s.customBgType === "video" ? (
            <video src={bgUrl} autoPlay muted loop playsInline className="amb-media" />
          ) : bgUrl && s.customBgType === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bgUrl} alt="" className="amb-media" />
          ) : (
            <SceneCanvas scene={s.scene!} />
          )}
          <div className="amb-scrim" />
        </div>
      ) : null}

      {s.playing || resume ? (
        <div className="amb-pill" role="region" aria-label="Background sound">
          <span className={`amb-eq${s.playing ? " on" : ""}`} aria-hidden="true"><i /><i /><i /></span>
          <span className="amb-name">{resume && !s.playing ? `Resume ${name?.toLowerCase() ?? "ambience"}?` : name}</span>
          {s.playing ? (
            <button type="button" onClick={() => stop()} aria-label="Pause background sound">Pause</button>
          ) : (
            <>
              <button type="button" onClick={() => s.scene && start(s.scene)}>Play</button>
              <button type="button" aria-label="Dismiss" onClick={() => { setResume(false); stop(); }}>×</button>
            </>
          )}
        </div>
      ) : null}
    </>
  );
}

type P = { x: number; y: number; v: number; s: number; a: number };

export function SceneCanvas({ scene, mini = false }: { scene: Scene; mini?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const g = cv.getContext("2d");
    if (!g) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, raf = 0, t = 0, lv = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const fit = () => { const r = cv.getBoundingClientRect(); w = r.width; h = r.height; cv.width = w * dpr; cv.height = h * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(cv);
    const N = mini ? 40 : 140;
    const ps: P[] = Array.from({ length: N }, () => ({ x: Math.random(), y: Math.random(), v: 0.3 + Math.random(), s: Math.random(), a: Math.random() * Math.PI * 2 }));

    const draw = () => {
      t += 1 / 60;
      const live = level();
      lv += ((mini ? 0.35 + 0.25 * Math.sin(t * 1.3) : live) - lv) * 0.08; // smooth loudness
      const k = 0.4 + lv * 1.6;
      g.clearRect(0, 0, w, h);
      if (scene === "rain") {
        const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, "#2B3A4A"); bg.addColorStop(1, "#1A2430");
        g.fillStyle = bg; g.fillRect(0, 0, w, h);
        g.strokeStyle = "rgba(200,220,240,0.55)"; g.lineWidth = 1.2;
        ps.forEach((p, i) => {
          if (i > N * (0.35 + lv * 0.65)) return;
          p.y += (0.012 + p.v * 0.012) * k; p.x -= 0.0012 * k;
          if (p.y > 1) { p.y = -0.05; p.x = Math.random() * 1.1; }
          const x = p.x * w, y = p.y * h, len = 10 + p.v * 14;
          g.beginPath(); g.moveTo(x, y); g.lineTo(x - len * 0.18, y + len); g.stroke();
        });
      } else if (scene === "fire") {
        g.fillStyle = "#1C120D"; g.fillRect(0, 0, w, h);
        const glow = g.createRadialGradient(w / 2, h * 1.05, 10, w / 2, h * 1.05, Math.max(w, h) * (0.55 + lv * 0.35));
        glow.addColorStop(0, `rgba(255,150,60,${0.55 + lv * 0.4})`); glow.addColorStop(0.5, "rgba(200,71,31,0.35)"); glow.addColorStop(1, "rgba(28,18,13,0)");
        g.fillStyle = glow; g.fillRect(0, 0, w, h);
        ps.forEach((p, i) => {
          if (i % 2) return;
          p.y -= 0.004 * p.v * k; p.x += Math.sin(t * 2 + p.a) * 0.0008;
          if (p.y < 0.2) { p.y = 1 + Math.random() * 0.1; p.x = 0.3 + Math.random() * 0.4; }
          g.fillStyle = `rgba(255,${150 + p.s * 80},70,${(p.y - 0.2) * 0.9})`;
          g.beginPath(); g.arc(p.x * w, p.y * h, 1 + p.s * 2, 0, Math.PI * 2); g.fill();
        });
      } else if (scene === "forest") {
        const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, "#DCEBDD"); bg.addColorStop(1, "#7FA88A");
        g.fillStyle = bg; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 7; i++) { // tree trunks, far to near
          const x = ((i * 0.17 + 0.05) % 1) * w, tw = 8 + i * 4;
          g.fillStyle = `rgba(40,70,50,${0.15 + i * 0.06})`; g.fillRect(x, 0, tw, h);
        }
        ps.forEach((p, i) => {
          if (i > N * 0.4) return;
          p.y += 0.0018 * p.v * k; p.x += Math.sin(t + p.a) * 0.0012 * k; p.a += 0.02;
          if (p.y > 1.05) { p.y = -0.05; p.x = Math.random(); }
          g.save(); g.translate(p.x * w, p.y * h); g.rotate(p.a);
          g.fillStyle = p.s > 0.5 ? "rgba(200,71,31,0.7)" : "rgba(226,176,74,0.75)";
          g.beginPath(); g.ellipse(0, 0, 6, 3, 0, 0, Math.PI * 2); g.fill(); g.restore();
        });
        if (lv > 0.45) { // a bird crosses when it sings
          const bx = ((t * 0.12) % 1.3 - 0.15) * w, by = h * 0.22 + Math.sin(t * 3) * 6, f = Math.sin(t * 18) * 6;
          g.strokeStyle = "rgba(30,40,35,0.7)"; g.lineWidth = 2; g.beginPath(); g.moveTo(bx - 10, by - f); g.quadraticCurveTo(bx - 4, by - 4, bx, by); g.quadraticCurveTo(bx + 4, by - 4, bx + 10, by - f); g.stroke();
        }
      } else if (scene === "waves") {
        const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, "#FBE7D6"); bg.addColorStop(0.55, "#9CC7D6"); bg.addColorStop(1, "#2F6F8A");
        g.fillStyle = bg; g.fillRect(0, 0, w, h);
        for (let L = 0; L < 4; L++) {
          const base = h * (0.55 + L * 0.11), amp = (6 + L * 4) * (0.6 + lv * 1.6);
          g.fillStyle = `rgba(${30 + L * 10},${100 + L * 15},${140 + L * 10},${0.35 + L * 0.15})`;
          g.beginPath(); g.moveTo(0, h);
          for (let x = 0; x <= w; x += 8) g.lineTo(x, base + Math.sin(x * 0.012 + t * (0.6 + L * 0.25) + L) * amp);
          g.lineTo(w, h); g.closePath(); g.fill();
        }
      } else if (scene === "wind") {
        const bg = g.createLinearGradient(0, 0, w, h); bg.addColorStop(0, "#E9ECFB"); bg.addColorStop(1, "#B8C1DE");
        g.fillStyle = bg; g.fillRect(0, 0, w, h);
        g.strokeStyle = "rgba(255,255,255,0.75)"; g.lineWidth = 2; g.lineCap = "round";
        ps.forEach((p, i) => {
          if (i > N * 0.3) return;
          p.x += 0.006 * p.v * k; if (p.x > 1.2) { p.x = -0.3; p.y = Math.random(); }
          const x = p.x * w, y = p.y * h + Math.sin(t * 2 + p.a) * 10, len = 40 + p.s * 80;
          g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + len / 2, y - 8, x + len, y); g.stroke();
        });
      } else {
        const bg = g.createLinearGradient(0, 0, w, h); bg.addColorStop(0, "#FDEDE5"); bg.addColorStop(1, "#E9ECFB");
        g.fillStyle = bg; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 3; i++) {
          const r = Math.max(w, h) * (0.18 + lv * 0.12);
          const x = w * (0.3 + 0.4 * Math.sin(t * 0.2 + i * 2)), y = h * (0.4 + 0.3 * Math.cos(t * 0.17 + i));
          const rg = g.createRadialGradient(x, y, 0, x, y, r);
          rg.addColorStop(0, ["rgba(200,71,31,0.35)", "rgba(52,70,212,0.25)", "rgba(30,127,92,0.25)"][i]!); rg.addColorStop(1, "rgba(255,255,255,0)");
          g.fillStyle = rg; g.fillRect(0, 0, w, h);
        }
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [scene, mini]);
  return <canvas ref={ref} className="amb-canvas" />;
}
