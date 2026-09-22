// A branded, on-brand loading state — the Libry wordmark gently pulsing above an
// indeterminate gold progress bar — shown while a route's data loads so the
// reader never stares at a blank screen. Pure CSS (see .libry-loader in
// globals.css), reduced-motion safe.
export default function LibryLoader({ label = "Loading…", minHeight = "60vh" }: { label?: string; minHeight?: string }) {
  return (
    <div className="libry-loader" style={{ minHeight }} role="status" aria-live="polite">
      <div className="ll-mark" aria-hidden="true">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-3.2L5 20V5a1 1 0 0 1 1-1Z" />
        </svg>
        <span>Libry<i>.</i></span>
      </div>
      <div className="libry-bar" aria-hidden="true" />
      <span className="ll-label">{label}</span>
    </div>
  );
}
