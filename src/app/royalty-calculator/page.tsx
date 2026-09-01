import AppNav from "@/components/AppNav";
import BackButton from "@/components/BackButton";
import RoyaltyCalculator from "@/components/RoyaltyCalculator";

export default function RoyaltyCalculatorPage() {
  return (
    <>
      <AppNav />
      <section className="section" style={{ maxWidth: 780, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.6rem" }}>
          <BackButton />
          <h2 style={{ margin: 0 }}>Royalty Calculator</h2>
        </div>
        <p style={{ color: "var(--muted)", marginBottom: "1.8rem" }}>
          Estimate your monthly payout. Numbers update as you type.
        </p>
        <RoyaltyCalculator />
      </section>
    </>
  );
}
