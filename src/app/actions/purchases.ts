"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CheckoutItem = { id: number; price: number };

// Records purchases for the current user. Called on a successful (or simulated)
// checkout. Already-owned books are ignored via the unique constraint.
export async function checkoutCart(items: CheckoutItem[], reference: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to check out." };
  if (!items.length) return { error: "Your cart is empty." };

  const rows = items.map((i) => ({
    user_id: user.id,
    book_id: Number(i.id),
    amount: Number(i.price) || 0,
    reference,
  }));

  // Upsert so re-buying an owned book is a no-op rather than an error.
  const { error } = await supabase.from("purchases").upsert(rows, { onConflict: "user_id,book_id", ignoreDuplicates: true });
  if (error) return { error: error.message };

  revalidatePath("/my-library");
  revalidatePath("/creator");
  return { ok: true, count: rows.length };
}
