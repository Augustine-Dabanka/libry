import { createClient } from "@/lib/supabase/server";
import { sendPushToUser, pushConfigured } from "@/lib/push-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Sends a test push to the signed-in user, so the "Enable notifications" button
// can confirm the whole pipe works end to end.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: "Not signed in." }, 401);
  if (!pushConfigured()) return json({ error: "Push isn't fully configured on the server yet." }, 503);
  const sent = await sendPushToUser(user.id, { title: "Libry", body: "Notifications are on — you're all set. 🔔", url: "/notifications" });
  return json({ ok: true, sent });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}
