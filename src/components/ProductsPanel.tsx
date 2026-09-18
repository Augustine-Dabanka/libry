"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createProduct, updateProduct, deleteProduct, publishProduct, type ProductType } from "@/app/actions/products";
import { formatPrice } from "@/lib/types";

export type MyProduct = {
  id: number;
  title: string;
  description: string | null;
  type: ProductType;
  price: number | null;
  cover_url: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  external_url: string | null;
  category: string | null;
  is_published: boolean;
  sales?: number;
};

const TYPES: { id: ProductType; label: string; hint: string; file: boolean }[] = [
  { id: "download", label: "Download", hint: "Any file — PDF, ZIP, art pack", file: true },
  { id: "template", label: "Template", hint: "Notion, docs, worksheets", file: true },
  { id: "audio", label: "Audio", hint: "Narration, music, podcast", file: true },
  { id: "ebook", label: "E-book", hint: "Standalone EPUB / PDF", file: true },
  { id: "video", label: "Video", hint: "Hosted stream link", file: false },
  { id: "course", label: "Course", hint: "Multi-lesson, hosted", file: false },
  { id: "bundle", label: "Bundle", hint: "A pack of files", file: true },
];

const blank = (): MyProduct => ({
  id: 0, title: "", description: "", type: "download", price: 0, cover_url: "", file_path: "",
  file_name: "", file_size: null, external_url: "", category: "", is_published: false,
});

function fmtSize(n: number | null) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--charcoal)", border: "1px solid var(--border)", borderRadius: 10,
  color: "var(--ivory)", fontFamily: "var(--sans)", fontSize: "0.92rem", padding: "0.6rem 0.8rem", outline: "none", marginTop: "0.3rem",
};
const labelStyle: React.CSSProperties = { display: "block", fontFamily: "var(--sans)", fontSize: "0.82rem", color: "var(--muted)", marginTop: "0.9rem" };

