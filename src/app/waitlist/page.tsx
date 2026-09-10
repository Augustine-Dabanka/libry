import WaitlistForm from "@/components/WaitlistForm";

export const metadata = {
  title: "Join the Libry waitlist",
  description: "Be among the first readers and writers on Libry — the reader-friendly bookstore that actually pays its writers.",
};

export default async function WaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <main style={{ background: "var(--charcoal)" }}>
      {/* slim header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.2rem clamp(1.1rem,5vw,3rem)" }}>
        <a href="/" style={{ fontFamily: "var(--serif)", fontWeight: 600, fontSize: "1.25rem", color: "var(--ivory)", textDecoration: "none" }}>
          Libry<span style={{ color: "var(--gold)" }}>.</span>
        </a>
        <a href="/login" style={{ fontFamily: "var(--sans)", fontSize: "0.88rem", color: "var(--muted)", textDecoration: "none" }}>
          Already in? Log in →
        </a>
      </div>

      <section style={{ maxWidth: 760, margin: "0 auto", padding: "clamp(2rem,6vw,4rem) clamp(1.1rem,5vw,2rem) 5rem" }}>
        <div style={{ display: "inline-block", fontFamily: "var(--sans)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--gold)", border: "1px solid rgba(197,160,89,0.4)", borderRadius: 999, padding: "0.35rem 0.9rem", marginBottom: "1.4rem" }}>
          Early access · opening soon
        </div>

        <h1 style={{ fontFamily: "var(--serif)", fontWeight: 600, fontSize: "clamp(2.2rem,7vw,3.8rem)", lineHeight: 1.08, letterSpacing: "-0.02em", color: "var(--ivory)", margin: "0 0 1.1rem", textWrap: "balance" }}>
          A bookstore that actually{" "}
          <span style={{ color: "var(--gold)", fontStyle: "italic" }}>pays its writers</span>.
        </h1>

        <p style={{ fontFamily: "var(--sans)", fontSize: "1.1rem", lineHeight: 1.7, color: "var(--ivory-muted)", maxWidth: 560, marginBottom: "2rem" }}>
          Libry is a calm, beautiful home for reading — full of interactive stories and classics you can lose an evening
          in. Creators keep <strong style={{ color: "var(--ivory)" }}>70%</strong>, own their readers, and publish in
          minutes. Join the list and you&apos;ll be first through the door.
        </p>

        <WaitlistForm initialRef={ref} />

        {/* trust row */}
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", marginTop: "2.5rem", color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem" }}>
          <span>📚 Full-length classics, free</span>
          <span>🌿 Choose-your-path stories</span>
          <span>💛 70% to creators</span>
        </div>
      </section>
    </main>
  );
}
