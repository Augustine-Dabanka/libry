"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCommunity } from "@/app/actions/communities";
import ImagePicker from "@/components/ImagePicker";

export default function CommunityCreate() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📚");
  const [desc, setDesc] = useState("");
  const [cover, setCover] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    setErr(null);
    start(async () => {
      const res = await createCommunity({ name, description: desc, emoji, coverUrl: cover });
      if (res?.error) { setErr(res.error); return; }
      if (res?.slug) router.push(`/c/${res.slug}`);
    });
  }

  const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "var(--charcoal)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--ivory)", fontFamily: "var(--sans)", fontSize: "0.92rem", padding: "0.6rem 0.8rem", outline: "none", marginTop: "0.3rem" };

  if (!open) {
    return <button type="button" className="btn btn-outline" onClick={() => setOpen(true)} style={{ padding: "0.5rem 1.1rem", whiteSpace: "nowrap" }}>+ Start a community</button>;
  }

  return (
    <div style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.3rem 1.4rem", marginBottom: "1.6rem", maxWidth: 520 }}>
      <h3 style={{ marginBottom: "0.6rem" }}>Start a community</h3>
      <div style={{ display: "flex", gap: "0.6rem" }}>
        <input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} aria-label="Emoji" style={{ ...field, width: 60, textAlign: "center", flexShrink: 0 }} />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Community name" style={field} />
      </div>
      <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What's it about? (optional)" rows={2} style={{ ...field, resize: "vertical" }} />
      <ImagePicker value={cover} onChange={setCover} label="Community cover" aspect="16 / 9" />
      {err ? <p style={{ color: "var(--terracotta)", fontFamily: "var(--sans)", fontSize: "0.84rem", marginTop: "0.6rem" }}>{err}</p> : null}
      <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.9rem" }}>
        <button type="button" className="btn btn-gold" onClick={submit} disabled={pending || !name.trim()} style={{ padding: "0.5rem 1.2rem" }}>{pending ? "Creating…" : "Create"}</button>
        <button type="button" className="btn btn-outline" onClick={() => setOpen(false)} style={{ padding: "0.5rem 1.1rem" }}>Cancel</button>
      </div>
    </div>
  );
}
