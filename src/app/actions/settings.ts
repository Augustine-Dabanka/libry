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

// Set or clear the profile photo (a downscaled data URL, or null to remove).
export async function setAvatar(dataUrl: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("profiles").update({ avatar_url: dataUrl }).eq("id", user.id);
  revalidatePath("/settings");
}
