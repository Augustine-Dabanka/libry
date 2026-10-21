"use client";

import { useEffect, useId, useRef, useState } from "react";

// Lybry's bushbaby (galago), v4. Replaced the koala in October 2026.
// - Style: chunky, friendly shapes with huge eyes, flat colours and one shade
//   crescent + one highlight per part, so it reads as 3D without gradients
//   (the same "toy-like" approach big app mascots use, drawn from scratch).
// - Why a bushbaby: an African night animal with giant eyes, made for reading
//   after dark. Big round ears, amber eyes and a long fluffy tail.
// - Depth: the figure tilts toward your finger/mouse (or the tablet's tilt
//   sensor) and its layers move by different amounts (ears < head < eyes).
// - Springs: everything eases with a little overshoot. Press = squash,
//   release = cheer, mood change = pop. All motion is transform/opacity.
//
//   <Mascot mood="wave" size={140} />
//   <Mascot mood="idle" follow interactive />   looks at pointer, tap = cheer
//   <Mascot crop="head" />                      head-and-shoulders framing
// (Type names still say "Koala" so saved avatars keep working.)
export type MascotMood = "idle" | "wave" | "cheer" | "think" | "sad";
export type MascotHat = "santa" | "witch" | "bunny" | "party" | "ghana" | "heart" | "beanie" | "crown";
export type MascotFur = "grey" | "cocoa" | "cream" | "midnight" | "laterite";
export type MascotScarf = "gold" | "laterite" | "adire" | "palm" | "sobolo";
// A reader's own koala (profile avatar). Stored as profiles.avatar (jsonb).
export type MascotKind = "neutral" | "girl" | "boy";
export type KoalaLook = { fur?: MascotFur; scarf?: MascotScarf; hat?: MascotHat | "none"; glasses?: boolean; book?: boolean; bg?: string; kind?: MascotKind };

// Flat palette per fur: base, shade, light (highlight / face mask), inner ear, belly.
const FUR: Record<MascotFur, { base: string; shade: string; light: string; inner: string; belly: string; ring: string }> = {
  grey: { base: "#A3ABB8", shade: "#828C9C", light: "#D5DBE3", inner: "#F4B9C4", belly: "#EEF1F5", ring: "#6E7889" },
  cocoa: { base: "#B08463", shade: "#8C664B", light: "#E2C6AE", inner: "#F5C2AE", belly: "#F4E6D8", ring: "#704F39" },
  cream: { base: "#E6D3B5", shade: "#C9B190", light: "#FFF6E6", inner: "#F7C7B8", belly: "#FFFBF2", ring: "#B39A78" },
  midnight: { base: "#56618A", shade: "#414A6E", light: "#8C97BD", inner: "#D3A6CF", belly: "#B3BBD6", ring: "#323A58" },
  laterite: { base: "#DE7650", shade: "#BC5732", light: "#F6B79B", inner: "#FCD6C6", belly: "#FDEBE2", ring: "#9C4425" },
};
const SCARF: Record<MascotScarf, [string, string, string]> = {
  gold: ["#F6D27A", "#E2B04A", "#B9862A"],
  laterite: ["#F08A64", "#C8471F", "#8F2F12"],
  adire: ["#7F8DF0", "#3446D4", "#1F2C96"],
  palm: ["#5FC79B", "#1E7F5C", "#0F5A40"],
  sobolo: ["#EE77A6", "#C42B6B", "#8A1648"],
};

const INK = "#283040";

