"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Like a story. Public read (count), authed write. Optimistic; degrades to a
// friendly message if the book_likes table isn't migrated yet.
export default function LikeButton({
  bookId,
  userId,
  initialLiked,
  initialCount,
}: {
  bookId: number;
  userId: string | null;
  initialLiked: boolean;
  initialCount: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function toggle() {
    if (!userId) { window.location.assign(`/login?next=/book/${bookId}`); return; }
    setErr(null);
    setBusy(true);
    const next = !liked;
    setLiked(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    const supabase = createClient();
    const { error } = next
      ? await supabase.from("book_likes").insert({ user_id: userId, book_id: bookId })
      : await supabase.from("book_likes").delete().eq("user_id", userId).eq("book_id", bookId);
    setBusy(false);
    if (error) {
      setLiked(!next);
      setCount((c) => Math.max(0, c + (next ? -1 : 1)));
      setErr(/relation .*book_likes.* does not exist/i.test(error.message) ? "Likes aren't set up yet." : error.message);
    }
  }

  return (
    <>
      <button
        type="button"
        className={liked ? "btn btn-gold" : "btn btn-outline"}
        onClick={toggle}
        disabled={busy}
        aria-pressed={liked}
        title={liked ? "Unlike" : "Like this story"}
      >
        {liked ? "❤" : "🤍"} {count > 0 ? count : "Like"}
      </button>
      {err ? <span style={{ color: "var(--terracotta)", fontSize: "0.8rem", marginLeft: "0.6rem" }}>{err}</span> : null}
    </>
  );
}
