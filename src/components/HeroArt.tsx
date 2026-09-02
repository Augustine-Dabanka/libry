// The original home.html hero illustration — a cozy bookshelf with a warm lamp.
export default function HeroArt() {
  return (
    <svg
      viewBox="0 0 400 460"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="A cozy bookshelf with a warm reading lamp"
      style={{ width: "100%", maxWidth: 400 }}
    >
      <rect x="8" y="8" width="384" height="444" rx="16" fill="#22201E" stroke="rgba(250,247,242,0.08)" />
      <circle className="hero-lamp" cx="312" cy="96" r="60" fill="#C4A35A" opacity="0.6" />
      <circle cx="312" cy="96" r="16" fill="#FAF7F2" opacity="0.9" />
      <rect x="40" y="150" width="320" height="10" rx="3" fill="#44403C" />
      <g>
        <rect x="56" y="92" width="22" height="58" fill="#C4A35A" />
        <rect x="82" y="104" width="20" height="46" fill="#B45309" />
        <rect x="106" y="86" width="24" height="64" fill="#7C4D6E" />
        <rect className="hero-book-sway" x="134" y="98" width="18" height="52" fill="#3E7C8C" />
        <rect x="156" y="108" width="22" height="42" fill="#4E7A52" />
        <rect x="182" y="90" width="20" height="60" fill="#E7E5E4" />
        <rect x="214" y="126" width="20" height="24" rx="2" fill="#8F3F07" />
        <path d="M224 126 q-14 -18 -22 -6 q10 2 22 6 M224 126 q14 -20 24 -6 q-12 2 -24 6 M224 126 q0 -22 0 -22" stroke="#4E7A52" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
      <rect x="40" y="250" width="320" height="10" rx="3" fill="#44403C" />
      <g>
        <rect x="60" y="196" width="24" height="54" fill="#B45309" />
        <rect x="88" y="204" width="20" height="46" fill="#C4A35A" />
        <rect x="112" y="190" width="22" height="60" fill="#3E7C8C" />
        <rect x="138" y="200" width="18" height="50" fill="#7C4D6E" />
        <rect x="176" y="222" width="34" height="28" rx="4" fill="#E7E5E4" />
        <path d="M210 228 q12 2 12 12 q0 8 -12 8" fill="none" stroke="#E7E5E4" strokeWidth="4" />
        <path className="hero-steam" d="M186 214 q4 -8 0 -14 M196 214 q4 -8 0 -14" stroke="#A8A29E" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
      <rect x="40" y="350" width="320" height="10" rx="3" fill="#44403C" />
      <g>
        <rect x="64" y="296" width="20" height="54" fill="#7C4D6E" />
        <rect x="88" y="304" width="22" height="46" fill="#E7E5E4" />
        <rect x="114" y="292" width="24" height="58" fill="#C4A35A" />
        <rect x="142" y="300" width="18" height="50" fill="#B45309" />
        <rect x="164" y="296" width="20" height="54" fill="#4E7A52" />
        <rect x="188" y="306" width="22" height="44" fill="#3E7C8C" />
      </g>
      <text x="200" y="418" textAnchor="middle" fill="#78716C" fontFamily="Georgia, serif" fontStyle="italic" fontSize="18">
        a place to linger
      </text>
    </svg>
  );
}
