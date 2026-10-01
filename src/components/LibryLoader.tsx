// The Libry loader: L-I-B-R-Y fly in, collide into the "L", and the dot drops
// and bounces into place, then it repeats. Pure CSS (see .ll-* in globals.css):
// no JS, no image, about 1 KB, and it runs on the compositor (transform/opacity
// only) so it never slows the skeleton or the page loading underneath it.
// Honors prefers-reduced-motion by showing the finished mark instead.
export default function LibryLoader({ size = 56, label = "Loading" }: { size?: number; label?: string }) {
  return (
    <span className="ll" style={{ fontSize: size }} role="status" aria-label={label}>
      <span className="ll-ch ll-i" aria-hidden="true">I</span>
      <span className="ll-ch ll-b" aria-hidden="true">B</span>
      <span className="ll-ch ll-r" aria-hidden="true">R</span>
      <span className="ll-ch ll-y" aria-hidden="true">Y</span>
      <span className="ll-ch ll-l" aria-hidden="true">L</span>
      <span className="ll-dot" aria-hidden="true" />
    </span>
  );
}
