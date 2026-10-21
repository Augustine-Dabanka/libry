"use client";

import { useEffect, useState } from "react";
import KoalaAvatar from "@/components/KoalaAvatar";
import SeasonalScene, { useSeason } from "@/components/SeasonalScene";
import { createClient } from "@/lib/supabase/client";
import { greet } from "@/lib/greeting";
import { play } from "@/lib/sound";

// The welcome after signing in or up: a sheet of frosted glass over the app,
// with the reader's koala and the day's greeting. The real page loads
// underneath, blurred; when it's ready the glass lifts (blur clears, the card
// floats up and fades) so you land on Home in one continuous motion.
//
// Shown ONLY right after sign-up / log-in: LoginGate and /auth/callback set a
// short-lived `leep_splash` cookie, and the inline script in layout.tsx turns
// it into <html class="leep-splash"> before the first paint. It stays exactly
// as long as the page takes to load (at least ~1.2s so it can be read, at most
// 7s). A CSS failsafe hides it after 9s even if JS never runs.

export const SPLASH_COOKIE = "leep_splash";
const WELCOME_KEY = "leep-welcome";

// Call right before navigating into the app after sign-up / log-in. Pass what
// we already know so the greeting is instant on the next page.
export function armWelcomeSplash(who?: { name?: string | null; dob?: string | null; look?: unknown }) {
  try { document.cookie = `${SPLASH_COOKIE}=1; Max-Age=60; Path=/; SameSite=Lax`; } catch { /* ignore */ }
  if (who) { try { sessionStorage.setItem(WELCOME_KEY, JSON.stringify(who)); } catch { /* ignore */ } }
  // Bring the glass up now, on this page, so there's no gap before the next one.
  try {
    document.documentElement.classList.add("leep-splash");
    window.dispatchEvent(new CustomEvent("leep:welcome"));
  } catch { /* ignore */ }
}

type Who = { name: string; dob: string | null; look: unknown };

function SplashHero({ look }: { look: unknown }) {
  const { season } = useSeason();
  if (season) return <SeasonalScene />;
  return <KoalaAvatar look={look} size={124} mood="wave" />;
}

export default function AppSplash() {
  const [active, setActive] = useState(false);
  const [who, setWho] = useState<Who | null>(null);

  useEffect(() => {
    const html = document.documentElement;
    let cleanup: (() => void) | undefined;

    const run = (stayUntilUnload: boolean) => {
      setActive(true);
      // Greeting: what the sign-in page handed over, else ask the database.
      try {
        const raw = sessionStorage.getItem(WELCOME_KEY);
        if (raw) { const o = JSON.parse(raw); setWho({ name: o.name || "", dob: o.dob ?? null, look: o.look ?? null }); }
      } catch { /* ignore */ }
      (async () => {
        try {
          const sb = createClient();
          const { data: { user } } = await sb.auth.getUser();
          if (!user) return;
          const [p, pv] = await Promise.all([
            sb.from("profiles").select("full_name, username, avatar").eq("id", user.id).maybeSingle(),
            sb.from("profile_private").select("date_of_birth").eq("user_id", user.id).maybeSingle(),
          ]);
          const pd = p.data as { full_name?: string; username?: string; avatar?: unknown } | null;
          const next: Who = { name: pd?.full_name || pd?.username || "", dob: (pv.data as { date_of_birth?: string } | null)?.date_of_birth ?? null, look: pd?.avatar ?? null };
          setWho(next);
          try { sessionStorage.setItem(WELCOME_KEY, JSON.stringify(next)); } catch { /* ignore */ }
        } catch { /* keep the generic welcome */ }
      })();
      if (stayUntilUnload) return; // this page is about to navigate away

      let done = false;
      const started = performance.now();
      const MIN = 1200, MAX = 7000;
      const hide = () => {
        if (done) return;
        done = true;
        play("swoosh");
        html.classList.add("leep-splash-out");
        window.setTimeout(() => {
          html.classList.remove("leep-splash", "leep-splash-out");
          setActive(false);
          try { sessionStorage.removeItem(WELCOME_KEY); } catch { /* ignore */ }
        }, 700);
      };
      const loaded = document.readyState === "complete" ? Promise.resolve() : new Promise<void>((r) => window.addEventListener("load", () => r(), { once: true }));
      const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready ?? Promise.resolve();
      const painted = new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
      Promise.all([loaded, fonts, painted]).then(() => window.setTimeout(hide, Math.max(0, MIN - (performance.now() - started))));
      const cap = window.setTimeout(hide, MAX);
      cleanup = () => clearTimeout(cap);
    };

    if (html.classList.contains("leep-splash")) run(false);
    const onArm = () => run(true);
    window.addEventListener("leep:welcome", onArm);
    return () => { window.removeEventListener("leep:welcome", onArm); cleanup?.(); };
  }, []);

  const g = who?.name ? greet(who.name, { dob: who.dob }) : null;

  return (
    <div className="app-splash" role="status" aria-label="Signing you in" aria-hidden={active ? undefined : true}>
      <span className="as-orb as-orb-a" aria-hidden="true" />
      <span className="as-orb as-orb-b" aria-hidden="true" />
      <span className="as-orb as-orb-c" aria-hidden="true" />
      <div className="as-glass">
        {active ? <SplashHero look={who?.look ?? null} /> : null}
        <p className="as-hello" key={g?.line ?? "x"}>
          {g ? <>{g.line}{g.emoji ? <span aria-hidden="true"> {g.emoji}</span> : null}</> : "Welcome to Lybry"}
        </p>
        <p className="as-sub">Getting your shelf ready</p>
        <span className="as-dots" aria-hidden="true"><i /><i /><i /></span>
      </div>
    </div>
  );
}
