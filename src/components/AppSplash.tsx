"use client";

import { useEffect, useState } from "react";
import LibryLoader from "@/components/LibryLoader";
import Mascot from "@/components/Mascot";
import SeasonalScene, { useSeason } from "@/components/SeasonalScene";

// Welcome splash. Shows ONLY right after someone signs up or logs in (never on
// the landing page or ordinary visits): LoginGate and /auth/callback set a
// short-lived `leep_splash` cookie, and the inline script in layout.tsx turns
// it into <html class="leep-splash"> before the first paint, so the overlay is
// there instantly. It then stays exactly as long as the page really takes to
// load (window load + fonts + first paint), at least ~0.9s so it doesn't
// flash, at most 7s. A CSS failsafe hides it after 9s even if JS never runs.

const TIPS = [
  "Setting up your library…",
  "Interactive stories branch with every choice",
  "Your place is saved on every device",
  "Creators keep 65%, shown openly",
];

export const SPLASH_COOKIE = "leep_splash";

// Call right before navigating into the app after sign-up / log-in.
export function armWelcomeSplash() {
  try { document.cookie = `${SPLASH_COOKIE}=1; Max-Age=60; Path=/; SameSite=Lax`; } catch { /* ignore */ }
}

function SplashHero() {
  const { season } = useSeason();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ height: 150 }} />;
  if (season) return <SeasonalScene />;
  return <Mascot mood="wave" size={130} />;
}

export default function AppSplash() {
  const [active, setActive] = useState(false);
  const [tip, setTip] = useState(0);

  useEffect(() => {
    const html = document.documentElement;
    if (!html.classList.contains("leep-splash")) return;
    setActive(true);
    let done = false;
    const started = performance.now();
    const MIN = 900, MAX = 7000;

    const hide = () => {
      if (done) return;
      done = true;
      html.classList.add("leep-splash-out");
      window.setTimeout(() => html.classList.remove("leep-splash", "leep-splash-out"), 420);
    };
    const loaded = document.readyState === "complete"
      ? Promise.resolve()
      : new Promise<void>((r) => window.addEventListener("load", () => r(), { once: true }));
    const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready ?? Promise.resolve();
    const painted = new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

    Promise.all([loaded, fonts, painted]).then(() => {
      const wait = Math.max(0, MIN - (performance.now() - started));
      window.setTimeout(hide, wait);
    });
    const cap = window.setTimeout(hide, MAX);
    const rot = window.setInterval(() => setTip((t) => (t + 1) % TIPS.length), 1400);
    return () => { clearTimeout(cap); clearInterval(rot); };
  }, []);

  return (
    <div className="app-splash" role="status" aria-label="Loading Leep" aria-hidden={active ? undefined : true}>
      <div className="as-inner">
        {active ? <SplashHero /> : null}
        <LibryLoader size={46} label="Loading Leep" />
        <div className="libry-bar" aria-hidden="true" />
        <div className="as-tip" key={tip}>{TIPS[tip]}</div>
      </div>
    </div>
  );
}
