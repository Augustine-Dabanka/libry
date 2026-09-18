import { sendPushToUser, pushConfigured } from "@/lib/push-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Webhook target for a Supabase Database Webhook on INSERT into public.notifications.
// Add the webhook in the Supabase dashboard (Database → Webhooks): method POST,
// URL https://<your-domain>/api/push/dispatch, and a header
//   x-push-secret: <PUSH_WEBHOOK_SECRET>
// matching the env var below. Each new notification row is then also delivered
// as a Web Push to that user's devices.
export async function POST(req: Request) {
  const secret = process.env.PUSH_WEBHOOK_SECRET;
  if (!secret || req.headers.get("x-push-secret") !== secret) {
    return new Response("forbidden", { status: 403 });
  }
  if (!pushConfigured()) return new Response("push not configured", { status: 503 });

  let payload: { record?: { user_id?: string; summary?: string; link?: string; kind?: string } } = {};
  try {
    payload = await req.json();
  } catch {
    return new Response("bad request", { status: 400 });
  }
  const rec = payload.record;
  if (!rec?.user_id || !rec.summary) return new Response("ignored", { status: 200 });

  await sendPushToUser(rec.user_id, { title: "Libry", body: rec.summary, url: rec.link || "/notifications", tag: rec.kind });
  return new Response("ok", { status: 200 });
}
