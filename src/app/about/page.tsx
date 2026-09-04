import AppNav from "@/components/AppNav";

const feature = (icon: string, title: string, body: string) => (
  <div
    style={{
      background: "var(--stone)",
      border: "1px solid var(--border)",
      borderRadius: 14,
      padding: "1.4rem 1.4rem 1.5rem",
    }}
  >
    <div style={{ fontSize: "1.6rem", marginBottom: "0.6rem" }}>{icon}</div>
    <h3 style={{ fontFamily: "var(--serif)", fontSize: "1.2rem", marginBottom: "0.4rem" }}>{title}</h3>
    <p style={{ fontFamily: "var(--sans)", color: "var(--ivory-muted)", fontSize: "0.92rem", lineHeight: 1.6, margin: 0 }}>
      {body}
    </p>
  </div>
);

const step = (n: string, title: string, body: string) => (
  <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
    <div
      style={{
        flexShrink: 0,
        width: 38,
        height: 38,
        borderRadius: "50%",
        border: "1.5px solid var(--gold)",
        color: "var(--gold)",
        display: "grid",
        placeItems: "center",
        fontFamily: "var(--serif)",
        fontSize: "1.1rem",
      }}
    >
      {n}
    </div>
    <div>
      <h4 style={{ fontFamily: "var(--sans)", fontWeight: 700, margin: "0.35rem 0 0.25rem" }}>{title}</h4>
      <p style={{ fontFamily: "var(--sans)", color: "var(--ivory-muted)", fontSize: "0.92rem", lineHeight: 1.6, margin: 0 }}>
        {body}
      </p>
    </div>
  </div>
);

export default function About() {
  return (
    <>
      <AppNav />
      <section className="section" style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1
          style={{
            fontFamily: "var(--serif)",
            fontSize: "clamp(2.2rem, 6vw, 3.4rem)",
            lineHeight: 1.1,
            letterSpacing: "-0.01em",
            marginBottom: "1.1rem",
          }}
        >
          Stories deserve a <span style={{ color: "var(--gold)", fontStyle: "italic" }}>better home</span>.
        </h1>
        <p
          style={{
            fontFamily: "var(--sans)",
            fontSize: "1.12rem",
            lineHeight: 1.7,
            color: "var(--ivory-muted)",
            maxWidth: 640,
          }}
        >
          Libry was created for readers who still believe in the quiet power of a good story, and for writers who
          deserve to be seen, supported, and fairly rewarded.
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
            “We believe the future of reading is not louder, faster, or more distracted. It is deeper, more
            intentional, and more human. Libry exists to protect that future.”
          </p>
        </blockquote>

        {/* Why we built Libry */}
        <div style={{ marginTop: "3.2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.7rem", marginBottom: "1.1rem" }}>Why we built Libry</h2>
          <div
            style={{
              fontFamily: "var(--sans)",
              lineHeight: 1.8,
              color: "var(--ivory-muted)",
              display: "grid",
              gap: "1.2rem",
              maxWidth: 700,
            }}
          >
            <p>
              The modern reading landscape often feels cold and transactional. We wanted something warmer — a place
              that feels closer to a well-loved independent bookstore than a massive marketplace.
            </p>
            <p>
              Whether you are here to lose yourself in an interactive adventure or to publish your own work, Libry is
              built to serve the relationship between reader and story — nothing more, nothing less.
            </p>
          </div>
        </div>

        {/* What you can do */}
        <div style={{ marginTop: "3.2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.7rem", marginBottom: "1.3rem" }}>What you can do here</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
            {feature("📖", "Read beautifully", "A calm, distraction-free reader with adjustable type, dark mode, and a comments tray on every chapter.")}
            {feature("🌿", "Choose your path", "Interactive stories branch on your choices — the same tale can end three different ways.")}
            {feature("✍️", "Publish in minutes", "Write chapter by chapter or import a manuscript. Your work goes live the moment you hit publish.")}
            {feature("🏅", "Level up", "Earn XP, streaks, and badges as you read — reading you can actually feel yourself getting better at.")}
            {feature("💛", "Support creators", "Creators keep 70% of every sale. Buying a book here means the author actually gets paid.")}
            {feature("👥", "Read together", "Share a library with someone you love, and follow the same stories side by side.")}
          </div>
        </div>

        {/* How it works */}
        <div style={{ marginTop: "3.2rem" }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "1.7rem", marginBottom: "1.4rem" }}>How it works</h2>
          <div style={{ display: "grid", gap: "1.4rem", maxWidth: 640 }}>
            {step("1", "Discover", "Browse curated shelves, or search for a title, an author, or a whole world to fall into.")}
            {step("2", "Read or collect", "Start free stories instantly. Add premium titles to your cart and they land in your library.")}
            {step("3", "Grow", "Track your progress, keep your streak, and unlock achievements as your shelf fills up.")}
            {step("4", "Create", "When you're ready, become a creator and share your own stories with the community.")}
          </div>
        </div>

        {/* Values band */}
        <div
          style={{
            marginTop: "3.2rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "1rem",
            textAlign: "center",
          }}
        >
          {[
            { big: "70%", small: "kept by creators on every sale" },
            { big: "3", small: "endings in every interactive tale" },
            { big: "0", small: "ads, ever — reading comes first" },
          ].map((s) => (
            <div key={s.small} style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.6rem 1.2rem" }}>
              <div style={{ fontFamily: "var(--serif)", fontSize: "2.2rem", color: "var(--gold)" }}>{s.big}</div>
              <div style={{ fontFamily: "var(--sans)", color: "var(--ivory-muted)", fontSize: "0.88rem", marginTop: "0.3rem" }}>{s.small}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "3rem", display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
          <a href="/catalog" className="btn btn-gold">Browse the catalog</a>
          <a href="/creator" className="btn btn-outline">Become a creator</a>
        </div>
      </section>
    </>
  );
}
