"use client";

import { useRef, useState, useTransition } from "react";
import { setAvatar } from "@/app/actions/settings";

// Downscale a chosen image to a small square JPEG data URL.
function downscale(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = size;
        c.height = size;
        const ctx = c.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        resolve(c.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("bad image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

export default function AvatarSettings({
  initialUrl,
  initials,
}: {
  initialUrl: string | null;
  initials: string;
}) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr(null);
    try {
      const data = await downscale(file);
      setUrl(data);
      start(() => setAvatar(data));
    } catch {
      setErr("Couldn't read that image.");
    }
  }

  function remove() {
    setUrl(null);
    start(() => setAvatar(null));
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1.4rem", flexWrap: "wrap" }}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="Your avatar"
          style={{ width: 76, height: 76, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--gold)" }}
        />
      ) : (
        <span
          aria-hidden="true"
          style={{
            width: 76,
            height: 76,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background: "var(--gold)",
            color: "#20180a",
            fontFamily: "var(--sans)",
            fontWeight: 800,
            fontSize: "1.7rem",
          }}
        >
          {initials || "?"}
        </span>
      )}

      <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />

      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        {url ? (
          <>
            <button className="btn btn-gold" type="button" disabled={pending} onClick={() => fileRef.current?.click()}>
              Change Photo
            </button>
            <button className="btn btn-outline" type="button" disabled={pending} onClick={remove}>
              Remove Photo
            </button>
          </>
        ) : (
          <button className="btn btn-gold" type="button" disabled={pending} onClick={() => fileRef.current?.click()}>
            Upload Photo
          </button>
        )}
      </div>
      {err ? <p style={{ color: "var(--terracotta)", fontSize: "0.85rem", width: "100%" }}>{err}</p> : null}
    </div>
  );
}
