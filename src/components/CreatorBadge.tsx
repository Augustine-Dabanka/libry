// Lybry's creator badges (0047). Earned from real follower counts:
// Bronze 100 · Silver 500 · Gold 2,500 · Platinum 10,000 · Diamond 50,000.
// Diamond carries the "verified" rosette outline. The shape is Lybry's own
// (a scalloped seal with an open book), not a copy of any other site's tick.
export type BadgeTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export const TIERS: { key: BadgeTier; name: string; at: number; colors: [string, string, string] }[] = [
  { key: "bronze", name: "Bronze", at: 100, colors: ["#F2B48A", "#C77B48", "#8A4E28"] },
  { key: "silver", name: "Silver", at: 500, colors: ["#F4F6F9", "#B9C2CD", "#7C8796"] },
  { key: "gold", name: "Gold", at: 2500, colors: ["#FBE19A", "#E2B04A", "#A87822"] },
  { key: "platinum", name: "Platinum", at: 10000, colors: ["#E9F1F7", "#9FB8CC", "#5E7A91"] },
  { key: "diamond", name: "Diamond", at: 50000, colors: ["#FFD2C0", "#C8471F", "#7E2A10"] },
];

function seal(cx: number, cy: number, r: number, bumps = 12, depth = 0.11) {
  const pts: string[] = [];
  for (let i = 0; i <= bumps * 8; i++) {
    const a = (i / (bumps * 8)) * Math.PI * 2;
    const rr = r * (1 - depth / 2 + (depth / 2) * Math.cos(a * bumps));
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
}

export default function CreatorBadge({ tier, size = 22, title }: { tier: BadgeTier | null | undefined; size?: number; title?: string }) {
  const t = TIERS.find((x) => x.key === tier);
  if (!t) return null;
  const id = `cb-${t.key}`;
  const label = title ?? `${t.name} creator: ${t.at.toLocaleString("en-US")}+ followers${t.key === "diamond" ? ", verified" : ""}`;
  return (
    <span className="cb-badge" title={label} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox="0 0 40 40">
        <defs>
          <radialGradient id={`${id}-g`} cx="0.35" cy="0.28" r="0.85">
            <stop offset="0" stopColor={t.colors[0]} /><stop offset="0.55" stopColor={t.colors[1]} /><stop offset="1" stopColor={t.colors[2]} />
          </radialGradient>
        </defs>
        {t.key === "diamond" ? <path d={seal(20, 20, 19.5, 12, 0.14)} fill="none" stroke="#E2B04A" strokeWidth="1.6" /> : null}
        <path d={seal(20, 20, t.key === "diamond" ? 16.5 : 18.5)} fill={`url(#${id}-g)`} stroke={t.colors[2]} strokeWidth="1" />
        {/* open book with a tick */}
        <path d="M11 15.5 q4.5 -2 9 1 q4.5 -3 9 -1 v11 q-4.5 -2 -9 1 q-4.5 -3 -9 -1 z" fill="#fff" fillOpacity="0.92" />
        <path d="M20 16.5 v11" stroke={t.colors[2]} strokeWidth="1.2" />
        <path d="M15.5 21.5 l3 3 l6 -6.5" stroke={t.colors[2]} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
