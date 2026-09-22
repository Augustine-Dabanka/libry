"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { parseComic } from "@/lib/comic";

type Pg = { src: string; caption: string };

// Comic editor: manage a comic's pages (upload images, paste URLs, reorder, add
// captions, remove) and compile them into the comic content format that
// lib/comic.ts reads and ComicReader renders. Shown in the book editor when the
// book's type is a comic. Uploads go to the public book-media bucket.
export default function ComicPagesEditor({ bookId, value, onChange }: { bookId: number | string; value: string; onChange: (content: string) => void }) {
  const [pages, setPages] = useState<Pg[]>(() =>
    parseComic(value || "").pages.filter((p): p is { kind: "image"; src: string; caption?: string } => p.kind === "image").map((p) => ({ src: p.src, caption: p.caption ?? "" })),
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function commit(next: Pg[]) {
    setPages(next);
    onChange(next.filter((p) => p.src.trim()).map((p) => (p.caption.trim() ? `${p.src.trim()} | ${p.caption.trim()}` : p.src.trim())).join("\n"));
  }

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    e.target.value = "";
    if (!files || !files.length) return;
    setErr(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const added: Pg[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 8 * 1024 * 1024) { setErr("Some pages were over 8 MB and skipped."); continue; }
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const path = `comics/${bookId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
        const up = await supabase.storage.from("book-media").upload(path, file, { contentType: file.type, upsert: true });
        if (up.error) { setErr(up.error.message); continue; }
        added.push({ src: supabase.storage.from("book-media").getPublicUrl(path).data.publicUrl, caption: "" });
      }
      if (added.length) commit([...pages, ...added]);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Upload failed.");
    }
    setBusy(false);
  }

  function move(i: number, dir: number) {
    const j = i + dir;
    if (j < 0 || j >= pages.length) return;
    const n = [...pages];
    const a = n[i]!, b = n[j]!;
    n[i] = b; n[j] = a;
    commit(n);
  }
  const setField = (i: number, k: keyof Pg, v: string) => commit(pages.map((p, x) => (x === i ? { ...p, [k]: v } : p)));

  const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", minWidth: 0, background: "var(--charcoal)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--ivory)", fontFamily: "var(--sans)", fontSize: "0.85rem", padding: "0.45rem 0.6rem", outline: "none" };
  const ico: React.CSSProperties = { width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border)", background: "var(--stone)", color: "var(--ivory-muted)", cursor: "pointer", flexShrink: 0 };

  return (
    <div>
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.9rem", alignItems: "center" }}>
        <label className="btn btn-gold" style={{ padding: "0.5rem 1.1rem", cursor: busy ? "default" : "pointer" }}>
          {busy ? "Uploading…" : "＋ Add pages"}
          <input type="file" accept="image/*" multiple onChange={onFiles} style={{ display: "none" }} disabled={busy} />
        </label>
        <button type="button" className="btn btn-outline" style={{ padding: "0.5rem 1rem" }} onClick={() => commit([...pages, { src: "", caption: "" }])}>Add by URL</button>
        <span style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.8rem" }}>{pages.length} page{pages.length === 1 ? "" : "s"}</span>
      </div>
      {err ? <p style={{ color: "var(--terracotta)", fontFamily: "var(--sans)", fontSize: "0.82rem", marginBottom: "0.6rem" }}>{err}</p> : null}

      {pages.length === 0 ? (
        <div style={{ border: "1px dashed var(--border)", borderRadius: 12, padding: "1.8rem 1rem", textAlign: "center", color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.88rem" }}>
          No pages yet — add page images (they read top to bottom, webtoon-style).
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.6rem" }}>
          {pages.map((p, i) => (
            <div key={i} style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.6rem" }}>
              <div style={{ flexShrink: 0, width: 46, height: 64, borderRadius: 6, overflow: "hidden", background: "var(--charcoal)", border: "1px solid var(--border)", display: "grid", placeItems: "center", color: "var(--muted)", fontSize: "0.7rem" }}>
                {p.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0, display: "grid", gap: "0.4rem" }}>
                <input style={field} value={p.src} onChange={(e) => setField(i, "src", e.target.value)} placeholder="Page image URL" />
                <input style={field} value={p.caption} onChange={(e) => setField(i, "caption", e.target.value)} placeholder="Caption (optional)" />
              </div>
              <div style={{ display: "grid", gap: "0.3rem", flexShrink: 0 }}>
                <button type="button" title="Move up" style={ico} onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                <button type="button" title="Move down" style={ico} onClick={() => move(i, 1)} disabled={i === pages.length - 1}>↓</button>
                <button type="button" title="Remove" style={{ ...ico, color: "var(--terracotta)" }} onClick={() => commit(pages.filter((_, x) => x !== i))}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
