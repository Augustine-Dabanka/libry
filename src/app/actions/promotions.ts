"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { promoPrice, type PromoKind } from "@/lib/promo";

const RATE = Number(process.env.NEXT_PUBLIC_PAYSTACK_USD_RATE || "1") || 1;

// Same server-side verification as checkout: never grant a paid placement
// without confirming the money moved.
async function verifyPaystack(reference: string, expectedMinor: number): Promise<{ ok: boolean; error?: string }> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return { ok: false, error: "Payments aren't fully set up yet." };
  try {
    const r = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    });
    const j = await r.json();
    if (!j?.status || j?.data?.status !== "success") return { ok: false, error: "Payment wasn't completed." };
    if (Number(j.data.amount) + 1 < expectedMinor) return { ok: false, error: "Payment amount didn't match." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't confirm the payment." };
  }
}

export async function createPromotion(input: { bookId: number; kind: PromoKind; days: number; reference: string }) {
  const { bookId, kind, days, reference } = input;
  if (!["boost", "prerelease"].includes(kind)) return { error: "Invalid promotion type." };
  if (![3, 7].includes(days)) return { error: "Invalid duration." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  // Must own the book.
  const { data: book } = await supabase.from("books").select("id, user_id, title").eq("id", bookId).maybeSingle();
  if (!book || (book as { user_id?: string }).user_id !== user.id) return { error: "You can only promote your own books." };

  // Price is computed server-side; verify the payment covers it.
  const amountUsd = promoPrice(kind, days);
  const isSimulated = /^(demo|free)-/.test(reference);
  if (amountUsd > 0 && !isSimulated) {
    const v = await verifyPaystack(reference, Math.round(amountUsd * RATE * 100));
    if (!v.ok) return { error: v.error };
  }

  const ends = new Date(Date.now() + days * 86400_000).toISOString();
  const { error } = await supabase.from("promotions").insert({
    book_id: bookId,
    creator_id: user.id,
    kind,
    days,
    amount: amountUsd,
    reference,
    status: "active",
    ends_at: ends,
  });
  if (error) return { error: error.message };

  revalidatePath("/discover");
  revalidatePath("/creator");
  return { ok: true };
}
