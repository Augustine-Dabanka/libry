"use server";

import { createClient as createAdmin } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sanitizeSeasons } from "@/lib/themes";
import { getStaff, requirePerm, audit, type Perm } from "@/lib/staff";

async function guard(perm: Perm, action: string, target: string | null = null) {
  const g = await requirePerm(perm);
  if ("error" in g) return g.error;
  await audit(g.userId, action, target);
  return null;
}

// Staff area. Access = the configured CEO identity (CEO_ADMIN_EMAIL, with a
// safe default) or a standard Ultra Admin listed in ADMIN_EMAILS, or an account
// with a staff rank (0049). There is no shared passcode. Every action re-checks
// the caller's permission in src/lib/staff.ts.
export async function isAdmin(): Promise<boolean> {
  return !!(await getStaff());
}

// Who is looking at /admin, so the gate can show the right message.
export async function adminViewer(): Promise<{ signedIn: boolean; email: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { signedIn: !!user, email: user?.email ?? null };
}

export async function adminLogout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return { ok: true };
}

function admin() {
  return createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
}

// ---- Partnership Program review ------------------------------------------
export async function setPartnerStatus(userId: string, status: "approved" | "rejected" | "pending" | "none") {
  { const deny = await guard("creators.review", "setPartnerStatus"); if (deny) return { error: deny }; }
  const { error } = await admin()
    .from("profiles")
    .update({ partner_status: status, partner_reviewed_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) return { error: error.message };
  return { ok: true };
}

// ---- Payout processing ----------------------------------------------------
export async function markPayoutPaid(payoutId: number) {
  { const deny = await guard("finance.send", "markPayoutPaid"); if (deny) return { error: deny }; }
  const { error } = await admin().from("payouts").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", payoutId);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function rejectPayout(payoutId: number) {
  { const deny = await guard("finance.send", "rejectPayout"); if (deny) return { error: deny }; }
  const { error } = await admin().from("payouts").update({ status: "rejected" }).eq("id", payoutId);
  if (error) return { error: error.message };
  return { ok: true };
}

// Auto-send a payout to the creator's account via Paystack Transfers, and mark
// it paid on success. Falls back to a clear error so staff can send manually.
export async function sendPayoutNow(payoutId: number) {
  { const deny = await guard("finance.send", "sendPayoutNow"); if (deny) return { error: deny }; }
  const sb = admin();
  const { data: po } = await sb.from("payouts").select("id, creator_id, amount, status").eq("id", payoutId).maybeSingle();
  if (!po) return { error: "Payout not found." };
  if (po.status !== "pending") return { error: `This payout is already ${po.status}.` };
  const { data: acct } = await sb.from("payout_accounts").select("method, provider, account_name, account_number").eq("user_id", po.creator_id).maybeSingle();
  if (!acct) return { error: "This creator hasn't added payout details." };

  const { sendPaystackTransfer } = await import("@/lib/paystack-transfer");
  const res = await sendPaystackTransfer(Number(po.amount), acct, `Lybry payout #${payoutId}`);
  if (!res.ok) {
    await sb.from("payouts").update({ note: res.error ?? "Transfer failed" }).eq("id", payoutId);
    return { error: res.error };
  }
  await sb.from("payouts").update({ status: "paid", paid_at: new Date().toISOString(), reference: res.reference ?? null, note: `Auto-transfer via Paystack (${res.status})` }).eq("id", payoutId);
  return { ok: true };
}


// Save the seasonal theme schedule (Halloween, Christmas, ...). Staff only.
export async function saveThemeSchedule(input: unknown) {
  { const deny = await guard("site.settings", "saveThemeSchedule"); if (deny) return { error: deny }; }
  const seasons = sanitizeSeasons(input);
  const { data: { user } } = await (await createClient()).auth.getUser();
  const { error } = await admin()
    .from("site_settings")
    .upsert({ key: "theme_schedule", value: seasons, updated_at: new Date().toISOString(), updated_by: user?.email ?? null });
  if (error) return { error: "Couldn't save. Is migration 0037 applied?" };
  revalidatePath("/", "layout");
  return { ok: true };
}
