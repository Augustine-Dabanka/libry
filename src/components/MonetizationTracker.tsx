export const SALES_TARGET = 6;
export const REFERRAL_TARGET = 15;

function Bar({ label, value, target }: { label: string; value: number; target: number }) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  return (
    <div style={{ marginBottom: "1.1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--sans)", fontSize: "0.9rem", marginBottom: "0.4rem" }}>
        <span>{label}</span>
        <span style={{ color: "var(--gold)", fontWeight: 700 }}>
          {Math.min(value, target)} / {target} · {pct}%
        </span>
      </div>
      <div style={{ height: 10, background: "rgba(250,247,242,0.08)", borderRadius: 6, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: value >= target ? "linear-gradient(90deg,#58CC02,#7BE23B)" : "linear-gradient(90deg,var(--gold),var(--terracotta))",
            borderRadius: 6,
            transition: "width 0.6s cubic-bezier(0.68,-0.55,0.265,1.55)",
          }}
        />
      </div>
    </div>
  );
}

export default function MonetizationTracker({ sales, referrals }: { sales: number; referrals: number }) {
  const eligible = sales >= SALES_TARGET && referrals >= REFERRAL_TARGET;
  return (
    <div
      style={{
        background: "var(--stone)",
        border: "1px solid var(--border)",
        borderRadius: 18,
        padding: "1.5rem",
        marginBottom: "2.5rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.6rem", marginBottom: "0.4rem" }}>
        <h3 style={{ margin: 0 }}>Monetization</h3>
        <span
          className="badge"
          style={
            eligible
              ? { background: "rgba(78,122,82,0.2)", color: "#7DBE86" }
              : { background: "rgba(180,83,9,0.18)", color: "#D2793B" }
          }
        >
          {eligible ? "Eligible to earn" : "Locked"}
        </span>
      </div>
      <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", margin: "0 0 1.3rem" }}>
        Hit both milestones to unlock creator earnings. Everyone can publish; earning is what you work up to.
      </p>
      <Bar label="Books sold" value={sales} target={SALES_TARGET} />
      <Bar label="Successful referrals" value={referrals} target={REFERRAL_TARGET} />
    </div>
  );
}
