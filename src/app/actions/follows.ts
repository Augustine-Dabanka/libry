"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Follow / unfollow an author (identified by name). Returns the new state.
export async function toggleFollow(author: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to follow authors." };

  const a = (author || "").trim();
  if (!a) return { error: "Unknown author." };

  const existing = await supabase
    .from("author_follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("author", a)
    .maybeSingle();

  if (existing.data) {
    const { error } = await supabase.from("author_follows").delete().eq("follower_id", user.id).eq("author", a);
    if (error) return { error: error.message };
    revalidatePath(`/author/${encodeURIComponent(a)}`);
    return { ok: true, following: false };
  }

  const { error } = await supabase.from("author_follows").insert({ follower_id: user.id, author: a });
  if (error) return { error: error.message };
  revalidatePath(`/author/${encodeURIComponent(a)}`);
  return { ok: true, following: true };
}
