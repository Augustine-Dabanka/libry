"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
  const router = useRouter();
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Write directly through the authenticated browser client (same proven path
  // as the display-name save), so the photo actually persists to the profile.
  async function persist(value: string | null): Promise<{ ok: boolean; error?: string }> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not signed in." };
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, avatar_url: value }, { onConflict: "id" })
      .select("id")
      .single();
    return error ? { ok: false, error: error.message } : { ok: true };
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr(null);
    let data: string;
    try {
      data = await downscale(file);
    } catch {
      setErr("Couldn't read that image.");
      return;
    }
    const prev = url;
    setUrl(data); // optimistic preview
    start(async () => {
      const res = await persist(data);
      if (res.ok) router.refresh();
      else {
        setUrl(prev); // roll back so we never show a photo that didn't save
        setErr(res.error || "Couldn't save that photo. Please try again.");
      }
    });
  }

  function remove() {
    const prev = url;
    setUrl(null);
    setErr(null);
    start(async () => {
      const res = await persist(null);
      if (res.ok) router.refresh();
      else {
        setUrl(prev);
        setErr(res.error || "Couldn't remove the photo. Please try again.");
      }
    });
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
