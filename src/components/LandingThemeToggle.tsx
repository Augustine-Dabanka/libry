"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

export default function LandingThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const sync = () => {
      let saved: Theme = "light";
      try {
        const value = localStorage.getItem("libry-theme");
        if (value === "dark" || value === "light") saved = value;
        else if (value === "system") {
          saved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
      } catch {}
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    };
    const frame = window.requestAnimationFrame(sync);
    window.addEventListener("storage", sync);
    window.addEventListener("libry:theme-change", sync);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("storage", sync);
      window.removeEventListener("libry:theme-change", sync);
    };
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("libry-theme", next); } catch {}
    window.dispatchEvent(new Event("libry:theme-change"));
  }

  const isDark = theme === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      className="landing-theme-toggle"
      onClick={toggle}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
    >
      <Icon size={18} strokeWidth={2.2} fill={isDark ? "currentColor" : "none"} aria-hidden="true" />
      <span>{isDark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}
