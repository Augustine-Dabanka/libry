"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Heart toggle for a book. Writes to the wishlist table; degrades to a clear
// message if the 0009 migration hasn't been run yet.
export default function WishlistButton({
  bookId,
  userId,
  initial,
}: {
  bookId: number;
  userId: string;
  initial: boolean;
}) {
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function toggle() {
    setErr(null);
    setBusy(true);
    const supabase = createClient();
    const next = !saved;
    setSaved(next); // optimistic
    const { error } = next
      ? await supabase.from("wishlist").insert({ user_id: userId, book_id: bookId })
      : await supabase.from("wishlist").delete().eq("user_id", userId).eq("book_id", bookId);
    setBusy(false);
    if (error) {
      setSaved(!next); // revert
      setErr(/relation .*wishlist.* does not exist/i.test(error.message) ? "Wishlist isn't set up yet." : error.message);
      return;
    }
    // Nudge the navbar heart badge.
    window.dispatchEvent(new CustomEvent("libry:wishlist-change", { detail: next ? 1 : -1 }));
  }

  return (
    <>
      <button
        type="button"
        className={saved ? "btn btn-gold" : "btn btn-outline"}
        onClick={toggle}
        disabled={busy}
        aria-pressed={saved}
      >
        {saved ? "♥ Wishlisted" : "♡ Add to wishlist"}
      </button>
      {err ? <span style={{ color: "var(--terracotta)", fontSize: "0.8rem", marginLeft: "0.6rem" }}>{err}</span> : null}
    </>
  );
}
