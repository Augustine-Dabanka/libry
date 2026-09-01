"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Parental control: show/hide Mature-rated books for this reader.
export async function setShowMature(value: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("profiles").update({ show_mature: value }).eq("id", user.id);
  revalidatePath("/settings");
  revalidatePath("/home");
  revalidatePath("/catalog");
  revalidatePath("/discover");
}
