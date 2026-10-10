"use server";

import { createClient } from "@/lib/supabase/server";

// Records a completed post-reading challenge for a book (once per book) and
// awards XP + tokens. Best-effort: returns whether it was newly recorded so the
// UI can celebrate. Safe if tables aren't migrated yet.
export async function completeReadingChallenge(bookId: number): Promise<{ ok: boolean; already: boolean }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, already: false };

    // Already done for this book?
    const existing = await supabase
      .from("reading_challenges")
      .select("id")
      .eq("user_id", user.id)
      .eq("book_id", bookId)
      .maybeSingle();
    if (existing.data) return { ok: true, already: true };

    const ins = await supabase.from("reading_challenges").insert({ user_id: user.id, book_id: bookId });
    if (ins.error) return { ok: false, already: false };

    // Reward (+30 XP, +6 energy) is granted by the database, once per book.
    await supabase.rpc("award_xp", { p_reason: "challenge", p_ref: String(bookId) });
    return { ok: true, already: false };
  } catch {
    return { ok: false, already: false };
  }
}
