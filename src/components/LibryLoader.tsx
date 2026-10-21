// The Lybry loader: L, E, E, P hop in one after another and the dot drops onto
// the baseline, then the word drops away and it repeats. The letters are a real
// flex row, so they never overlap. Pure CSS (see .ll-* in globals.css):
// no JS, no image, about 1 KB, transform/opacity only, so it never slows the
// page loading underneath it. Honors prefers-reduced-motion.
//
// Two ways to use it (both existed before, so every loading.tsx keeps working):
//   <LibryLoader size={44} label="..." />        inline mark only (label is for screen readers)
//   <LibryLoader label="..." minHeight="60vh" /> full loading screen with a visible label
import SeasonalScene from "@/components/SeasonalScene";

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
      <span className="ll-ch" aria-hidden="true">L</span>
      <span className="ll-ch" aria-hidden="true">y</span>
      <span className="ll-ch" aria-hidden="true">b</span>
      <span className="ll-ch" aria-hidden="true">r</span>
      <span className="ll-ch" aria-hidden="true">y</span>
      <span className="ll-dot" aria-hidden="true" />
    </span>
  );

  if (typeof size === "number") return mark(size, label);

  return (
    <div className="libry-loader" style={{ minHeight }} role="status" aria-live="polite">
      {/* Holiday scene (Christmas sleigh, Halloween bats, ...) only during an event. */}
      <SeasonalScene compact />
      {mark(56)}
      <span className="ll-label">{label}</span>
    </div>
  );
}
