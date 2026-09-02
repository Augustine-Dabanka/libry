import AppNav from "@/components/AppNav";

export default function About() {
  return (
    <>
      <AppNav />
      <section className="section" style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className="section-header">
          <h2>About Libry</h2>
        </div>
        <div style={{ fontFamily: "var(--sans)", lineHeight: 1.8, color: "var(--ivory-muted)" }}>
          <p style={{ marginBottom: "1rem" }}>
            Libry is a home for <em>stories worth lingering in</em> — a place to read deeply, not doom-scroll.
            We pair carefully chosen ebooks with interactive, choose-your-path storybooks, and wrap them in a
            reading experience that feels calm and considered.
          </p>
          <p style={{ marginBottom: "1rem" }}>
            Every chapter has a comments tray, so reading can be social when you want it to be. And creators keep{" "}
            <strong style={{ color: "var(--gold)" }}>70%</strong> of every sale — publishing takes minutes, and your
            work goes live in the catalog instantly.
          </p>
          <p>
            Built with care for readers and writers. <a href="/catalog" style={{ color: "var(--gold)" }}>Browse the catalog →</a>
          </p>
        </div>
      </section>
    </>
  );
}
