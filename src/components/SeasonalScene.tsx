"use client";

import { useEffect, useState } from "react";
import Mascot, { type MascotHat, type MascotMood } from "@/components/Mascot";

// Holiday / event scenes for the loading screens. Which one shows is decided
// by <html data-season> (set before paint by the boot script from the /admin
// calendar), so nothing renders outside an event. Pure SVG + CSS (.ss-* in
// globals.css), transform/opacity only, and still under reduced motion.
//
//   christmas    Santa's sleigh crosses the sky and drops presents; snow
//   halloween    moon, bats, a flickering jack-o'-lantern and a ghost
//   easter       a bunny hops past, eggs wobble in the grass
//   newyear      fireworks over the year number
//   valentines   hearts float up
//   independence Ghana's flag waves, red-gold-green confetti
//   collab       spotlights and "Leep × partner"

type Cfg = { hat?: MascotHat; mood: MascotMood; greeting: (label: string) => string };
const CFG: Record<string, Cfg> = {
  christmas: { hat: "santa", mood: "wave", greeting: () => "Merry Christmas from Leep" },
  halloween: { hat: "witch", mood: "idle", greeting: () => "Happy Halloween" },
  easter: { hat: "bunny", mood: "cheer", greeting: () => "Happy Easter" },
  newyear: { hat: "party", mood: "cheer", greeting: () => "Happy New Year" },
  valentines: { hat: "heart", mood: "wave", greeting: () => "Happy Valentine’s" },
  independence: { hat: "ghana", mood: "cheer", greeting: () => "Happy Independence Day, Ghana" },
  collab: { hat: "party", mood: "wave", greeting: (l) => (l ? `Leep × ${l}` : "Something special is on") },
};

export const SEASON_KEYS = Object.keys(CFG);

export function useSeason(override?: string | null): { season: string | null; label: string } {
  const [state, setState] = useState<{ season: string | null; label: string }>({ season: override ?? null, label: "" });
  useEffect(() => {
    if (override !== undefined) { setState({ season: override, label: "" }); return; }
    const r = document.documentElement;
    setState({ season: r.getAttribute("data-season"), label: r.getAttribute("data-season-label") || "" });
  }, [override]);
  return state;
}

export default function SeasonalScene({
  season: override,
  label: labelOverride,
  compact = false,
  showGreeting = true,
}: {
  season?: string | null;
  label?: string;
  compact?: boolean;
  showGreeting?: boolean;
}) {
  const { season, label } = useSeason(override);
  if (!season || !CFG[season]) return null;
  const cfg = CFG[season];
  const lbl = labelOverride ?? label;
  const w = compact ? 260 : 360;

  return (
    <div className={`ss ss-${season}${compact ? " ss-compact" : ""}`} style={{ width: w, maxWidth: "100%" }} aria-hidden="true">
      <div className="ss-stage">
        <svg className="ss-svg" viewBox="0 0 360 220" width="100%" height="100%">
          <Scene season={season} label={lbl} />
        </svg>
        <div className="ss-koala">
          <Mascot mood={cfg.mood} hat={cfg.hat} size={compact ? 86 : 118} />
        </div>
      </div>
      {showGreeting ? <p className="ss-greet">{cfg.greeting(lbl)}</p> : null}
    </div>
  );
}

function Scene({ season, label }: { season: string; label: string }) {
  switch (season) {
    case "christmas": return <Christmas />;
    case "halloween": return <Halloween />;
    case "easter": return <Easter />;
    case "newyear": return <NewYear />;
    case "valentines": return <Valentines />;
    case "independence": return <Independence />;
    case "collab": return <Collab label={label} />;
    default: return null;
  }
}

