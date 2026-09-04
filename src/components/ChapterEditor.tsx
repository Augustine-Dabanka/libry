"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Chapter = { title: string; content: string };

const field: React.CSSProperties = {
  width: "100%",
  padding: "0.7rem 0.95rem",
  background: "var(--charcoal)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  color: "var(--ivory)",
  fontFamily: "var(--sans)",
  fontSize: "0.95rem",
  outline: "none",
};

// Per-chapter editor. Chapters live in the `chapters` table AND are compiled
// into books.content so the reader renders them without any changes.
export default function ChapterEditor({ bookId, initial }: { bookId: number; initial: Chapter[] }) {
  const [chapters, setChapters] = useState<Chapter[]>(
    initial.length ? initial : [{ title: "Chapter One", content: "" }]
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState(0);

  const patch = (i: number, p: Partial<Chapter>) =>
    setChapters((cs) => cs.map((c, idx) => (idx === i ? { ...c, ...p } : c)));
  const add = () =>
    setChapters((cs) => {
      setOpen(cs.length);
      return [...cs, { title: `Chapter ${cs.length + 1}`, content: "" }];
    });
  const remove = (i: number) => setChapters((cs) => cs.filter((_, idx) => idx !== i));
  const move = (i: number, dir: number) =>
    setChapters((cs) => {
      const j = i + dir;
      if (j < 0 || j >= cs.length) return cs;
      const n = [...cs];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  async function save() {
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    const rows = chapters
      .filter((c) => c.title.trim() || c.content.trim())
      .map((c, idx) => ({
        book_id: bookId,
        title: c.title.trim() || `Chapter ${idx + 1}`,
        content: c.content,
        chapter_number: idx + 1,
        is_published: true,
      }));

    // Replace the chapter set, then compile it into the book body.
    await supabase.from("chapters").delete().eq("book_id", bookId);
    if (rows.length) {
      const { error } = await supabase.from("chapters").insert(rows);
      if (error) {
        setBusy(false);
        setMsg(error.message);
        return;
      }
    }
    const compiled = rows.map((r) => `${r.title}\n\n${r.content}`).join("\n\n").trim();
    let { error: e2 } = await supabase.from("books").update({ content: compiled, pages: rows.length }).eq("id", bookId);
    if (e2 && /pages/i.test(e2.message)) {
      ({ error: e2 } = await supabase.from("books").update({ content: compiled }).eq("id", bookId));
    }
    setBusy(false);
    setMsg(e2 ? e2.message : `Saved ✓ — ${rows.length} chapter${rows.length === 1 ? "" : "s"} compiled into your story.`);
  }

  return (
    <div style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.6rem", marginBottom: "2.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "0.6rem" }}>
        <h3 style={{ margin: 0 }}>Chapter Editor</h3>
        <span style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.85rem" }}>{chapters.length} chapter{chapters.length === 1 ? "" : "s"}</span>
      </div>
      <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", margin: "0.3rem 0 1.3rem" }}>
        Write your story chapter by chapter. Saving compiles them into the reader in order.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
        {chapters.map((c, i) => {
          const isOpen = open === i;
          return (
            <div key={i} style={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--charcoal)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 0.7rem" }}>
                <span style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.8rem", width: 28, textAlign: "center" }}>{i + 1}</span>
                <input
                  style={{ ...field, flex: 1 }}
                  value={c.title}
                  onChange={(e) => patch(i, { title: e.target.value })}
                  placeholder={`Chapter ${i + 1} title`}
                  onFocus={() => setOpen(i)}
                />
                <button type="button" title="Move up" onClick={() => move(i, -1)} disabled={i === 0} style={iconBtn}>▲</button>
                <button type="button" title="Move down" onClick={() => move(i, 1)} disabled={i === chapters.length - 1} style={iconBtn}>▼</button>
                <button type="button" title={isOpen ? "Collapse" : "Edit"} onClick={() => setOpen(isOpen ? -1 : i)} style={iconBtn}>{isOpen ? "–" : "✎"}</button>
                <button type="button" title="Delete chapter" onClick={() => remove(i)} disabled={chapters.length === 1} style={{ ...iconBtn, color: "var(--terracotta)" }}>✕</button>
              </div>
              {isOpen ? (
                <div style={{ padding: "0 0.7rem 0.7rem" }}>
                  <textarea
                    style={{ ...field, minHeight: 200, resize: "vertical", fontFamily: "var(--serif)", lineHeight: 1.7 }}
                    value={c.content}
                    onChange={(e) => patch(i, { content: e.target.value })}
                    placeholder="Write this chapter… Add an image on its own line with ![caption](https://…​.jpg)"
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "0.8rem", marginTop: "1.2rem", flexWrap: "wrap" }}>
        <button type="button" className="btn btn-outline" onClick={add}>＋ Add chapter</button>
        <button type="button" className="btn btn-gold" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save chapters"}</button>
      </div>
      {msg ? <p style={{ color: msg.includes("✓") ? "#7DBE86" : "var(--terracotta)", fontFamily: "var(--sans)", fontSize: "0.86rem", marginTop: "0.9rem" }}>{msg}</p> : null}
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  background: "transparent",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--ivory-muted)",
  width: 30,
  height: 30,
  cursor: "pointer",
  fontSize: "0.8rem",
  flexShrink: 0,
};
