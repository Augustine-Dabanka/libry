"use server";

import { createClient } from "@/lib/supabase/server";

// Append-only product analytics (spec §44). Privacy-minimised: user_id is
// optional and only attached when signed in; callers pass aggregate meta, never
// sensitive content. Analytics must never break a page, so failures are silent.
export async function logEvent(
  event: string,
  opts?: { bookId?: number | null; meta?: Record<string, unknown> },
): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("analytics_events").insert({
      event: event.slice(0, 64),
      user_id: user?.id ?? null,
      book_id: opts?.bookId ?? null,
      meta: opts?.meta ?? null,
    });
  } catch {
    /* analytics is best-effort — never surface an error to the reader */
  }
}
