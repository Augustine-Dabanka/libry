"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/supabase/service";
import { createClient as createPlainClient } from "@supabase/supabase-js";

// Mature (18+) content. Turning it OFF is one tap. Turning it ON needs the
// reader to prove it's them (password again, or a recent sign-in for Google /
// Discord accounts) and, the first time, a date of birth showing 18+. The date
// is checked by the database (set_mature, 0045) and never stored. Only the
// service role can call set_mature, so this can't be skipped from the browser.
export type MatureResult = {
  ok?: boolean;
  error?: string;
  needsBirth?: boolean;
  needsPassword?: boolean;
  needsRecentSignIn?: boolean;
};

const RECENT_SIGN_IN_MS = 15 * 60 * 1000;

function revalidateReading() {
  revalidatePath("/settings");
  revalidatePath("/home");
  revalidatePath("/catalog");
  revalidatePath("/discover");
}

export async function setShowMature(value: boolean, opts: { password?: string; birth?: string } = {}): Promise<MatureResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first." };

  if (!value) {
    const { error } = await supabase.from("profiles").update({ show_mature: false }).eq("id", user.id);
    if (error) return { error: "Couldn't save that. Try again." };
    revalidateReading();
    return { ok: true };
  }

  const svc = serviceClient();
  if (!svc) return { error: "This setting isn't available yet." };

  // 1) Prove it's really the account owner.
  const providers = ((user.app_metadata?.providers as string[] | undefined) ?? [user.app_metadata?.provider as string]).filter(Boolean);
  const hasPassword = providers.includes("email") && !!user.email;
  if (hasPassword) {
    if (!opts.password) return { needsPassword: true };
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return { error: "This setting isn't available yet." };
    // A throwaway client, so checking the password never touches the real session cookies.
    const check = createPlainClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await check.auth.signInWithPassword({ email: user.email!, password: opts.password });
    if (error || data.user?.id !== user.id) return { error: "That password isn't right.", needsPassword: true };
    await check.auth.signOut().catch(() => {});
  } else {
    const last = user.last_sign_in_at ? Date.parse(user.last_sign_in_at) : 0;
    if (!last || Date.now() - last > RECENT_SIGN_IN_MS) return { needsRecentSignIn: true };
  }

  // 2) Age check (first time only) + switch on, enforced in the database.
  const birth = opts.birth && /^\d{4}-\d{2}-\d{2}$/.test(opts.birth) ? opts.birth : null;
  const { data, error } = await svc.rpc("set_mature", { p_user: user.id, p_on: true, p_birth: birth });
  if (error) return { error: "Couldn't save that. Try again." };
  const row = (Array.isArray(data) ? data[0] : data) as { ok?: boolean; message?: string } | null;
  if (!row?.ok) {
    const msg = row?.message || "Couldn't turn that on.";
    return { error: msg, needsBirth: /date of birth/i.test(msg) && !birth };
  }
  revalidateReading();
  return { ok: true };
}
