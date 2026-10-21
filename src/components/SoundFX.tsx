"use client";

import { useEffect } from "react";
import { play, type Sfx } from "@/lib/sound";

// One listener for the whole site (landing page included): buttons click,
// inputs make a soft pencil tick when you tap into them, switches flick.
// Opt an element out with data-sound="off"; pick a sound with data-sound="pop".
// Components can also fire a sound: window.dispatchEvent(new CustomEvent("leep:sfx", { detail: "success" })).
const PRESSABLE = "button, .btn, [role=button], [role=tab], [role=radio], [role=switch], [role=menuitem], summary, a";
const TYPEABLE = "input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):not([type=hidden]), textarea, select, [contenteditable=true]";
const NAMED: Sfx[] = ["tap", "press", "focus", "toggle", "success", "error", "swoosh", "pop"];

function chosen(el: Element): Sfx | "off" | null {
  const host = el.closest("[data-sound]");
  const v = host?.getAttribute("data-sound");
  if (v === "off") return "off";
  return v && (NAMED as string[]).includes(v) ? (v as Sfx) : null;
}

export default function SoundFX() {
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const t = e.target as Element | null;
      const el = t?.closest?.(PRESSABLE);
      if (!el || (el as HTMLButtonElement).disabled || el.getAttribute("aria-disabled") === "true") return;
      const pick = chosen(el);
      if (pick === "off") return;
      if (pick) return play(pick);
      if (el.matches(".btn-gold, .btn-primary, [type=submit]")) play("press");
      else play("tap");
    };
    const onFocus = (e: FocusEvent) => {
      const t = e.target as Element | null;
      if (!t?.matches?.(TYPEABLE)) return;
      if (chosen(t) === "off") return;
      play("focus");
    };
    const onChange = (e: Event) => {
      const t = e.target as HTMLInputElement | null;
      if (!t || t.tagName !== "INPUT" || (t.type !== "checkbox" && t.type !== "radio")) return;
      if (chosen(t) === "off") return;
      play("toggle");
    };
    const onNamed = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if ((NAMED as string[]).includes(d)) play(d as Sfx);
    };
    document.addEventListener("pointerdown", onDown, { passive: true, capture: true });
    document.addEventListener("focusin", onFocus);
    document.addEventListener("change", onChange);
    window.addEventListener("leep:sfx", onNamed);
    return () => {
      document.removeEventListener("pointerdown", onDown, { capture: true } as EventListenerOptions);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("change", onChange);
      window.removeEventListener("leep:sfx", onNamed);
    };
  }, []);
  return null;
}

export function sfx(s: Sfx) {
  try { window.dispatchEvent(new CustomEvent("leep:sfx", { detail: s })); } catch { /* ignore */ }
}
