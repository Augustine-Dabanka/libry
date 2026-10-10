import { createHmac, timingSafeEqual } from "crypto";
import { serviceClient } from "@/lib/supabase/service";
import { COIN_PACKS } from "@/lib/coins";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Paystack webhook (Dashboard > Settings > API Keys & Webhooks > Webhook URL:
//   https://<your-domain>/api/paystack/webhook).
// Safety net for coin packs: if a buyer pays and closes the tab before the site
// records it, Paystack still tells us here and the coins are added. Every event
// is verified with the HMAC-SHA512 signature Paystack signs with your secret key.
// Granting is idempotent per payment reference, so the webhook and the in-page
// callback can both run without double-crediting.
export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return new Response("not configured", { status: 503 });

  const raw = await req.text();
  const sig = req.headers.get("x-paystack-signature") || "";
  const expected = createHmac("sha512", secret).update(raw).digest("hex");
  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return new Response("bad signature", { status: 401 });

  let event: { event?: string; data?: Record<string, unknown> } = {};
  try { event = JSON.parse(raw); } catch { return new Response("bad json", { status: 400 }); }
  if (event.event !== "charge.success" || !event.data) return new Response("ignored", { status: 200 });

  const d = event.data as { reference?: string; amount?: number; currency?: string; status?: string; metadata?: { kind?: string; pack?: string; user_id?: string } };
  const meta = d.metadata || {};
  if (meta.kind !== "coins" || !d.reference || !meta.user_id || d.status !== "success") return new Response("ignored", { status: 200 });

  const pack = COIN_PACKS.find((p) => p.id === meta.pack);
  if (!pack) return new Response("unknown pack", { status: 200 });
  const rate = Number(process.env.NEXT_PUBLIC_PAYSTACK_USD_RATE || "1") || 1;
  const expectedMinor = Math.round(pack.price * rate * 100);
  const currency = process.env.NEXT_PUBLIC_PAYSTACK_CURRENCY;
  if (Number(d.amount) + 1 < expectedMinor) return new Response("amount mismatch", { status: 200 });
  if (currency && d.currency && d.currency !== currency) return new Response("currency mismatch", { status: 200 });

  const svc = serviceClient();
  if (!svc) return new Response("not configured", { status: 503 });
  const claim = await svc.from("payment_references").insert({ reference: d.reference, user_id: meta.user_id, purpose: `coins:${pack.id}`, amount_minor: expectedMinor });
  if (claim.error) {
    const prev = await svc.from("payment_references").select("user_id, purpose").eq("reference", d.reference).maybeSingle();
    if (!prev.data || prev.data.user_id !== meta.user_id || prev.data.purpose !== `coins:${pack.id}`) return new Response("reference used", { status: 200 });
  }
  const { error } = await svc.rpc("grant_paid_coins", { p_user: meta.user_id, p_coins: pack.coins, p_reference: d.reference });
  if (error) return new Response("retry", { status: 500 }); // Paystack retries on non-2xx
  return new Response("ok", { status: 200 });
}
