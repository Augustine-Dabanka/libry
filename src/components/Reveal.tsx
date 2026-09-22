"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

// A gentle scroll-reveal used to give rails and sections a "slick" entrance
// without a redesign. Content is fully visible at rest for anyone with reduced
// motion (or no JS) — the animation only eases it in when it scrolls into view.
export default function Reveal({
  children,
  delay = 0,
  y = 14,
  className,
  style,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className} style={style}>{children}</div>;
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
