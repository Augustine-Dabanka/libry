"use client";

import { useRef, useState } from "react";

// Downscale a chosen image to a compact JPEG data URL, preserving aspect ratio
// (max width `maxW`). Stored inline in the DB column — no storage bucket needed,
// same approach as the account avatar.
function downscaleCover(file: File, maxW = 720): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => reject(new Error("bad image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

// A cover picker offering BOTH: upload an image from the device, or paste an
// image URL. Shows a live preview. `aspect` shapes the preview box.
export default function ImagePicker({
  value,
  onChange,
  aspect = "16 / 9",
  label = "Cover image",
  maxW = 720,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  aspect?: string;
  label?: string;
  maxW?: number;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr(null);
    setBusy(true);
    try {
      onChange(await downscaleCover(file, maxW));
    } catch {
      setErr("Couldn't read that image.");
    } finally {
      setBusy(false);
    }
  }

  const tab: (on: boolean) => React.CSSProperties = (on) => ({
    cursor: "pointer", border: "none", background: "transparent", padding: "0.2rem 0.1rem",
    color: on ? "var(--gold)" : "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.8rem",
    fontWeight: 700, borderBottom: `2px solid ${on ? "var(--gold)" : "transparent"}`,
  });

  return (
    <div style={{ marginTop: "0.7rem" }}>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "0.5rem" }}>
        <span style={{ fontFamily: "var(--sans)", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)" }}>{label}</span>
        <div style={{ display: "flex", gap: "0.9rem", marginLeft: "auto" }}>
          <button type="button" onClick={() => setMode("upload")} style={tab(mode === "upload")}>Upload</button>
          <button type="button" onClick={() => setMode("url")} style={tab(mode === "url")}>Paste URL</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.9rem", alignItems: "flex-start" }}>
        <div style={{ position: "relative", flex: "0 0 128px", aspectRatio: aspect, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)", background: "var(--charcoal)", display: "grid", placeItems: "center" }}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ color: "var(--muted)", fontSize: "1.4rem" }}>🖼️</span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {mode === "upload" ? (
            <>
              <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
              <button type="button" className="btn btn-outline" onClick={() => fileRef.current?.click()} disabled={busy} style={{ padding: "0.5rem 1rem" }}>
                {busy ? "Reading…" : value ? "Change image" : "Choose from device"}
              </button>
              <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.74rem", marginTop: "0.5rem" }}>JPG or PNG. It&apos;s resized and stored with your community — no external link.</p>
            </>
          ) : (
            <input
              value={value && /^https?:\/\//.test(value) ? value : ""}
              onChange={(e) => onChange(e.target.value.trim() || null)}
              placeholder="https://…/cover.jpg"
              style={{ width: "100%", boxSizing: "border-box", background: "var(--charcoal)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--ivory)", fontFamily: "var(--sans)", fontSize: "0.9rem", padding: "0.55rem 0.8rem", outline: "none" }}
            />
          )}
          {value ? (
            <button type="button" onClick={() => onChange(null)} style={{ marginTop: "0.5rem", background: "transparent", border: "none", color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.78rem", cursor: "pointer", textDecoration: "underline" }}>Remove</button>
          ) : null}
          {err ? <p style={{ color: "var(--terracotta)", fontFamily: "var(--sans)", fontSize: "0.78rem", marginTop: "0.4rem" }}>{err}</p> : null}
        </div>
      </div>
    </div>
  );
}
