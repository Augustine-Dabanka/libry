// Animated hero: a reader walks up to the library and keeps hauling home stacks
// of books — two today, three more tomorrow — until it's too much. Then they
// pull out their phone, find Libry, and read happily (thumbs up). Loops calmly.
export default function HeroArt() {
  return (
    <div className="heroart-scene" style={{ width: "100%", maxWidth: 400, margin: "0 auto" }}>
      <svg viewBox="0 0 400 460" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A reader trades hauling stacks of books for reading on Libry, and gives a happy thumbs up">
        <rect x="8" y="8" width="384" height="444" rx="16" fill="#22201E" stroke="rgba(250,247,242,0.08)" />

        {/* soft warm glow */}
        <circle cx="118" cy="120" r="86" fill="#C4A35A" opacity="0.10" />

        {/* ── Library building ── */}
        <g>
          {/* pediment */}
          <path d="M44 168 L120 118 L196 168 Z" fill="#6E6259" />
          <path d="M44 168 L120 118 L196 168 Z" fill="none" stroke="#8a7d70" strokeWidth="1.5" />
          {/* architrave */}
          <rect x="48" y="168" width="144" height="14" fill="#7d7166" />
          {/* columns */}
          <rect x="58" y="182" width="16" height="150" rx="2" fill="#6E6259" />
          <rect x="86" y="182" width="16" height="150" rx="2" fill="#645a51" />
          <rect x="138" y="182" width="16" height="150" rx="2" fill="#645a51" />
          <rect x="166" y="182" width="16" height="150" rx="2" fill="#6E6259" />
          {/* doorway */}
          <rect x="108" y="238" width="24" height="94" rx="12" fill="#2c2925" />
          <rect x="108" y="238" width="24" height="94" rx="12" fill="none" stroke="#C4A35A" strokeWidth="1.5" opacity="0.5" />
          {/* steps */}
          <rect x="40" y="332" width="160" height="12" rx="2" fill="#544b43" />
          <rect x="30" y="344" width="180" height="12" rx="2" fill="#48403a" />
          {/* sign */}
          <text x="120" y="205" textAnchor="middle" fill="#C4A35A" fontFamily="Georgia, serif" fontSize="12" letterSpacing="3">LIBRARY</text>
        </g>

        {/* ground */}
        <rect x="24" y="356" width="352" height="8" rx="3" fill="#3a332e" />

        {/* ── The reader ── */}
        <g className="ha-person" style={{ transformOrigin: "278px 356px" }}>
          {/* legs */}
          <rect x="268" y="322" width="8" height="34" rx="3" fill="#44403C" />
          <rect x="282" y="322" width="8" height="34" rx="3" fill="#3a3733" />
          {/* body */}
          <rect x="262" y="270" width="34" height="58" rx="14" fill="#3E7C8C" />
          {/* head */}
          <circle cx="279" cy="252" r="15" fill="#E0B48C" />
          <path d="M265 248 q14 -18 28 0 q-4 -12 -14 -12 q-10 0 -14 12Z" fill="#5b4a3f" />
          {/* neutral face (during the struggle) */}
          <g className="ha-face-plain">
            <circle cx="274" cy="251" r="1.6" fill="#3a2f28" />
            <circle cx="284" cy="251" r="1.6" fill="#3a2f28" />
            <line x1="275" y1="258" x2="283" y2="258" stroke="#3a2f28" strokeWidth="1.6" strokeLinecap="round" />
          </g>
          {/* arms hugging the stack */}
          <path d="M262 292 q-8 8 4 18 M296 292 q8 8 -4 18" fill="none" stroke="#356b79" strokeWidth="7" strokeLinecap="round" />

          {/* the growing, teetering stack of books */}
          <g className="ha-stack" style={{ transformOrigin: "278px 300px" }}>
            <rect className="ha-book-a" x="258" y="296" width="42" height="9" rx="1.5" fill="#B45309" />
            <rect className="ha-book-a" x="261" y="286" width="40" height="9" rx="1.5" fill="#C4A35A" />
            <rect className="ha-book-b" x="256" y="276" width="44" height="9" rx="1.5" fill="#7C4D6E" />
            <rect className="ha-book-b" x="260" y="266" width="40" height="9" rx="1.5" fill="#4E7A52" />
            <rect className="ha-book-b" x="258" y="256" width="42" height="9" rx="1.5" fill="#3E7C8C" />
          </g>

          {/* struggle marks */}
          <text className="ha-sweat" x="300" y="242" fontFamily="Georgia, serif" fontSize="16" fill="#E7E5E4">!</text>
          <path className="ha-sweat2" d="M258 244 q-3 5 0 8 q3 -3 0 -8Z" fill="#8fc7d6" />
        </g>

        {/* ── Phone + Libry (the relief) ── */}
        <g className="ha-phone" style={{ transformOrigin: "306px 316px" }}>
          <rect x="286" y="284" width="44" height="72" rx="9" fill="#1a1917" stroke="#C4A35A" strokeWidth="1.5" />
          <rect x="291" y="293" width="34" height="54" rx="4" fill="#2c2925" />
          {/* Libry mark */}
          <text className="ha-libry" x="308" y="318" textAnchor="middle" fontFamily="Georgia, serif" fontSize="17" fontWeight="700" fill="#C4A35A">L<tspan fill="#7C6BF5">.</tspan></text>
          {/* the book that appears on screen */}
          <g className="ha-pbook">
            <rect x="299" y="308" width="18" height="24" rx="2" fill="#B45309" />
            <line x1="308" y1="309" x2="308" y2="331" stroke="#7a370a" strokeWidth="1" />
          </g>
          {/* tap ripple */}
          <circle className="ha-tap" cx="308" cy="320" r="6" fill="none" stroke="#FAF7F2" strokeWidth="2" />
        </g>

        {/* ── Happy payoff ── */}
        <g className="ha-happy">
          {/* smile overlay on the face */}
          <path d="M273 256 q6 6 12 0" fill="none" stroke="#3a2f28" strokeWidth="1.8" strokeLinecap="round" />
          {/* thumbs up */}
          <text x="243" y="262" fontFamily="system-ui, sans-serif" fontSize="22">👍</text>
          {/* sparkles */}
          <g fill="#C4A35A">
            <path className="ha-spark" d="M336 292 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2Z" />
            <path className="ha-spark ha-spark2" d="M300 268 l1.4 3.5 3.5 1.4 -3.5 1.4 -1.4 3.5 -1.4 -3.5 -3.5 -1.4 3.5 -1.4Z" />
          </g>
        </g>

        <text x="200" y="430" textAnchor="middle" fill="#78716C" fontFamily="Georgia, serif" fontStyle="italic" fontSize="17">
          the library, in your pocket
        </text>
      </svg>

      <style>{`
        .heroart-scene .ha-person,
        .heroart-scene .ha-book-a,
        .heroart-scene .ha-book-b,
        .heroart-scene .ha-phone,
        .heroart-scene .ha-pbook,
        .heroart-scene .ha-happy,
        .heroart-scene .ha-sweat,
        .heroart-scene .ha-sweat2,
        .heroart-scene .ha-tap { opacity: 0; }

        .heroart-scene .ha-person { animation: ha-person 16s ease-in-out infinite; }
        .heroart-scene .ha-stack  { animation: ha-wobble 16s ease-in-out infinite; }
        .heroart-scene .ha-book-a { animation: ha-book-a 16s ease-in-out infinite; }
        .heroart-scene .ha-book-b { animation: ha-book-b 16s ease-in-out infinite; }
        .heroart-scene .ha-sweat,
        .heroart-scene .ha-sweat2 { animation: ha-sweat 16s ease-in-out infinite; }
        .heroart-scene .ha-face-plain { animation: ha-faceplain 16s step-end infinite; }
        .heroart-scene .ha-phone  { animation: ha-phone 16s ease-in-out infinite; }
        .heroart-scene .ha-libry  { animation: ha-glow 16s ease-in-out infinite; }
        .heroart-scene .ha-tap    { animation: ha-tap 16s ease-in-out infinite; }
        .heroart-scene .ha-pbook  { animation: ha-pbook 16s ease-in-out infinite; }
        .heroart-scene .ha-happy  { animation: ha-happy 16s ease-in-out infinite; }
        .heroart-scene .ha-spark  { animation: ha-spark 16s ease-in-out infinite; }
        .heroart-scene .ha-spark2 { animation-delay: -1.2s; }

        @keyframes ha-person {
          0%   { opacity: 0; transform: translateX(120px) rotate(0deg); }
          5%   { opacity: 1; }
          14%  { transform: translateX(0) rotate(0deg); }
          38%  { transform: translateX(0) rotate(0deg); }
          46%  { transform: translateX(0) rotate(-4deg); }
          52%  { transform: translateX(0) rotate(3deg); }
          58%  { transform: translateX(0) rotate(0deg); }
          96%  { opacity: 1; transform: translateX(0) rotate(0deg); }
          100% { opacity: 0; transform: translateX(0) rotate(0deg); }
        }
        @keyframes ha-book-a {
          0%,15% { opacity: 0; transform: scale(0.4) translateY(10px); }
          20%,54% { opacity: 1; transform: none; }
          60%,100% { opacity: 0; transform: scale(0.9) translateY(-4px); }
        }
        @keyframes ha-book-b {
          0%,28% { opacity: 0; transform: scale(0.4) translateY(10px); }
          33%,54% { opacity: 1; transform: none; }
          60%,100% { opacity: 0; transform: scale(0.9) translateY(-4px); }
        }
        @keyframes ha-wobble {
          0%,36% { transform: rotate(0deg); }
          42% { transform: rotate(5deg); }
          48% { transform: rotate(-6deg); }
          54% { transform: rotate(4deg); }
          58%,100% { transform: rotate(0deg); }
        }
        @keyframes ha-sweat {
          0%,38% { opacity: 0; }
          42%,56% { opacity: 1; }
          60%,100% { opacity: 0; }
        }
        @keyframes ha-faceplain {
          0%,79% { opacity: 1; }
          80%,100% { opacity: 0; }
        }
        @keyframes ha-phone {
          0%,58% { opacity: 0; transform: translateY(22px) scale(0.6); }
          65% { opacity: 1; transform: translateY(0) scale(1); }
          96% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; }
        }
        @keyframes ha-glow {
          0%,64% { opacity: 0; }
          70% { opacity: 1; }
          82% { opacity: 0.6; }
          92% { opacity: 1; }
          96%,100% { opacity: 0.9; }
        }
        @keyframes ha-tap {
          0%,66% { opacity: 0; transform: scale(0.4); }
          70% { opacity: 0.9; transform: scale(0.6); }
          76% { opacity: 0; transform: scale(2.4); }
          100% { opacity: 0; }
        }
        @keyframes ha-pbook {
          0%,74% { opacity: 0; transform: translateY(8px) scale(0.6); }
          80%,96% { opacity: 1; transform: none; }
          100% { opacity: 0; }
        }
        @keyframes ha-happy {
          0%,80% { opacity: 0; transform: scale(0.6); }
          85% { opacity: 1; transform: scale(1.12); }
          90%,96% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; }
        }
        @keyframes ha-spark {
          0%,84% { opacity: 0; transform: scale(0.4) rotate(0deg); }
          89% { opacity: 1; transform: scale(1) rotate(45deg); }
          96%,100% { opacity: 0; transform: scale(0.6) rotate(90deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .heroart-scene .ha-person,
          .heroart-scene .ha-phone,
          .heroart-scene .ha-pbook,
          .heroart-scene .ha-happy,
          .heroart-scene .ha-libry { opacity: 1 !important; transform: none !important; animation: none !important; }
          .heroart-scene .ha-book-a,
          .heroart-scene .ha-book-b,
          .heroart-scene .ha-stack,
          .heroart-scene .ha-sweat,
          .heroart-scene .ha-sweat2,
          .heroart-scene .ha-tap,
          .heroart-scene .ha-face-plain { animation: none !important; opacity: 0 !important; }
        }
      `}</style>
    </div>
  );
}
