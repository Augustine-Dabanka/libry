// A community cover that reads as "designed", not placeholder. Uses the real
// cover_url when a creator has uploaded one; otherwise paints a deterministic
// duotone from a cohesive on-brand palette with a soft glow and a small emoji
// glyph — so a wall of communities looks intentional instead of a row of
// emoji-in-a-circle stickers.

const DUOTONES = [
  "linear-gradient(150deg,#3a2740,#7c4d6e)", // plum
  "linear-gradient(150deg,#23414d,#2f6f79)", // teal
  "linear-gradient(150deg,#3a2c1a,#8a5a2a)", // bronze
  "linear-gradient(150deg,#3a1f22,#8a3a3a)", // wine
  "linear-gradient(150deg,#213a2b,#3f6543)", // forest
  "linear-gradient(150deg,#25233f,#4b3f7c)", // indigo
];

function hueIndex(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % DUOTONES.length;
}

export default function CommunityCover({
  name,
  emoji,
  coverUrl,
  className,
  radius = 0,
}: {
  name: string;
  emoji?: string | null;
  coverUrl?: string | null;
  className?: string;
  radius?: number;
}) {
  const bg = DUOTONES[hueIndex(name || "libry")];
  if (coverUrl) {
    return (
      <div className={`ccov ${className ?? ""}`} style={{ borderRadius: radius || undefined }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverUrl} alt="" loading="lazy" />
      </div>
    );
  }
  return (
    <div className={`ccov ccov-gen ${className ?? ""}`} style={{ background: bg, borderRadius: radius || undefined }} aria-hidden="true">
      <span className="ccov-glow" />
      <span className="ccov-glyph">{emoji || "📚"}</span>
    </div>
  );
}
