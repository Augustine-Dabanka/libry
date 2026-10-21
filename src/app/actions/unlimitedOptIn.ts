"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Creator opt-in: let Unlimited trial/box readers keep this book.
export async function setAllowUnlimited(bookId: number, on: boolean): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in." };
  const { error } = await supabase.from("books").update({ allow_unlimited: on }).eq("id", bookId).eq("user_id", user.id);
  if (error) return { ok: false, message: "Couldn't save. Try again." };
  revalidatePath(`/book/${bookId}`);
  return { ok: true, message: on ? "Readers on Unlimited can now keep this book." : "Removed from Unlimited." };
}

export async function getAllowUnlimited(bookId: number): Promise<boolean | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("books").select("allow_unlimited").eq("id", bookId).maybeSingle();
  if (error) return null; // migration 0044 not run yet
  return !!(data as { allow_unlimited?: boolean } | null)?.allow_unlimited;
}
