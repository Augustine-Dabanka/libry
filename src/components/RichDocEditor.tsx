"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { RICH_CSS } from "@/lib/richStyles";

// A Word-style WYSIWYG surface. You format text, drop images anywhere and
// align/resize them, add dividers, callouts, comic-panel grids and shapes —
// then it hands the parent clean HTML. Uncontrolled inside: the DOM owns the
// caret; we only report changes upward so React never stomps the cursor.
export default function RichDocEditor({
  value,
  onChange,
  minHeight = 320,
}: {
  value: string;
  onChange: (html: string) => void;
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const selRef = useRef<Range | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingPanel = useRef<HTMLElement | null>(null);
  const [empty, setEmpty] = useState(!value);
  const [imgBar, setImgBar] = useState<{ top: number; left: number; fig: HTMLElement } | null>(null);
  const [menu, setMenu] = useState<null | "insert" | "shape">(null);

  // Fill the editable surface once; after that the DOM is the source of truth.
  useEffect(() => {
    if (ref.current && !ref.current.innerHTML) ref.current.innerHTML = value || "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track the caret so async inserts (file dialogs, prompts) land in place.
  useEffect(() => {
    const onSel = () => {
      const s = window.getSelection();
      if (!s || s.rangeCount === 0) return;
      const r = s.getRangeAt(0);
      if (ref.current && ref.current.contains(r.commonAncestorContainer)) selRef.current = r.cloneRange();
    };
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, []);

  const emit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEmpty(!el.textContent?.trim() && !el.querySelector("img,hr,svg,.le-comic,.le-callout"));
    onChange(el.innerHTML);
  }, [onChange]);

  function focusRestore() {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const r = selRef.current;
    if (r && el.contains(r.commonAncestorContainer)) {
      const s = window.getSelection();
      s?.removeAllRanges();
      s?.addRange(r);
    }
  }

  function exec(cmd: string, arg?: string) {
    focusRestore();
    document.execCommand(cmd, false, arg);
    emit();
  }

  function insertHtml(html: string) {
    focusRestore();
    document.execCommand("insertHTML", false, html);
    emit();
  }

  async function uploadImage(file: File): Promise<string> {
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
      const { error } = await supabase.storage.from("book-media").upload(path, file, { contentType: file.type });
      if (error) throw error;
      return supabase.storage.from("book-media").getPublicUrl(path).data.publicUrl;
    } catch {
      // Storage not authorized yet → embed the image so it still works.
      return await new Promise<string>((res) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        r.readAsDataURL(file);
      });
    }
  }

  const figHtml = (url: string, caption = "") =>
    `<figure class="le-fig le-al-c le-sz-l" data-block="image" contenteditable="false"><img class="le-img" src="${url}" alt="${caption.replace(/"/g, "&quot;")}" />` +
    `<figcaption contenteditable="true">${caption || "Add a caption…"}</figcaption></figure><p><br/></p>`;

  function pickImage(forPanel?: HTMLElement) {
    pendingPanel.current = forPanel || null;
    fileRef.current?.click();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const url = await uploadImage(file);
    const panel = pendingPanel.current;
    if (panel) {
      panel.innerHTML = `<img src="${url}" alt="" />`;
      pendingPanel.current = null;
      emit();
    } else {
      insertHtml(figHtml(url));
    }
    setMenu(null);
  }

  function imageByUrl() {
    const url = window.prompt("Paste an image URL (https://…)");
    if (url && /^https?:\/\//i.test(url)) insertHtml(figHtml(url.trim()));
    setMenu(null);
  }

  function insertComic(cols: number) {
    const panels = Array.from({ length: cols === 4 ? 4 : cols }, () =>
      `<figure class="le-panel" data-block="panel" contenteditable="false"><span class="le-ph">＋ Click to add art</span></figure>`
    ).join("");
    insertHtml(`<div class="le-comic le-cols-${cols}" data-block="comic" contenteditable="false">${panels}</div><p><br/></p>`);
    setMenu(null);
  }

  function insertShape(kind: string) {
    const c = "#C5A059";
    const shapes: Record<string, string> = {
      rect: `<svg viewBox="0 0 200 120" width="200" height="120"><rect x="4" y="4" width="192" height="112" rx="14" fill="${c}" opacity="0.9"/></svg>`,
      circle: `<svg viewBox="0 0 140 140" width="140" height="140"><circle cx="70" cy="70" r="64" fill="${c}" opacity="0.9"/></svg>`,
      line: `<svg viewBox="0 0 300 20" width="300" height="20"><line x1="6" y1="10" x2="294" y2="10" stroke="${c}" stroke-width="4" stroke-linecap="round"/></svg>`,
      star: `<svg viewBox="0 0 120 120" width="120" height="120"><polygon points="60,6 74,44 116,44 82,68 95,110 60,84 25,110 38,68 4,44 46,44" fill="${c}" opacity="0.92"/></svg>`,
    };
    insertHtml(`<div class="le-shape" data-block="shape" contenteditable="false">${shapes[kind] || shapes.rect}</div><p><br/></p>`);
    setMenu(null);
  }

  function insertCallout() {
    insertHtml(`<div class="le-callout" data-block="callout"><p>Type your note, aside, or author's message here…</p></div><p><br/></p>`);
    setMenu(null);
  }

  // Selecting an image reveals its floating controls.
  function onClickBody(e: React.MouseEvent) {
    const t = e.target as HTMLElement;
    const panel = t.closest(".le-panel") as HTMLElement | null;
    if (panel) {
      pickImage(panel);
      return;
    }
    const fig = t.closest(".le-fig") as HTMLElement | null;
    if (fig && ref.current) {
      const box = ref.current.getBoundingClientRect();
      const fb = fig.getBoundingClientRect();
      setImgBar({ top: fb.top - box.top + ref.current.scrollTop - 4, left: fb.left - box.left, fig });
    } else {
      setImgBar(null);
    }
  }

  function figSet(kind: "align" | "size", val: string) {
    const fig = imgBar?.fig;
    if (!fig) return;
    const prefix = kind === "align" ? "le-al-" : "le-sz-";
    Array.from(fig.classList).forEach((c) => {
      if (c.startsWith(prefix)) fig.classList.remove(c);
    });
    fig.classList.add(prefix + val);
    emit();
  }

  function figDelete() {
    imgBar?.fig.remove();
    setImgBar(null);
    emit();
  }

  return (
    <div style={{ position: "relative" }}>
      <style dangerouslySetInnerHTML={{ __html: RICH_CSS }} />
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />

      {/* ── Ribbon ── */}
      <div style={ribbon}>
        <Group>
          <Sel onChange={(v) => exec("formatBlock", v)} />
        </Group>
        <Group>
          <B onDown={() => exec("bold")} title="Bold"><b>B</b></B>
          <B onDown={() => exec("italic")} title="Italic"><i>I</i></B>
          <B onDown={() => exec("underline")} title="Underline"><u>U</u></B>
          <B onDown={() => exec("strikeThrough")} title="Strikethrough"><s>S</s></B>
        </Group>
        <Group>
          <B onDown={() => exec("insertUnorderedList")} title="Bulleted list">•—</B>
          <B onDown={() => exec("insertOrderedList")} title="Numbered list">1.</B>
        </Group>
        <Group>
          <B onDown={() => exec("justifyLeft")} title="Align left">⯇</B>
          <B onDown={() => exec("justifyCenter")} title="Center">≡</B>
          <B onDown={() => exec("justifyFull")} title="Justify">☰</B>
        </Group>
        <Group>
          <B onClick={() => pickImage()} title="Insert image">🖼 Image</B>
          <div style={{ position: "relative" }}>
            <B onClick={() => setMenu(menu === "insert" ? null : "insert")} title="Insert…">＋ Insert ▾</B>
            {menu === "insert" ? (
              <div style={pop}>
                <MI onClick={imageByUrl}>🔗 Image from URL</MI>
                <MI onClick={insertCallout}>💬 Callout box</MI>
                <MI onClick={() => exec("insertHorizontalRule")}>— Divider</MI>
                <div style={popLabel}>Comic panels</div>
                <MI onClick={() => insertComic(2)}>▭▭ 2 panels</MI>
                <MI onClick={() => insertComic(3)}>▭▭▭ 3 panels</MI>
                <MI onClick={() => insertComic(4)}>⊞ 4 panels</MI>
              </div>
            ) : null}
          </div>
          <div style={{ position: "relative" }}>
            <B onClick={() => setMenu(menu === "shape" ? null : "shape")} title="Shapes">◆ Shapes ▾</B>
            {menu === "shape" ? (
              <div style={pop}>
                <MI onClick={() => insertShape("rect")}>▭ Rectangle</MI>
                <MI onClick={() => insertShape("circle")}>● Circle</MI>
                <MI onClick={() => insertShape("line")}>— Line</MI>
                <MI onClick={() => insertShape("star")}>★ Star</MI>
              </div>
            ) : null}
          </div>
        </Group>
        <Group>
          <B onDown={() => exec("removeFormat")} title="Clear formatting">⌫ Clear</B>
        </Group>
      </div>

      {/* ── Page ── */}
      <div style={{ position: "relative" }}>
        <div
          ref={ref}
          className="le-body"
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
          onClick={onClickBody}
          onKeyDown={() => setImgBar(null)}
          style={{
            minHeight,
            padding: "1.4rem 1.5rem",
            background: "var(--charcoal)",
            border: "1px solid var(--border)",
            borderTop: "none",
            borderRadius: "0 0 12px 12px",
            color: "var(--ivory)",
            outline: "none",
            fontSize: "1.02rem",
            overflow: "hidden",
          }}
        />
        {empty ? (
          <div style={{ position: "absolute", top: "1.4rem", left: "1.5rem", color: "var(--muted)", pointerEvents: "none", fontFamily: "var(--serif)", fontSize: "1.02rem" }}>
            Start writing your chapter… use the toolbar to add headings, images, panels and shapes.
          </div>
        ) : null}

        {/* Floating image controls */}
        {imgBar ? (
          <div style={{ position: "absolute", top: imgBar.top, left: imgBar.left, transform: "translateY(-100%)", zIndex: 20, display: "flex", gap: 4, background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 10, padding: 4, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
            <Chip onClick={() => figSet("align", "l")}>⯇</Chip>
            <Chip onClick={() => figSet("align", "c")}>≡</Chip>
            <Chip onClick={() => figSet("align", "r")}>⯈</Chip>
            <span style={{ width: 1, background: "var(--border)", margin: "2px 2px" }} />
            <Chip onClick={() => figSet("size", "s")}>S</Chip>
            <Chip onClick={() => figSet("size", "m")}>M</Chip>
            <Chip onClick={() => figSet("size", "l")}>L</Chip>
            <span style={{ width: 1, background: "var(--border)", margin: "2px 2px" }} />
            <Chip onClick={figDelete} danger>✕</Chip>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ── little UI atoms ── */
function Group({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", gap: 3, alignItems: "center", paddingRight: 8, marginRight: 4, borderRight: "1px solid var(--border)" }}>{children}</div>;
}
function B({ children, onDown, onClick, title }: { children: React.ReactNode; onDown?: () => void; onClick?: () => void; title?: string }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={onDown ? (e) => { e.preventDefault(); onDown(); } : undefined}
      onClick={onClick}
      style={{ background: "transparent", border: "1px solid transparent", borderRadius: 7, color: "var(--ivory-muted)", padding: "0.32rem 0.5rem", fontSize: "0.85rem", fontFamily: "var(--sans)", cursor: "pointer", lineHeight: 1, whiteSpace: "nowrap" }}
    >
      {children}
    </button>
  );
}
function Chip({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" onMouseDown={(e) => { e.preventDefault(); onClick(); }} style={{ background: "var(--charcoal)", border: "1px solid var(--border)", borderRadius: 6, color: danger ? "var(--terracotta)" : "var(--ivory)", width: 26, height: 26, fontSize: "0.78rem", cursor: "pointer" }}>{children}</button>
  );
}
function MI({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onClick} style={{ display: "block", width: "100%", textAlign: "left", background: "transparent", border: "none", color: "var(--ivory)", padding: "0.5rem 0.8rem", fontSize: "0.85rem", fontFamily: "var(--sans)", cursor: "pointer", whiteSpace: "nowrap" }}>{children}</button>
  );
}
function Sel({ onChange }: { onChange: (v: string) => void }) {
  return (
    <select
      onMouseDown={(e) => e.stopPropagation()}
      onChange={(e) => { const v = e.target.value; e.target.selectedIndex = 0; onChange(v); }}
      defaultValue=""
      style={{ background: "var(--charcoal)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--ivory-muted)", padding: "0.32rem 0.4rem", fontSize: "0.82rem", fontFamily: "var(--sans)", cursor: "pointer" }}
    >
      <option value="" disabled>Style ▾</option>
      <option value="p">Body text</option>
      <option value="h2">Heading</option>
      <option value="h3">Subheading</option>
      <option value="blockquote">Quote</option>
    </select>
  );
}

const ribbon: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
  alignItems: "center",
  padding: "0.5rem 0.6rem",
  background: "var(--stone)",
  border: "1px solid var(--border)",
  borderRadius: "12px 12px 0 0",
  position: "sticky",
  top: 0,
  zIndex: 15,
};
const pop: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 4px)",
  left: 0,
  minWidth: 180,
  background: "var(--stone)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "0.3rem",
  boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
  zIndex: 30,
};
const popLabel: React.CSSProperties = { fontFamily: "var(--sans)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", padding: "0.5rem 0.8rem 0.2rem" };
