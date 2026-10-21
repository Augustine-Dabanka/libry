"use client";

import { useEffect, useRef, useState } from "react";
import { getAmbience, SCENES, setAmbVolume, setBackdrop, setCustomBackground, setCustomSound, start, stop, subscribe, type AmbState, type Scene } from "@/lib/ambience";
import { SceneCanvas } from "@/components/AmbienceHost";
import VolumeControl from "@/components/VolumeControl";

const MAX_MB = 60;

export default function AmbienceSettings() {
  const [s, setS] = useState<AmbState>(() => getAmbience());
  const [err, setErr] = useState<string | null>(null);
  const soundIn = useRef<HTMLInputElement>(null);
  const bgIn = useRef<HTMLInputElement>(null);
  useEffect(() => { setS(getAmbience()); return subscribe((n) => setS({ ...n })); }, []);

  function pick(k: Scene) {
    setErr(null);
    if (k === "custom" && !s.customName) { soundIn.current?.click(); return; }
    if (s.playing && s.scene === k) stop(); else start(k);
  }
  async function onSound(f: File | undefined) {
    if (!f) return;
    if (!f.type.startsWith("audio/")) return setErr("That isn't an audio file. Try an MP3, M4A, WAV or OGG.");
    if (f.size > MAX_MB * 1048576) return setErr(`Keep sound files under ${MAX_MB} MB.`);
    await setCustomSound(f);
  }
  async function onBg(f: File | undefined) {
    if (!f) return;
    if (!/^(image|video)\//.test(f.type)) return setErr("Pick a photo or a video.");
    if (f.size > MAX_MB * 1048576) return setErr(`Keep backgrounds under ${MAX_MB} MB.`);
    await setCustomBackground(f);
  }

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div role="list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.75rem" }}>
        {SCENES.map((sc) => {
          const on = s.playing && s.scene === sc.key;
          return (
            <button key={sc.key} role="listitem" type="button" aria-pressed={on} onClick={() => pick(sc.key)}
              style={{ textAlign: "left", padding: 0, borderRadius: 16, overflow: "hidden", cursor: "pointer", background: "var(--stone)", border: `2px solid ${on ? "var(--gold)" : "var(--edge)"}`, boxShadow: `0 4px 0 ${on ? "var(--gold-shade)" : "var(--edge)"}`, color: "var(--ivory)" }}>
              <span style={{ display: "block", height: 74, position: "relative" }}>
                <SceneCanvas scene={sc.key} mini />
                {on ? <span className="amb-eq on" style={{ position: "absolute", right: 8, top: 8 }} aria-hidden="true"><i /><i /><i /></span> : null}
              </span>
              <span style={{ display: "block", padding: "0.55rem 0.7rem" }}>
                <strong style={{ display: "block", fontWeight: 900, fontSize: "0.9rem" }}>{sc.name}</strong>
                <span style={{ color: "var(--muted)", fontSize: "0.78rem", fontWeight: 700 }}>
                  {sc.key === "custom" && s.customName ? s.customName : on ? "Playing · tap to stop" : sc.blurb}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <VolumeControl label="Background sound" value={s.volume} onChange={setAmbVolume} />

      <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontWeight: 800, fontSize: "0.9rem", cursor: "pointer" }}>
        <input type="checkbox" checked={s.backdrop} onChange={(e) => setBackdrop(e.target.checked)} style={{ accentColor: "var(--gold)", width: 18, height: 18 }} />
        Show the moving scene behind the app (never inside a book)
      </label>

      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <button type="button" className="btn btn-outline" onClick={() => soundIn.current?.click()}>{s.customName ? "Change my sound" : "Add my own sound"}</button>
        <button type="button" className="btn btn-outline" onClick={() => bgIn.current?.click()}>{s.customBgName ? "Change background" : "Add my own background"}</button>
        {s.customBgName ? <button type="button" className="btn btn-outline" onClick={() => setCustomBackground(null)}>Remove background</button> : null}
      </div>
      <input ref={soundIn} type="file" accept="audio/*" hidden onChange={(e) => onSound(e.target.files?.[0])} />
      <input ref={bgIn} type="file" accept="image/*,video/*" hidden onChange={(e) => onBg(e.target.files?.[0])} />
      {s.customBgName ? <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.82rem", fontWeight: 700 }}>Background: {s.customBgName} (shows while a sound plays)</p> : null}
      {err ? <p role="alert" style={{ margin: 0, color: "var(--danger)", fontWeight: 800, fontSize: "0.86rem" }}>{err}</p> : null}
      <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.8rem", fontWeight: 600 }}>Your own sounds and backgrounds stay on this device. They are never uploaded to Lybry.</p>
    </div>
  );
}
