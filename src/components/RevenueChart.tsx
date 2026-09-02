"use client";

// Revenue Overview (Last 7 Days). Takes 7 daily totals; renders a small SVG
// bar chart. With no sales backend yet, totals are zero — shown honestly as a
// flat baseline rather than invented numbers.
export default function RevenueChart({ daily }: { daily: number[] }) {
  const days = daily.length === 7 ? daily : [0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(1, ...days);
  const labels = ["6d", "5d", "4d", "3d", "2d", "Yst", "Tdy"];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "0.6rem", height: 120 }}>
        {days.map((v, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", height: "100%", justifyContent: "flex-end" }}>
            <div
              title={`$${v.toFixed(2)}`}
              style={{
                width: "100%",
                height: `${Math.max(3, (v / max) * 100)}%`,
                background: v > 0 ? "linear-gradient(180deg,#C4A35A,#8a6d2f)" : "rgba(255,255,255,0.06)",
                borderRadius: "6px 6px 0 0",
              }}
            />
            <span style={{ fontSize: "0.7rem", color: "var(--muted)", fontFamily: "var(--sans)" }}>{labels[i]}</span>
          </div>
        ))}
      </div>
      {max === 1 && days.every((d) => d === 0) ? (
        <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.82rem", marginTop: "0.9rem" }}>
          No sales yet — revenue will chart here once purchases go live.
        </p>
      ) : null}
    </div>
  );
}
