"use client";

import { audio } from "@/lib/sound";

// Background ambience for reading. The built-in scenes are generated live with
// Web Audio (noise shaped by filters, random crackles and synthetic birdsong),
// so they never loop audibly, weigh nothing and need no licence. Readers can
// also pick a sound file of their own; it is kept on this device only
// (IndexedDB), never uploaded.

export type Scene = "rain" | "fire" | "forest" | "waves" | "wind" | "custom";
export const SCENES: { key: Scene; name: string; blurb: string }[] = [
  { key: "rain", name: "Rain on the window", blurb: "Steady, soft rain" },
  { key: "fire", name: "Fireplace", blurb: "Crackling logs" },
  { key: "forest", name: "Forest walk", blurb: "Breeze and birdsong" },
  { key: "waves", name: "Ocean waves", blurb: "Slow rolling surf" },
  { key: "wind", name: "Whistling wind", blurb: "Wind round the house" },
  { key: "custom", name: "My own sound", blurb: "A file from your device" },
];

export type AmbState = { scene: Scene | null; playing: boolean; volume: number; backdrop: boolean; customName: string | null; customBgName: string | null; customBgType: "image" | "video" | null };
const LS = "leep-ambience";
const listeners = new Set<(s: AmbState) => void>();
let state: AmbState = { scene: null, playing: false, volume: 0.5, backdrop: true, customName: null, customBgName: null, customBgType: null };
let loaded = false;

let bus: GainNode | null = null;
let analyser: AnalyserNode | null = null;
let stopFns: (() => void)[] = [];
let timers: number[] = [];
let mediaEl: HTMLAudioElement | null = null;
let mediaUrl: string | null = null;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(LS);
    if (raw) {
      const o = JSON.parse(raw);
      state = { ...state, ...o, playing: false };
    }
  } catch { /* ignore */ }
}
function save() {
  try {
    const { playing: _p, ...rest } = state; // eslint-disable-line @typescript-eslint/no-unused-vars
    localStorage.setItem(LS, JSON.stringify({ ...rest, wasPlaying: state.playing }));
  } catch { /* ignore */ }
}
function emit() { save(); listeners.forEach((f) => f(state)); }

export function getAmbience(): AmbState { load(); return state; }
export function wasPlaying(): boolean {
  try { return JSON.parse(localStorage.getItem(LS) || "{}").wasPlaying === true; } catch { return false; }
}
export function subscribe(f: (s: AmbState) => void) { load(); listeners.add(f); return () => { listeners.delete(f); }; }

// 0..1 loudness right now, for animations that move with the sound.
const buf = new Uint8Array(256);
export function level(): number {
  if (!analyser || !state.playing) return 0;
  analyser.getByteTimeDomainData(buf);
  let sum = 0;
  for (let i = 0; i < buf.length; i++) { const v = (buf[i]! - 128) / 128; sum += v * v; }
  return Math.min(1, Math.sqrt(sum / buf.length) * 4);
}

function noiseBuffer(c: AudioContext, kind: "white" | "pink" | "brown", seconds = 4) {
  const len = Math.floor(c.sampleRate * seconds);
  const b = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    let last = 0, b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === "white") d[i] = w;
      else if (kind === "brown") { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else { b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.11; }
    }
  }
  return b;
}
function loop(c: AudioContext, b: AudioBuffer) {
  const s = c.createBufferSource();
  s.buffer = b;
  s.loop = true;
  s.loopStart = Math.random() * 0.5;
  s.start(0, Math.random() * b.duration);
  stopFns.push(() => { try { s.stop(); } catch { /* ignore */ } });
  return s;
}
function filt(c: AudioContext, type: BiquadFilterType, f: number, q = 0.7) {
  const n = c.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q; return n;
}
function gain(c: AudioContext, v: number) { const g = c.createGain(); g.gain.value = v; return g; }
function lfo(c: AudioContext, target: AudioParam, rate: number, depth: number) {
  const o = c.createOscillator(); o.frequency.value = rate;
  const g = gain(c, depth);
  o.connect(g).connect(target); o.start();
  stopFns.push(() => { try { o.stop(); } catch { /* ignore */ } });
}
function every(minMs: number, maxMs: number, fn: () => void) {
  const tick = () => { fn(); timers.push(window.setTimeout(tick, minMs + Math.random() * (maxMs - minMs))); };
  timers.push(window.setTimeout(tick, Math.random() * maxMs));
}

