"use client";

import { useEffect, useState } from "react";

// Cookie-consent banner with persistent choice. Functional cookies are always on
// (the app needs them); the choice here is about analytical & performance ones.
// Stored per-browser in localStorage so it doesn't nag on every visit.
export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("libry-cookie-consent")) setShow(true);
    } catch {
      /* storage blocked — don't nag */
    }
  }, []);

  function decide(choice: "all" | "essential") {
    try {
      localStorage.setItem("libry-cookie-consent", choice);
      localStorage.setItem("libry-cookie-consent-at", new Date().toISOString());
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie consent" aria-live="polite">
      <div className="cookie-inner">
        <p>
          Libry uses <strong>functional</strong> cookies to keep you signed in and remember your reading. With your OK we also use{" "}
          <strong>analytical &amp; performance</strong> cookies to improve the app. See our <a href="/cookies">Cookie Policy</a>.
        </p>
        <div className="cookie-actions">
          <button type="button" className="btn btn-outline" onClick={() => decide("essential")}>
            Decline non-essential
          </button>
          <button type="button" className="btn btn-gold" onClick={() => decide("all")}>
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
