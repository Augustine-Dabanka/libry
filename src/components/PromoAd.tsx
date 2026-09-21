// Standalone animated "ad" — a longer, shareable version of the hero story,
// built to be screen-recorded or screenshotted for social. Six beats loop over
// 30s: 1) title, 2) the daily 3 km walk, 3) a friend shares Libry, 4) the
// features fan out, 5) a creator gets paid (keep 65%), 6) the payoff + CTA.
// All styles live in globals.css (scope .promoad) so they load reliably under
// React 19; scene 6 is opacity:1 inline as a no-CSS fallback.
export default function PromoAd() {
  return (
    <div className="promoad" style={{ width: "100%", maxWidth: 400, margin: "0 auto" }}>
      <svg viewBox="0 0 400 640" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Libry — the library in your pocket: a daily 3 km walk to the library, a friend shares the app, read and listen and collect, creators keep 65%, and start reading free.">
        <defs>
          <linearGradient id="pa-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#26231F" />
            <stop offset="1" stopColor="#17140F" />
          </linearGradient>
          <radialGradient id="pa-glow" cx="0.5" cy="0.28" r="0.6">
            <stop offset="0" stopColor="#C4A35A" stopOpacity="0.22" />
            <stop offset="1" stopColor="#C4A35A" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect x="6" y="6" width="388" height="628" rx="22" fill="url(#pa-bg)" stroke="rgba(250,247,242,0.09)" />
        <rect x="6" y="6" width="388" height="628" rx="22" fill="url(#pa-glow)" />

        {/* Brand header — always on */}
        <text x="34" y="52" fontFamily="Georgia, serif" fontStyle="italic" fontSize="26" fontWeight="700" fill="#FAF7F2">Libry<tspan fill="#C4A35A">.</tspan></text>
        <text x="366" y="50" textAnchor="end" fontFamily="sans-serif" fontSize="11" letterSpacing="2" fill="#8a7d70">EARLY ACCESS</text>

        {/* ── 1 · Title ── */}
        <g className="pa pa1" opacity="0">
          <text x="200" y="300" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="44" fontWeight="700" fill="#FAF7F2">Libry<tspan fill="#C4A35A">.</tspan></text>
          <text x="200" y="344" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="18" fill="#C4A35A">the library, in your pocket</text>
          <g className="pa1-spark" fill="#C4A35A">
            <path d="M300 250 l2.4 6 6 2.4 -6 2.4 -2.4 6 -2.4 -6 -6 -2.4 6 -2.4Z" />
          </g>
        </g>

        {/* ── 2 · The daily 3 km walk ── */}
        <g className="pa pa2" opacity="0">
          <circle className="pa2-sun" cx="200" cy="150" r="18" fill="#C4A35A" opacity="0.85" />
          <text x="200" y="120" textAnchor="middle" fill="#a99a86" fontFamily="Georgia, serif" fontStyle="italic" fontSize="16">Before Libry…</text>
          {[0, 1, 2, 3, 4, 5, 6].map((d) => (
            <circle key={d} className={`pa2-dot pa2-dot-${d}`} cx={128 + d * 24} cy="210" r="6" fill="#44403C" stroke="#5a5048" />
          ))}
          <text x="200" y="240" textAnchor="middle" fill="#78716C" fontFamily="sans-serif" fontSize="12">seven days a week</text>

          {/* house */}
          <g>
            <rect x="44" y="420" width="58" height="54" fill="#3E7C8C" />
            <path d="M40 420 L73 393 L106 420 Z" fill="#356b79" />
            <rect x="63" y="442" width="18" height="32" fill="#22201E" />
          </g>
          {/* library */}
          <g>
            <path d="M296 420 L334 396 L372 420 Z" fill="#6E6259" />
            <rect x="300" y="420" width="12" height="54" fill="#645a51" />
            <rect x="320" y="420" width="12" height="54" fill="#6E6259" />
            <rect x="340" y="420" width="12" height="54" fill="#645a51" />
            <rect x="358" y="420" width="10" height="54" fill="#6E6259" />
            <text x="334" y="412" textAnchor="middle" fill="#C4A35A" fontFamily="Georgia, serif" fontSize="9" letterSpacing="1.5">LIBRARY</text>
          </g>
          <rect x="106" y="474" width="190" height="6" rx="3" fill="#3a332e" />
          <text x="201" y="500" textAnchor="middle" fill="#8a7d70" fontFamily="sans-serif" fontSize="12">3 km</text>

          <g className="pa2-walk">
            <circle cx="0" cy="440" r="9" fill="#E0B48C" />
            <rect x="-8" y="450" width="16" height="20" rx="6" fill="#B45309" />
            <line className="pa2-leg" x1="-3" y1="470" x2="-6" y2="478" stroke="#44403C" strokeWidth="3" strokeLinecap="round" />
            <line className="pa2-leg pa2-leg2" x1="3" y1="470" x2="6" y2="478" stroke="#44403C" strokeWidth="3" strokeLinecap="round" />
          </g>
          <text x="200" y="560" textAnchor="middle" fill="#E7E5E4" fontFamily="Georgia, serif" fontStyle="italic" fontSize="19">3 km, every single day.</text>
        </g>

        {/* ── 3 · A friend shares Libry ── */}
        <g className="pa pa3" opacity="0">
          <g>
            <circle cx="150" cy="330" r="18" fill="#E0B48C" />
            <rect x="132" y="350" width="36" height="58" rx="13" fill="#7C4D6E" />
          </g>
          <g>
            <circle cx="258" cy="330" r="18" fill="#D9A06C" />
            <rect x="240" y="350" width="36" height="58" rx="13" fill="#3E7C8C" />
          </g>
          <g className="pa3-bubble">
            <rect x="116" y="256" width="150" height="44" rx="14" fill="#2c2925" stroke="#C4A35A" strokeWidth="1.2" />
            <path d="M150 300 l0 14 l14 -14 Z" fill="#2c2925" />
            <text x="191" y="283" textAnchor="middle" fill="#E7E5E4" fontFamily="sans-serif" fontSize="14">You have to try Libry!</text>
          </g>
          <g className="pa3-app">
            <rect x="-16" y="-16" width="32" height="32" rx="9" fill="#C4A35A" />
            <text x="0" y="7" textAnchor="middle" fontFamily="Georgia, serif" fontSize="20" fontWeight="700" fill="#22201E">L</text>
          </g>
          <text x="200" y="560" textAnchor="middle" fill="#E7E5E4" fontFamily="Georgia, serif" fontStyle="italic" fontSize="19">Then a friend shared Libry.</text>
        </g>

        {/* ── 4 · Features fan out ── */}
        <g className="pa pa4" opacity="0">
          <rect x="150" y="150" width="100" height="230" rx="18" fill="#1a1917" stroke="#C4A35A" strokeWidth="1.5" />
          <text x="200" y="188" textAnchor="middle" fontFamily="Georgia, serif" fontSize="20" fontWeight="700" fill="#C4A35A">Libry<tspan fill="#7C6BF5">.</tspan></text>
          <g className="pa4-f pa4-f1">
            <rect x="162" y="204" width="76" height="36" rx="9" fill="#2c2925" />
            <text x="176" y="228" fontSize="16">📖</text>
            <text x="196" y="227" fill="#E7E5E4" fontFamily="sans-serif" fontSize="11">Read books</text>
          </g>
          <g className="pa4-f pa4-f2">
            <rect x="162" y="248" width="76" height="36" rx="9" fill="#2c2925" />
            <text x="176" y="272" fontSize="16">🎧</text>
            <text x="196" y="271" fill="#E7E5E4" fontFamily="sans-serif" fontSize="11">Listen</text>
          </g>
          <g className="pa4-f pa4-f3">
            <rect x="162" y="292" width="76" height="36" rx="9" fill="#2c2925" />
            <text x="176" y="316" fontSize="16">💥</text>
            <text x="196" y="315" fill="#E7E5E4" fontFamily="sans-serif" fontSize="11">Comics</text>
          </g>
          <g className="pa4-f pa4-f4">
            <rect x="162" y="336" width="76" height="36" rx="9" fill="#2c2925" />
            <text x="176" y="360" fontSize="16">✍️</text>
            <text x="196" y="359" fill="#C4A35A" fontFamily="sans-serif" fontSize="11" fontWeight="700">Create</text>
          </g>
          <text x="200" y="560" textAnchor="middle" fill="#E7E5E4" fontFamily="Georgia, serif" fontStyle="italic" fontSize="19">Read. Listen. Collect. Create.</text>
        </g>

        {/* ── 5 · Creators get paid ── */}
        <g className="pa pa5" opacity="0">
          <circle cx="200" cy="300" r="30" fill="#1a1917" stroke="#C4A35A" strokeWidth="1.5" />
          <text x="200" y="292" textAnchor="middle" fontFamily="Georgia, serif" fontSize="20" fontWeight="800" fill="#C4A35A">65%</text>
          <text x="200" y="312" textAnchor="middle" fontFamily="sans-serif" fontSize="8" letterSpacing="1" fill="#a99a86">TO YOU</text>
          {[0, 1, 2, 3, 4].map((c) => (
            <g key={c} className={`pa5-coin pa5-coin-${c}`}>
              <circle cx={120 + c * 40} cy="400" r="12" fill="#C4A35A" stroke="#a5843f" />
              <text x={120 + c * 40} y="404" textAnchor="middle" fontFamily="Georgia, serif" fontSize="11" fontWeight="700" fill="#22201E">₵</text>
            </g>
          ))}
          <text x="200" y="470" textAnchor="middle" fill="#C4A35A" fontFamily="sans-serif" fontSize="13" fontWeight="700">Publish books, comics &amp; products</text>
          <text x="200" y="560" textAnchor="middle" fill="#E7E5E4" fontFamily="Georgia, serif" fontStyle="italic" fontSize="19">Creators keep 65%.</text>
        </g>

        {/* ── 6 · Payoff + CTA (opacity 1 fallback) ── */}
        <g className="pa pa6" opacity="1">
          <rect x="120" y="300" width="160" height="46" rx="15" fill="#4E7A52" />
          <rect x="112" y="285" width="24" height="61" rx="10" fill="#3f6543" />
          <rect x="264" y="285" width="24" height="61" rx="10" fill="#3f6543" />
          <circle cx="200" cy="270" r="16" fill="#E0B48C" />
          <circle cx="194" cy="269" r="1.7" fill="#3a2f28" />
          <circle cx="206" cy="269" r="1.7" fill="#3a2f28" />
          <path d="M193 276 q7 6 14 0" fill="none" stroke="#3a2f28" strokeWidth="1.9" strokeLinecap="round" />
          <rect x="182" y="287" width="36" height="28" rx="11" fill="#3E7C8C" />
          <rect x="216" y="296" width="28" height="42" rx="6" fill="#1a1917" stroke="#C4A35A" strokeWidth="1.2" />
          <text x="230" y="322" textAnchor="middle" fontFamily="Georgia, serif" fontSize="13" fontWeight="700" fill="#C4A35A">L<tspan fill="#7C6BF5">.</tspan></text>
          <text className="pa6-thumb" x="150" y="268" fontFamily="sans-serif" fontSize="24">👍</text>
          <g fill="#C4A35A">
            <path className="pa6-spark" d="M266 250 l2.2 5.4 5.4 2.2 -5.4 2.2 -2.2 5.4 -2.2 -5.4 -5.4 -2.2 5.4 -2.2Z" />
            <path className="pa6-spark pa6-spark2" d="M172 246 l1.5 3.8 3.8 1.5 -3.8 1.5 -1.5 3.8 -1.5 -3.8 -3.8 -1.5 3.8 -1.5Z" />
          </g>

          {/* CTA pill (baked in for the recorded loop) */}
          <g className="pa6-cta">
            <rect x="96" y="430" width="208" height="52" rx="26" fill="#C4A35A" />
            <text x="200" y="462" textAnchor="middle" fontFamily="sans-serif" fontSize="17" fontWeight="800" fill="#20180a">Start reading free →</text>
          </g>
          <text x="200" y="560" textAnchor="middle" fill="#C4A35A" fontFamily="Georgia, serif" fontStyle="italic" fontSize="20">The library, in your pocket.</text>
        </g>

        <text x="200" y="606" textAnchor="middle" fill="#6b625a" fontFamily="sans-serif" fontSize="11" letterSpacing="1">@officially_libry</text>
      </svg>
    </div>
  );
}
