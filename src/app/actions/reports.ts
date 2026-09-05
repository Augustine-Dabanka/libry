"use server";

import { createClient } from "@/lib/supabase/server";

// File a trust-and-safety report on a book. Signed-in readers only.
export async function submitReport(bookId: number, reason: string, note: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to report a book." };
  if (!reason) return { error: "Pick a reason." };

  const { error } = await supabase.from("reports").insert({
    book_id: bookId,
    reporter_id: user.id,
    reason,
    note: (note || "").trim().slice(0, 1000),
  });
  if (error) return { error: error.message };
  return { ok: true };
}
