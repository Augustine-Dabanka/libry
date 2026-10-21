"use client";

import { useEffect, useState } from "react";
import { getGuestBooks, getGuestPrefs } from "@/lib/guest";

// Loss aversion, honestly: a guest who has started reading has something real
// to lose (their place, their picks live only in this browser). Show it once
// they have, and offer the one-tap fix. Never shown to signed-in readers.
export default function GuestSaveBanner() {
  const [count, setCount] = useState(0);
  const [hasPicks, setHasPicks] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const n = getGuestBooks().length;
    const picks = Object.keys(getGuestPrefs()).length > 0;
    let dismissed = false;
    try { dismissed = sessionStorage.getItem("leep-guest-banner") === "0"; } catch {}
    setCount(n);
    setHasPicks(picks);
    setHidden(dismissed || (n === 0 && !picks));
  }, []);

  if (hidden) return null;
  const what = count > 0 ? `${count} book${count === 1 ? "" : "s"} you started` : "your picks";

  return (
    <div role="region" aria-label="Save your progress" className="guest-save">
      <div style={{ minWidth: 0 }}>
        <strong style={{ display: "block", fontWeight: 900 }}>Don&apos;t lose {what}.</strong>
        <span style={{ color: "var(--muted)", fontWeight: 600, fontSize: "0.85rem" }}>
          {hasPicks && count > 0 ? "Your place and picks" : count > 0 ? "Your place" : "They"} only live in this browser right now.
        </span>
      </div>
      <a className="btn btn-gold" href="/login?auth=signup&next=%2Fhome" style={{ minHeight: 40, padding: "0.5rem 0.9rem", fontSize: "0.88rem", whiteSpace: "nowrap" }}>Save it free</a>
      <button type="button" aria-label="Dismiss" onClick={() => { setHidden(true); try { sessionStorage.setItem("leep-guest-banner", "0"); } catch {} }}
        style={{ border: "none", background: "transparent", color: "var(--muted)", cursor: "pointer", fontSize: "1.2rem", lineHeight: 1, padding: "0.3rem" }}>×</button>
    </div>
  );
}
