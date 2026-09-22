"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Apply to the Libry Partnership Program (moves status none/rejected -> pending).
export async function applyForPartner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };
  const { error } = await supabase
    .from("profiles")
    .update({ partner_status: "pending", partner_applied_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/creator");
  return { ok: true };
}

// Withdraw a pending application (pending -> none).
export async function withdrawPartner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };
  const { error } = await supabase.from("profiles").update({ partner_status: "none" }).eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/creator");
  return { ok: true };
}
