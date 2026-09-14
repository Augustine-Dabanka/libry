"use server";

import { createClient } from "@/lib/supabase/server";

// Store a short exit-survey response. Guarded end to end: if the feedback table
// hasn't been migrated yet (or anything fails), this quietly no-ops so the
// logout it precedes always goes through.
export async function submitExitFeedback(input: { reason?: string; note?: string }): Promise<{ ok: boolean }> {
  const reason = (input.reason || "").slice(0, 60);
  const note = (input.note || "").slice(0, 1000).trim();
  if (!reason && !note) return { ok: true }; // nothing to save
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("feedback").insert({
      user_id: user?.id ?? null,
      kind: "exit_survey",
      reason: reason || null,
      note: note || null,
    });
    return { ok: true };
  } catch {
    return { ok: true };
  }
}