const Present = ({ x, color, ribbon, i }: { x: number; color: string; ribbon: string; i: number }) => (
  <g className={`ss-present ss-p${i}`} style={{ transformOrigin: `${x}px 204px` }}>
    <rect x={x - 11} y={182} width="22" height="20" rx="3" fill={color} />
    <rect x={x - 13} y={178} width="26" height="7" rx="2" fill={color} />
    <rect x={x - 2.5} y={178} width="5" height="24" fill={ribbon} />
    <path d={`M${x} 178 q-9 -10 -12 -2 q2 4 12 2 q9 -10 12 -2 q-2 4 -12 2`} fill={ribbon} />
  </g>
);

function Christmas() {
  const flakes = Array.from({ length: 16 }, (_, i) => i);
  return (
    <>
      <circle cx="300" cy="40" r="16" fill="#F8F3DC" opacity="0.85" />
      {flakes.map((i) => (
        <circle key={i} className="ss-snow" cx={(i * 23 + 11) % 360} cy={-6} r={1.5 + (i % 3)} fill="#fff"
          style={{ animationDelay: `${(i * 0.37) % 4}s`, animationDuration: `${3.4 + (i % 4) * 0.6}s` }} />
      ))}
      <ellipse cx="180" cy="232" rx="230" ry="40" fill="#EEF3F8" />
      <ellipse cx="60" cy="226" rx="90" ry="28" fill="#DDE6EF" />
      <g className="ss-sleigh">
        <path d="M-6 52 q22 -2 40 -16" stroke="#8B5A2B" strokeWidth="2" fill="none" />
        {/* reindeer */}
        <g fill="#8B5A2B">
          <ellipse cx="-22" cy="54" rx="13" ry="6" />
          <circle cx="-36" cy="46" r="5" />
          <path d="M-38 41 l-4 -8 M-36 41 l1 -8 M-40 37 l-4 -1 M-34 35 l3 -2" stroke="#6B4423" strokeWidth="1.6" />
          <rect x="-30" y="58" width="2.5" height="8" /><rect x="-16" y="58" width="2.5" height="8" />
          <circle cx="-40" cy="46" r="1.8" fill="#FF3B3B" />
        </g>
        <path d="M34 40 h44 q10 0 8 12 l-4 10 h-46 q-6 -10 -2 -22 z" fill="#D7263D" />
        <path d="M30 70 h56 q8 0 10 -6" stroke="#E8C170" strokeWidth="3" fill="none" strokeLinecap="round" />
        <ellipse cx="62" cy="34" rx="15" ry="11" fill="#8B5A2B" />
        <rect x="48" y="26" width="10" height="8" rx="2" fill="#2F9E44" />
        <rect x="62" y="22" width="10" height="9" rx="2" fill="#E8C170" />
      </g>
      <Present x={92} color="#2F9E44" ribbon="#E8C170" i={1} />
      <Present x={262} color="#D7263D" ribbon="#F7F4F0" i={2} />
      <Present x={300} color="#7C83FF" ribbon="#FFD43B" i={3} />
    </>
  );
}

const Bat = ({ i }: { i: number }) => (
  <g className={`ss-bat ss-bat${i}`}>
    <g className="ss-wing">
      <path d="M0 0 q-8 -10 -20 -4 q4 2 4 6 q-6 -2 -8 2 q6 0 10 4 z" fill="#140D1A" />
      <path d="M0 0 q8 -10 20 -4 q-4 2 -4 6 q6 -2 8 2 q-6 0 -10 4 z" fill="#140D1A" />
    </g>
    <ellipse cx="0" cy="2" rx="4" ry="5" fill="#140D1A" />
  </g>
);

