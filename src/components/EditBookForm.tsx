"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AGE_RATINGS, AGE_LABEL, GENRES } from "@/lib/content";

const MIN_PRICE = 2.99;

type BookEdit = {
  id: number | string;
  title: string;
  description: string | null;
  content: string | null;
  price: number | null;
  type: string | null;
  age_rating: string | null;
  category?: string | null;
  cover_url?: string | null;
};

const field: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem 1rem",
  background: "var(--charcoal)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  color: "var(--ivory)",
  fontFamily: "var(--sans)",
  fontSize: "0.95rem",
  outline: "none",
  marginTop: "0.35rem",
};
const label: React.CSSProperties = {
  display: "block",
  fontSize: "0.85rem",
  color: "var(--muted)",
  fontFamily: "var(--sans)",
  marginTop: "1rem",
};

export default function EditBookForm({ book }: { book: BookEdit }) {
  const router = useRouter();
  const [title, setTitle] = useState(book.title ?? "");
  const [description, setDescription] = useState(book.description ?? "");
  const [content, setContent] = useState(book.content ?? "");
  const [type, setType] = useState(book.type ?? "Fiction");
  const [category, setCategory] = useState(book.category ?? "");
  const [price, setPrice] = useState(String(book.price ?? 0));
  const [age, setAge] = useState(book.age_rating ?? "Everyday");
  const [cover, setCover] = useState(book.cover_url ?? "");
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverErr, setCoverErr] = useState<string | null>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Upload a chosen cover image from the creator's device to the book-media
  // bucket and use its public URL. (A pasted URL is supported too, below.)
  async function onCoverFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCoverErr(null);
    if (!file.type.startsWith("image/")) { setCoverErr("Please choose an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setCoverErr("That image is over 5 MB — please pick a smaller one."); return; }
    setCoverBusy(true);
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `covers/${book.id}-${Date.now()}.${ext}`;
      const up = await supabase.storage.from("book-media").upload(path, file, { contentType: file.type, upsert: true });
      if (up.error) { setCoverErr(up.error.message); setCoverBusy(false); return; }
      const pub = supabase.storage.from("book-media").getPublicUrl(path).data.publicUrl;
      setCover(pub);
    } catch (e2) {
      setCoverErr(e2 instanceof Error ? e2.message : "Upload failed.");
    }
    setCoverBusy(false);
  }

  async function save() {
    setErr(null);
    if (!title.trim()) {
      setErr("Title can't be empty.");
      return;
    }
    const priceNum = Math.max(0, parseFloat(price) || 0);
    // Price floor: paid books must clear the payment-processor fee (~5% + $0.50)
    // so both the writer and Libry actually profit. Free (0) is always allowed.
    if (priceNum > 0 && priceNum < MIN_PRICE) {
      setErr(`Paid books must be free or at least $${MIN_PRICE.toFixed(2)} — below that, payment fees eat the sale.`);
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const payload: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim(),
      content: content.trim() || null,
      type,
      category: category || null,
      price: priceNum,
      is_free: priceNum <= 0,
      age_rating: age,
      cover_url: cover.trim() || null,
    };
    let { error } = await supabase.from("books").update(payload).eq("id", book.id);
    // Retry gracefully if a column/constraint isn't migrated yet.
    if (error && /cover_url/i.test(error.message)) {
      delete payload.cover_url;
      ({ error } = await supabase.from("books").update(payload).eq("id", book.id));
    }
    if (error && /age_rating/i.test(error.message)) {
      delete payload.age_rating;
      ({ error } = await supabase.from("books").update(payload).eq("id", book.id));
    }
    if (error && /category/i.test(error.message)) {
      delete payload.category;
      ({ error } = await supabase.from("books").update(payload).eq("id", book.id));
    }
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    router.push(`/book/${book.id}`);
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <label style={label}>Title</label>
      <input style={field} value={title} onChange={(e) => setTitle(e.target.value)} />

      <label style={label}>Description</label>
      <textarea style={{ ...field, minHeight: 80, resize: "vertical" }} value={description} onChange={(e) => setDescription(e.target.value)} />

      {/* Cover — upload from device, or paste a URL */}
      <label style={label}>Book cover</label>
      <div style={{ display: "flex", gap: "1.1rem", alignItems: "flex-start", flexWrap: "wrap", marginTop: "0.35rem" }}>
        <div style={{ width: 96, aspectRatio: "2 / 3", borderRadius: 10, overflow: "hidden", flexShrink: 0, border: "1px solid var(--border)", background: "linear-gradient(160deg, rgba(197,160,89,0.12), rgba(0,0,0,0.25))", display: "grid", placeItems: "center" }}>
          {cover.trim() ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="Cover preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontFamily: "var(--sans)", fontSize: "0.6rem", letterSpacing: "0.2em", color: "var(--gold-hi)", fontWeight: 700 }}>LIBRY</span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <input ref={coverFileRef} type="file" accept="image/*" onChange={onCoverFile} style={{ display: "none" }} />
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button type="button" className="btn btn-gold" disabled={coverBusy} onClick={() => coverFileRef.current?.click()}>
              {coverBusy ? "Uploading…" : cover.trim() ? "Change cover" : "Upload from device"}
            </button>
            {cover.trim() ? (
              <button type="button" className="btn btn-outline" disabled={coverBusy} onClick={() => setCover("")}>Remove</button>
            ) : null}
          </div>
          <label style={{ ...label, marginTop: "0.8rem", fontSize: "0.78rem" }}>…or paste an image URL</label>
          <input style={field} value={cover} onChange={(e) => setCover(e.target.value)} placeholder="https://…/cover.jpg" />
          <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.76rem", marginTop: "0.4rem" }}>
            Portrait works best (2:3). Leave empty to use the generated Libry cover.
          </p>
          {coverErr ? <p style={{ color: "var(--terracotta)", fontSize: "0.82rem", marginTop: "0.4rem" }}>{coverErr}</p> : null}
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 150 }}>
          <label style={label}>Type</label>
          <select style={field} value={type} onChange={(e) => setType(e.target.value)}>
            <option>Fiction</option>
            <option>Non-Fiction</option>
            <option>Interactive</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 150 }}>
          <label style={label}>Genre</label>
          <select style={field} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">— Select a genre —</option>
            {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 150 }}>
          <label style={label}>Price (USD) · free, or $2.99+</label>
          <input style={field} type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
          <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.45rem", flexWrap: "wrap" }}>
            {["0", "2.99", "4.99", "6.99"].map((p) => {
              const on = String(parseFloat(price) || 0) === String(parseFloat(p));
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPrice(p)}
                  style={{
                    padding: "0.3rem 0.7rem", borderRadius: 999, cursor: "pointer",
                    fontFamily: "var(--sans)", fontSize: "0.78rem", fontWeight: 700,
                    border: `1px solid ${on ? "var(--gold)" : "var(--border)"}`,
                    background: on ? "rgba(197,160,89,0.14)" : "transparent",
                    color: on ? "var(--gold)" : "var(--ivory-muted)",
                  }}
                >
                  {p === "0" ? "Free" : `$${p}`}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 150 }}>
          <label style={label}>Age rating</label>
          <select style={field} value={age} onChange={(e) => setAge(e.target.value)}>
            {AGE_RATINGS.map((r) => (
              <option key={r} value={r}>{AGE_LABEL[r]}</option>
            ))}
          </select>
        </div>
      </div>

      <label style={label}>Story text</label>
      <textarea
        style={{ ...field, minHeight: 200, resize: "vertical", fontFamily: "var(--serif)", lineHeight: 1.7 }}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Paste or edit your story. Drop an image with ![caption](https://…​.jpg) on its own line."
      />

      {err ? <p style={{ color: "var(--terracotta)", marginTop: "0.9rem", fontSize: "0.9rem" }}>{err}</p> : null}

      <div style={{ display: "flex", gap: "0.8rem", marginTop: "1.4rem" }}>
        <button className="btn btn-gold lb-press" onClick={save} disabled={busy} type="button">
          {busy ? "Saving…" : "Save changes"}
        </button>
        <a className="btn btn-outline" href={`/book/${book.id}`}>
          Cancel
        </a>
      </div>
    </div>
  );
}
