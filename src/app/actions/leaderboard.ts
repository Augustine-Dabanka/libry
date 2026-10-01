"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Opt in or out of the public weekly leaderboard (off by default).
export async function setLeaderboardOptIn(on: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first." };
  const { data } = await supabase.from("profiles").select("prefs").eq("id", user.id).maybeSingle();
  const prefs = { ...((data?.prefs as Record<string, unknown>) ?? {}), leaderboard: on ? "on" : "off" };
  const { error } = await supabase.from("profiles").update({ prefs }).eq("id", user.id);
  if (error) return { error: "Couldn't save that. Try again." };
  revalidatePath("/leaderboard");
  return { ok: true };
}
