"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// A free-canvas page designer (Fabric.js) for comic pages and handcrafted
// layouts. Drop images, shapes, panels and text anywhere; move/resize/rotate
// freely; then flatten the page to an image and insert it into the chapter.
// Fabric is dynamically imported so it never touches the server render.
export default function PageDesigner({
  onInsert,
  onClose,
}: {
  onInsert: (url: string) => void;
  onClose: () => void;
}) {
  const elRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fabRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const W = 760;
  const H = 980;

  useEffect(() => {
    let disposed = false;
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fabric: any = await import("fabric");
      if (disposed || !elRef.current) return;
      fabRef.current = fabric;
      const canvas = new fabric.Canvas(elRef.current, {
        width: W,
        height: H,
        backgroundColor: "#ffffff",
        preserveObjectStacking: true,
      });
      canvasRef.current = canvas;
      setReady(true);
    })();
    return () => {
      disposed = true;
      try { canvasRef.current?.dispose(); } catch {}
    };
  }, []);

  const add = (obj: unknown) => {
    const c = canvasRef.current;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    c.add(obj as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    c.setActiveObject(obj as any);
    c.requestRenderAll();
  };

  const GOLD = "#C5A059";

  function addRect() {
    const f = fabRef.current;
    add(new f.Rect({ left: 120, top: 120, width: 200, height: 140, rx: 10, ry: 10, fill: GOLD }));
  }
  function addPanel() {
    const f = fabRef.current;
    add(new f.Rect({ left: 60, top: 60, width: 300, height: 380, fill: "rgba(0,0,0,0)", stroke: "#111", strokeWidth: 5, rx: 6, ry: 6 }));
  }
  function addCircle() {
    const f = fabRef.current;
    add(new f.Circle({ left: 150, top: 150, radius: 80, fill: GOLD }));
  }
  function addTriangle() {
    const f = fabRef.current;
    add(new f.Triangle({ left: 150, top: 150, width: 160, height: 150, fill: GOLD }));
  }
  function addLine() {
    const f = fabRef.current;
    add(new f.Line([60, 60, 320, 60], { stroke: "#111", strokeWidth: 5, left: 120, top: 200 }));
  }
  function addStar() {
    const f = fabRef.current;
    const pts = [
      { x: 60, y: 0 }, { x: 74, y: 44 }, { x: 116, y: 44 }, { x: 82, y: 68 },
      { x: 95, y: 110 }, { x: 60, y: 84 }, { x: 25, y: 110 }, { x: 38, y: 68 },
      { x: 4, y: 44 }, { x: 46, y: 44 },
    ];
    add(new f.Polygon(pts, { left: 160, top: 140, fill: GOLD }));
  }
  function addBubble() {
    const f = fabRef.current;
    add(new f.Ellipse({ left: 140, top: 140, rx: 130, ry: 80, fill: "#ffffff", stroke: "#111", strokeWidth: 4 }));
  }
  function addText() {
    const f = fabRef.current;
    const t = new f.IText("Double-click to edit", { left: 140, top: 160, fontFamily: "Georgia, serif", fontSize: 34, fill: "#111" });
    add(t);
  }

  function loadImageUrl(url: string) {
    const f = fabRef.current;
    f.FabricImage.fromURL(url, { crossOrigin: "anonymous" })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((img: any) => {
        const max = 420;
        const scale = Math.min(1, max / (img.width || max));
        img.set({ left: 120, top: 120, scaleX: scale, scaleY: scale });
        add(img);
      })
      .catch(() => setErr("Couldn't load that image (it may block cross-origin use)."));
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const r = new FileReader();
    r.onload = () => loadImageUrl(String(r.result));
    r.readAsDataURL(file);
  }

  function urlImage() {
    const u = window.prompt("Paste an image URL (https://…)");
    if (u && /^https?:\/\//i.test(u)) loadImageUrl(u.trim());
  }

  function delSel() {
    const c = canvasRef.current;
    c.getActiveObjects().forEach((o: unknown) => c.remove(o));
    c.discardActiveObject();
    c.requestRenderAll();
  }
  function layer(dir: number) {
    const c = canvasRef.current;
    const o = c.getActiveObject();
    if (!o) return;
    if (dir > 0) c.bringObjectForward(o);
    else c.sendObjectBackwards(o);
    c.requestRenderAll();
  }
  function setBg(color: string) {
    const c = canvasRef.current;
    c.backgroundColor = color;
    c.requestRenderAll();
  }

  async function dataUrlToUrl(dataUrl: string): Promise<string> {
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const supabase = createClient();
      const path = `pages/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.png`;
      const { error } = await supabase.storage.from("book-media").upload(path, blob, { contentType: "image/png" });
      if (error) throw error;
      return supabase.storage.from("book-media").getPublicUrl(path).data.publicUrl;
    } catch {
      return dataUrl; // embed if storage not authorized
    }
  }

  async function insert() {
    setErr(null);
    setBusy(true);
    try {
      const c = canvasRef.current;
      c.discardActiveObject();
      c.requestRenderAll();
      const dataUrl = c.toDataURL({ format: "png", multiplier: 2 });
      const url = await dataUrlToUrl(dataUrl);
      onInsert(url);
    } catch {
      setErr("Export failed — if you used an external image, upload it as a file instead.");
      setBusy(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 4000, background: "rgba(8,7,6,0.9)", display: "flex", flexDirection: "column" }}>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />

      {/* top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "0.7rem 1.1rem", background: "var(--stone)", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
        <strong style={{ fontFamily: "var(--serif)", color: "var(--ivory)" }}>Page Designer <span style={{ color: "var(--muted)", fontWeight: 400, fontFamily: "var(--sans)", fontSize: "0.8rem" }}>· comic & handcrafted layouts</span></strong>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <T onClick={() => layer(1)} title="Bring forward">⤒</T>
          <T onClick={() => layer(-1)} title="Send backward">⤓</T>
          <T onClick={delSel} title="Delete selected" danger>🗑</T>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.78rem" }}>
            BG <input type="color" defaultValue="#ffffff" onChange={(e) => setBg(e.target.value)} style={{ width: 26, height: 26, border: "none", background: "none", cursor: "pointer" }} />
          </label>
          <button type="button" onClick={onClose} style={btn("ghost")}>Cancel</button>
          <button type="button" onClick={insert} disabled={busy || !ready} style={btn("gold")}>{busy ? "Inserting…" : "Insert into chapter →"}</button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* left tools */}
        <div style={{ width: 130, padding: "0.9rem 0.7rem", background: "var(--charcoal)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.45rem", overflowY: "auto" }}>
          <Tool onClick={() => fileRef.current?.click()}>🖼 Upload</Tool>
          <Tool onClick={urlImage}>🔗 Image URL</Tool>
          <Tool onClick={addText}>🅣 Text</Tool>
          <Tool onClick={addPanel}>▢ Panel</Tool>
          <Tool onClick={addRect}>▭ Rectangle</Tool>
          <Tool onClick={addCircle}>● Circle</Tool>
          <Tool onClick={addTriangle}>△ Triangle</Tool>
          <Tool onClick={addStar}>★ Star</Tool>
          <Tool onClick={addLine}>— Line</Tool>
          <Tool onClick={addBubble}>💬 Bubble</Tool>
        </div>

        {/* canvas stage */}
        <div style={{ flex: 1, overflow: "auto", display: "grid", placeItems: "center", padding: "1.2rem" }}>
          <div style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.6)", borderRadius: 4, overflow: "hidden" }}>
            <canvas ref={elRef} width={W} height={H} />
          </div>
        </div>
      </div>

      {err ? (
        <div style={{ padding: "0.6rem 1.1rem", background: "rgba(180,83,9,0.15)", color: "var(--terracotta)", fontFamily: "var(--sans)", fontSize: "0.82rem", textAlign: "center" }}>{err}</div>
      ) : null}
    </div>
  );
}

function Tool({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ display: "block", width: "100%", textAlign: "left", background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--ivory)", padding: "0.5rem 0.6rem", fontSize: "0.8rem", fontFamily: "var(--sans)", cursor: "pointer" }}>{children}</button>
  );
}
function T({ children, onClick, title, danger }: { children: React.ReactNode; onClick: () => void; title?: string; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} title={title} style={{ background: "var(--charcoal)", border: "1px solid var(--border)", borderRadius: 8, color: danger ? "var(--terracotta)" : "var(--ivory)", width: 34, height: 30, cursor: "pointer", fontSize: "0.85rem" }}>{children}</button>
  );
}
function btn(kind: "gold" | "ghost"): React.CSSProperties {
  return {
    padding: "0.5rem 1rem",
    borderRadius: 10,
    fontFamily: "var(--sans)",
    fontWeight: 700,
    fontSize: "0.85rem",
    cursor: "pointer",
    border: kind === "gold" ? "none" : "1px solid var(--border)",
    background: kind === "gold" ? "var(--gold)" : "transparent",
    color: kind === "gold" ? "#12100E" : "var(--ivory-muted)",
  };
}
