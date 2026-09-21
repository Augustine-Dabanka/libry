import PromoAd from "@/components/PromoAd";

export const metadata = {
  title: "Libry — the library, in your pocket",
  description: "Read interactive stories, comics and books, join communities, and get paid to create. Creators keep 65%.",
};

// A public, shareable "ad" surface — a self-contained animated promo built to be
// screen-recorded or screenshotted for social, with a real CTA underneath.
export default function AdPage() {
  return (
    <main style={{ minHeight: "100vh", background: "radial-gradient(700px 380px at 50% -6%, rgba(196,163,90,0.14), transparent 70%), #14110d", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2.2rem 1.1rem", gap: "1.8rem", fontFamily: "var(--sans, 'Plus Jakarta Sans', system-ui, sans-serif)" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <PromoAd />
      </div>

      <div style={{ textAlign: "center", maxWidth: 460 }}>
        <h1 style={{ fontFamily: "var(--serif, 'Fraunces', Georgia, serif)", fontStyle: "italic", color: "#FAF7F2", fontSize: "clamp(1.6rem, 5vw, 2.2rem)", lineHeight: 1.15, margin: "0 0 0.6rem" }}>
          The library, in your pocket.
        </h1>
        <p style={{ color: "#C6BEB2", fontSize: "1rem", lineHeight: 1.6, margin: "0 0 1.4rem" }}>
          Interactive stories, comics and books — plus communities that keep the story going. Creators keep 65%.
        </p>
        <div style={{ display: "flex", gap: "0.7rem", justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/onboarding" style={{ background: "#C4A35A", color: "#20180a", fontWeight: 800, textDecoration: "none", padding: "0.85rem 1.7rem", borderRadius: 999, boxShadow: "0 10px 26px rgba(196,163,90,0.28)" }}>
            Start reading free →
          </a>
          <a href="/" style={{ background: "transparent", color: "#FAF7F2", fontWeight: 700, textDecoration: "none", padding: "0.85rem 1.7rem", borderRadius: 999, border: "1.5px solid rgba(250,247,242,0.16)" }}>
            Explore Libry
          </a>
        </div>
        <p style={{ color: "#6b625a", fontSize: "0.8rem", marginTop: "1.4rem", letterSpacing: "0.04em" }}>
          Follow <a href="https://www.instagram.com/officially_libry" target="_blank" rel="noopener noreferrer" style={{ color: "#C4A35A" }}>@officially_libry</a>
        </p>
      </div>
    </main>
  );
}
