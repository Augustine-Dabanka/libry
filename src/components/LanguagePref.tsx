"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const LANGS: { v: string; label: string }[] = [
  { v: "en", label: "English" },
  { v: "es", label: "Español" },
  { v: "fr", label: "Français" },
  { v: "pt", label: "Português" },
  { v: "sw", label: "Kiswahili" },
];

// Saves a preferred language onto the profile (drives future localisation +
// recommendations). Mirrors the old build's language setting.
export default function LanguagePref({ userId, initial }: { userId: string; initial: string }) {
  const [lang, setLang] = useState(initial || "en");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem("libry-lang");
      if (v) setLang(v);
    } catch {}
  }, []);

  async function change(v: string) {
    setLang(v);
    setMsg(null);
    try {
      localStorage.setItem("libry-lang", v);
    } catch {}
    // Persist to the profile when the column exists; the localStorage copy above
    // always applies. A missing `language` column just returns an ignored error.
    const supabase = createClient();
    await supabase.from("profiles").update({ language: v }).eq("id", userId);
    setMsg("Saved ✓");
    setTimeout(() => setMsg(null), 1500);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" }}>
      <select
        value={lang}
        onChange={(e) => change(e.target.value)}
        style={{
          padding: "0.7rem 0.9rem",
          background: "var(--charcoal)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          color: "var(--ivory)",
          fontFamily: "var(--sans)",
          fontSize: "0.95rem",
          cursor: "pointer",
          minWidth: 180,
        }}
      >
        {LANGS.map((l) => (
          <option key={l.v} value={l.v}>{l.label}</option>
        ))}
      </select>
      {msg ? <span style={{ color: "#7DBE86", fontSize: "0.82rem", fontFamily: "var(--sans)" }}>{msg}</span> : null}
    </div>
  );
}
