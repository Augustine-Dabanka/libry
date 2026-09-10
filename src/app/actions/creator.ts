"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Upgrade the current reader account to a creator (writer) account. Readers can
// only read; becoming a creator unlocks publishing. Safe if the column isn't
// migrated yet.
export async function becomeCreator(): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in." };

  const { error } = await supabase.from("profiles").update({ is_creator: true }).eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/creator");
  revalidatePath("/settings");
  return { ok: true };
}
