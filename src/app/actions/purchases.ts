"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/supabase/service";

export type CheckoutItem = { id: number; price: number };

const CURRENCY = process.env.NEXT_PUBLIC_PAYSTACK_CURRENCY || "USD";
// How many currency units to charge per $1 of list price. 1 for a USD account;
// set to your GHS-per-USD rate for a Ghana (GHS) account.
const RATE = Number(process.env.NEXT_PUBLIC_PAYSTACK_USD_RATE || "1") || 1;

// True once real payments are fully configured on the server (secret key set +
// enabled). The client uses this to decide real Paystack vs. simulated checkout,
// so we never open the card iframe when we couldn't verify the result.
export async function paystackReady(): Promise<boolean> {
  return !!process.env.PAYSTACK_SECRET_KEY && process.env.NEXT_PUBLIC_PAYSTACK_ENABLED === "true";
}

// Verify a Paystack transaction server-side with the SECRET key before granting
// anything — the only trustworthy signal that money actually moved.
async function verifyPaystack(reference: string, expectedMinor: number): Promise<{ ok: boolean; error?: string }> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return { ok: false, error: "Payments aren't fully set up yet. Please try again later." };
  try {
    const r = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    });
    const j = await r.json();
    if (!j?.status || j?.data?.status !== "success") return { ok: false, error: "Payment wasn't completed." };
    if (process.env.NEXT_PUBLIC_PAYSTACK_CURRENCY && j?.data?.currency && j.data.currency !== process.env.NEXT_PUBLIC_PAYSTACK_CURRENCY) return { ok: false, error: "Payment currency didn't match." };
    // Allow a 1-minor-unit rounding slack; never accept an underpayment.
    if (Number(j.data.amount) + 1 < expectedMinor) return { ok: false, error: "Payment amount didn't match the order." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't confirm the payment. If you were charged, contact support." };
  }
}

// Records purchases for the current user after a verified (or, pre-launch,
// simulated) checkout. Prices are taken from the DB, never trusted from the
// client, so a tampered cart can't underpay. Already-owned books are ignored.
export async function checkoutCart(items: CheckoutItem[], reference: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to check out." };
  if (!items.length) return { error: "Your cart is empty." };

  // Authoritative prices from the DB.
  const ids = [...new Set(items.map((i) => Number(i.id)))].filter((n) => Number.isFinite(n));
  const { data: books, error: bookErr } = await supabase.from("books").select("id, price").in("id", ids);
  if (bookErr) return { error: bookErr.message };
  const priceById = new Map<number, number>((books ?? []).map((b: { id: number; price: number | null }) => [Number(b.id), Number(b.price) || 0]));
  const realTotalUsd = ids.reduce((s, id) => s + (priceById.get(id) ?? 0), 0);

  // Pre-launch demo checkout ("demo-"/"free-" references) is only honoured while
  // real payments are switched off, and it records NO revenue (amount 0,
  // simulated), so it can never turn into a creator payout. Once Paystack is
  // live, every paid order must be verified, and each reference pays once.
  const live = await paystackReady();
  const isSimulated = /^(demo|free)-/.test(reference);
  if (realTotalUsd > 0 && isSimulated && live) return { error: "Please complete payment to continue." };
  const svc = serviceClient();
  if (!svc) return { error: "Checkout isn't configured yet." };
  if (realTotalUsd > 0 && !isSimulated) {
    const expectedMinor = Math.round(realTotalUsd * RATE * 100);
    const v = await verifyPaystack(reference, expectedMinor);
    if (!v.ok) return { error: v.error };
    const claim = await svc.from("payment_references").insert({ reference, user_id: user.id, purpose: "books", amount_minor: expectedMinor });
    if (claim.error) return { error: "This payment was already used for another order." };
  }

  const rows = ids.map((id) => ({
    user_id: user.id,
    book_id: id,
    amount: isSimulated ? 0 : priceById.get(id) ?? 0,
    simulated: isSimulated,
    reference,
  }));
  // Recorded by the server (readers can't insert purchases directly any more).
  // Upsert so re-buying an owned book is a no-op rather than an error.
  const { error } = await svc.from("purchases").upsert(rows, { onConflict: "user_id,book_id", ignoreDuplicates: true });
  if (error) return { error: "Couldn't record the purchase. If you were charged, contact support." };

  revalidatePath("/my-library");
  revalidatePath("/creator");
  return { ok: true, count: rows.length, currency: CURRENCY };
}
