"use client";

import { useMemo, useState } from "react";

type Period = "weekly" | "monthly" | "yearly";

// Revenue overview with a Weekly / Monthly / Yearly view switch. With no sales
// backend yet, every bucket is zero — shown honestly as a flat baseline for the
// selected range rather than invented numbers. `daily` seeds the weekly view.
export default function RevenueChart({ daily }: { daily: number[] }) {
  const [period, setPeriod] = useState<Period>("weekly");

  const { values, labels } = useMemo(() => {
    if (period === "weekly") {
      const v = daily.length === 7 ? daily : [0, 0, 0, 0, 0, 0, 0];
      return { values: v, labels: ["6d", "5d", "4d", "3d", "2d", "Yst", "Tdy"] };
    }
    if (period === "monthly") {
      return { values: [0, 0, 0, 0], labels: ["Wk 1", "Wk 2", "Wk 3", "Wk 4"] };
    }
    // yearly — last 12 months, ending on the current month
    const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date().getMonth();
    const months = Array.from({ length: 12 }, (_, i) => names[(now - 11 + i + 12) % 12]);
    return { values: new Array(12).fill(0), labels: months };
  }, [period, daily]);

  const max = Math.max(1, ...values);
  const allZero = values.every((d) => d === 0);
  const total = values.reduce((s, v) => s + v, 0);

  const tab = (p: Period, label: string) => (
    <button
      key={p}
      type="button"
      onClick={() => setPeriod(p)}
      style={{
        padding: "0.35rem 0.9rem",
        borderRadius: 999,
        fontFamily: "var(--sans)",
        fontSize: "0.82rem",
        fontWeight: 600,
        cursor: "pointer",
        border: "1px solid var(--border)",
        background: period === p ? "var(--gold)" : "transparent",
        color: period === p ? "#12100E" : "var(--ivory-muted)",
      }}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.8rem", marginBottom: "1.1rem" }}>
        <span style={{ fontFamily: "var(--sans)", color: "var(--muted)", fontSize: "0.85rem" }}>
          {period === "weekly" ? "Last 7 days" : period === "monthly" ? "This month, by week" : "Last 12 months"} · total {formatUsd(total)}
        </span>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {tab("weekly", "Weekly")}
          {tab("monthly", "Monthly")}
          {tab("yearly", "Yearly")}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: period === "yearly" ? "0.3rem" : "0.6rem", height: 130 }}>
        {values.map((v, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", height: "100%", justifyContent: "flex-end" }}>
            <div
              title={formatUsd(v)}
              style={{
                width: "100%",
                height: `${Math.max(3, (v / max) * 100)}%`,
                background: v > 0 ? "linear-gradient(180deg, var(--gold), var(--gold-hover))" : "rgba(255,255,255,0.06)",
                borderRadius: "6px 6px 0 0",
              }}
            />
            <span style={{ fontSize: period === "yearly" ? "0.6rem" : "0.7rem", color: "var(--muted)", fontFamily: "var(--sans)" }}>{labels[i]}</span>
          </div>
        ))}
      </div>

      {allZero ? (
        <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.82rem", marginTop: "0.9rem" }}>
          No sales yet — your {period} revenue will chart here once purchases go live.
        </p>
      ) : null}
    </div>
  );
}

function formatUsd(n: number) {
  return `$${n.toFixed(2)}`;
}
