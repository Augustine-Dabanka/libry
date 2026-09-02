"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AGE_RATINGS, AGE_LABEL } from "@/lib/content";

export default function NewBookForm({
  userId,
  authorName,
}: {
  userId: string;
  authorName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Fiction");
  const [price, setPrice] = useState("0");
  const [age, setAge] = useState("Everyday");
  const [content, setContent] = useState("");

  async function publish() {
    setErr(null);
    if (!title.trim()) {
      setErr("Give your story a title.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const priceNum = Math.max(0, parseFloat(price) || 0);
    const payload: Record<string, unknown> = {
      id: Date.now(),
      title: title.trim(),
      author: authorName,
      description: description.trim(),
      content: content.trim() || null,
      type,
      price: priceNum,
      is_free: priceNum <= 0,
      age_rating: age,
      status: "Draft",
      is_published: false,
      user_id: userId,
      created_by: authorName,
    };
    let { error } = await supabase.from("books").insert(payload);
    if (error && /age_rating|is_published/i.test(error.message)) {
      // columns not migrated yet — save without them.
      delete payload.age_rating;
      delete payload.is_published;
      ({ error } = await supabase.from("books").insert(payload));
    }
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setTitle("");
    setDescription("");
    setContent("");
    setPrice("0");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn btn-gold" onClick={() => setOpen(true)}>
        ＋ New Story
      </button>
    );
  }

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

  return (
    <div
      style={{
        background: "var(--stone)",
        border: "1px solid var(--border)",
        borderRadius: 18,
        padding: "1.6rem",
        maxWidth: 620,
      }}
    >
      <h3 style={{ marginBottom: "0.4rem" }}>Start a new story</h3>
      <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem" }}>
        Saved as a draft — publish it from “Your Books” when it&apos;s ready. You keep 70%.
      </p>

      <label style={label}>Title</label>
      <input style={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="The Forgotten Forest" />

      <label style={label}>Description</label>
      <textarea style={{ ...field, minHeight: 80, resize: "vertical" }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A short hook for readers…" />

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={label}>Type</label>
          <select style={field} value={type} onChange={(e) => setType(e.target.value)}>
            <option>Fiction</option>
            <option>Non-Fiction</option>
            <option>Interactive</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={label}>Price (USD, 0 = free)</label>
          <input style={field} type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={label}>Age rating</label>
          <select style={field} value={age} onChange={(e) => setAge(e.target.value)}>
            {AGE_RATINGS.map((r) => (
              <option key={r} value={r}>{AGE_LABEL[r]}</option>
            ))}
          </select>
        </div>
      </div>

      <label style={label}>Story text</label>
      <textarea style={{ ...field, minHeight: 180, resize: "vertical", fontFamily: "var(--serif)", lineHeight: 1.7 }} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Once upon a time… Add an image on its own line with ![caption](https://…​.jpg)" />

      {err ? (
        <p style={{ color: "var(--terracotta)", marginTop: "0.9rem", fontSize: "0.9rem" }}>{err}</p>
      ) : null}

      <div style={{ display: "flex", gap: "0.8rem", marginTop: "1.4rem" }}>
        <button className="btn btn-gold" onClick={publish} disabled={busy}>
          {busy ? "Saving…" : "Save draft"}
        </button>
        <button className="btn btn-outline" onClick={() => setOpen(false)} disabled={busy}>
          Cancel
        </button>
      </div>
    </div>
  );
}