export default function Mascot({
  mood = "idle",
  size = 120,
  crop = "full",
  follow = false,
  interactive = false,
  prop,
  hat,
  fur = "grey",
  scarf = "gold",
  glasses = false,
  kind = "neutral",
  cape = false,
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
  fur?: MascotFur;
  scarf?: MascotScarf;
  glasses?: boolean;
  kind?: MascotKind;
  cape?: boolean;
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
          <radialGradient id={`${uid}-pink`} cx="0.4" cy="0.35" r="0.75">
            <stop offset="0" stopColor="#FCD7E0" />
            <stop offset="1" stopColor="#E9939F" />
          </radialGradient>
          <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F6D27A" />
            <stop offset="0.55" stopColor="#E2B04A" />
            <stop offset="1" stopColor="#B9862A" />
          </linearGradient>
          <linearGradient id={`${uid}-scarf`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={SCARF[scarf][0]} />
            <stop offset="0.55" stopColor={SCARF[scarf][1]} />
            <stop offset="1" stopColor={SCARF[scarf][2]} />
          </linearGradient>
          <radialGradient id={`${uid}-ao`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#1A1F29" stopOpacity="0.35" />
            <stop offset="1" stopColor="#1A1F29" stopOpacity="0" />
          </radialGradient>
          <clipPath id={`${uid}-cHead`}><ellipse cx="100" cy="86" rx="62" ry="54" /></clipPath>
          <clipPath id={`${uid}-cBody`}><ellipse cx="100" cy="160" rx="50" ry="48" /></clipPath>
          <clipPath id={`${uid}-cEarL`}><ellipse cx="40" cy="44" rx="30" ry="34" transform="rotate(-22 40 44)" /></clipPath>
          <clipPath id={`${uid}-cEarR`}><ellipse cx="160" cy="44" rx="30" ry="34" transform="rotate(22 160 44)" /></clipPath>
        </defs>

        {crop === "full" ? <ellipse className="m-shadow" cx="100" cy="212" rx="54" ry="8" fill={u("ao")} /> : null}

        <g className="m-pop-g">
          <g className="m-all">
            {cape ? (
              <g className="m-cape" aria-hidden="true">
                <path d="M62 126 Q44 170 38 210 Q100 224 162 210 Q156 170 138 126 Z" fill={SCARF[scarf][2]} />
                <path d="M66 126 Q52 168 48 204 Q100 216 152 204 Q148 168 134 126 Z" fill={SCARF[scarf][1]} />
                <path d="M74 132 Q64 166 62 198" stroke="#fff" strokeOpacity="0.22" strokeWidth="5" fill="none" strokeLinecap="round" />
              </g>
            ) : null}

            {/* tail: long and fluffy, curls up behind */}
            <g className="m-tail">
              <path d="M128 192 C 168 196, 192 168, 182 128 C 176 104, 160 96, 150 104" fill="none" stroke={FUR[fur].shade} strokeWidth="22" strokeLinecap="round" />
              <path d="M128 188 C 164 192, 186 166, 177 129 C 172 110, 160 102, 152 108" fill="none" stroke={FUR[fur].base} strokeWidth="16" strokeLinecap="round" />
              <circle cx="152" cy="104" r="13" fill={FUR[fur].light} />
            </g>

            {/* feet */}
            <g className="m-p1">
              <ellipse cx="78" cy="203" rx="18" ry="10" fill={FUR[fur].shade} />
              <ellipse cx="122" cy="203" rx="18" ry="10" fill={FUR[fur].shade} />
              <ellipse cx="74" cy="200" rx="9" ry="4" fill={FUR[fur].light} opacity="0.7" />
              <ellipse cx="118" cy="200" rx="9" ry="4" fill={FUR[fur].light} opacity="0.7" />
            </g>

            {/* body: base, shade crescent bottom-right, highlight top-left */}
            <g className="m-body">
              <g clipPath={u("cBody")}>
                <rect x="40" y="100" width="120" height="120" fill={FUR[fur].shade} />
                <ellipse cx="94" cy="152" rx="50" ry="48" fill={FUR[fur].base} />
                <ellipse cx="100" cy="172" rx="31" ry="30" fill={FUR[fur].belly} />
                <ellipse cx="74" cy="132" rx="14" ry="8" fill="#fff" opacity="0.25" />
              </g>
              {/* scarf */}
              <ellipse cx="100" cy="140" rx="40" ry="6" fill={u("ao")} />
              <rect x="58" y="120" width="84" height="17" rx="8.5" fill={u("scarf")} />
              <rect x="64" y="123" width="48" height="4" rx="2" fill="#FFF3CF" opacity="0.5" />
              <path d="M118 132 l12 28 l-11 4 l-9 -28 z" fill={SCARF[scarf][2]} />
              <path d="M116 132 l9 24 l-9 3 l-7 -24 z" fill={u("scarf")} />
            </g>

            {/* head */}
            <g className="m-head">
              {hat === "bunny" ? (
                <g className="m-hat m-bunny">
                  <rect x="70" y="30" width="60" height="7" rx="3.5" fill="#F3F0FA" />
                  <g className="m-bunny-l"><ellipse cx="78" cy="-4" rx="12" ry="34" transform="rotate(-14 78 -4)" fill="#F3F0FA" /><ellipse cx="78" cy="-2" rx="6" ry="24" transform="rotate(-14 78 -2)" fill={u("pink")} /></g>
                  <g className="m-bunny-r"><ellipse cx="122" cy="-4" rx="12" ry="34" transform="rotate(14 122 -4)" fill="#F3F0FA" /><ellipse cx="122" cy="-2" rx="6" ry="24" transform="rotate(14 122 -2)" fill={u("pink")} /></g>
                </g>
              ) : null}
              {/* big round ears */}
              <g className="m-ear-l m-p-ear">
                <g clipPath={u("cEarL")}>
                  <rect x="0" y="0" width="80" height="90" fill={FUR[fur].shade} />
                  <ellipse cx="36" cy="40" rx="30" ry="34" transform="rotate(-22 36 40)" fill={FUR[fur].base} />
                </g>
                <ellipse cx="42" cy="46" rx="18" ry="22" transform="rotate(-22 42 46)" fill={FUR[fur].inner} />
                <ellipse cx="38" cy="38" rx="6" ry="9" transform="rotate(-22 38 38)" fill="#fff" opacity="0.35" />
              </g>
              <g className="m-ear-r m-p-ear">
                <g clipPath={u("cEarR")}>
                  <rect x="120" y="0" width="80" height="90" fill={FUR[fur].shade} />
                  <ellipse cx="156" cy="40" rx="30" ry="34" transform="rotate(22 156 40)" fill={FUR[fur].base} />
                </g>
                <ellipse cx="158" cy="46" rx="18" ry="22" transform="rotate(22 158 46)" fill={FUR[fur].inner} />
                <ellipse cx="154" cy="38" rx="6" ry="9" transform="rotate(22 154 38)" fill="#fff" opacity="0.35" />
              </g>

              <g clipPath={u("cHead")}>
                <rect x="30" y="26" width="140" height="120" fill={FUR[fur].shade} />
                <ellipse cx="95" cy="80" rx="62" ry="54" fill={FUR[fur].base} />
                <ellipse cx="66" cy="52" rx="18" ry="10" fill="#fff" opacity="0.28" />
              </g>
              {/* contact shadow under the head */}
              <ellipse cx="100" cy="132" rx="44" ry="7" fill={u("ao")} />
              {kind === "boy" && !hat ? (
                <path d="M92 36 q2 -22 22 -20 q-12 4 -8 14 q8 -10 18 -4 q-14 2 -14 14 z" fill={FUR[fur].shade} aria-hidden="true" />
              ) : null}
              {kind === "girl" ? (
                <g aria-hidden="true" transform="translate(128 34) rotate(14)">
                  <path d="M0 0 L-15 -9 Q-19 0 -15 9 Z" fill={u("scarf")} />
                  <path d="M0 0 L15 -9 Q19 0 15 9 Z" fill={u("scarf")} />
                  <circle cx="0" cy="0" r="4.5" fill={SCARF[scarf][2]} />
                </g>
              ) : null}

              <g className="m-face">
                {/* dark eye rings + the pale stripe down the nose, bushbaby-style */}
                <ellipse cx="74" cy="86" rx="28" ry="27" fill={FUR[fur].ring} opacity="0.55" />
                <ellipse cx="126" cy="86" rx="28" ry="27" fill={FUR[fur].ring} opacity="0.55" />
                <path d="M100 58 q6 22 0 48 q-6 -26 0 -48 z" fill={FUR[fur].light} />
                <ellipse cx="100" cy="114" rx="17" ry="12" fill={FUR[fur].light} />

                <g className="m-brows">
                  <path d="M54 58 q12 -8 26 -3" stroke={INK} strokeWidth={kind === "boy" ? 6 : 4.5} fill="none" strokeLinecap="round" />
                  <path d="M120 55 q14 -5 26 3" stroke={INK} strokeWidth={kind === "boy" ? 6 : 4.5} fill="none" strokeLinecap="round" />
                </g>

                {shown === "cheer" ? (
                  <g>
                    <path d="M58 90 q16 -20 32 0" stroke={INK} strokeWidth="7" fill="none" strokeLinecap="round" />
                    <path d="M110 90 q16 -20 32 0" stroke={INK} strokeWidth="7" fill="none" strokeLinecap="round" />
                  </g>
                ) : (
                  <g className="m-eyes">
                    <circle cx="74" cy="86" r="22" fill="#FFFFFF" />
                    <circle cx="126" cy="86" r="22" fill="#FFFFFF" />
                    <path d="M54 92 a22 22 0 0 0 40 0" fill="#DDE3EA" />
                    <path d="M106 92 a22 22 0 0 0 40 0" fill="#DDE3EA" />
                    <g className="m-pupils">
                      <circle cx="76" cy="88" r="15" fill="#C97A22" />
                      <circle cx="124" cy="88" r="15" fill="#C97A22" />
                      <circle cx="76" cy="88" r="9.5" fill={INK} />
                      <circle cx="124" cy="88" r="9.5" fill={INK} />
                      <circle cx="81" cy="82" r="5" fill="#fff" />
                      <circle cx="129" cy="82" r="5" fill="#fff" />
                      <circle cx="72" cy="94" r="2" fill="#fff" opacity="0.8" />
                      <circle cx="120" cy="94" r="2" fill="#fff" opacity="0.8" />
                    </g>
                  </g>
                )}
                {kind === "girl" && shown !== "cheer" ? (
                  <g className="m-lashes" stroke={INK} strokeWidth="3.2" strokeLinecap="round" aria-hidden="true">
                    <path d="M53 78 l-8 -4 M56 71 l-6 -7" />
                    <path d="M147 78 l8 -4 M144 71 l6 -7" />
                  </g>
                ) : null}

                {glasses ? (
                  <g aria-hidden="true">
                    <circle cx="74" cy="86" r="26" fill="rgba(255,255,255,0.10)" stroke={INK} strokeWidth="5" />
                    <circle cx="126" cy="86" r="26" fill="rgba(255,255,255,0.10)" stroke={INK} strokeWidth="5" />
                    <path d="M97 82 q3 -4 6 0" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />
                    <path d="M48 82 l-10 -4 M152 82 l10 -4" stroke={INK} strokeWidth="5" strokeLinecap="round" />
                  </g>
                ) : null}

                <g className="m-nose">
                  <path d="M93 108 q7 -4 14 0 q-1 7 -7 9 q-6 -2 -7 -9 z" fill={INK} />
                  <ellipse cx="97" cy="109" rx="2.6" ry="1.5" fill="#fff" opacity="0.55" />
                </g>
                <circle cx="62" cy="114" r="9" fill="#F49AB0" opacity="0.35" />
                <circle cx="138" cy="114" r="9" fill="#F49AB0" opacity="0.35" />

                {shown === "cheer" ? (
                  <g>
                    <path d="M88 120 q12 22 24 0 z" fill={INK} />
                    <path d="M94 129 q6 6 12 0 q-6 -4 -12 0 z" fill="#F08FA6" />
                  </g>
                ) : shown === "sad" ? (
                  <path d="M92 130 q8 -7 16 0" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
                ) : shown === "think" ? (
                  <path d="M93 127 q7 2 14 -2" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
                ) : (
                  <path d="M90 122 q10 9 20 0" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
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

            {/* arms with round little fingertips */}
            <g className="m-arm-l m-p2">
              <ellipse cx="58" cy="160" rx="12" ry="23" transform="rotate(18 58 160)" fill={FUR[fur].shade} />
              <circle cx="51" cy="179" r="8" fill={FUR[fur].light} />
              <circle cx="45" cy="183" r="3" fill={FUR[fur].light} /><circle cx="51" cy="187" r="3" fill={FUR[fur].light} /><circle cx="57" cy="185" r="3" fill={FUR[fur].light} />
            </g>
            <g className="m-arm-r m-p2">
              <ellipse cx="142" cy="160" rx="12" ry="23" transform="rotate(-18 142 160)" fill={FUR[fur].shade} />
              <circle cx="149" cy="179" r="8" fill={FUR[fur].light} />
              <circle cx="143" cy="185" r="3" fill={FUR[fur].light} /><circle cx="149" cy="187" r="3" fill={FUR[fur].light} /><circle cx="155" cy="183" r="3" fill={FUR[fur].light} />
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
  if (kind === "beanie") {
    return (
      <g className="m-hat">
        <path d="M46 46 Q48 -6 100 -8 Q152 -6 154 46 Z" fill={u("scarf")} />
        <rect x="44" y="34" width="112" height="18" rx="9" fill={u("scarf")} stroke="rgba(0,0,0,0.18)" strokeWidth="2" />
        <path d="M70 34 V4 M90 34 V-4 M110 34 V-4 M130 34 V4" stroke="rgba(255,255,255,0.22)" strokeWidth="4" strokeLinecap="round" />
        <circle className="m-pompom" cx="100" cy="-12" r="12" fill="#FFFCF7" />
      </g>
    );
  }
  if (kind === "crown") {
    return (
      <g className="m-hat">
        <path d="M66 40 L70 6 L86 24 L100 0 L114 24 L130 6 L134 40 Z" fill={u("gold")} stroke="#A87822" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="100" cy="30" r="5" fill="#C8471F" />
        <circle cx="80" cy="32" r="3.5" fill="#3446D4" />
        <circle cx="120" cy="32" r="3.5" fill="#1E7F5C" />
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
