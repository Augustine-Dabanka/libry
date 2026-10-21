"use client";

import { useEffect, useState, type ReactNode } from "react";

// Settings in tabs. All panels are rendered on the server; this only shows
// one at a time and keeps the choice in the URL hash (#security etc.), so a
// link like /settings#security opens the right tab.
export type SettingsTab = { key: string; label: string; short?: string; icon: ReactNode; content: ReactNode };

export default function SettingsTabs({ tabs }: { tabs: SettingsTab[] }) {
  const [cur, setCur] = useState(tabs[0]?.key ?? "");
  useEffect(() => {
    const read = () => {
      const h = window.location.hash.replace("#", "");
      if (tabs.some((t) => t.key === h)) setCur(h);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [tabs]);

  function go(k: string) {
    setCur(k);
    try { history.replaceState(null, "", `#${k}`); } catch { /* ignore */ }
  }

  return (
    <>
      <div className="st-tabs" role="tablist" aria-label="Settings sections">
        {tabs.map((t) => (
          <button key={t.key} id={`st-tab-${t.key}`} type="button" role="tab" className="st-tab" aria-label={t.label} aria-selected={cur === t.key} aria-controls={`st-panel-${t.key}`} onClick={() => go(t.key)}>
            <span aria-hidden="true" style={{ display: "inline-grid" }}>{t.icon}</span>
            <span className="st-long">{t.label}</span>
            <span className="st-short" aria-hidden="true">{t.short ?? t.label}</span>
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.key} id={`st-panel-${t.key}`} role="tabpanel" aria-labelledby={`st-tab-${t.key}`} hidden={cur !== t.key} className={cur === t.key ? "st-panel" : undefined}>
          {t.content}
        </div>
      ))}
    </>
  );
}
