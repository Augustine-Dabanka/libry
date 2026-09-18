"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// A touch-first, block-based chapter editor. Instead of a floating toolbar, each
// block is its own tappable card (paragraph, heading, quote, image, divider) —
// easy to write, reorder and delete on a phone. Compiles to the same HTML the
// reader renders, so it's interchangeable with the rich-text editor.

type BlockType = "p" | "h2" | "quote" | "img" | "hr";
type Block = { id: string; type: BlockType; text?: string; src?: string; caption?: string };

const uid = () => Math.random().toString(36).slice(2, 9);
const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Parse existing chapter HTML (or plain text) into blocks.
function parse(html: string): Block[] {
  if (!html || !html.trim()) return [{ id: uid(), type: "p", text: "" }];
  // Plain text (no tags) → split paragraphs.
  if (!/<[a-z]/i.test(html)) {
    return html.split(/\n{2,}/).map((t) => ({ id: uid(), type: "p" as BlockType, text: t.trim() })).filter((b) => b.text) || [{ id: uid(), type: "p", text: "" }];
  }
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const out: Block[] = [];
    doc.body.childNodes.forEach((node) => {
      if (node.nodeType === 3) { const t = (node.textContent || "").trim(); if (t) out.push({ id: uid(), type: "p", text: t }); return; }
      if (node.nodeType !== 1) return;
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      if (tag === "figure" || tag === "img") {
        const img = tag === "img" ? el : el.querySelector("img");
        const cap = el.querySelector("figcaption")?.textContent || img?.getAttribute("alt") || "";
        out.push({ id: uid(), type: "img", src: img?.getAttribute("src") || "", caption: cap });
      } else if (tag === "hr") out.push({ id: uid(), type: "hr" });
      else if (/^h[1-6]$/.test(tag)) out.push({ id: uid(), type: "h2", text: el.textContent || "" });
      else if (tag === "blockquote") out.push({ id: uid(), type: "quote", text: el.textContent || "" });
      else { const t = (el.textContent || "").trim(); if (t || tag === "p") out.push({ id: uid(), type: "p", text: t }); }
    });
    return out.length ? out : [{ id: uid(), type: "p", text: "" }];
  } catch {
    return [{ id: uid(), type: "p", text: html }];
  }
}

function compile(blocks: Block[]): string {
  return blocks
    .map((b) => {
      if (b.type === "hr") return "<hr/>";
      if (b.type === "img") {
        if (!b.src) return "";
        const cap = esc(b.caption || "");
        return `<figure class="le-fig le-al-c le-sz-l"><img class="le-img" src="${b.src}" alt="${cap}"/>${cap ? `<figcaption>${cap}</figcaption>` : ""}</figure>`;
      }
      const txt = esc(b.text || "").replace(/\n/g, "<br/>");
      if (!txt) return "";
      if (b.type === "h2") return `<h2>${txt}</h2>`;
      if (b.type === "quote") return `<blockquote>${txt}</blockquote>`;
      return `<p>${txt}</p>`;
    })
    .filter(Boolean)
    .join("");
}

