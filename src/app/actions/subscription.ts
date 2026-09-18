"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { type Plan, PLAN_PRICE, PERIOD_DAYS } from "@/lib/plans";

const RATE = Number(process.env.NEXT_PUBLIC_PAYSTACK_USD_RATE || "1") || 1;

export async function subscribeUnlimited(input: {
  plan: Plan; genres: string[]; maxAge: string; picks: number; reference: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to subscribe." };
  const plan = (["weekly", "monthly", "yearly"] as Plan[]).includes(input.plan) ? input.plan : "monthly";
  const price = PLAN_PRICE[plan];

  // Verify the payment server-side unless this is a simulated (pre-launch) run.
  const isSimulated = /^(demo|free)-/.test(input.reference);
  if (price > 0 && !isSimulated) {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return { error: "Payments aren't fully set up yet." };
    try {
      const r = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(input.reference)}`, { headers: { Authorization: `Bearer ${secret}` }, cache: "no-store" });
      const j = await r.json();
      if (!j?.status || j?.data?.status !== "success") return { error: "Payment wasn't completed." };
      if (Number(j.data.amount) + 1 < Math.round(price * RATE * 100)) return { error: "Payment amount didn't match the plan." };
    } catch {
      return { error: "Couldn't confirm the payment. If you were charged, contact support." };
    }
  }

  const periodEnd = new Date(Date.now() + PERIOD_DAYS[plan] * 86400 * 1000).toISOString();
  const genres = (input.genres || []).slice(0, 12);
  const picks = Math.max(1, Math.min(50, Number(input.picks) || 4));

  const { error } = await supabase.from("subscriptions").upsert({
    user_id: user.id, plan, genres, max_age: input.maxAge || "Everyone",
    picks_per_cycle: picks, status: "active", reference: input.reference,
    current_period_end: periodEnd, updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) return { error: error.message };
  revalidatePath("/unlimited");
  return { ok: true };
}

// Update just the preferences (genres / age / picks) without a new charge.
export async function updateSubscriptionPrefs(input: { genres: string[]; maxAge: string; picks: number }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };
  const { error } = await supabase.from("subscriptions").update({
    genres: (input.genres || []).slice(0, 12), max_age: input.maxAge || "Everyone",
    picks_per_cycle: Math.max(1, Math.min(50, Number(input.picks) || 4)), updated_at: new Date().toISOString(),
  }).eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/unlimited");
  return { ok: true };
}

export async function cancelSubscription() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };
  const { error } = await supabase.from("subscriptions").update({ status: "canceled", updated_at: new Date().toISOString() }).eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/unlimited");
  return { ok: true };
}
