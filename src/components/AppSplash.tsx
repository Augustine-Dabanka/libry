"use client";

import { useEffect, useState } from "react";

// First-load splash: a branded intro shown the moment the app opens (typing the
// URL / a full reload), so the very first thing a visitor sees is Libry rather
// than a blank page. Rotates a few "sneak peek" tips, then fades out. It renders
// in the initial HTML (so it appears before hydration) and a CSS animation also
// auto-hides it, so it disappears even if JS is slow. It does NOT re-show on
// in-app navigation (the root layout persists).

const TIPS = [
  "✦ Sneak peek — interactive stories that branch with every choice",
  "Tip: build a community around a story you love",
  "Sneak peek — comics you can read panel by panel",
  "Creators keep 65%, shown openly on a live dashboard",
  "Your place is saved on every device you read on",
];

export default function AppSplash() {
  const [gone, setGone] = useState(false);
  const [tip, setTip] = useState(0);

  useEffect(() => {
    // Skip the intro on repeat loads within the same session.
    let already = false;
    try { already = sessionStorage.getItem("libry-splashed") === "1"; } catch { already = false; }
    if (already) { setGone(true); return; }
    try { sessionStorage.setItem("libry-splashed", "1"); } catch { /* private mode */ }

    // The visual fade is a CSS animation (so it hides even if JS is slow); this
    // just unmounts the node once that animation has finished.
    const rot = setInterval(() => setTip((t) => (t + 1) % TIPS.length), 1100);
    const end = setTimeout(() => setGone(true), 2500);
    return () => { clearInterval(rot); clearTimeout(end); };
  }, []);

  if (gone) return null;

  return (
    <div className="app-splash" role="status" aria-label="Loading Libry">
      <div className="as-inner">
        <div className="as-mark" aria-hidden="true">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-3.2L5 20V5a1 1 0 0 1 1-1Z" />
          </svg>
          <span>Libry<i>.</i></span>
        </div>
        <div className="libry-bar" aria-hidden="true" />
        <div className="as-tip" key={tip}>{TIPS[tip]}</div>
      </div>
    </div>
  );
}
