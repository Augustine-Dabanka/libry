"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Mascot from "@/components/Mascot";

// Floating help button, bottom-right. The loop (CSS only, see .hb-* in
// globals.css): a "?" shows, the coin flips sideways to the koala with a "?"
// over its head, the "?" pops away and the koala waves, then it flips back.
// Hidden on the landing page, book pages and the reader (the reader already
// has its own companion button in that corner).
const HIDE_EXACT = ["/"];
const HIDE_PREFIX = ["/book/", "/b/", "/reader", "/links", "/ad"];

const LINKS = [
  { href: "/docs", title: "Guides & FAQ", sub: "How reading, coins and publishing work" },
  { href: "/contact?topic=support", title: "Contact support", sub: "Account, reading or anything else" },
  { href: "/contact?topic=refund", title: "Payment problem", sub: "Charged but nothing unlocked, refunds" },
  { href: "/contact?topic=safety", title: "Report something", sub: "Content, a user, or appeal a decision" },
];

export default function HelpButton() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("pointerdown", onDown); };
  }, [open]);

  if (HIDE_EXACT.includes(pathname) || HIDE_PREFIX.some((p) => pathname.startsWith(p))) return null;

  return (
    <div ref={wrap} className="hb-wrap">
      {open ? (
        <div id="help-panel" role="dialog" aria-label="Help" className="hb-panel">
          <div className="hb-panel-head">
            <span className="hb-panel-koala"><Mascot crop="head" mood="wave" size={48} /></span>
            <div>
              <strong>Need a hand?</strong>
              <span>Pick what fits and we&apos;ll take it from there.</span>
            </div>
          </div>
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="hb-link">
              <strong>{l.title}</strong>
              <span>{l.sub}</span>
            </a>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        className={`hb-fab${open ? " is-open" : ""}`}
        aria-label={open ? "Close help" : "Help and support"}
        aria-expanded={open}
        aria-controls="help-panel"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="hb-coin">
          <span className="hb-face hb-front" aria-hidden="true">?</span>
          <span className="hb-face hb-back">
            <Mascot crop="head" mood="idle" size={50} />
            <span className="hb-idk" aria-hidden="true">?</span>
          </span>
        </span>
      </button>
    </div>
  );
}
