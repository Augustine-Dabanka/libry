"use client";

import { useEffect, useState } from "react";

// Brief branded splash on initial load: "Libry." pulses, then fades out.
export default function Splash() {
  const [gone, setGone] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 850);
    const t2 = setTimeout(() => setGone(true), 1450);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "grid",
        placeItems: "center",
        background: "#1C1917",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.6s ease",
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      <span
        style={{
          fontFamily: "var(--serif, 'Fraunces', Georgia, serif)",
          fontStyle: "italic",
          fontWeight: 500,
          fontSize: "clamp(2.6rem, 11vw, 4.6rem)",
          color: "#FAF7F2",
          animation: "librySplashPulse 1.2s ease-in-out infinite",
        }}
      >
        Libry<span style={{ color: "#C4A35A" }}>.</span>
      </span>
      <style>{`@keyframes librySplashPulse{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.08);opacity:1}}`}</style>
    </div>
  );
}
