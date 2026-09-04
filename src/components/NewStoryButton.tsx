"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Creates a blank draft and opens the chapter editor for it.
export default function NewStoryButton({ userId, authorName }: { userId: string; authorName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function create() {
    setErr(null);
    setBusy(true);
    const supabase = createClient();
    const payload: Record<string, unknown> = {
      id: Date.now(),
      title: "Untitled story",
      author: authorName,
      content: null,
      type: "Fiction",
      price: 0,
      is_free: true,
      age_rating: "Everyday",
      status: "Draft",
      is_published: false,
      user_id: userId,
      created_by: authorName,
    };
    let { error } = await supabase.from("books").insert(payload);
    if (error && /age_rating|is_published/i.test(error.message)) {
      delete payload.age_rating;
      delete payload.is_published;
      ({ error } = await supabase.from("books").insert(payload));
    }
    if (error) {
      setBusy(false);
      setErr(error.message);
      return;
    }
    router.push(`/creator/edit/${payload.id}`);
  }

  return (
    <>
      <button type="button" className="btn btn-gold" onClick={create} disabled={busy}>
        {busy ? "Creating…" : "＋ New Story (Chapter Editor)"}
      </button>
      {err ? <span style={{ color: "var(--terracotta)", fontSize: "0.8rem", marginLeft: "0.6rem" }}>{err}</span> : null}
    </>
  );
}
