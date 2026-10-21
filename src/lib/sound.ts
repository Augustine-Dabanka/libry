"use client";

// Lybry's interface sounds. Every sound is synthesised with Web Audio (no audio
// files to download, nothing to license) and kept short and soft. The browser
// only allows audio after the first tap, which is exactly when these play.
//
// Volume lives on this device: localStorage "leep-sound" = "0".."1" (default
// 0.4). 0 = muted. Changing it fires "leep:sound" so open pages update.

export type Sfx = "tap" | "press" | "focus" | "toggle" | "success" | "error" | "swoosh" | "pop";

const KEY = "leep-sound";
const DEFAULT_VOL = 0.4;
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let cachedVol: number | null = null;
let lastAt = 0;

export function getVolume(): number {
  if (cachedVol !== null) return cachedVol;
  try {
    const v = localStorage.getItem(KEY);
    cachedVol = v === null ? DEFAULT_VOL : Math.max(0, Math.min(1, Number(v) || 0));
  } catch {
    cachedVol = DEFAULT_VOL;
  }
  return cachedVol;
}

export function setVolume(v: number) {
  cachedVol = Math.max(0, Math.min(1, Math.round(v * 100) / 100));
  try { localStorage.setItem(KEY, String(cachedVol)); } catch { /* storage blocked */ }
  if (master) master.gain.value = cachedVol * 0.6;
  try { window.dispatchEvent(new CustomEvent("leep:sound", { detail: cachedVol })); } catch { /* ignore */ }
}

export function audio(): { ctx: AudioContext; out: GainNode } | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = getVolume() * 0.6;
      master.connect(ctx.destination);
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return { ctx, out: master! };
}

function tone(c: AudioContext, out: AudioNode, o: { f: number; f2?: number; type?: OscillatorType; t?: number; dur: number; vol: number; attack?: number }) {
  const t0 = c.currentTime + (o.t ?? 0);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(o.f, t0);
  if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t0 + o.dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(o.vol, t0 + (o.attack ?? 0.006));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
  osc.connect(g).connect(out);
  osc.start(t0);
  osc.stop(t0 + o.dur + 0.02);
}

function noiseBurst(c: AudioContext, out: AudioNode, dur: number, vol: number, freq: number) {
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = freq;
  f.Q.value = 0.9;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(out);
  src.start();
}

// Play one interface sound. Rate-limited so a burst of events is one sound.
export function play(s: Sfx) {
  if (getVolume() <= 0) return;
  const now = performance.now();
  if (now - lastAt < 35) return;
  lastAt = now;
  const a = audio();
  if (!a) return;
  const { ctx: c, out } = a;
  switch (s) {
    case "tap": // a soft wooden tick
      tone(c, out, { f: 880, f2: 520, type: "triangle", dur: 0.07, vol: 0.22 });
      break;
    case "press": // chunky button: low thump + bright click
      tone(c, out, { f: 220, f2: 120, type: "sine", dur: 0.09, vol: 0.35 });
      tone(c, out, { f: 1320, f2: 900, type: "triangle", dur: 0.045, vol: 0.12 });
      break;
    case "focus": // a pencil touching paper
      noiseBurst(c, out, 0.05, 0.18, 3200);
      break;
    case "toggle":
      tone(c, out, { f: 600, f2: 900, type: "triangle", dur: 0.08, vol: 0.2 });
      break;
    case "pop":
      tone(c, out, { f: 400, f2: 1100, type: "sine", dur: 0.09, vol: 0.25 });
      break;
    case "swoosh":
      noiseBurst(c, out, 0.22, 0.14, 1400);
      break;
    case "success": // a little three-note rise
      [523.25, 659.25, 783.99].forEach((f, i) => tone(c, out, { f, type: "triangle", t: i * 0.08, dur: 0.22, vol: 0.2 }));
      break;
    case "error":
      tone(c, out, { f: 220, f2: 180, type: "square", dur: 0.12, vol: 0.08 });
      tone(c, out, { f: 196, f2: 150, type: "square", t: 0.1, dur: 0.14, vol: 0.08 });
      break;
  }
}
