"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try { localStorage.setItem("libry-theme", theme); } catch {}
  window.dispatchEvent(new Event("libry:theme-change"));
}

export default function LandingThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const sync = () => {
      const saved = localStorage.getItem("libry-theme");
      setTheme(saved === "dark" ? "dark" : "light");
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

  const dark = theme === "dark";
  return (
    <button
      type="button"
      className="landing-theme-toggle"
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => {
        const next = dark ? "light" : "dark";
        setTheme(next);
        applyTheme(next);
      }}
    >
      {dark ? <Sun size={18} strokeWidth={2} aria-hidden="true" /> : <Moon size={18} strokeWidth={2} aria-hidden="true" />}
      <span>{dark ? "Light" : "Dark"} mode</span>
    </button>
  );
}
