"use client";

import { useEffect, useId, useRef, useState } from "react";

// Leep's koala, v3 ("2.5D").
// - Volume: every part is shaded with a radial gradient lit from the top-left,
//   plus contact shadows (head on body, body on floor) and glossy highlights.
// - Depth: the whole figure tilts in 3D toward your finger/mouse (or the
//   tablet's tilt sensor), and its layers move by different amounts
//   (parallax: ears < head < face), so the head seems to turn.
// - Springs: everything eases toward its target with a little overshoot, so
//   it never snaps. Press = squash, release = stretch + cheer, mood change = pop.
// All motion is transform/opacity; the spring loop only runs while moving.
//
//   <Mascot mood="wave" size={140} />
//   <Mascot mood="idle" follow interactive />   tilts/looks at pointer, tap = cheer
//   <Mascot crop="head" />                      head-and-shoulders framing
export type MascotMood = "idle" | "wave" | "cheer" | "think" | "sad";
export type MascotHat = "santa" | "witch" | "bunny" | "party" | "ghana" | "heart";

const INK = "#283040";

export default function Mascot({
  mood = "idle",
  size = 120,
  crop = "full",
  follow = false,
  interactive = false,
  prop,
  hat,
  className,
  label,
}: {
  mood?: MascotMood;
  size?: number;
  crop?: "full" | "head";
  follow?: boolean;
  interactive?: boolean;
  prop?: "magnifier" | "book";
  hat?: MascotHat;
  className?: string;
  label?: string;
}) {
  const uid = "m" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const u = (n: string) => `url(#${uid}-${n})`;
  const [burst, setBurst] = useState(false);
  const [pop, setPop] = useState(false);
  const [pressed, setPressed] = useState(false);
  const stage = useRef<HTMLSpanElement>(null);
  const shown: MascotMood = burst ? "cheer" : mood;

  // Spring-follow: target (tx,ty) in -1..1, current (x,y) chases it.
  useEffect(() => {
    const el = stage.current;
    if (!el || typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let tx = 0, ty = 0, x = 0, y = 0, vx = 0, vy = 0, raf = 0, lastInput = 0;
    const lock = shown === "think" ? { x: 0.35, y: -0.5 } : shown === "sad" ? { x: -0.1, y: 0.6 } : null;

    const step = () => {
      const gx = lock ? lock.x : tx, gy = lock ? lock.y : ty;
      vx = (vx + (gx - x) * 0.09) * 0.78;
      vy = (vy + (gy - y) * 0.09) * 0.78;
      x += vx; y += vy;
      el.style.setProperty("--mx", x.toFixed(3));
      el.style.setProperty("--my", y.toFixed(3));
      if (Math.abs(gx - x) + Math.abs(gy - y) + Math.abs(vx) + Math.abs(vy) > 0.002) raf = requestAnimationFrame(step);
      else raf = 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(step); };

    const aim = (cx: number, cy: number) => {
      const r = el.getBoundingClientRect();
      const dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height * 0.42);
      const reach = Math.max(260, r.width * 2.2);
      tx = Math.max(-1, Math.min(1, dx / reach));
      ty = Math.max(-1, Math.min(1, dy / reach));
      lastInput = Date.now();
      kick();
    };
    const onMove = (e: PointerEvent) => aim(e.clientX, e.clientY);
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null || Date.now() - lastInput < 1500) return;
      tx = Math.max(-1, Math.min(1, e.gamma / 30));
      ty = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
      kick();
    };
    // Left alone, it glances around now and then, like it's alive.
    const glance = window.setInterval(() => {
      if (Date.now() - lastInput < 2500) return;
      const r = Math.random();
      tx = r < 0.35 ? 0 : (Math.random() * 1.4 - 0.7);
      ty = r < 0.35 ? 0 : (Math.random() * 0.8 - 0.4);
      kick();
    }, 2600 + Math.random() * 1600);

    if (follow) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("deviceorientation", onTilt);
    }
    kick();
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(glance);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, [follow, shown]);

  // A little squash-pop whenever the mood changes.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setPop(true);
    const t = setTimeout(() => setPop(false), 480);
    return () => clearTimeout(t);
  }, [shown]);

  useEffect(() => {
    if (!burst) return;
    const t = setTimeout(() => setBurst(false), 1200);
    return () => clearTimeout(t);
  }, [burst]);

  const viewBox = crop === "head" ? "0 8 200 160" : "0 0 200 222";
  const height = crop === "head" ? Math.round(size * 0.8) : Math.round(size * 1.11);
  const cls = ["m-stage", follow ? "m-follow" : "", className || ""].filter(Boolean).join(" ");
  const svgCls = ["m-svg", `m-${shown}`, crop === "head" ? "m-crop" : "", interactive ? "m-tap" : "", pop ? "m-pop" : "", pressed ? "m-press" : ""].filter(Boolean).join(" ");

  return (
    <span ref={stage} className={cls} style={{ width: size, height }}>
      <svg
        className={svgCls}
        width={size}
        height={height}
        viewBox={viewBox}
        role={label ? "img" : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        onPointerDown={interactive ? () => setPressed(true) : undefined}
        onPointerUp={interactive ? () => { setPressed(false); setBurst(true); } : undefined}
        onPointerLeave={interactive ? () => setPressed(false) : undefined}
        onPointerCancel={interactive ? () => setPressed(false) : undefined}
      >
        <defs>
          <radialGradient id={`${uid}-fur`} cx="0.36" cy="0.28" r="0.8">
            <stop offset="0" stopColor="#C9D2DC" />
            <stop offset="0.5" stopColor="#9CA8B6" />
            <stop offset="1" stopColor="#6F7B89" />
          </radialGradient>
          <radialGradient id={`${uid}-furdark`} cx="0.35" cy="0.25" r="0.85">
            <stop offset="0" stopColor="#A9B3BF" />
            <stop offset="0.6" stopColor="#808C9A" />
            <stop offset="1" stopColor="#5E6976" />
          </radialGradient>
          <radialGradient id={`${uid}-face`} cx="0.4" cy="0.3" r="0.75">
            <stop offset="0" stopColor="#E3E8EE" />
            <stop offset="0.7" stopColor="#C6CFD9" />
            <stop offset="1" stopColor="#AEB8C4" />
          </radialGradient>
          <radialGradient id={`${uid}-belly`} cx="0.4" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.6" stopColor="#E7EBF0" />
            <stop offset="1" stopColor="#C8D0DA" />
          </radialGradient>
          <radialGradient id={`${uid}-pink`} cx="0.4" cy="0.35" r="0.75">
            <stop offset="0" stopColor="#FCD7E0" />
            <stop offset="1" stopColor="#E9939F" />
          </radialGradient>
          <radialGradient id={`${uid}-nose`} cx="0.35" cy="0.25" r="0.85">
            <stop offset="0" stopColor="#56607A" />
            <stop offset="0.55" stopColor="#283040" />
            <stop offset="1" stopColor="#12161F" />
          </radialGradient>
          <radialGradient id={`${uid}-eye`} cx="0.42" cy="0.32" r="0.75">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.65" stopColor="#F4F6F9" />
            <stop offset="1" stopColor="#C9D0DA" />
          </radialGradient>
          <radialGradient id={`${uid}-pupil`} cx="0.4" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#4A556C" />
            <stop offset="1" stopColor="#0E121A" />
          </radialGradient>
          <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F6D27A" />
            <stop offset="0.55" stopColor="#E2B04A" />
            <stop offset="1" stopColor="#B9862A" />
          </linearGradient>
          <radialGradient id={`${uid}-ao`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#1A1F29" stopOpacity="0.45" />
            <stop offset="1" stopColor="#1A1F29" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${uid}-cheek`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#F49AB0" stopOpacity="0.9" />
            <stop offset="1" stopColor="#F49AB0" stopOpacity="0" />
          </radialGradient>
        </defs>

        {crop === "full" ? <ellipse className="m-shadow" cx="100" cy="212" rx="54" ry="9" fill={u("ao")} /> : null}

        <g className="m-pop-g">
          <g className="m-all">
            {/* feet */}
            <g className="m-p1">
              <ellipse cx="76" cy="200" rx="19" ry="11.5" fill={u("furdark")} />
              <ellipse cx="124" cy="200" rx="19" ry="11.5" fill={u("furdark")} />
              <ellipse cx="72" cy="203" rx="8" ry="4" fill="#B5BEC9" opacity="0.6" />
              <ellipse cx="120" cy="203" rx="8" ry="4" fill="#B5BEC9" opacity="0.6" />
            </g>

            {/* body */}
            <g className="m-body">
              <ellipse cx="100" cy="156" rx="55" ry="51" fill={u("fur")} />
              <ellipse cx="100" cy="166" rx="36" ry="34" fill={u("belly")} />
              {/* scarf, with a shadow under it so it sits ON the body */}
              <ellipse cx="100" cy="142" rx="44" ry="8" fill={u("ao")} />
              <rect x="55" y="121" width="90" height="18" rx="9" fill={u("gold")} />
              <rect x="62" y="124" width="54" height="4" rx="2" fill="#FFF3CF" opacity="0.55" />
              <path d="M120 134 l14 30 l-12 4 l-11 -30 z" fill="#A87822" />
              <path d="M118 134 l10 26 l-10 3 l-8 -26 z" fill={u("gold")} />
              {/* head's contact shadow on the shoulders */}
              <ellipse cx="100" cy="122" rx="52" ry="10" fill={u("ao")} />
            </g>

            {/* head */}
            <g className="m-head">
              {hat === "bunny" ? (
                <g className="m-hat m-bunny">
                  <rect x="70" y="28" width="60" height="7" rx="3.5" fill="#F3F0FA" />
                  <g className="m-bunny-l"><ellipse cx="78" cy="-6" rx="12" ry="34" transform="rotate(-14 78 -6)" fill="#F3F0FA" /><ellipse cx="78" cy="-4" rx="6" ry="24" transform="rotate(-14 78 -4)" fill={u("pink")} /></g>
                  <g className="m-bunny-r"><ellipse cx="122" cy="-6" rx="12" ry="34" transform="rotate(14 122 -6)" fill="#F3F0FA" /><ellipse cx="122" cy="-4" rx="6" ry="24" transform="rotate(14 122 -4)" fill={u("pink")} /></g>
                </g>
              ) : null}
              <g className="m-ear-l m-p-ear">
                <circle cx="44" cy="58" r="32" fill={u("fur")} />
                <circle cx="46" cy="60" r="19" fill={u("pink")} />
                <circle cx="24" cy="48" r="9" fill="#D3DAE3" />
                <circle cx="30" cy="34" r="7" fill="#D3DAE3" />
              </g>
              <g className="m-ear-r m-p-ear">
                <circle cx="156" cy="58" r="32" fill={u("fur")} />
                <circle cx="154" cy="60" r="19" fill={u("pink")} />
                <circle cx="176" cy="48" r="9" fill="#C3CBD5" />
                <circle cx="170" cy="34" r="7" fill="#C3CBD5" />
              </g>

              <ellipse cx="100" cy="88" rx="64" ry="56" fill={u("fur")} />
              <circle cx="92" cy="36" r="9" fill="#AEB8C4" />
              <circle cx="104" cy="31" r="10" fill="#B9C2CD" />
              <circle cx="115" cy="37" r="7" fill="#A3AEBB" />
              {/* rim light */}
              <path d="M48 70 q18 -40 64 -42" stroke="#E6EBF1" strokeOpacity="0.55" strokeWidth="4" fill="none" strokeLinecap="round" />

              <g className="m-face">
                <ellipse cx="100" cy="100" rx="47" ry="37" fill={u("face")} />
                <circle cx="58" cy="108" r="13" fill={u("cheek")} />
                <circle cx="142" cy="108" r="13" fill={u("cheek")} />

                <g className="m-brows">
                  <path d="M62 62 q12 -8 24 -2" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />
                  <path d="M114 60 q12 -6 24 2" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />
                </g>

                {shown === "cheer" ? (
                  <g>
                    <path d="M62 86 q12 -16 24 0" stroke={INK} strokeWidth="7" fill="none" strokeLinecap="round" />
                    <path d="M114 86 q12 -16 24 0" stroke={INK} strokeWidth="7" fill="none" strokeLinecap="round" />
                  </g>
                ) : (
                  <g className="m-eyes">
                    <ellipse cx="74" cy="84" rx="16" ry="18" fill={u("eye")} />
                    <ellipse cx="126" cy="84" rx="16" ry="18" fill={u("eye")} />
                    <g className="m-pupils">
                      <circle cx="76" cy="87" r="9.5" fill={u("pupil")} />
                      <circle cx="124" cy="87" r="9.5" fill={u("pupil")} />
                      <circle cx="79.5" cy="83" r="3.6" fill="#fff" />
                      <circle cx="127.5" cy="83" r="3.6" fill="#fff" />
                      <circle cx="73" cy="91" r="1.5" fill="#fff" opacity="0.7" />
                      <circle cx="121" cy="91" r="1.5" fill="#fff" opacity="0.7" />
                    </g>
                  </g>
                )}

                <g className="m-nose">
                  <path d="M82 104 q18 -10 36 0 q2 16 -18 20 q-20 -4 -18 -20 z" fill={u("nose")} />
                  <ellipse cx="92" cy="105" rx="6" ry="3.4" fill="#fff" opacity="0.5" />
                  <circle cx="108" cy="107" r="1.6" fill="#fff" opacity="0.35" />
                </g>

                {shown === "cheer" ? (
                  <g>
                    <path d="M86 128 q14 26 28 0 z" fill={INK} />
                    <path d="M93 138 q7 7 14 0 q-7 -4 -14 0 z" fill="#F08FA6" />
                  </g>
                ) : shown === "sad" ? (
                  <path d="M90 136 q10 -8 20 0" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
                ) : shown === "think" ? (
                  <path d="M92 133 q8 2 16 -2" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
                ) : (
                  <path d="M88 129 q12 11 24 0" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
                )}
              </g>
              {hat && hat !== "bunny" ? <Hat kind={hat} u={u} /> : null}
            </g>

            {prop === "book" ? (
              <g className="m-p2">
                <rect x="80" y="163" width="40" height="30" rx="4" fill="#9A4709" />
                <rect x="80" y="160" width="40" height="30" rx="4" fill="#C2610F" />
                <rect x="80" y="160" width="8" height="30" rx="3" fill="#8F3F07" />
                <rect x="93" y="168" width="20" height="3" rx="1.5" fill="rgba(255,255,255,0.85)" />
                <rect x="90" y="161.5" width="28" height="3" rx="1.5" fill="#fff" opacity="0.25" />
              </g>
            ) : null}

            {/* arms (drawn over the head so a raised paw shows) */}
            <g className="m-arm-l m-p2">
              <ellipse cx="54" cy="160" rx="14" ry="25" transform="rotate(18 54 160)" fill={u("furdark")} />
              <ellipse cx="49" cy="178" rx="9" ry="7" fill="#D3DAE3" />
            </g>
            <g className="m-arm-r m-p2">
              <ellipse cx="146" cy="160" rx="14" ry="25" transform="rotate(-18 146 160)" fill={u("furdark")} />
              <ellipse cx="151" cy="178" rx="9" ry="7" fill="#D3DAE3" />
              {prop === "magnifier" ? (
                <g>
                  <line x1="156" y1="184" x2="170" y2="200" stroke="#A87822" strokeWidth="6" strokeLinecap="round" />
                  <circle cx="150" cy="176" r="14" fill="rgba(255,255,255,0.25)" stroke={u("gold")} strokeWidth="5" />
                </g>
              ) : null}
            </g>
          </g>
        </g>

        {shown === "think" ? (
          <g className="m-dots" fill="#D3DAE3">
            <circle cx="168" cy="20" r="5" />
            <circle cx="182" cy="8" r="6.5" />
            <circle cx="196" cy="-6" r="8" />
          </g>
        ) : null}
        {shown === "cheer" ? (
          <g className="m-sparks" fill={u("gold")}>
            <path d="M22 70 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 z" />
            <path d="M178 96 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z" />
            <path d="M160 40 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 z" />
          </g>
        ) : null}
      </svg>
    </span>
  );
}

// Seasonal hats, drawn in head space so they move with the head.
function Hat({ kind, u }: { kind: Exclude<MascotHat, "bunny">; u: (n: string) => string }) {
  if (kind === "santa") {
    return (
      <g className="m-hat m-santa">
        <path d="M54 42 Q66 0 110 -6 Q148 -10 166 20 Q146 8 124 14 Q142 26 146 42 Z" fill="#D7263D" />
        <path d="M70 34 Q84 6 112 2" stroke="#F06A7A" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.6" />
        <rect x="48" y="30" width="104" height="18" rx="9" fill="#F7F4F0" />
        <circle className="m-pompom" cx="168" cy="24" r="11" fill="#F7F4F0" />
      </g>
    );
  }
  if (kind === "witch") {
    return (
      <g className="m-hat m-witch">
        <ellipse cx="100" cy="40" rx="76" ry="13" fill="#2A1A3C" />
        <path d="M66 40 L92 -22 Q100 -44 124 -42 Q108 -34 112 -16 L134 40 Z" fill="#3B2554" />
        <rect x="70" y="26" width="62" height="10" rx="3" fill="#FF7A1A" />
        <rect x="94" y="24" width="14" height="14" rx="2" fill="none" stroke="#FFC078" strokeWidth="3" />
      </g>
    );
  }
  if (kind === "heart") {
    return (
      <g className="m-hat m-hearthat">
        <path d="M100 22 C92 6 70 10 74 28 C78 40 100 50 100 50 C100 50 122 40 126 28 C130 10 108 6 100 22 Z" fill="#FF6B8A" />
        <ellipse cx="86" cy="22" rx="5" ry="3" fill="#fff" opacity="0.5" />
      </g>
    );
  }
  const ghana = kind === "ghana";
  return (
    <g className="m-hat m-party">
      <path d="M80 40 L104 -18 L126 40 Z" fill={ghana ? "#2F9E44" : "#7C83FF"} />
      <path d="M86 26 L118 22 L121 30 L84 34 Z" fill={ghana ? "#FCD116" : "#FFD43B"} />
      <path d="M94 6 L112 4 L115 12 L91 14 Z" fill={ghana ? "#CE1126" : "#FF6B8A"} />
      {ghana ? <path d="M104 -18 l3 7 7 .5 -5.5 4.5 2 7 -6.5 -4 -6.5 4 2 -7 -5.5 -4.5 7 -.5 z" fill="#111" /> : <circle className="m-pompom" cx="104" cy="-20" r="7" fill={u("gold")} />}
    </g>
  );
}
