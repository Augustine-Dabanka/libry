"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createCheckout, stripeLive } from "@/lib/stripe";
import { type Plan, PLAN_LABEL, PLAN_PRICE } from "@/lib/plans";

// Which checkout the browser should open: "stripe", "paystack" or "demo".
export async function paymentProvider(): Promise<"stripe" | "paystack" | "demo"> {
  if (stripeLive()) return "stripe";
  if (!!process.env.PAYSTACK_SECRET_KEY && process.env.NEXT_PUBLIC_PAYSTACK_ENABLED === "true") return "paystack";
  return "demo";
}

async function origin(): Promise<string> {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site && /^https?:\/\//.test(site)) return site.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

// Start a Stripe Checkout for the books in the cart. Prices come from the DB.
export async function startBooksCheckout(bookIds: number[]): Promise<{ url?: string; error?: string }> {
  if (!stripeLive()) return { error: "Card payments aren't switched on yet." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to check out." };
  const ids = [...new Set(bookIds.map(Number))].filter((n) => Number.isFinite(n) && n > 0).slice(0, 50);
  if (!ids.length) return { error: "Your cart is empty." };
  const { data: books, error } = await supabase.from("books").select("id, title, price").in("id", ids);
  if (error) return { error: "Couldn't load your cart. Try again." };
  const paid = (books ?? []).filter((b: { price: number | null }) => (Number(b.price) || 0) > 0);
  if (!paid.length) return { error: "Nothing in your cart needs paying for." };
  try {
    const s = await createCheckout({
      userId: user.id,
      email: user.email,
      origin: await origin(),
      cancelPath: "/catalog",
      lines: paid.map((b: { title: string; price: number | null }) => ({ name: b.title, cents: Math.round((Number(b.price) || 0) * 100) })),
      metadata: { kind: "books", book_ids: paid.map((b: { id: number }) => b.id).join(",") },
    });
    return { url: s.url || undefined };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't start checkout." };
  }
}

// Start a Stripe Checkout for a Lybry Unlimited period (one payment, no auto-renew).
export async function startUnlimitedCheckout(input: { plan: Plan; genres: string[]; maxAge: string }): Promise<{ url?: string; error?: string }> {
  if (!stripeLive()) return { error: "Card payments aren't switched on yet." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to subscribe." };
  const plan = (["weekly", "monthly", "yearly"] as Plan[]).includes(input.plan) ? input.plan : "monthly";
  const genres = (input.genres || []).map((g) => g.replace(/\|/g, "")).slice(0, 12).join("|");
  try {
    const s = await createCheckout({
      userId: user.id,
      email: user.email,
      origin: await origin(),
      cancelPath: "/unlimited",
      lines: [{ name: `Lybry Unlimited, ${PLAN_LABEL[plan].toLowerCase()} (doesn't renew by itself)`, cents: Math.round(PLAN_PRICE[plan] * 100) }],
      metadata: { kind: "unlimited", plan, genres: genres.slice(0, 480), max_age: (input.maxAge || "Everyone").slice(0, 40) },
    });
    return { url: s.url || undefined };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't start checkout." };
  }
}
