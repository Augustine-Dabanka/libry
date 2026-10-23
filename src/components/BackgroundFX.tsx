"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Glyph from "@/components/Glyph";

export type BgKind = "none" | "shapes" | "books" | "clouds";

const GLYPHS: Record<Exclude<BgKind, "none">, string[]> = {
  shapes: ["◆", "●", "▲", "■", "✦", "◗"],
  books: ["📖", "📕", "📚", "✒", "📖", "📘"],
  clouds: ["☁", "☁", "✧", "·", "❃", "☾"],
};

// Ambient, opt-in animated background. Low opacity, never captures pointer,
// and stays off the reader so it can't distract from prose.
export default function BackgroundFX() {
  const [kind, setKind] = useState<BgKind>("none");
  const pathname = usePathname();

  useEffect(() => {
    const read = () => {
      try {
        const saved = localStorage.getItem("libry-bg");
        setKind(saved === "shapes" || saved === "books" || saved === "clouds" ? saved : "none");
      } catch {}
    };
    read();
    const onChange = () => read();
    const syncVisibility = () => {
      if (document.hidden) document.documentElement.setAttribute("data-page-hidden", "true");
      else document.documentElement.removeAttribute("data-page-hidden");
    };
    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);
    window.addEventListener("libry:bg", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("libry:bg", onChange);
      window.removeEventListener("storage", onChange);
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, []);

  if (kind === "none" || !GLYPHS[kind] || pathname?.startsWith("/reader")) return null;

  const glyphs = GLYPHS[kind];
  const items = Array.from({ length: 12 }, (_, i) => ({
    glyph: glyphs[i % glyphs.length],
    left: (i * 53) % 100,
    size: 18 + ((i * 13) % 30),
    dur: 16 + ((i * 7) % 20),
    delay: -((i * 11) % 24),
  }));

  return (
    <div aria-hidden="true" className="bgfx">
      {items.map((it, i) => (
        <span
          key={i}
          className="bgfx-item"
          style={{
            left: `${it.left}%`,
            fontSize: `${it.size}px`,
            animationDuration: `${it.dur}s`,
            animationDelay: `${it.delay}s`,
          }}
        >
          <Glyph e={it.glyph} fallback={null} size="1em" />
        </span>
      ))}
    </div>
  );
}
