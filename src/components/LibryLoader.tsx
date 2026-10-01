// The Libry loader: L-I-B-R-Y fly in, collide into the "L", and the dot drops
// and bounces into place, then it repeats. Pure CSS (see .ll-* in globals.css):
// no JS, no image, about 1 KB, transform/opacity only, so it never slows the
// page loading underneath it. Honors prefers-reduced-motion.
//
// Two ways to use it (both existed before, so every loading.tsx keeps working):
//   <LibryLoader size={44} label="..." />        inline mark only (label is for screen readers)
//   <LibryLoader label="..." minHeight="60vh" /> full loading screen with a visible label
export default function LibryLoader({
  size,
  label = "Loading…",
  minHeight = "60vh",
}: {
  size?: number;
  label?: string;
  minHeight?: string;
}) {
  const mark = (px: number, a11yLabel?: string) => (
    <span className="ll" style={{ fontSize: px }} role={a11yLabel ? "status" : undefined} aria-label={a11yLabel} aria-hidden={a11yLabel ? undefined : true}>
      <span className="ll-ch ll-i" aria-hidden="true">I</span>
      <span className="ll-ch ll-b" aria-hidden="true">B</span>
      <span className="ll-ch ll-r" aria-hidden="true">R</span>
      <span className="ll-ch ll-y" aria-hidden="true">Y</span>
      <span className="ll-ch ll-l" aria-hidden="true">L</span>
      <span className="ll-dot" aria-hidden="true" />
    </span>
  );

  if (typeof size === "number") return mark(size, label);

  return (
    <div className="libry-loader" style={{ minHeight }} role="status" aria-live="polite">
      {mark(56)}
      <span className="ll-label">{label}</span>
    </div>
  );
}
