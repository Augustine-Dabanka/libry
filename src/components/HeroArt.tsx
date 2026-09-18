// Animated hero — a four-scene story that loops (styles live in globals.css so
// they always load): 1) the daily 3 km walk to the library (a week of dots
// fills), 2) a friend shares Libry, 3) the app's features fan out — read books,
// digital products, get paid to create, 4) reading happily at home. Respects
// prefers-reduced-motion (settles on the payoff scene).
export default function HeroArt() {
  return (
    <div className="heroart-scene" style={{ width: "100%", maxWidth: 400, margin: "0 auto" }}>
      <svg viewBox="0 0 400 460" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A daily 3km walk to the library, then a friend shares Libry — read books, get digital products, and get paid to create, all from your phone">
        <rect x="8" y="8" width="384" height="444" rx="16" fill="#22201E" stroke="rgba(250,247,242,0.08)" />

        {/* ── Scene 1 — the daily 3 km trek ── */}
        <g className="sc sc1">
          <circle className="s1-sun" cx="200" cy="70" r="16" fill="#C4A35A" opacity="0.85" />
          {[0, 1, 2, 3, 4, 5, 6].map((d) => (
            <circle key={d} className={`s1-dot s1-dot-${d}`} cx={120 + d * 27} cy="112" r="6" fill="#44403C" stroke="#5a5048" />
          ))}
          <text x="200" y="140" textAnchor="middle" fill="#78716C" fontFamily="sans-serif" fontSize="12">a week, every week</text>

          <g>
            <rect x="44" y="300" width="60" height="56" fill="#3E7C8C" />
            <path d="M40 300 L74 272 L108 300 Z" fill="#356b79" />
            <rect x="64" y="322" width="18" height="34" fill="#22201E" />
          </g>
          <g>
            <path d="M300 300 L336 274 L372 300 Z" fill="#6E6259" />
            <rect x="304" y="300" width="12" height="56" fill="#645a51" />
            <rect x="324" y="300" width="12" height="56" fill="#6E6259" />
            <rect x="344" y="300" width="12" height="56" fill="#645a51" />
            <rect x="360" y="300" width="8" height="56" fill="#6E6259" />
            <text x="336" y="292" textAnchor="middle" fill="#C4A35A" fontFamily="Georgia, serif" fontSize="8" letterSpacing="1.5">LIBRARY</text>
          </g>
          <rect x="104" y="356" width="196" height="6" rx="3" fill="#3a332e" />
          <text x="202" y="384" textAnchor="middle" fill="#8a7d70" fontFamily="sans-serif" fontSize="12">3 km</text>

          <g className="s1-walk">
            <circle cx="0" cy="322" r="9" fill="#E0B48C" />
            <rect x="-8" y="332" width="16" height="20" rx="6" fill="#B45309" />
            <line className="s1-leg" x1="-3" y1="352" x2="-6" y2="360" stroke="#44403C" strokeWidth="3" strokeLinecap="round" />
            <line className="s1-leg s1-leg2" x1="3" y1="352" x2="6" y2="360" stroke="#44403C" strokeWidth="3" strokeLinecap="round" />
          </g>
          <text x="200" y="430" textAnchor="middle" fill="#78716C" fontFamily="Georgia, serif" fontStyle="italic" fontSize="16">3 km, every single day</text>
        </g>

        {/* ── Scene 2 — a friend shares Libry ── */}
        <g className="sc sc2">
          <g>
            <circle cx="150" cy="250" r="16" fill="#E0B48C" />
            <rect x="134" y="268" width="32" height="52" rx="12" fill="#7C4D6E" />
          </g>
          <g>
            <circle cx="252" cy="250" r="16" fill="#D9A06C" />
            <rect x="236" y="268" width="32" height="52" rx="12" fill="#3E7C8C" />
          </g>
          <g className="s2-bubble">
            <rect x="120" y="196" width="120" height="38" rx="12" fill="#2c2925" stroke="#C4A35A" strokeWidth="1.2" />
            <path d="M150 234 l0 12 l12 -12 Z" fill="#2c2925" />
            <text x="180" y="220" textAnchor="middle" fill="#E7E5E4" fontFamily="sans-serif" fontSize="13">You have to try Libry!</text>
          </g>
          <g className="s2-app">
            <rect x="-15" y="-15" width="30" height="30" rx="8" fill="#C4A35A" />
            <text x="0" y="6" textAnchor="middle" fontFamily="Georgia, serif" fontSize="18" fontWeight="700" fill="#22201E">L</text>
          </g>
          <text x="200" y="430" textAnchor="middle" fill="#78716C" fontFamily="Georgia, serif" fontStyle="italic" fontSize="16">then a friend shared Libry</text>
        </g>

        {/* ── Scene 3 — the features ── */}
        <g className="sc sc3">
          <rect x="150" y="96" width="100" height="200" rx="16" fill="#1a1917" stroke="#C4A35A" strokeWidth="1.5" />
          <text x="200" y="130" textAnchor="middle" fontFamily="Georgia, serif" fontSize="20" fontWeight="700" fill="#C4A35A">Libry<tspan fill="#7C6BF5">.</tspan></text>
          <g className="s3-f1">
            <rect x="162" y="150" width="76" height="34" rx="8" fill="#2c2925" />
            <text x="176" y="172" fontSize="16">📖</text>
            <text x="196" y="171" fill="#E7E5E4" fontFamily="sans-serif" fontSize="11">Read books</text>
          </g>
          <g className="s3-f2">
            <rect x="162" y="192" width="76" height="34" rx="8" fill="#2c2925" />
            <text x="176" y="214" fontSize="16">🎧</text>
            <text x="196" y="209" fill="#E7E5E4" fontFamily="sans-serif" fontSize="9">Audiobooks,</text>
            <text x="196" y="220" fill="#E7E5E4" fontFamily="sans-serif" fontSize="9">templates, PDFs</text>
          </g>
          <g className="s3-f3">
            <rect x="162" y="234" width="76" height="34" rx="8" fill="#2c2925" />
            <text x="176" y="256" fontSize="16">✍️</text>
            <text x="196" y="251" fill="#C4A35A" fontFamily="sans-serif" fontSize="9" fontWeight="700">Create &amp; get</text>
            <text x="196" y="262" fill="#C4A35A" fontFamily="sans-serif" fontSize="9" fontWeight="700">paid 💰</text>
          </g>
          <text x="200" y="430" textAnchor="middle" fill="#78716C" fontFamily="Georgia, serif" fontStyle="italic" fontSize="16">read · collect · get paid</text>
        </g>

        {/* ── Scene 4 — the payoff ── */}
        <g className="sc sc4">
          <rect x="120" y="300" width="160" height="44" rx="14" fill="#4E7A52" />
          <rect x="112" y="286" width="24" height="58" rx="10" fill="#3f6543" />
          <rect x="264" y="286" width="24" height="58" rx="10" fill="#3f6543" />
          <circle cx="200" cy="272" r="15" fill="#E0B48C" />
          <circle cx="195" cy="271" r="1.6" fill="#3a2f28" />
          <circle cx="205" cy="271" r="1.6" fill="#3a2f28" />
          <path d="M194 277 q6 6 12 0" fill="none" stroke="#3a2f28" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="184" y="288" width="32" height="26" rx="10" fill="#3E7C8C" />
          <rect x="216" y="296" width="26" height="40" rx="5" fill="#1a1917" stroke="#C4A35A" strokeWidth="1.2" />
          <text x="229" y="320" textAnchor="middle" fontFamily="Georgia, serif" fontSize="12" fontWeight="700" fill="#C4A35A">L<tspan fill="#7C6BF5">.</tspan></text>
          <text className="s4-thumb" x="150" y="270" fontFamily="sans-serif" fontSize="22">👍</text>
          <g fill="#C4A35A">
            <path className="s4-spark" d="M264 250 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2Z" />
            <path className="s4-spark s4-spark2" d="M176 244 l1.4 3.5 3.5 1.4 -3.5 1.4 -1.4 3.5 -1.4 -3.5 -3.5 -1.4 3.5 -1.4Z" />
          </g>
          <text x="200" y="430" textAnchor="middle" fill="#C4A35A" fontFamily="Georgia, serif" fontStyle="italic" fontSize="17">the library, in your pocket</text>
        </g>
      </svg>
    </div>
  );
}
