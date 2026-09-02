import AppNav from "@/components/AppNav";

export default function About() {
  return (
    <>
      <AppNav />
      <section className="section" style={{ maxWidth: 860, margin: "0 auto" }}>
        <h1
          style={{
            fontFamily: "var(--serif)",
            fontSize: "clamp(2.2rem, 6vw, 3.4rem)",
            lineHeight: 1.1,
            letterSpacing: "-0.01em",
            marginBottom: "1.1rem",
          }}
        >
          Stories deserve a{" "}
          <span style={{ color: "var(--gold)", fontStyle: "italic" }}>better home</span>.
        </h1>
        <p
          style={{
            fontFamily: "var(--sans)",
            fontSize: "1.12rem",
            lineHeight: 1.7,
            color: "var(--ivory-muted)",
            maxWidth: 620,
          }}
        >
          Libry was created for readers who still believe in the quiet power of a good story, and for
          writers who deserve to be seen, supported, and fairly rewarded.
        </p>

        {/* Manifesto */}
        <blockquote
          style={{
            marginTop: "2.6rem",
            padding: "1.6rem 1.8rem",
            background: "var(--stone)",
            borderLeft: "3px solid var(--gold)",
            borderRadius: 12,
          }}
        >
          <p
            style={{
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              fontSize: "1.12rem",
              lineHeight: 1.7,
              color: "var(--ivory)",
              margin: 0,
            }}
          >
            “We believe the future of reading is not louder, faster, or more distracted. It is deeper,
            more intentional, and more human. Libry exists to protect that future.”
          </p>
        </blockquote>

        {/* Why we built Libry */}
        <div style={{ marginTop: "3.2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.7rem", marginBottom: "1.1rem" }}>
            Why we built Libry
          </h2>
          <div
            style={{
              fontFamily: "var(--sans)",
              lineHeight: 1.8,
              color: "var(--ivory-muted)",
              display: "grid",
              gap: "1.2rem",
              maxWidth: 680,
            }}
          >
            <p>
              The modern reading landscape often feels cold and transactional. We wanted something
              warmer — a place that feels closer to a well-loved independent bookstore than a massive
              marketplace.
            </p>
            <p>
              Whether you are here to lose yourself in an interactive adventure or to publish your own
              work, Libry is built to serve the relationship between reader and story — nothing more,
              nothing less.
            </p>
            <p>
              Every chapter has a comments tray, so reading can be social when you want it to be. And
              creators keep <strong style={{ color: "var(--gold)" }}>70%</strong> of every sale —
              publishing takes minutes, and your work goes live in the catalog the moment you hit
              publish.
            </p>
          </div>
        </div>

        <div style={{ marginTop: "2.6rem", display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
          <a href="/catalog" className="btn btn-gold">
            Browse the catalog
          </a>
          <a href="/creator" className="btn btn-outline">
            Become a creator
          </a>
        </div>
      </section>
    </>
  );
}
