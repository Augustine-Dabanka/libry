"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { VideoCard, type ChannelVideo } from "@/components/ChannelView";

// Creator dashboard → Channel: banner image, tagline, and linked videos.
// The banner is shrunk in the browser to a ~1600px JPEG before saving.

export function parseVideoUrl(raw: string): { provider: "youtube" | "vimeo"; video_id: string } | null {
  let u: URL;
  try { u = new URL(raw.trim()); } catch { return null; }
  const h = u.hostname.replace(/^www\.|^m\./, "");
  if (h === "youtu.be") { const id = u.pathname.slice(1).split("/")[0]; return /^[A-Za-z0-9_-]{11}$/.test(id) ? { provider: "youtube", video_id: id } : null; }
  if (h === "youtube.com" || h === "youtube-nocookie.com") {
    const id = u.searchParams.get("v") || u.pathname.match(/^\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{11})/)?.[1] || "";
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? { provider: "youtube", video_id: id } : null;
  }
  if (h === "vimeo.com" || h === "player.vimeo.com") { const id = u.pathname.match(/(\d{6,12})/)?.[1]; return id ? { provider: "vimeo", video_id: id } : null; }
  return null;
}

function shrink(file: File, maxW = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      const ctx = c.getContext("2d"); if (!ctx) return reject(new Error("canvas"));
      ctx.drawImage(img, 0, 0, c.width, c.height);
      let q = 0.8, out = c.toDataURL("image/jpeg", q);
      while (out.length > 380000 && q > 0.4) { q -= 0.1; out = c.toDataURL("image/jpeg", q); }
      URL.revokeObjectURL(img.src);
      resolve(out);
    };
    img.onerror = () => reject(new Error("image"));
    img.src = URL.createObjectURL(file);
  });
}

export default function ChannelEditor({ userId, initialBanner, initialTagline, initialVideos, username }: { userId: string; initialBanner: string | null; initialTagline: string | null; initialVideos: ChannelVideo[]; username: string | null }) {
  const [banner, setBanner] = useState(initialBanner);
  const [tagline, setTagline] = useState(initialTagline || "");
  const [videos, setVideos] = useState(initialVideos);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const parsed = url ? parseVideoUrl(url) : null;

  async function saveProfile(patch: { banner?: string | null; tagline?: string | null }) {
    setBusy(true); setMsg(null);
    const { error } = await createClient().from("profiles").update(patch).eq("id", userId);
    setBusy(false);
    setMsg(error ? { ok: false, t: /column/i.test(error.message) ? "Run the latest SQL (0049) first." : error.message } : { ok: true, t: "Saved." });
    return !error;
  }
  async function pickBanner(f?: File) {
    if (!f) return;
    if (!f.type.startsWith("image/")) return setMsg({ ok: false, t: "Pick an image." });
    try { const data = await shrink(f); if (await saveProfile({ banner: data })) setBanner(data); }
    catch { setMsg({ ok: false, t: "Couldn't read that image." }); }
  }
  async function addVideo(e: React.FormEvent) {
    e.preventDefault();
    if (!parsed) return setMsg({ ok: false, t: "Paste a YouTube or Vimeo link." });
    if (!title.trim()) return setMsg({ ok: false, t: "Give the video a title." });
    setBusy(true); setMsg(null);
    const { data, error } = await createClient().from("creator_videos").insert({ user_id: userId, ...parsed, title: title.trim().slice(0, 120) }).select("id, provider, video_id, title, created_at").single();
    setBusy(false);
    if (error) return setMsg({ ok: false, t: /duplicate|unique/i.test(error.message) ? "That video is already on your channel." : error.message });
    setVideos((v) => [data as ChannelVideo, ...v]); setUrl(""); setTitle(""); setMsg({ ok: true, t: "Video added." });
  }
  async function remove(id: number) {
    const { error } = await createClient().from("creator_videos").delete().eq("id", id);
    if (!error) setVideos((v) => v.filter((x) => x.id !== id));
  }

  const field: React.CSSProperties = { width: "100%", padding: "0.65rem 0.9rem", borderRadius: 12, border: "2px solid var(--edge)", background: "var(--charcoal)", color: "var(--ivory)", fontFamily: "var(--sans)", fontSize: "0.95rem" };
  return (
    <div style={{ display: "grid", gap: "1.4rem" }}>
      <div>
        <h3 style={{ margin: "0 0 0.6rem" }}>Banner</h3>
        <div className={`ch-banner${banner ? " has-img" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {banner ? <img src={banner} alt="" /> : null}
          {tagline ? <div className="ch-tagline">{tagline}</div> : null}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.7rem" }}>
          <button type="button" className="btn btn-outline" onClick={() => file.current?.click()} disabled={busy}>Change background</button>
          {banner ? <button type="button" className="btn btn-outline" onClick={async () => { if (await saveProfile({ banner: null })) setBanner(null); }}>Remove</button> : null}
          {username ? <a className="btn btn-outline" href={`/u/${username}`}>View my channel</a> : null}
        </div>
        <input ref={file} type="file" accept="image/*" hidden onChange={(e) => pickBanner(e.target.files?.[0])} />
        <p style={{ color: "var(--muted)", fontSize: "0.8rem", fontWeight: 600, margin: "0.4rem 0 0" }}>Wide images work best (about 4:1). Don&apos;t use pictures you don&apos;t have the rights to.</p>
      </div>
      <div>
        <h3 style={{ margin: "0 0 0.6rem" }}>Tagline</h3>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input style={field} maxLength={80} value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Let's make a better tomorrow, now." aria-label="Tagline" />
          <button type="button" className="btn btn-gold" disabled={busy} onClick={() => saveProfile({ tagline: tagline.trim() || null })}>Save</button>
        </div>
      </div>
      <div>
        <h3 style={{ margin: "0 0 0.6rem" }}>Videos</h3>
        <form onSubmit={addVideo} style={{ display: "grid", gap: "0.5rem" }}>
          <input style={field} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a YouTube or Vimeo link" aria-label="Video link" />
          <input style={field} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Title shown on your channel" aria-label="Video title" />
          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", flexWrap: "wrap" }}>
            <button className="btn btn-gold" type="submit" disabled={busy || !parsed}>Add video</button>
            <span style={{ color: url && !parsed ? "var(--danger)" : "var(--muted)", fontWeight: 700, fontSize: "0.82rem" }}>
              {url ? (parsed ? `${parsed.provider === "youtube" ? "YouTube" : "Vimeo"} video found` : "That doesn't look like a YouTube or Vimeo link") : "Videos stay hosted on YouTube or Vimeo; Lybry shows them on your channel."}
            </span>
          </div>
        </form>
        {videos.length ? (
          <div className="ch-grid" style={{ marginTop: "1rem" }}>
            {videos.map((v) => (
              <div key={v.id} style={{ display: "grid", gap: "0.4rem" }}>
                <VideoCard v={v} />
                <button type="button" className="btn btn-outline" onClick={() => remove(v.id)} style={{ padding: "0.3rem 0.8rem" }}>Remove</button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {msg ? <p role={msg.ok ? "status" : "alert"} style={{ margin: 0, fontWeight: 800, color: msg.ok ? "var(--success)" : "var(--danger)" }}>{msg.t}</p> : null}
    </div>
  );
}
