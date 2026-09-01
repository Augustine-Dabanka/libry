"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const TIERS: Record<string, { priority: number; days: number; price: number }> = {
  Boost: { priority: 10, days: 3, price: 4 },
  Featured: { priority: 20, days: 7, price: 8 },
  Spotlight: { priority: 30, days: 7, price: 15 },
};

// Promote a book to a home-page placement tier (simulated purchase).
export async function promoteBook(bookId: number, tier: string) {
  const t = TIERS[tier];
  if (!t) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const ends = new Date(Date.now() + t.days * 86_400_000).toISOString();
  await supabase.from("promoted_books").insert({
    book_id: bookId,
    user_id: user.id,
    tier,
    priority: t.priority,
    ends_at: ends,
  });
  revalidatePath("/creator");
  revalidatePath("/home");
}

// Buy a token bundle (simulated purchase — grants tokens immediately).
export async function buyTokens(amount: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: st } = await supabase
    .from("user_stats")
    .select("tokens")
    .eq("user_id", user.id)
    .maybeSingle();
  const current = st?.tokens ?? 0;
  await supabase
    .from("user_stats")
    .update({ tokens: current + amount, tokens_updated_at: new Date().toISOString() })
    .eq("user_id", user.id);
  revalidatePath("/shop");
  revalidatePath("/home");
}
