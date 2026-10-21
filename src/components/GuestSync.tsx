"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { clearGuestBooks, getGuestBooks } from "@/lib/guest";

// The first time a reader is signed in on this device, copy the books they
// opened as a guest into their account so "Continue reading" shows them.
// Existing progress is never overwritten (ignoreDuplicates).
export default function GuestSync({ email }: { email: string }) {
  useEffect(() => {
    if (!email) return;
    const books = getGuestBooks();
    if (!books.length) return;
    (async () => {
      const supabase = createClient();
      const rows = books
        .map((b) => Number(b.id))
        .filter((id) => Number.isFinite(id) && id > 0)
        .map((book_id) => ({ user_email: email, book_id, current_chapter: 1, progress_percentage: 1 }));
      if (!rows.length) {
        clearGuestBooks();
        return;
      }
      const { error } = await supabase.from("reading_progress").upsert(rows, { onConflict: "user_email,book_id", ignoreDuplicates: true });
      if (!error) clearGuestBooks();
    })();
  }, [email]);
  return null;
}
