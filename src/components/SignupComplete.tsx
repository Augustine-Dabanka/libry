"use client";

import { useEffect, useState } from "react";
import Mascot from "@/components/Mascot";
import { normalizeLook } from "@/components/KoalaAvatar";
import { play } from "@/lib/sound";

// The finish line of sign-up: the reader's own koala, in a cape, waving, with
// a speech bubble, dressed up for the time of year (pumpkins, ghosts and candy
// around Halloween; snow in December; confetti the rest of the year).
type Decor = "halloween" | "winter" | "confetti";
function decorFor(d: Date): Decor {
  const m = d.getMonth() + 1, day = d.getDate();
  if ((m === 10 && day >= 10) || (m === 11 && day <= 2)) return "halloween";
  if (m === 12 || (m === 1 && day <= 6)) return "winter";
  return "confetti";
}

function Pumpkin({ s = 34 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M20 8 q1 -5 5 -6" stroke="#2F6B3A" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="13" cy="24" rx="9" ry="12" fill="#E8701A" /><ellipse cx="27" cy="24" rx="9" ry="12" fill="#E8701A" />
      <ellipse cx="20" cy="24" rx="9" ry="13" fill="#F58A2B" />
      <path d="M14 21 l3 -3 l3 3 z M22 21 l3 -3 l3 3 z" fill="#4A2508" />
      <path d="M13 28 q7 6 14 0 l-2 2 l-2 -2 l-2 2 l-2 -2 l-2 2 l-2 -2 z" fill="#4A2508" />
    </svg>
  );
}
function Ghost({ s = 34 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M8 36 V18 a12 12 0 0 1 24 0 V36 l-4 -3 l-4 3 l-4 -3 l-4 3 l-4 -3 z" fill="#FFFCF7" stroke="#C9C2B8" strokeWidth="1.5" />
      <circle cx="16" cy="19" r="2.6" fill="#283040" /><circle cx="24" cy="19" r="2.6" fill="#283040" />
      <ellipse cx="20" cy="26" rx="2.4" ry="3" fill="#283040" />
    </svg>
  );
}
function Candy({ s = 30 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M6 14 l8 6 l-8 6 z M34 14 l-8 6 l8 6 z" fill="#C42B6B" />
      <circle cx="20" cy="20" r="8" fill="#E2B04A" />
      <path d="M14 18 q6 -4 12 0" stroke="#fff" strokeOpacity=".7" strokeWidth="2" fill="none" />
    </svg>
  );
}

export default function SignupComplete({ name, look, onGo, onBack, cta }: { name: string; look: unknown; onGo: () => void; onBack?: () => void; cta: string }) {
  const [decor, setDecor] = useState<Decor>("confetti");
  useEffect(() => { setDecor(decorFor(new Date())); play("success"); }, []);
  const l = normalizeLook(look);
  const first = name.trim().split(" ")[0] || "reader";

  const bits = Array.from({ length: 18 }, (_, i) => ({ left: (i * 37) % 100, delay: (i % 6) * 0.25, dur: 2.6 + (i % 5) * 0.4, hue: ["#C8471F", "#E2B04A", "#3446D4", "#1E7F5C", "#C42B6B"][i % 5]! }));

  return (
    <div className="sc-wrap">
      <div className="sc-stage" aria-hidden="true">
        {decor === "confetti"
          ? bits.map((b, i) => <i key={i} className="sc-confetti" style={{ left: `${b.left}%`, background: b.hue, animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s` }} />)
          : decor === "winter"
            ? bits.map((b, i) => <i key={i} className="sc-snow" style={{ left: `${b.left}%`, animationDelay: `${b.delay * 2}s`, animationDuration: `${b.dur + 2}s` }} />)
            : null}
        {decor === "halloween" ? (
          <>
            <span className="sc-deco" style={{ left: "4%", bottom: 6 }}><Pumpkin s={44} /></span>
            <span className="sc-deco sc-float" style={{ right: "6%", top: 8 }}><Ghost s={40} /></span>
            <span className="sc-deco" style={{ right: "10%", bottom: 4 }}><Candy /></span>
            <span className="sc-deco sc-float" style={{ left: "12%", top: 18, animationDelay: "-1.2s" }}><Ghost s={28} /></span>
            <span className="sc-deco" style={{ left: "22%", bottom: 2 }}><Candy s={24} /></span>
          </>
        ) : null}
      </div>

      <div className="sc-bubble" role="status">
        <strong>Congratulations, {first}!</strong>
        <span>You&apos;re all set to dive into the amazing world of Lybry.</span>
      </div>
      <div className="sc-koala">
        <Mascot size={150} mood="wave" cape interactive fur={l.fur} scarf={l.scarf} glasses={l.glasses} kind={l.kind} hat={l.hat === "none" ? undefined : l.hat} label="Your bushbaby, waving" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: onBack ? "auto 1fr" : "1fr", gap: "0.6rem", width: "100%", marginTop: "0.6rem" }}>
        {onBack ? <button type="button" className="btn btn-outline" onClick={onBack}>Back</button> : null}
        <button type="button" className="btn btn-gold" onClick={onGo}>{cta}</button>
      </div>
    </div>
  );
}
