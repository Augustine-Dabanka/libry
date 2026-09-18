import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const PRIVATE = process.env.VAPID_PRIVATE_KEY || "";
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:hello@libry.app";

export function pushConfigured(): boolean {
  return !!PUBLIC && !!PRIVATE && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

if (PUBLIC && PRIVATE) {
  try {
    webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE);
  } catch {
    /* invalid keys — pushConfigured() gates senders anyway */
  }
}

// Service-role client: reads every subscriber and prunes dead endpoints,
// bypassing RLS. Only ever used server-side from the push sender.
function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
}

export type PushPayload = { title: string; body: string; url?: string; icon?: string; tag?: string };

// Send a Web Push to every device a user has subscribed. Dead subscriptions
// (410 Gone / 404) are deleted so the list stays clean. Best-effort.
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!pushConfigured() || !userId) return 0;
  const sb = admin();
  const { data } = await sb.from("push_subscriptions").select("endpoint, p256dh, auth").eq("user_id", userId);
  const subs = data ?? [];
  const body = JSON.stringify(payload);
  let sent = 0;
  await Promise.all(
    subs.map(async (s: { endpoint: string; p256dh: string; auth: string }) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body);
        sent++;
      } catch (e: unknown) {
        const code = (e as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) await sb.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
      }
    })
  );
  return sent;
}