function Halloween() {
  return (
    <>
      <circle cx="292" cy="48" r="28" fill="#FFF1C1" />
      <circle cx="282" cy="40" r="5" fill="#EBDCA8" /><circle cx="300" cy="58" r="4" fill="#EBDCA8" />
      <circle className="ss-moonglow" cx="292" cy="48" r="44" fill="#FFF1C1" opacity="0.12" />
      <Bat i={1} /><Bat i={2} /><Bat i={3} />
      <path d="M0 220 Q60 190 120 206 T240 200 T360 208 V220 Z" fill="#1C1226" />
      {/* jack-o'-lantern */}
      <g className="ss-pumpkin">
        <ellipse cx="62" cy="196" rx="30" ry="22" fill="#E8590C" />
        <ellipse cx="62" cy="196" rx="14" ry="22" fill="#F76707" />
        <rect x="59" y="168" width="6" height="10" rx="2" fill="#2B8A3E" />
        <g className="ss-flicker" fill="#FFD43B">
          <path d="M46 190 l7 -8 l7 8 z" /><path d="M64 190 l7 -8 l7 8 z" />
          <path d="M46 202 q16 12 32 0 l-5 4 l-4 -4 l-4 4 l-4 -4 l-4 4 l-4 -4 l-4 4 z" />
        </g>
      </g>
      <g className="ss-ghost">
        <path d="M290 160 q0 -30 24 -30 q24 0 24 30 v32 l-6 -6 l-6 6 l-6 -6 l-6 6 l-6 -6 l-6 6 l-6 -6 l-6 6 z" fill="#F1EEF8" opacity="0.92" />
        <circle cx="306" cy="158" r="3.5" fill="#1C1226" /><circle cx="322" cy="158" r="3.5" fill="#1C1226" />
        <ellipse cx="314" cy="170" rx="4" ry="5" fill="#1C1226" />
      </g>
    </>
  );
}

function Easter() {
  const eggs = [
    { x: 48, c: "#FFC9DE", s: "#F783AC" }, { x: 90, c: "#C5F6FA", s: "#3BC9DB" },
    { x: 272, c: "#FFF3BF", s: "#FAB005" }, { x: 316, c: "#E5DBFF", s: "#9775FA" },
  ];
  return (
    <>
      <circle cx="60" cy="44" r="18" fill="#FFF3BF" />
      <ellipse cx="250" cy="42" rx="30" ry="10" fill="#fff" opacity="0.8" /><ellipse cx="268" cy="36" rx="18" ry="10" fill="#fff" opacity="0.8" />
      <path d="M0 220 Q90 178 180 198 T360 190 V220 Z" fill="#8CE99A" />
      <path d="M0 220 Q120 200 240 212 T360 206 V220 Z" fill="#69DB7C" />
      {eggs.map((e, i) => (
        <g key={i} className={`ss-egg ss-egg${i}`} style={{ transformOrigin: `${e.x}px 206px` }}>
          <ellipse cx={e.x} cy={192} rx="12" ry="15" fill={e.c} />
          <path d={`M${e.x - 11} 190 l5 -4 l5 4 l5 -4 l5 4 l3 -2`} stroke={e.s} strokeWidth="2.4" fill="none" strokeLinejoin="round" />
          <circle cx={e.x - 4} cy={199} r="2" fill={e.s} /><circle cx={e.x + 4} cy={200} r="2" fill={e.s} />
        </g>
      ))}
      <g className="ss-bunny">
        <g className="ss-bunny-body">
          <ellipse cx="0" cy="-12" rx="14" ry="11" fill="#F8F9FA" />
          <circle cx="12" cy="-22" r="8" fill="#F8F9FA" />
          <ellipse cx="10" cy="-36" rx="3.5" ry="11" fill="#F8F9FA" transform="rotate(-10 10 -36)" />
          <ellipse cx="16" cy="-36" rx="3.5" ry="11" fill="#F8F9FA" transform="rotate(12 16 -36)" />
          <circle cx="15" cy="-23" r="1.6" fill="#343A40" />
          <circle cx="-13" cy="-12" r="4" fill="#fff" />
        </g>
      </g>
    </>
  );
}