export default function ProductsPanel({ userId, products, canPublish }: { userId: string; products: MyProduct[]; canPublish: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState<MyProduct | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [upMsg, setUpMsg] = useState<string | null>(null);

  const typeMeta = (t: ProductType) => TYPES.find((x) => x.id === t)!;

  async function uploadCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUpMsg("Uploading cover…");
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `product-covers/${userId}-${Date.now()}.${ext}`;
      const up = await supabase.storage.from("book-media").upload(path, file, { contentType: file.type, upsert: true });
      if (up.error) { setErr(up.error.message); setUpMsg(null); return; }
      const pub = supabase.storage.from("book-media").getPublicUrl(path).data.publicUrl;
      setEditing({ ...editing, cover_url: pub });
      setUpMsg(null);
    } catch { setErr("Cover upload failed."); setUpMsg(null); }
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    if (file.size > 200 * 1024 * 1024) { setErr("Files must be under 200 MB."); return; }
    setUpMsg(`Uploading ${file.name}…`);
    try {
      const supabase = createClient();
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${userId}/${Date.now()}-${safe}`;
      const up = await supabase.storage.from("product-files").upload(path, file, { contentType: file.type, upsert: true });
      if (up.error) { setErr(up.error.message); setUpMsg(null); return; }
      setEditing({ ...editing, file_path: path, file_name: file.name, file_size: file.size });
      setUpMsg(null);
    } catch { setErr("File upload failed."); setUpMsg(null); }
  }

  async function save() {
    if (!editing) return;
    setErr(null);
    if (!editing.title.trim()) { setErr("Give your product a title."); return; }
    const meta = typeMeta(editing.type);
    if (meta.file && !editing.file_path && editing.is_published) { setErr("Upload a file for this product type."); return; }
    if (!meta.file && !editing.external_url?.trim() && editing.is_published) { setErr("Add the hosted video/course link."); return; }
    setBusy(true);
    const input = {
      title: editing.title, description: editing.description || "", type: editing.type,
      price: Number(editing.price) || 0, cover_url: editing.cover_url, file_path: editing.file_path,
      file_name: editing.file_name, file_size: editing.file_size, external_url: editing.external_url, category: editing.category,
    };
    const res = editing.id ? await updateProduct(editing.id, input) : await createProduct(input);
    setBusy(false);
    if (res?.error) { setErr(res.error); return; }
    setEditing(null);
    router.refresh();
  }

  async function toggle(p: MyProduct) {
    setBusy(true);
    const res = await publishProduct(p.id, !p.is_published);
    setBusy(false);
    if (res?.error) { setErr(res.error); return; }
    router.refresh();
  }

  async function remove(p: MyProduct) {
    if (!confirm(`Delete “${p.title}”? This can't be undone.`)) return;
    setBusy(true);
    const res = await deleteProduct(p.id);
    setBusy(false);
    if (res?.error) { setErr(res.error); return; }
    router.refresh();
  }

  // ---------- Editor form ----------
  if (editing) {
    const meta = typeMeta(editing.type);
    return (
      <div style={{ maxWidth: 640 }}>
        <button type="button" onClick={() => { setEditing(null); setErr(null); }} style={{ background: "transparent", border: "none", color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer", marginBottom: "0.9rem", padding: 0 }}>
          ← Back to products
        </button>
        <h3 style={{ marginBottom: "0.3rem" }}>{editing.id ? "Edit product" : "New product"}</h3>
        <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.86rem", marginBottom: "0.5rem" }}>
          You keep <strong style={{ color: "var(--ivory)" }}>65%</strong> of every sale · Libry keeps 35% (30% platform + 5% infra fee).
        </p>

        <label style={labelStyle}>Product type</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.4rem" }}>
          {TYPES.map((t) => (
            <button key={t.id} type="button" onClick={() => setEditing({ ...editing, type: t.id })}
              style={{ padding: "0.4rem 0.8rem", borderRadius: 999, fontFamily: "var(--sans)", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", border: "1px solid var(--border)", background: editing.type === t.id ? "var(--gold)" : "transparent", color: editing.type === t.id ? "#12100E" : "var(--ivory-muted)" }}>
              {t.label}
            </button>
          ))}
        </div>
        <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.78rem", marginTop: "0.35rem" }}>{meta.hint}</p>

        <label style={labelStyle}>Title</label>
        <input style={inputStyle} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="e.g. Character Sketchbook Templates" />

        <label style={labelStyle}>Description</label>
        <textarea style={{ ...inputStyle, resize: "vertical" }} rows={4} value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="What's included, who it's for…" />

        <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={labelStyle}>Price (USD) — 0 = free</label>
            <input style={inputStyle} type="number" min="0" step="0.01" value={editing.price ?? 0} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={labelStyle}>Category (optional)</label>
            <input style={inputStyle} value={editing.category || ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} placeholder="e.g. Worldbuilding" />
          </div>
        </div>

        {/* Deliverable: a file, or an external stream link. */}
        {meta.file ? (
          <>
            <label style={labelStyle}>File {editing.file_name ? "· replace" : ""}</label>
            <input type="file" onChange={uploadFile} style={{ ...inputStyle, padding: "0.5rem" }} />
            {editing.file_name ? (
              <p style={{ color: "#7DBE86", fontFamily: "var(--sans)", fontSize: "0.82rem", marginTop: "0.35rem" }}>✓ {editing.file_name} {fmtSize(editing.file_size)}</p>
            ) : null}
          </>
        ) : (
          <>
            <label style={labelStyle}>Hosted video / course URL</label>
            <input style={inputStyle} value={editing.external_url || ""} onChange={(e) => setEditing({ ...editing, external_url: e.target.value })} placeholder="https://customer-….cloudflarestream.com/…/iframe" />
            <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.78rem", marginTop: "0.35rem" }}>Paste your Cloudflare Stream (or other) embed/playback link.</p>
          </>
        )}

        <label style={labelStyle}>Cover image (optional)</label>
        <div style={{ display: "flex", gap: "0.8rem", alignItems: "flex-start", marginTop: "0.3rem", flexWrap: "wrap" }}>
          <input type="file" accept="image/*" onChange={uploadCover} style={{ ...inputStyle, padding: "0.5rem", flex: 1, minWidth: 200 }} />
          {editing.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={editing.cover_url} alt="" style={{ width: 54, height: 72, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }} />
          ) : null}
        </div>
        <input style={{ ...inputStyle, marginTop: "0.4rem" }} value={editing.cover_url || ""} onChange={(e) => setEditing({ ...editing, cover_url: e.target.value })} placeholder="…or paste an image URL" />

        {upMsg ? <p style={{ color: "var(--gold)", fontFamily: "var(--sans)", fontSize: "0.84rem", marginTop: "0.8rem" }}>{upMsg}</p> : null}
        {err ? <p style={{ color: "var(--terracotta)", fontFamily: "var(--sans)", fontSize: "0.84rem", marginTop: "0.8rem" }}>{err}</p> : null}

        <div style={{ display: "flex", gap: "0.7rem", marginTop: "1.2rem", flexWrap: "wrap" }}>
          <button type="button" className="btn btn-gold" onClick={save} disabled={busy || !!upMsg} style={{ padding: "0.55rem 1.4rem" }}>{busy ? "Saving…" : "Save product"}</button>
          <button type="button" className="btn btn-outline" onClick={() => { setEditing(null); setErr(null); }} style={{ padding: "0.55rem 1.2rem" }}>Cancel</button>
        </div>
      </div>
    );
  }

  // ---------- List ----------
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1.2rem", flexWrap: "wrap" }}>
        <div>
          <h3 style={{ marginBottom: "0.2rem" }}>Digital products ({products.length})</h3>
          <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.86rem" }}>Sell templates, audio, downloads, video &amp; courses alongside your books.</p>
        </div>
        {canPublish ? (
          <button type="button" className="btn btn-gold" onClick={() => { setEditing(blank()); setErr(null); }} style={{ padding: "0.5rem 1.1rem", whiteSpace: "nowrap" }}>+ New product</button>
        ) : null}
      </div>

      {err ? <p style={{ color: "var(--terracotta)", fontFamily: "var(--sans)", fontSize: "0.84rem", marginBottom: "0.8rem" }}>{err}</p> : null}

      {!canPublish ? (
        <div style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 14, padding: "2rem 1.6rem", textAlign: "center" }}>
          <div style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }}>🔒</div>
          <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem" }}>Publishing is paused for your account, so new products can&apos;t go live right now.</p>
        </div>
      ) : products.length === 0 ? (
        <div style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 14, padding: "2.4rem 1.6rem", textAlign: "center" }}>
          <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>🎁</div>
          <h4 style={{ marginBottom: "0.35rem" }}>No products yet</h4>
          <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", maxWidth: 420, margin: "0 auto 1.2rem", lineHeight: 1.6 }}>
            Turn your craft into income — sell a worksheet pack, an audio reading, a template, or a course.
          </p>
          <button type="button" className="btn btn-gold" onClick={() => setEditing(blank())} style={{ padding: "0.55rem 1.3rem" }}>Create your first product</button>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead><tr><th>Product</th><th>Type</th><th>Price</th><th>Sales</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <a href={`/product/${p.id}`} style={{ color: "var(--ivory)", fontFamily: "var(--serif)" }}>{p.title}</a>
                  </td>
                  <td style={{ textTransform: "capitalize" }}>{p.type}</td>
                  <td>{(p.price ?? 0) > 0 ? formatPrice(p.price) : "Free"}</td>
                  <td>{p.sales ?? 0}</td>
                  <td>
                    <span className="badge" style={p.is_published ? { background: "rgba(78,122,82,0.2)", color: "#7DBE86" } : { background: "rgba(168,162,158,0.2)", color: "var(--muted)" }}>
                      {p.is_published ? "Live" : "Draft"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                      <button type="button" className="btn btn-outline" disabled={busy} onClick={() => toggle(p)} style={{ padding: "0.3rem 0.8rem", fontSize: "0.8rem" }}>{p.is_published ? "Unpublish" : "Publish"}</button>
                      <button type="button" className="btn btn-outline" onClick={() => { setEditing({ ...p, price: p.price ?? 0 }); setErr(null); }} style={{ padding: "0.3rem 0.8rem", fontSize: "0.8rem" }}>Edit</button>
                      <button type="button" className="btn btn-outline" disabled={busy} onClick={() => remove(p)} style={{ padding: "0.3rem 0.8rem", fontSize: "0.8rem", color: "var(--terracotta)" }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
