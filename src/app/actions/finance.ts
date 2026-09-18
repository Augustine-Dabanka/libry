"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function savePayoutAccount(input: { method: string; provider: string; accountName: string; accountNumber: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };
  const method = input.method === "bank" ? "bank" : "momo";
  if (!input.accountNumber.trim() || !input.accountName.trim()) return { error: "Enter your account name and number." };
  const { error } = await supabase.from("payout_accounts").upsert(
    {
      user_id: user.id,
      method,
      provider: input.provider.trim() || null,
      account_name: input.accountName.trim(),
      account_number: input.accountNumber.trim(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) return { error: error.message };
  revalidatePath("/creator");
  return { ok: true };
}

export async function requestPayout() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };
  const { error } = await supabase.rpc("request_payout");
  if (error) return { error: error.message.replace(/^.*?:\s*/, "") };
  revalidatePath("/creator");
  return { ok: true };
}
