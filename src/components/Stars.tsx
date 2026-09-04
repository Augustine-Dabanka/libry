// Read-only star rating display. Rounds to the nearest whole star; dims the rest.
export default function Stars({ value, size = 15, showValue = false }: { value: number; size?: number; showValue?: boolean }) {
  const v = Math.max(0, Math.min(5, value || 0));
  const full = Math.round(v);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
      <span aria-label={`${v.toFixed(1)} out of 5 stars`} style={{ display: "inline-flex", gap: 1, color: "var(--gold-hi, #C5A059)", fontSize: size, lineHeight: 1 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} style={{ opacity: i <= full ? 1 : 0.26 }}>★</span>
        ))}
      </span>
      {showValue ? (
        <span style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.82rem" }}>{v.toFixed(1)}</span>
      ) : null}
    </span>
  );
}
