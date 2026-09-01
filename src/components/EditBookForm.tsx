"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AGE_RATINGS, AGE_LABEL } from "@/lib/content";

type BookEdit = {
  id: number | string;
  title: string;
  description: string | null;
  content: string | null;
  price: number | null;
  type: string | null;
  age_rating: string | null;
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
  const [price, setPrice] = useState(String(book.price ?? 0));
  const [age, setAge] = useState(book.age_rating ?? "Everyday");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setErr(null);
    if (!title.trim()) {
      setErr("Title can't be empty.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const priceNum = Math.max(0, parseFloat(price) || 0);
    const payload: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim(),
      content: content.trim() || null,
      type,
      price: priceNum,
      is_free: priceNum <= 0,
      age_rating: age,
    };
    let { error } = await supabase.from("books").update(payload).eq("id", book.id);
    if (error && /age_rating/i.test(error.message)) {
      delete payload.age_rating;
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
          <label style={label}>Price (USD)</label>
          <input style={field} type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
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
