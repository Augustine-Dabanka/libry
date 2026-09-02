"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export type BgKind = "none" | "shapes" | "books" | "clouds";

const GLYPHS: Record<Exclude<BgKind, "none">, string[]> = {
  shapes: ["◆", "●", "▲", "■", "✦", "◗"],
  books: ["📖", "📕", "📗", "📘", "📚", "✒️"],
  clouds: ["☁️", "☁", "✧", "·", "❃", "☾"],
};

// Ambient, opt-in animated background. Low opacity, never captures pointer,
// and stays off the reader so it can't distract from prose.
export default function BackgroundFX() {
  const [kind, setKind] = useState<BgKind>("none");
  const pathname = usePathname();

  useEffect(() => {
    const read = () => {
      try {
        setKind((localStorage.getItem("libry-bg") as BgKind) || "none");
      } catch {}
    };
    read();
    const onChange = () => read();
    window.addEventListener("libry:bg", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("libry:bg", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  if (kind === "none" || pathname?.startsWith("/reader")) return null;

  const glyphs = GLYPHS[kind];
  const items = Array.from({ length: 18 }, (_, i) => ({
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
          {it.glyph}
        </span>
      ))}
    </div>
  );
}
