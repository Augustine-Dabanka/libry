"use client";

import { useState, useTransition } from "react";
import { setShowMature } from "@/app/actions/settings";

export default function MatureToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();

  function toggle() {
    const next = !on;
    setOn(next);
    start(() => setShowMature(next));
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={toggle}
      disabled={pending}
      style={{
        width: 52,
        height: 30,
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        background: on ? "var(--gold)" : "var(--stone-light)",
        position: "relative",
        transition: "background 0.2s ease",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: on ? 25 : 3,
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: on ? "#20180a" : "var(--ivory)",
          transition: "left 0.2s cubic-bezier(0.68,-0.55,0.265,1.55)",
        }}
      />
    </button>
  );
}
