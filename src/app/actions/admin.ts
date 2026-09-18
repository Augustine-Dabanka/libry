"use server";

import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { createClient as createAdmin } from "@supabase/supabase-js";

// Passcode-gated staff area. The passcode defaults to 1495 but can be overridden
// with ADMIN_PASSCODE in the environment. Access is proven by an httpOnly cookie
// holding an HMAC of the passcode keyed on a server secret — presence alone
// can't be forged without knowing the passcode.
const PASSCODE = process.env.ADMIN_PASSCODE || "1495";
const COOKIE = "libry_admin";

function token(): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_URL || "libry-admin-secret";
  return createHmac("sha256", secret).update(PASSCODE).digest("hex");
}

function safeEq(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  try { return timingSafeEqual(ab, bb); } catch { return false; }
}

export async function isAdmin(): Promise<boolean> {
  const c = await cookies();
  const v = c.get(COOKIE)?.value;
  return !!v && safeEq(v, token());
}

export async function adminLogin(passcode: string) {
  if (!safeEq((passcode || "").trim(), PASSCODE)) return { error: "Incorrect passcode." };
  const c = await cookies();
  c.set(COOKIE, token(), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
  return { ok: true };
}

export async function adminLogout() {
  const c = await cookies();
  c.delete(COOKIE);
  return { ok: true };
}

function admin() {
  return createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
}

// ---- Partnership Program review ------------------------------------------
export async function setPartnerStatus(userId: string, status: "approved" | "rejected" | "pending" | "none") {
  if (!(await isAdmin())) return { error: "Not authorized." };
  const { error } = await admin()
    .from("profiles")
    .update({ partner_status: status, partner_reviewed_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) return { error: error.message };
  return { ok: true };
}

// ---- Payout processing ----------------------------------------------------
export async function markPayoutPaid(payoutId: number) {
  if (!(await isAdmin())) return { error: "Not authorized." };
  const { error } = await admin().from("payouts").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", payoutId);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function rejectPayout(payoutId: number) {
  if (!(await isAdmin())) return { error: "Not authorized." };
  const { error } = await admin().from("payouts").update({ status: "rejected" }).eq("id", payoutId);
  if (error) return { error: error.message };
  return { ok: true };
}

// Auto-send a payout to the creator's account via Paystack Transfers, and mark
// it paid on success. Falls back to a clear error so staff can send manually.
export async function sendPayoutNow(payoutId: number) {
  if (!(await isAdmin())) return { error: "Not authorized." };
  const sb = admin();
  const { data: po } = await sb.from("payouts").select("id, creator_id, amount, status").eq("id", payoutId).maybeSingle();
  if (!po) return { error: "Payout not found." };
  if (po.status !== "pending") return { error: `This payout is already ${po.status}.` };
  const { data: acct } = await sb.from("payout_accounts").select("method, provider, account_name, account_number").eq("user_id", po.creator_id).maybeSingle();
  if (!acct) return { error: "This creator hasn't added payout details." };

  const { sendPaystackTransfer } = await import("@/lib/paystack-transfer");
  const res = await sendPaystackTransfer(Number(po.amount), acct, `Libry payout #${payoutId}`);
  if (!res.ok) {
    await sb.from("payouts").update({ note: res.error ?? "Transfer failed" }).eq("id", payoutId);
    return { error: res.error };
  }
  await sb.from("payouts").update({ status: "paid", paid_at: new Date().toISOString(), reference: res.reference ?? null, note: `Auto-transfer via Paystack (${res.status})` }).eq("id", payoutId);
  return { ok: true };
}
