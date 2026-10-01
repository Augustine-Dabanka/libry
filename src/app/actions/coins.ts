"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/supabase/service";
import { isAdmin } from "@/app/actions/admin";
import { COIN_PACKS, type CoinPackId } from "@/lib/coins";

// Every coin change happens inside a database function (see migration 0038):
// amounts are decided there, each award is idempotent, and nothing here can be
// used to write a balance directly.

export async function getWallet() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("coin_wallets").select("bonus, paid").eq("user_id", user.id).maybeSingle();
  const bonus = Number(data?.bonus ?? 0);
  const paid = Number(data?.paid ?? 0);
  return { bonus, paid, total: bonus + paid };
}

export async function redeemCoupon(code: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("redeem_coupon", { p_code: String(code || "").slice(0, 40) });
  if (error) return { ok: false, message: "Couldn't check that code. Try again." };
  const row = Array.isArray(data) ? data[0] : data;
  if (row?.ok) revalidatePath("/wallet");
  return { ok: !!row?.ok, message: String(row?.message ?? "That code isn't valid."), coins: Number(row?.coins ?? 0) };
}

export async function startRewardedAd() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_rewarded_ad");
  if (error || !data) return { id: null as string | null, message: "You've reached today's limit of rewarded ads." };
  return { id: String(data), message: "" };
}

export async function finishRewardedAd(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("finish_rewarded_ad", { p_id: id });
  const coins = error ? 0 : Number(data ?? 0);
  if (coins > 0) revalidatePath("/wallet");
  return { coins };
}

export async function unlockBookWithCoins(bookId: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("unlock_book_with_coins", { p_book: bookId });
  if (error) return { ok: false, message: "Couldn't unlock right now. Try again." };
  const row = Array.isArray(data) ? data[0] : data;
  if (row?.ok) {
    revalidatePath(`/book/${bookId}`);
    revalidatePath("/my-library");
    revalidatePath("/wallet");
  }
  return { ok: !!row?.ok, message: String(row?.message ?? "Couldn't unlock."), cost: Number(row?.cost ?? 0) };
}

export async function coinPurchasesLive() {
  return !!process.env.PAYSTACK_SECRET_KEY && process.env.NEXT_PUBLIC_PAYSTACK_ENABLED === "true";
}

// Credit a bought coin pack, only after Paystack confirms the payment and only
// once per payment reference.
export async function buyCoinPack(packId: CoinPackId, reference: string) {
  if (!(await coinPurchasesLive())) return { error: "Coin packs open once payments are live." };
  const pack = COIN_PACKS.find((p) => p.id === packId);
  if (!pack) return { error: "Unknown pack." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first." };
  const svc = serviceClient();
  if (!svc) return { error: "Payments aren't configured." };

  const rate = Number(process.env.NEXT_PUBLIC_PAYSTACK_USD_RATE || "1") || 1;
  const expectedMinor = Math.round(pack.price * rate * 100);
  try {
    const r = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      cache: "no-store",
    });
    const j = await r.json();
    if (!j?.status || j?.data?.status !== "success") return { error: "Payment wasn't completed." };
    if (process.env.NEXT_PUBLIC_PAYSTACK_CURRENCY && j?.data?.currency && j.data.currency !== process.env.NEXT_PUBLIC_PAYSTACK_CURRENCY) return { error: "Payment currency didn't match." };
    if (Number(j.data.amount) + 1 < expectedMinor) return { error: "Payment amount didn't match." };
  } catch {
    return { error: "Couldn't confirm the payment. If you were charged, contact support." };
  }
  const claim = await svc.from("payment_references").insert({ reference, user_id: user.id, purpose: `coins:${pack.id}`, amount_minor: expectedMinor });
  if (claim.error) {
    // The Paystack webhook may have recorded this payment first. That's fine if
    // it's the same buyer and pack; granting is idempotent per reference.
    const prev = await svc.from("payment_references").select("user_id, purpose").eq("reference", reference).maybeSingle();
    if (!prev.data || prev.data.user_id !== user.id || prev.data.purpose !== `coins:${pack.id}`) return { error: "This payment was already used." };
  }
  const { error } = await svc.rpc("grant_paid_coins", { p_user: user.id, p_coins: pack.coins, p_reference: reference });
  if (error) return { error: "Payment received but coins weren't added. Contact support with your receipt." };
  revalidatePath("/wallet");
  return { ok: true, coins: pack.coins };
}

// ---- Staff: coupons ------------------------------------------------------------
export async function createCoupon(input: { code: string; coins: number; maxUses: number; endsAt?: string | null }) {
  if (!(await isAdmin())) return { error: "Not authorised." };
  const svc = serviceClient();
  if (!svc) return { error: "Service key missing." };
  const code = String(input.code || "").trim().toUpperCase();
  if (!/^[A-Z0-9-]{4,32}$/.test(code)) return { error: "Codes are 4 to 32 letters, numbers or dashes." };
  const coins = Math.floor(Number(input.coins));
  const maxUses = Math.floor(Number(input.maxUses));
  if (!(coins >= 1 && coins <= 10000)) return { error: "Reward must be 1 to 10,000 coins." };
  if (!(maxUses >= 1 && maxUses <= 1000000)) return { error: "Limit must be at least 1." };
  const endsAt = input.endsAt ? new Date(input.endsAt) : null;
  if (endsAt && isNaN(endsAt.getTime())) return { error: "Bad end date." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await svc.from("coupons").insert({ code, coins, max_uses: maxUses, ends_at: endsAt ? endsAt.toISOString() : null, created_by: user?.email ?? null });
  if (error) return { error: error.code === "23505" ? "That code already exists." : "Couldn't create the coupon." };
  revalidatePath("/admin");
  return { ok: true };
}

export async function setCouponActive(code: string, active: boolean) {
  if (!(await isAdmin())) return { error: "Not authorised." };
  const svc = serviceClient();
  if (!svc) return { error: "Service key missing." };
  const { error } = await svc.from("coupons").update({ active }).eq("code", String(code).toUpperCase());
  if (error) return { error: "Couldn't update." };
  revalidatePath("/admin");
  return { ok: true };
}
