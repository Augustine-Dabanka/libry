"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Leave (or update) a review on a book. One review per reader per book.
export async function submitReview(bookId: number, rating: number, body: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to leave a review." };

  const r = Math.max(1, Math.min(5, Math.round(Number(rating) || 0)));
  if (!r) return { error: "Pick a star rating." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username")
    .eq("id", user.id)
    .maybeSingle();
  const name = profile?.full_name || profile?.username || "Reader";

  const { error } = await supabase.from("reviews").upsert(
    { book_id: bookId, user_id: user.id, user_name: name, rating: r, body: (body || "").trim().slice(0, 2000) },
    { onConflict: "book_id,user_id" }
  );
  if (error) return { error: error.message };

  revalidatePath(`/book/${bookId}`);
  return { ok: true };
}

// Delete the caller's own review on a book.
export async function deleteReview(bookId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first." };
  const { error } = await supabase.from("reviews").delete().eq("book_id", bookId).eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath(`/book/${bookId}`);
  return { ok: true };
}
