export type KoalaState = "idle" | "happy" | "sad" | "frozen" | "detective";

// Libry's koala mascot. One body, expression + props swap by state.
export default function Koala({
  state = "idle",
  size = 96,
}: {
  state?: KoalaState;
  size?: number;
}) {
  const fur = state === "frozen" ? "#A9BBC6" : "#9C968F";
  const furLight = state === "frozen" ? "#C9D6DE" : "#B8B2AB";
  const anim = state === "happy" ? "lb-cheer" : state === "sad" ? undefined : "lb-bob";

  return (
    <svg className={anim} width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`Koala (${state})`}>
      {/* ears */}
      <circle cx="24" cy="30" r="16" fill={fur} />
      <circle cx="24" cy="30" r="8.5" fill="#D8B4BE" />
      <circle cx="76" cy="30" r="16" fill={fur} />
      <circle cx="76" cy="30" r="8.5" fill="#D8B4BE" />

      {/* head */}
      <ellipse cx="50" cy="52" rx="31" ry="28" fill={fur} />
      <ellipse cx="50" cy="54" rx="24" ry="22" fill={furLight} />

      {/* cheeks */}
      <circle cx="30" cy="60" r="5" fill="rgba(216,180,190,0.5)" />
      <circle cx="70" cy="60" r="5" fill="rgba(216,180,190,0.5)" />

      {/* eyes */}
      {state === "happy" ? (
        <>
          <path d="M36 48 q5 -6 10 0" stroke="#1C1917" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M54 48 q5 -6 10 0" stroke="#1C1917" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        </>
      ) : state === "sad" ? (
        <>
          <circle cx="40" cy="49" r="4.5" fill="#1C1917" />
          <circle cx="60" cy="49" r="4.5" fill="#1C1917" />
          <path d="M35 43 q5 3 9 1" stroke="#5b544e" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M56 44 q4 -2 9 -1" stroke="#5b544e" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M40 54 q0 8 -3 12 q-3 -1 -2 -5 q1 -4 5 -7" fill="#7fb7d6" opacity="0.85" />
        </>
      ) : (
        <>
          <circle cx="40" cy="49" r="4.5" fill="#1C1917" />
          <circle cx="60" cy="49" r="4.5" fill="#1C1917" />
          <circle cx="38.5" cy="47.5" r="1.4" fill="#fff" />
          <circle cx="58.5" cy="47.5" r="1.4" fill="#fff" />
        </>
      )}

      {/* nose */}
      <ellipse cx="50" cy="60" rx="10" ry="8" fill="#3A3632" />
      <ellipse cx="46.5" cy="57.5" rx="1.8" ry="2.4" fill="rgba(255,255,255,0.28)" />

      {/* mouth */}
      {state === "sad" ? (
        <path d="M43 73 q7 -6 14 0" stroke="#3A3632" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M43 70 q7 7 14 0" stroke="#3A3632" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      )}

      {/* state props */}
      {state === "frozen" && (
        <g fill="#E8F4FA" opacity="0.9">
          <text x="14" y="20" fontSize="11">❄</text>
          <text x="80" y="70" fontSize="11">❄</text>
        </g>
      )}
      {state === "detective" && (
        <g>
          {/* magnifying glass */}
          <circle cx="78" cy="74" r="10" fill="none" stroke="#C4A35A" strokeWidth="3" />
          <line x1="86" y1="82" x2="95" y2="91" stroke="#C4A35A" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
      {state === "happy" && (
        <text x="12" y="24" fontSize="12">✨</text>
      )}
    </svg>
  );
}
