// SERVER ONLY. Stripe Checkout without the SDK: plain HTTPS calls with the
// secret key, plus webhook signature checking. Lybry runs Paystack OR Stripe:
//
//   Stripe is used when STRIPE_SECRET_KEY is set AND NEXT_PUBLIC_PAYMENT_PROVIDER=stripe.
//   Otherwise Paystack is used (when it's switched on), otherwise checkout is a free demo.
//
// Stripe charges in USD at the list price (no exchange rate).
import { createHmac, timingSafeEqual } from "crypto";
import { serviceClient } from "@/lib/supabase/service";
import { type Plan, PLAN_PRICE, PERIOD_DAYS, PLAN_PICKS } from "@/lib/plans";
import { revalidatePath } from "next/cache";

// revalidatePath isn't allowed while a page renders (the return page calls this
// during render); the webhook path still revalidates. Pages fetch fresh anyway.
function refresh(path: string) {
  try { revalidatePath(path); } catch { /* during render: ignore */ }
}

export function stripeLive(): boolean {
  return !!process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_PAYMENT_PROVIDER === "stripe";
}
export function paystackLive(): boolean {
  return !stripeLive() && !!process.env.PAYSTACK_SECRET_KEY && process.env.NEXT_PUBLIC_PAYSTACK_ENABLED === "true";
}
/** True when ANY real payment provider is on. Demo (free) checkouts are refused then. */
export function paymentsLive(): boolean {
  return stripeLive() || (!!process.env.PAYSTACK_SECRET_KEY && process.env.NEXT_PUBLIC_PAYSTACK_ENABLED === "true");
}

type Form = Record<string, string | number | undefined>;
async function stripe<T>(path: string, method: "GET" | "POST", form?: Form): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe isn't configured.");
  const body = form
    ? new URLSearchParams(Object.entries(form).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString()
    : undefined;
  const r = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: { Authorization: `Bearer ${key}`, ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
    body,
    cache: "no-store",
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || "Stripe request failed.");
  return j as T;
}

export type StripeSession = {
  id: string;
  url: string | null;
  payment_status: "paid" | "unpaid" | "no_payment_required";
  amount_total: number | null;
  currency: string | null;
  client_reference_id: string | null;
  metadata: Record<string, string>;
};

export async function createCheckout(opts: {
  userId: string;
  email?: string | null;
  origin: string;
  lines: { name: string; cents: number }[];
  metadata: Record<string, string>;
  cancelPath: string;
}): Promise<StripeSession> {
  const form: Form = {
    mode: "payment",
    success_url: `${opts.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${opts.origin}${opts.cancelPath}`,
    client_reference_id: opts.userId,
    customer_email: opts.email || undefined,
    "metadata[user_id]": opts.userId,
  };
  for (const [k, v] of Object.entries(opts.metadata)) form[`metadata[${k}]`] = v;
  opts.lines.forEach((l, i) => {
    form[`line_items[${i}][quantity]`] = 1;
    form[`line_items[${i}][price_data][currency]`] = "usd";
    form[`line_items[${i}][price_data][unit_amount]`] = l.cents;
    form[`line_items[${i}][price_data][product_data][name]`] = l.name.slice(0, 120);
  });
  return stripe<StripeSession>("checkout/sessions", "POST", form);
}

export async function getCheckout(id: string): Promise<StripeSession> {
  return stripe<StripeSession>(`checkout/sessions/${encodeURIComponent(id)}`, "GET");
}

// Stripe-Signature: "t=…,v1=…". Signed payload is `${t}.${raw}` with HMAC-SHA256.
export function verifyStripeSignature(raw: string, header: string, secret: string, toleranceSec = 300): boolean {
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > toleranceSec) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex");
  const sigs = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  return sigs.some((s) => {
    const a = Buffer.from(s, "utf8");
    const b = Buffer.from(expected, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

// Grant what a paid Checkout Session bought. Safe to call more than once (the
// return page AND the webhook both call it): the session id is claimed once in
// payment_references, and purchases upsert.
export async function grantCheckout(s: StripeSession): Promise<{ ok: boolean; error?: string; kind?: string }> {
  if (s.payment_status !== "paid") return { ok: false, error: "Payment wasn't completed." };
  if ((s.currency || "").toLowerCase() !== "usd") return { ok: false, error: "Payment currency didn't match." };
  const userId = s.metadata.user_id || s.client_reference_id;
  if (!userId) return { ok: false, error: "Missing buyer." };
  const svc = serviceClient();
  if (!svc) return { ok: false, error: "Checkout isn't configured yet." };
  const kind = s.metadata.kind;
  const paid = Number(s.amount_total || 0);

  // Work out what's owed from OUR prices, never from the browser.
  let expected = 0;
  let bookIds: number[] = [];
  let plan: Plan | null = null;
  if (kind === "books") {
    bookIds = (s.metadata.book_ids || "").split(",").map(Number).filter((n) => Number.isFinite(n) && n > 0);
    if (!bookIds.length) return { ok: false, error: "Empty order." };
    const { data } = await svc.from("books").select("id, price").in("id", bookIds);
    expected = (data ?? []).reduce((sum: number, b: { price: number | null }) => sum + Math.round((Number(b.price) || 0) * 100), 0);
  } else if (kind === "unlimited") {
    plan = (["weekly", "monthly", "yearly"] as Plan[]).includes(s.metadata.plan as Plan) ? (s.metadata.plan as Plan) : null;
    if (!plan) return { ok: false, error: "Unknown plan." };
    expected = Math.round(PLAN_PRICE[plan] * 100);
  } else {
    return { ok: false, error: "Unknown order." };
  }
  if (paid + 1 < expected) return { ok: false, error: "Payment amount didn't match the order." };

  const purpose = kind === "books" ? "books" : `unlimited:${plan}`;
  const claim = await svc.from("payment_references").insert({ reference: s.id, user_id: userId, purpose, amount_minor: paid });
  if (claim.error) {
    const prev = await svc.from("payment_references").select("user_id, purpose").eq("reference", s.id).maybeSingle();
    if (!prev.data || prev.data.user_id !== userId || prev.data.purpose !== purpose) return { ok: false, error: "This payment was already used." };
    if (kind === "unlimited") return { ok: true, kind }; // already granted; don't extend twice
  }

  if (kind === "books") {
    const { data: books } = await svc.from("books").select("id, price").in("id", bookIds);
    const rows = (books ?? []).map((b: { id: number; price: number | null }) => ({
      user_id: userId, book_id: Number(b.id), amount: Number(b.price) || 0, simulated: false, reference: s.id,
    }));
    const { error } = await svc.from("purchases").upsert(rows, { onConflict: "user_id,book_id", ignoreDuplicates: true });
    if (error) return { ok: false, error: "Couldn't record the purchase. If you were charged, contact support." };
    refresh("/my-library");
    refresh("/creator");
  } else if (plan) {
    const genres = (s.metadata.genres || "").split("|").filter(Boolean).slice(0, 12);
    const { error } = await svc.from("subscriptions").upsert({
      user_id: userId, plan, genres, max_age: s.metadata.max_age || "Everyone",
      picks_per_cycle: PLAN_PICKS[plan], status: "active", reference: s.id,
      current_period_end: new Date(Date.now() + PERIOD_DAYS[plan] * 86400 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (error) return { ok: false, error: "Couldn't save your subscription. If you were charged, contact support." };
    refresh("/unlimited");
  }
  return { ok: true, kind };
}