export default function MobileBlockEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const [blocks, setBlocks] = useState<Block[]>(() => parse(value));
  const [addAt, setAddAt] = useState<number | null>(null);
  const firstRun = useRef(true);

  // Push compiled HTML up whenever blocks change (but not on the very first mount).
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    onChange(compile(blocks));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks]);

  const set = (id: string, patch: Partial<Block>) => setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const remove = (id: string) => setBlocks((bs) => (bs.length <= 1 ? bs : bs.filter((b) => b.id !== id)));
  const move = (i: number, dir: number) => setBlocks((bs) => { const j = i + dir; if (j < 0 || j >= bs.length) return bs; const n = [...bs]; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const insert = (i: number, type: BlockType) => { setBlocks((bs) => { const n = [...bs]; n.splice(i, 0, { id: uid(), type, text: "", src: "", caption: "" }); return n; }); setAddAt(null); };

  async function uploadImage(id: string, file: File) {
    set(id, { caption: "Uploading…" });
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
      const path = `chapter-images/${Date.now()}-${uid()}.${ext}`;
      const { error } = await supabase.storage.from("book-media").upload(path, file, { contentType: file.type });
      if (error) { set(id, { caption: "" }); return; }
      const url = supabase.storage.from("book-media").getPublicUrl(path).data.publicUrl;
      set(id, { src: url, caption: "" });
    } catch { set(id, { caption: "" }); }
  }

  const ta: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "transparent", border: "none", color: "var(--ivory)", fontFamily: "var(--sans)", fontSize: "0.95rem", lineHeight: 1.6, outline: "none", resize: "none", padding: 0 };
  const ctl: React.CSSProperties = { background: "transparent", border: "1px solid var(--border)", borderRadius: 7, color: "var(--ivory-muted)", width: 28, height: 28, cursor: "pointer", fontSize: "0.78rem", flexShrink: 0 };

  const addMenu = (i: number) => (
    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", padding: "0.5rem", background: "var(--charcoal)", border: "1px solid var(--border)", borderRadius: 10, margin: "0.4rem 0" }}>
      {([["p", "¶ Text"], ["h2", "H Heading"], ["quote", "❝ Quote"], ["img", "🖼 Image"], ["hr", "— Divider"]] as [BlockType, string][]).map(([t, label]) => (
        <button key={t} type="button" onClick={() => insert(i, t)} style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--ivory)", fontFamily: "var(--sans)", fontSize: "0.82rem", padding: "0.35rem 0.6rem", cursor: "pointer" }}>{label}</button>
      ))}
      <button type="button" onClick={() => setAddAt(null)} style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "0.82rem" }}>✕</button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {blocks.map((b, i) => (
        <div key={b.id}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", background: "var(--charcoal)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.6rem 0.7rem" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {b.type === "hr" ? (
                <div style={{ borderTop: "2px solid var(--border)", margin: "0.6rem 0" }} />
              ) : b.type === "img" ? (
                <div>
                  {b.src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.src} alt="" style={{ maxWidth: "100%", borderRadius: 8, marginBottom: "0.4rem" }} />
                  ) : (
                    <label style={{ display: "inline-block", background: "var(--stone)", border: "1px dashed var(--border)", borderRadius: 8, padding: "0.6rem 0.9rem", cursor: "pointer", fontFamily: "var(--sans)", fontSize: "0.85rem", color: "var(--ivory-muted)" }}>
                      🖼 {b.caption === "Uploading…" ? "Uploading…" : "Choose image"}
                      <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(b.id, f); }} />
                    </label>
                  )}
                  {b.src ? (
                    <input value={b.caption === "Uploading…" ? "" : (b.caption || "")} onChange={(e) => set(b.id, { caption: e.target.value })} placeholder="Caption (optional)" style={{ ...ta, fontSize: "0.82rem", color: "var(--muted)" }} />
                  ) : null}
                </div>
              ) : (
                <textarea
                  value={b.text || ""}
                  onChange={(e) => { set(b.id, { text: e.target.value }); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
                  onFocus={(e) => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
                  rows={1}
                  placeholder={b.type === "h2" ? "Heading…" : b.type === "quote" ? "A quote…" : "Write…"}
                  style={{ ...ta, fontFamily: b.type === "h2" ? "var(--serif)" : b.type === "quote" ? "var(--serif)" : "var(--sans)", fontSize: b.type === "h2" ? "1.2rem" : "0.95rem", fontStyle: b.type === "quote" ? "italic" : "normal", fontWeight: b.type === "h2" ? 700 : 400, borderLeft: b.type === "quote" ? "3px solid var(--gold)" : "none", paddingLeft: b.type === "quote" ? "0.6rem" : 0 }}
                />
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <button type="button" title="Move up" onClick={() => move(i, -1)} disabled={i === 0} style={ctl}>▲</button>
              <button type="button" title="Move down" onClick={() => move(i, 1)} disabled={i === blocks.length - 1} style={ctl}>▼</button>
              <button type="button" title="Delete" onClick={() => remove(b.id)} disabled={blocks.length <= 1} style={{ ...ctl, color: "var(--terracotta)" }}>✕</button>
            </div>
          </div>
          {addAt === i + 1 ? addMenu(i + 1) : (
            <div style={{ textAlign: "center" }}>
              <button type="button" onClick={() => setAddAt(i + 1)} style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontFamily: "var(--sans)", fontSize: "0.8rem", padding: "0.2rem" }}>＋ add block</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
