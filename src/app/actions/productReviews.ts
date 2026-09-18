"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function submitProductReview(productId: number, rating: number, body: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to review." };
  const r = Math.max(1, Math.min(5, Math.round(rating)));
  if (!r) return { error: "Pick a star rating first." };

  const { data: prof } = await supabase.from("profiles").select("username, full_name, pen_name").eq("id", user.id).maybeSingle();
  const name = prof?.pen_name || prof?.full_name || prof?.username || user.email?.split("@")[0] || "Reader";

  const { error } = await supabase.from("product_reviews").upsert(
    { product_id: productId, user_id: user.id, user_name: name, rating: r, body: (body || "").trim().slice(0, 4000) || null },
    { onConflict: "product_id,user_id" }
  );
  if (error) return { error: error.message };
  revalidatePath(`/product/${productId}`);
  return { ok: true };
}

export async function deleteProductReview(productId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };
  const { error } = await supabase.from("product_reviews").delete().eq("product_id", productId).eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath(`/product/${productId}`);
  return { ok: true };
}
