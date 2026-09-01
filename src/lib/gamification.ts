import { createClient } from "@/lib/supabase/server";

export type Stats = {
  user_id: string;
  streak_count: number;
  longest_streak: number;
  last_active_date: string | null;
  streak_broken: boolean;
  tokens: number;
  tokens_updated_at: string;
  xp: number;
  weekly_xp: number;
  league: string;
  updated_at: string;
};

export type Quest = {
  id: number;
  quest_key: string;
  label: string;
  target: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
  reward_tokens: number;
  reward_xp: number;
};

export const TOKEN_CAP = 30;
const TOKEN_REGEN_MINUTES = 30; // one token every 30 min
const DAILY_XP = 15;

export const LEAGUES = ["Bronze", "Silver", "Gold", "Diamond"] as const;
export function leagueFor(weeklyXp: number): string {
  if (weeklyXp >= 400) return "Diamond";
  if (weeklyXp >= 150) return "Gold";
  if (weeklyXp >= 50) return "Silver";
  return "Bronze";
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
function daysBetween(a: string, b: string): number {
  const ms = new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime();
  return Math.round(ms / 86_400_000);
}

const QUEST_TEMPLATES = [
  { quest_key: "show_up", label: "Show up today", target: 1, reward_tokens: 3, reward_xp: 5 },
  { quest_key: "open_book", label: "Open a story", target: 1, reward_tokens: 5, reward_xp: 10 },
  { quest_key: "read_10", label: "Read for 10 minutes", target: 10, reward_tokens: 8, reward_xp: 15 },
];

/**
 * Loads (and rolls forward) a user's gamification state: ensures a stats row,
 * applies the daily streak transition, regenerates tokens over time, and seeds
 * today's quests. Idempotent within a day.
 */
function defaultStats(userId: string): Stats {
  const now = new Date().toISOString();
  return {
    user_id: userId,
    streak_count: 1,
    longest_streak: 1,
    last_active_date: todayStr(),
    streak_broken: false,
    tokens: 20,
    tokens_updated_at: now,
    xp: DAILY_XP,
    weekly_xp: DAILY_XP,
    league: "Bronze",
    updated_at: now,
  };
}

export async function loadGamification(userId: string): Promise<{ stats: Stats; quests: Quest[] }> {
  const supabase = await createClient();
  const today = todayStr();

  const first = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  // Tables not migrated yet (or any read error): render safe defaults so /home works.
  if (first.error) {
    return { stats: defaultStats(userId), quests: [] };
  }
  let stats = first.data;

  if (!stats) {
    const { data: created } = await supabase
      .from("user_stats")
      .insert({ user_id: userId, streak_count: 1, longest_streak: 1, last_active_date: today, tokens: 20, xp: DAILY_XP, weekly_xp: DAILY_XP })
      .select("*")
      .single();
    stats = created;
  } else {
    const patch: Partial<Stats> = {};

    // --- token regen ---
    const elapsedMin = (Date.now() - new Date(stats.tokens_updated_at).getTime()) / 60000;
    const regen = Math.floor(elapsedMin / TOKEN_REGEN_MINUTES);
    if (regen > 0 && stats.tokens < TOKEN_CAP) {
      patch.tokens = Math.min(TOKEN_CAP, stats.tokens + regen);
      patch.tokens_updated_at = new Date().toISOString();
    }

    // --- streak transition (once per day) ---
    if (stats.last_active_date !== today) {
      const gap = stats.last_active_date ? daysBetween(stats.last_active_date, today) : 999;
      if (gap === 1) {
        patch.streak_count = stats.streak_count + 1;
        patch.streak_broken = false;
      } else {
        // Missed a day (or first visit after a lapse): streak resets, sad koala.
        patch.streak_count = 1;
        patch.streak_broken = stats.last_active_date != null;
      }
      patch.longest_streak = Math.max(stats.longest_streak, patch.streak_count ?? stats.streak_count);
      patch.last_active_date = today;
      patch.xp = stats.xp + DAILY_XP;
      patch.weekly_xp = stats.weekly_xp + DAILY_XP;
      patch.league = leagueFor(stats.weekly_xp + DAILY_XP);
    }

    if (Object.keys(patch).length > 0) {
      const { data: updated } = await supabase
        .from("user_stats")
        .update(patch)
        .eq("user_id", userId)
        .select("*")
        .single();
      if (updated) stats = updated;
    }
  }

  // --- ensure today's quests ---
  const { data: existing } = await supabase
    .from("daily_quests")
    .select("*")
    .eq("user_id", userId)
    .eq("quest_date", today)
    .order("id");

  let quests = (existing ?? []) as Quest[];
  if (quests.length === 0) {
    const rows = QUEST_TEMPLATES.map((t) => ({
      user_id: userId,
      quest_date: today,
      quest_key: t.quest_key,
      label: t.label,
      target: t.target,
      reward_tokens: t.reward_tokens,
      reward_xp: t.reward_xp,
      // "show up" auto-completes on load.
      progress: t.quest_key === "show_up" ? t.target : 0,
      completed: t.quest_key === "show_up",
    }));
    const { data: created } = await supabase.from("daily_quests").insert(rows).select("*").order("id");
    quests = (created ?? []) as Quest[];
  }

  return { stats: stats as Stats, quests };
}

/** Mark a single-step daily quest complete (best-effort; used to wire real actions). */
export async function completeQuest(userId: string, questKey: string): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase
      .from("daily_quests")
      .update({ completed: true, progress: 1 })
      .eq("user_id", userId)
      .eq("quest_date", todayStr())
      .eq("quest_key", questKey)
      .eq("completed", false);
  } catch {
    /* best effort — never block reading */
  }
}

/** Spend one reading token (energy). Fail-open if stats are unavailable. */
export async function trySpendToken(userId: string): Promise<{ ok: boolean; tokens: number }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("user_stats")
      .select("tokens")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return { ok: true, tokens: TOKEN_CAP }; // not migrated → never block
    if (data.tokens <= 0) return { ok: false, tokens: 0 };
    await supabase.from("user_stats").update({ tokens: data.tokens - 1 }).eq("user_id", userId);
    return { ok: true, tokens: data.tokens - 1 };
  } catch {
    return { ok: true, tokens: TOKEN_CAP };
  }
}

/** Recovery: clear the broken-streak flag once the reader gets back to reading. */
export async function clearStreakBroken(userId: string): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase
      .from("user_stats")
      .update({ streak_broken: false })
      .eq("user_id", userId)
      .eq("streak_broken", true);
  } catch {
    /* best effort */
  }
}

export function minutesToNextToken(tokensUpdatedAt: string): number {
  const elapsedMin = (Date.now() - new Date(tokensUpdatedAt).getTime()) / 60000;
  const rem = TOKEN_REGEN_MINUTES - (elapsedMin % TOKEN_REGEN_MINUTES);
  return Math.max(1, Math.ceil(rem));
}
