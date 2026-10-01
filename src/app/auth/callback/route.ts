import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// OAuth callback: Supabase redirects here with a `code` after Google sign-in.
// We exchange it for a session (stored in httpOnly cookies), persist any
// onboarding answers the guest picked before signing up, then redirect on.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Only same-site paths. "@evil.com" or ".evil.com" would otherwise be glued
  // onto our domain and send people to another site after signing in.
  const rawNext = searchParams.get("next") ?? "/";
  const next = /^\/(?![\/\\])[^\s]*$/.test(rawNext) ? rawNext : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await persistOnboardingPrefs();
      await persistReferral();
      await persistRole();

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}

// If the visitor completed onboarding before signing up, their answers are in
// a `libry_prefs` cookie. Move them into the profile, then clear the cookie.
async function persistOnboardingPrefs() {
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

// If the visitor chose "I'm a writer" before an OAuth sign-up, a libry_role
// cookie flags them — mark the profile as a creator (never downgrades).
async function persistRole() {
  const cookieStore = await cookies();
  const role = cookieStore.get("libry_role")?.value;
  if (role !== "writer") return;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const name = (user.user_metadata?.full_name || user.user_metadata?.name || "") as string;
    const patch: Record<string, unknown> = { is_creator: true };
    if (name) patch.pen_name = name;
    try {
      await supabase.from("profiles").update(patch).eq("id", user.id);
    } catch {
      /* is_creator/pen_name not migrated yet — ignore */
    }
  }
  cookieStore.delete("libry_role");
}

// If the visitor arrived via a referral link, a libry_ref cookie holds the
// referrer's id/username — record it after sign-in, then clear it.
async function persistReferral() {
  const cookieStore = await cookies();
  const ref = cookieStore.get("libry_ref")?.value;
  if (!ref) return;
  const supabase = await createClient();
  try {
    await supabase.rpc("record_referral", { referrer: decodeURIComponent(ref) });
  } catch {
    /* referral function not migrated yet — ignore */
  }
  cookieStore.delete("libry_ref");
}
