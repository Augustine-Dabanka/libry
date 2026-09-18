"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

// "Continue on your phone" — a real, scannable QR of the reader URL. Scan it on
// a phone (signed in) and the reader opens and resumes from your saved spot,
// since reading progress already syncs cross-device. Reuses the QR idea from
// sign-in for a genuine hand-off.
export default function ContinueOnPhone({ path, label = "Read on your phone" }: { path: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || dataUrl) return;
    const url = `${window.location.origin}${path}`;
    QRCode.toDataURL(url, { margin: 1, width: 200, color: { dark: "#1C1917", light: "#FFFFFF" } })
      .then(setDataUrl)
      .catch(() => setDataUrl(null));
  }, [open, path, dataUrl]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: "relative", display: "inline-block" }}>
      <button type="button" className="btn btn-outline" onClick={() => setOpen((v) => !v)} aria-expanded={open} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
        📱 {label}
      </button>
      {open ? (
        <div role="dialog" aria-label="Continue on your phone" style={{ position: "absolute", zIndex: 60, bottom: "calc(100% + 10px)", left: 0, width: 240, padding: "1rem", background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 14, boxShadow: "var(--shadow)", textAlign: "center" }}>
          <div style={{ width: 200, height: 200, margin: "0 auto 0.7rem", background: "#fff", borderRadius: 10, display: "grid", placeItems: "center", overflow: "hidden" }}>
            {dataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dataUrl} alt="QR code to open this book on your phone" width={200} height={200} />
            ) : (
              <span style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.8rem" }}>…</span>
            )}
          </div>
          <p style={{ fontFamily: "var(--sans)", fontSize: "0.82rem", color: "var(--ivory-muted)", lineHeight: 1.5, margin: 0 }}>
            Scan with your phone camera to keep reading there — you&apos;ll pick up right where you left off.
          </p>
        </div>
      ) : null}
    </div>
  );
}