function buildScene(c: AudioContext, out: AudioNode, scene: Exclude<Scene, "custom">) {
  if (scene === "rain") {
    const n = loop(c, noiseBuffer(c, "pink"));
    n.connect(filt(c, "highpass", 400)).connect(filt(c, "lowpass", 6500)).connect(gain(c, 0.9)).connect(out);
    every(30, 160, () => { // individual drops on the glass
      const t = c.currentTime, o = c.createOscillator(), g = gain(c, 0);
      o.frequency.setValueAtTime(1800 + Math.random() * 2400, t);
      o.frequency.exponentialRampToValueAtTime(600, t + 0.03);
      g.gain.setValueAtTime(0.03 + Math.random() * 0.04, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
      o.connect(g).connect(out); o.start(t); o.stop(t + 0.05);
    });
  } else if (scene === "fire") {
    const n = loop(c, noiseBuffer(c, "brown"));
    const g = gain(c, 0.9);
    n.connect(filt(c, "lowpass", 500)).connect(g).connect(out);
    lfo(c, g.gain, 0.3, 0.25);
    every(40, 420, () => { // crackles and pops
      const t = c.currentTime, len = Math.floor(c.sampleRate * (0.004 + Math.random() * 0.02));
      const b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
      const s = c.createBufferSource(); s.buffer = b;
      const hp = filt(c, "bandpass", 1500 + Math.random() * 3000, 1.2);
      s.connect(hp).connect(gain(c, 0.25 + Math.random() * 0.6)).connect(out); s.start(t);
    });
  } else if (scene === "forest") {
    const n = loop(c, noiseBuffer(c, "pink"));
    const g = gain(c, 0.35);
    n.connect(filt(c, "bandpass", 700, 0.4)).connect(g).connect(out);
    lfo(c, g.gain, 0.08, 0.18);
    every(1400, 5200, () => { // a bird: a few quick falling chirps
      const base = 2400 + Math.random() * 2200, notes = 2 + Math.floor(Math.random() * 4);
      for (let k = 0; k < notes; k++) {
        const t = c.currentTime + k * (0.09 + Math.random() * 0.05), o = c.createOscillator(), og = gain(c, 0);
        o.frequency.setValueAtTime(base * (1 + Math.random() * 0.15), t);
        o.frequency.exponentialRampToValueAtTime(base * 0.7, t + 0.07);
        og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.05, t + 0.01); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
        const pan = c.createStereoPanner(); pan.pan.value = Math.random() * 1.6 - 0.8;
        o.connect(og).connect(pan).connect(out); o.start(t); o.stop(t + 0.1);
      }
    });
  } else if (scene === "waves") {
    const n = loop(c, noiseBuffer(c, "pink"));
    const lp = filt(c, "lowpass", 900);
    const g = gain(c, 0.5);
    n.connect(lp).connect(g).connect(out);
    lfo(c, g.gain, 0.11, 0.45);
    lfo(c, lp.frequency, 0.11, 500);
  } else if (scene === "wind") {
    const n = loop(c, noiseBuffer(c, "white"));
    const bp = filt(c, "bandpass", 800, 9);
    const g = gain(c, 0.7);
    n.connect(bp).connect(g).connect(out);
    lfo(c, bp.frequency, 0.07, 450);
    lfo(c, g.gain, 0.13, 0.35);
    const low = loop(c, noiseBuffer(c, "brown"));
    low.connect(filt(c, "lowpass", 300)).connect(gain(c, 0.5)).connect(out);
  }
}

function teardown() {
  stopFns.forEach((f) => f()); stopFns = [];
  timers.forEach((t) => clearTimeout(t)); timers = [];
  if (mediaEl) { mediaEl.pause(); mediaEl.src = ""; mediaEl = null; }
  if (mediaUrl) { URL.revokeObjectURL(mediaUrl); mediaUrl = null; }
  if (bus) { try { bus.disconnect(); } catch { /* ignore */ } bus = null; }
}

export async function start(scene: Scene) {
  load();
  const a = audio();
  if (!a) return;
  teardown();
  const { ctx: c } = a;
  bus = gain(c, state.volume);
  analyser = c.createAnalyser();
  analyser.fftSize = 256;
  bus.connect(analyser);
  bus.connect(c.destination); // its own volume, separate from interface sounds
  if (scene === "custom") {
    const f = await idbGet("sound");
    if (!f) { state = { ...state, scene, playing: false }; emit(); return; }
    mediaUrl = URL.createObjectURL(f);
    mediaEl = new Audio(mediaUrl);
    mediaEl.loop = true;
    c.createMediaElementSource(mediaEl).connect(bus);
    await mediaEl.play().catch(() => {});
  } else {
    buildScene(c, bus, scene);
  }
  state = { ...state, scene, playing: true };
  emit();
}
export function stop() { teardown(); state = { ...state, playing: false }; emit(); }
export function setAmbVolume(v: number) {
  state = { ...state, volume: Math.max(0, Math.min(1, v)) };
  if (bus) bus.gain.value = state.volume;
  emit();
}
export function setBackdrop(on: boolean) { state = { ...state, backdrop: on }; emit(); }

export async function setCustomSound(file: File) {
  await idbPut("sound", file);
  state = { ...state, customName: file.name };
  emit();
  await start("custom");
}
export async function setCustomBackground(file: File | null) {
  if (!file) { await idbDel("bg"); state = { ...state, customBgName: null, customBgType: null }; emit(); return; }
  await idbPut("bg", file);
  state = { ...state, customBgName: file.name, customBgType: file.type.startsWith("video/") ? "video" : "image" };
  emit();
}
export function customBackground(): Promise<Blob | null> { return idbGet("bg"); }

// ---- tiny IndexedDB key/value store (files stay on this device) ----
function db(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open("leep-ambience", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("files");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function idbPut(k: string, v: Blob) {
  const d = await db();
  await new Promise<void>((res, rej) => { const t = d.transaction("files", "readwrite"); t.objectStore("files").put(v, k); t.oncomplete = () => res(); t.onerror = () => rej(t.error); });
}
async function idbGet(k: string): Promise<Blob | null> {
  try {
    const d = await db();
    return await new Promise((res) => { const r = d.transaction("files").objectStore("files").get(k); r.onsuccess = () => res((r.result as Blob) ?? null); r.onerror = () => res(null); });
  } catch { return null; }
}
async function idbDel(k: string) {
  try { const d = await db(); d.transaction("files", "readwrite").objectStore("files").delete(k); } catch { /* ignore */ }
}