const Burst = ({ x, y, c, i }: { x: number; y: number; c: string; i: number }) => (
  <g className={`ss-burst ss-b${i}`} style={{ transformOrigin: `${x}px ${y}px` }}>
    {Array.from({ length: 12 }, (_, k) => {
      const a = (k / 12) * Math.PI * 2;
      return <line key={k} x1={x + Math.cos(a) * 6} y1={y + Math.sin(a) * 6} x2={x + Math.cos(a) * 26} y2={y + Math.sin(a) * 26} stroke={c} strokeWidth="3" strokeLinecap="round" />;
    })}
    <circle cx={x} cy={y} r="4" fill="#fff" />
  </g>
);

function NewYear() {
  const d = new Date();
  const year = d.getMonth() === 11 ? d.getFullYear() + 1 : d.getFullYear();
  return (
    <>
      <Burst x={70} y={60} c="#FFD43B" i={1} />
      <Burst x={180} y={40} c="#FF6B8A" i={2} />
      <Burst x={292} y={66} c="#74C0FC" i={3} />
      <Burst x={128} y={96} c="#B197FC" i={4} />
      <text x="180" y="150" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize="44" fill="#E8C170" opacity="0.22">{year}</text>
    </>
  );
}

function Valentines() {
  return (
    <>
      {Array.from({ length: 9 }, (_, i) => {
        const x = 24 + i * 40, s = 0.6 + (i % 3) * 0.25;
        return (
          <g key={i} className="ss-heart" style={{ animationDelay: `${(i * 0.55) % 3.5}s`, transformOrigin: `${x}px 230px` }}>
            <path transform={`translate(${x} 230) scale(${s})`} d="M0 -6 C-4 -16 -18 -14 -16 -2 C-14 8 0 16 0 16 C0 16 14 8 16 -2 C18 -14 4 -16 0 -6 Z" fill={i % 2 ? "#FF6B8A" : "#FFA8BC"} />
          </g>
        );
      })}
    </>
  );
}

function Independence() {
  const colors = ["#CE1126", "#FCD116", "#2F9E44"];
  return (
    <>
      {Array.from({ length: 18 }, (_, i) => (
        <rect key={i} className="ss-confetti" x={(i * 21 + 7) % 360} y={-10} width="6" height="10" rx="1.5" fill={colors[i % 3]}
          style={{ animationDelay: `${(i * 0.31) % 3}s`, animationDuration: `${2.6 + (i % 4) * 0.5}s` }} />
      ))}
      <rect x="40" y="40" width="4" height="170" rx="2" fill="#ADB5BD" />
      <g className="ss-flag">
        <rect x="44" y="42" width="84" height="18" fill="#CE1126" />
        <rect x="44" y="60" width="84" height="18" fill="#FCD116" />
        <rect x="44" y="78" width="84" height="18" fill="#2F9E44" />
        <path d="M86 60 l3.4 7.6 8.2 .8 -6.2 5.4 1.8 8.2 -7.2 -4.2 -7.2 4.2 1.8 -8.2 -6.2 -5.4 8.2 -.8 z" fill="#111" />
      </g>
    </>
  );
}

function Collab({ label }: { label: string }) {
  return (
    <>
      <path className="ss-beam ss-beam1" d="M40 220 L120 0 L160 0 Z" fill="#7C83FF" opacity="0.18" />
      <path className="ss-beam ss-beam2" d="M320 220 L200 0 L240 0 Z" fill="#E8C170" opacity="0.18" />
      {label ? (
        <text x="180" y="40" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize="22" fill="#F5EFE4">
          Leep <tspan fill="#E8C170">×</tspan> {label}
        </text>
      ) : null}
      {[60, 300, 110, 250].map((x, i) => (
        <path key={i} className="ss-twinkle" style={{ animationDelay: `${i * 0.4}s`, transformOrigin: `${x}px ${70 + i * 18}px` }}
          d={`M${x} ${62 + i * 18} l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 z`} fill="#E8C170" />
      ))}
    </>
  );
}
