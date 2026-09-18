"use client";

import { useEffect, useState } from "react";

export type CreatorTab = { id: string; label: string; icon: string; node: React.ReactNode };

// A tabbed shell for the creator dashboard — turns the old single long scroll
// into a professional, sectioned workspace. Panels are server-rendered and
// passed in as nodes; we just toggle which one is visible (state kept per tab,
// remembered across reloads).
export default function CreatorTabs({ tabs }: { tabs: CreatorTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("libry-creator-tab");
      const fromHash = window.location.hash.replace("#", "");
      const want = fromHash || saved;
      if (want && tabs.some((t) => t.id === want)) setActive(want);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function go(id: string) {
    setActive(id);
    try {
      localStorage.setItem("libry-creator-tab", id);
      history.replaceState(null, "", `#${id}`);
    } catch {}
  }

  return (
    <div>
      {/* Desktop/tablet: a scrollable tab bar. */}
      <div className="ct-tabbar" role="tablist" aria-label="Creator sections">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={active === t.id}
            className={`ct-tab${active === t.id ? " active" : ""}`}
            onClick={() => go(t.id)}
          >
            <span aria-hidden="true" style={{ fontSize: "1rem" }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Mobile: a compact dropdown so the (many) tabs stay tidy. */}
      <select className="ct-tabselect" aria-label="Creator section" value={active} onChange={(e) => go(e.target.value)}>
        {tabs.map((t) => (
          <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
        ))}
      </select>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" hidden={active !== t.id}>
          {t.node}
        </div>
      ))}
    </div>
  );
}
