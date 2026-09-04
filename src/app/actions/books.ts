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

// Permanently remove a book the creator owns. RLS + the user_id filter make sure
// a creator can only ever delete their own title. Dependent chapter rows are
// cleared first so a foreign key can't block the delete.
export async function deleteBook(bookId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  // Guard: only the owner may delete.
  const { data: owned } = await supabase
    .from("books")
    .select("id")
    .eq("id", bookId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!owned) return { error: "You can only delete your own books." };

  await supabase.from("chapters").delete().eq("book_id", bookId);

  const { error } = await supabase
    .from("books")
    .delete()
    .eq("id", bookId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/creator");
  revalidatePath("/catalog");
  revalidatePath("/home");
  return { ok: true };
}
