import { getCheckout, grantCheckout, verifyStripeSignature } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stripe webhook (Stripe Dashboard > Developers > Webhooks > Add endpoint:
//   https://<your-domain>/api/stripe/webhook, event: checkout.session.completed).
// Safety net: if a buyer pays and closes the tab before the return page loads,
// Stripe tells us here and the order is still granted. Every event is checked
// against STRIPE_WEBHOOK_SECRET, and the session is re-fetched from Stripe
// before anything is granted, so a forged body can't grant a free order.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) return new Response("not configured", { status: 503 });

  const raw = await req.text();
  const sig = req.headers.get("stripe-signature") || "";
  if (!verifyStripeSignature(raw, sig, secret)) return new Response("bad signature", { status: 400 });

  let event: { type?: string; data?: { object?: { id?: string } } } = {};
  try { event = JSON.parse(raw); } catch { return new Response("bad json", { status: 400 }); }
  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") {
    return new Response("ignored", { status: 200 });
  }
  const id = event.data?.object?.id;
  if (!id) return new Response("no session", { status: 200 });

  try {
    const session = await getCheckout(id);
    const res = await grantCheckout(session);
    // 500 makes Stripe retry later (e.g. the database was briefly unavailable).
    if (!res.ok && /contact support|configured/i.test(res.error || "")) return new Response("retry", { status: 500 });
    return new Response(res.ok ? "ok" : `skipped: ${res.error}`, { status: 200 });
  } catch {
    return new Response("retry", { status: 500 });
  }
}
