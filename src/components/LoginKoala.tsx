"use client";

// The bushbaby that peeks over the sign-in card. Its big amber eyes follow
// what you type in the email box, it covers them while you type your password,
// and peeks through its paws if you press "Show". Pure SVG + CSS transitions.
// (File name kept from the koala days so imports don't change.)
export default function LoginKoala({ look = 0, cover = false, peek = false, happy = false }: { look?: number; cover?: boolean; peek?: boolean; happy?: boolean }) {
  const x = Math.max(-1, Math.min(1, look)) * 6;
  const ease = "transform .32s cubic-bezier(.34,1.56,.64,1)";
  const BASE = "#A3ABB8", SHADE = "#828C9C", LIGHT = "#D5DBE3", INNER = "#F4B9C4", RING = "#6E7889", INK = "#283040";
  return (
    <svg className="login-koala" width="140" height="88" viewBox="0 0 140 88" aria-hidden="true">
      <defs>
        <clipPath id="lk-head"><ellipse cx="70" cy="60" rx="44" ry="36" /></clipPath>
      </defs>
      {/* ears */}
      <ellipse cx="24" cy="30" rx="20" ry="24" transform="rotate(-22 24 30)" fill={SHADE} />
      <ellipse cx="22" cy="28" rx="18" ry="22" transform="rotate(-22 22 28)" fill={BASE} />
      <ellipse cx="26" cy="32" rx="11" ry="15" transform="rotate(-22 26 32)" fill={INNER} />
      <ellipse cx="116" cy="30" rx="20" ry="24" transform="rotate(22 116 30)" fill={SHADE} />
      <ellipse cx="118" cy="28" rx="18" ry="22" transform="rotate(22 118 28)" fill={BASE} />
      <ellipse cx="114" cy="32" rx="11" ry="15" transform="rotate(22 114 32)" fill={INNER} />
      {/* head with shade crescent + highlight */}
      <g clipPath="url(#lk-head)">
        <rect x="20" y="20" width="100" height="80" fill={SHADE} />
        <ellipse cx="66" cy="56" rx="44" ry="36" fill={BASE} />
        <ellipse cx="46" cy="38" rx="12" ry="6" fill="#fff" opacity="0.3" />
      </g>
      <ellipse cx="52" cy="58" rx="19" ry="18" fill={RING} opacity="0.55" />
      <ellipse cx="88" cy="58" rx="19" ry="18" fill={RING} opacity="0.55" />
      <path d="M70 40 q4 15 0 32 q-4 -17 0 -32 z" fill={LIGHT} />
      {/* eyes */}
      {happy ? (
        <g stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round"><path d="M40 61 q12 -14 24 0" /><path d="M76 61 q12 -14 24 0" /></g>
      ) : (
        <g>
          <circle cx="52" cy="58" r="15" fill="#fff" />
          <circle cx="88" cy="58" r="15" fill="#fff" />
          <g style={{ transform: `translateX(${x}px)`, transition: ease }}>
            <circle cx="53" cy="60" r="10" fill="#C97A22" /><circle cx="87" cy="60" r="10" fill="#C97A22" />
            <circle cx="53" cy="60" r="6.5" fill={INK} /><circle cx="87" cy="60" r="6.5" fill={INK} />
            <circle cx="56.5" cy="56" r="3.3" fill="#fff" /><circle cx="90.5" cy="56" r="3.3" fill="#fff" />
          </g>
        </g>
      )}
      {/* muzzle */}
      <ellipse cx="70" cy="78" rx="12" ry="8" fill={LIGHT} />
      <path d="M65 74 q5 -3 10 0 q-1 5 -5 6 q-4 -1 -5 -6 z" fill={INK} />
      {/* paws: slide up over the eyes */}
      <g style={{ transform: cover ? "translateY(0)" : "translateY(44px)", transition: ease }}>
        <g style={{ transform: peek ? "translate(-8px, 8px) rotate(-16deg)" : "none", transformOrigin: "52px 58px", transition: ease }}>
          <ellipse cx="52" cy="60" rx="16" ry="13" fill={SHADE} />
          <g fill={LIGHT}><circle cx="44" cy="53" r="3.6" /><circle cx="52" cy="50" r="3.6" /><circle cx="60" cy="53" r="3.6" /></g>
        </g>
        <ellipse cx="88" cy="60" rx="16" ry="13" fill={SHADE} />
        <g fill={LIGHT}><circle cx="80" cy="53" r="3.6" /><circle cx="88" cy="50" r="3.6" /><circle cx="96" cy="53" r="3.6" /></g>
      </g>
    </svg>
  );
}
