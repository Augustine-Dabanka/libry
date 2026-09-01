"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Add a co-author by username. Only the book owner can (RLS enforces it too).
export async function addCollaborator(
  bookId: number,
  username: string
): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const uname = username.trim().replace(/^@/, "");
  if (!uname) return { ok: false, message: "Enter a username." };

  const { data: prof } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", uname)
    .maybeSingle();
  if (!prof) return { ok: false, message: `No reader found with username “${uname}”.` };
  if (prof.id === user.id) return { ok: false, message: "That's you — you already own it." };

  const { error } = await supabase
    .from("book_collaborators")
    .insert({ book_id: bookId, user_id: prof.id, added_by: user.id });
  if (error) return { ok: false, message: "Could not add (maybe already a collaborator)." };

  revalidatePath("/creator");
  return { ok: true, message: `Added @${uname} as a co-author.` };
}

export async function removeCollaborator(bookId: number, userId: string) {
  const supabase = await createClient();
  await supabase.from("book_collaborators").delete().eq("book_id", bookId).eq("user_id", userId);
  revalidatePath("/creator");
}
