// Lightweight shimmer skeletons for perceived speed (spec §38). Pure CSS (see
// .sk / @keyframes sk-shimmer in globals.css) — no client JS, no dependency.

export function Skeleton({ w = "100%", h = 14, r = 8, style }: { w?: number | string; h?: number | string; r?: number; style?: React.CSSProperties }) {
  return <span className="sk" style={{ display: "block", width: w, height: h, borderRadius: r, ...style }} aria-hidden="true" />;
}

// A row of book-card placeholders matching the 2:3 cc-card grid.
export function BookGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="book-grid-mini" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Skeleton w="100%" h={0} r={10} style={{ aspectRatio: "2 / 3", height: "auto" }} />
          <Skeleton w="85%" h={12} style={{ marginTop: "0.5rem" }} />
          <Skeleton w="55%" h={10} style={{ marginTop: "0.35rem" }} />
        </div>
      ))}
    </div>
  );
}

// A horizontal rail of placeholders.
export function RailSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div style={{ display: "flex", gap: "0.9rem", overflow: "hidden" }} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ flex: "0 0 130px" }}>
          <Skeleton w="100%" h={0} r={10} style={{ aspectRatio: "2 / 3", height: "auto" }} />
          <Skeleton w="80%" h={11} style={{ marginTop: "0.5rem" }} />
        </div>
      ))}
    </div>
  );
}
