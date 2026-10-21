"use client";

import { useEffect, useRef, useState } from "react";

// A 15-second silent loop of the real app (onboarding → make your bushbaby →
// free trial), ~160 KB. It only starts downloading when it scrolls into view,
// pauses when it leaves, and shows a still frame for reduced-motion readers.
export default function PreviewClip() {
  const ref = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | undefined>(undefined);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduce(rm);
    const el = ref.current;
    if (!el || rm) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSrc("/media/preview.mp4");
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div style={{ width: "min(280px, 78vw)", aspectRatio: "360 / 780", borderRadius: 36, border: "9px solid #1D1A17", overflow: "hidden", background: "#FFFCF7", boxShadow: "0 8px 0 rgba(29,26,23,0.18), 0 24px 48px rgba(29,26,23,0.16)", maxWidth: "100%" }}>
      <video
        ref={ref}
        src={reduce ? undefined : src}
        poster="/media/preview-poster.jpg"
        muted
        loop
        playsInline
        preload="none"
        aria-label="A 14-second look at Lybry: picking genres, making a bushbaby, starting the free trial"
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  );
}
