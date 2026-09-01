"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { TOKEN_CAP } from "@/lib/gamification";

// Instant token refill (simulated purchase — real payment comes with monetization).
export async function refillTokens() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("user_stats")
    .update({ tokens: TOKEN_CAP, tokens_updated_at: new Date().toISOString() })
    .eq("user_id", user.id);
  revalidatePath("/home");
}

// Called once per minute of active reading; advances the "read 10 minutes" quest.
export async function tickReadingMinute() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const today = new Date().toISOString().slice(0, 10);
  const { data: q } = await supabase
    .from("daily_quests")
    .select("id, progress, target, completed")
    .eq("user_id", user.id)
    .eq("quest_date", today)
    .eq("quest_key", "read_10")
    .maybeSingle();
  if (!q || q.completed) return;
  const progress = q.progress + 1;
  await supabase
    .from("daily_quests")
    .update({ progress, completed: progress >= q.target })
    .eq("id", q.id);
}

// Claim a completed daily quest: award its tokens + XP, mark it claimed.
export async function claimQuest(questId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: q } = await supabase
    .from("daily_quests")
    .select("*")
    .eq("id", questId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!q || !q.completed || q.claimed) return;

  await supabase.from("daily_quests").update({ claimed: true }).eq("id", questId);

  const { data: st } = await supabase
    .from("user_stats")
    .select("tokens, xp, weekly_xp")
    .eq("user_id", user.id)
    .maybeSingle();
  if (st) {
    await supabase
      .from("user_stats")
      .update({
        tokens: Math.min(TOKEN_CAP, st.tokens + q.reward_tokens),
        xp: st.xp + q.reward_xp,
        weekly_xp: st.weekly_xp + q.reward_xp,
      })
      .eq("user_id", user.id);
  }

  revalidatePath("/home");
}
