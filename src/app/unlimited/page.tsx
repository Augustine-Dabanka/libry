import AppNav from "@/components/AppNav";
import WaitlistForm from "@/components/WaitlistForm";

export const metadata = {
  title: "Libry Unlimited — read everything, one price",
  description: "One subscription for unlimited access to Libry's premium and interactive stories. Reading is always free to start; Unlimited is coming soon.",
};

const perk = (icon: string, title: string, body: string) => (
  <div style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.3rem 1.4rem" }}>
    <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{icon}</div>
    <h3 style={{ fontFamily: "var(--serif)", fontSize: "1.12rem", marginBottom: "0.35rem" }}>{title}</h3>
    <p style={{ fontFamily: "var(--sans)", color: "var(--ivory-muted)", fontSize: "0.92rem", lineHeight: 1.6, margin: 0 }}>{body}</p>
  </div>
);

export default async function UnlimitedPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;

  return (
    <>
      <AppNav />
      <section className="section" style={{ maxWidth: 880, margin: "0 auto" }}>
        <div style={{ display: "inline-block", fontFamily: "var(--sans)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--gold)", border: "1px solid rgba(197,160,89,0.4)", borderRadius: 999, padding: "0.35rem 0.9rem", marginBottom: "1.3rem" }}>
          ✦ Libry Unlimited · coming soon
        </div>

        <h1 style={{ fontSize: "clamp(2.2rem, 6vw, 3.4rem)", lineHeight: 1.1, letterSpacing: "-0.01em", marginBottom: "1rem" }}>
          Read everything. <span style={{ color: "var(--gold)", fontStyle: "italic" }}>One price.</span>
        </h1>
        <p style={{ fontFamily: "var(--sans)", fontSize: "1.12rem", lineHeight: 1.7, color: "var(--ivory-muted)", maxWidth: 620, marginBottom: "2.4rem" }}>
          One subscription, the whole library — every premium book and interactive story, with new titles every week.
          Reading is always free to start; Unlimited is for when you never want to stop.
        </p>

        {/* Price card */}
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "center", background: "var(--stone)", border: "1px solid rgba(197,160,89,0.35)", borderRadius: 18, padding: "1.8rem 2rem", marginBottom: "2.6rem" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
              <span style={{ fontFamily: "var(--serif)", fontSize: "3rem", color: "var(--gold)", lineHeight: 1 }}>$6.99</span>
              <span style={{ color: "var(--muted)", fontFamily: "var(--sans)" }}>/ month</span>
            </div>
            <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", marginTop: "0.5rem" }}>
              Cancel anytime. Founding members lock this price for life. Writers still keep their 65%.
            </p>
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ fontFamily: "var(--sans)", fontWeight: 700, marginBottom: "0.5rem" }}>Get notified when it opens</div>
            <WaitlistForm initialRef={ref} role="unlimited" cta="Notify me" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "1rem", marginBottom: "2.6rem" }}>
          {perk("📚", "The whole library", "Unlimited access to every premium title and interactive story — read as much as you like.")}
          {perk("🌿", "New stories weekly", "Fresh classics and Libry Originals added all the time, always included.")}
          {perk("🔖", "Read anywhere", "Your place syncs across devices, and the reader stays calm and distraction-free.")}
          {perk("💛", "Writers still paid", "Subscriptions share back to the authors you actually read — 65% stays theirs.")}
        </div>

        <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem" }}>
          Not ready to subscribe? <a href="/catalog" style={{ color: "var(--gold)" }}>Browse the free shelf →</a> — hundreds of pages, no card required.
        </p>
      </section>
    </>
  );
}
