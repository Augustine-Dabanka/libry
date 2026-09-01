"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// After an email sign-up/sign-in, move any onboarding answers held in the
// libry_prefs cookie into the new profile (Google sign-in does this in the
// OAuth callback; email auth happens client-side, so we do it here).
export async function persistOnboardingPrefs() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("libry_prefs")?.value;
  if (!raw) return;
  let prefs: Record<string, string>;
  try {
    prefs = JSON.parse(decodeURIComponent(raw));
  } catch {
    return;
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("profiles").update({ prefs }).eq("id", user.id);
  }
  cookieStore.delete("libry_prefs");
}
