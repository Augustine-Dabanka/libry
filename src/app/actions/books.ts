"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Flip a book between Draft (hidden from the catalog) and Live (published).
// RLS lets a creator update only their own book.
export async function setPublished(bookId: number, published: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("books")
    .update({ is_published: published, status: published ? "Ongoing" : "Draft" })
    .eq("id", bookId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/creator");
  revalidatePath("/catalog");
  revalidatePath("/home");
  return { ok: true };
}
