"use client";

// A dedicated top bar for the Creator Hub — visually and structurally separate
// from the reader app, with a clear way back to reading.
export default function CreatorNav() {
  function toggleTheme() {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("libry-theme", next); } catch {}
  }

  const link: React.CSSProperties = { color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", textDecoration: "none", fontWeight: 600 };

  return (
    <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "0.85rem clamp(1.1rem,5vw,2.4rem)", background: "var(--stone)", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
        <a href="/creator" style={{ fontFamily: "var(--serif)", fontWeight: 600, fontSize: "1.2rem", color: "var(--ivory)", textDecoration: "none" }}>
          Libry<span style={{ color: "var(--gold)" }}>.</span>
        </a>
        <span style={{ fontFamily: "var(--sans)", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--gold)", border: "1px solid rgba(197,160,89,0.4)", borderRadius: 999, padding: "0.2rem 0.6rem" }}>
          Creator
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1.3rem", flexWrap: "wrap" }}>
        <a href="/creator" style={link}>Dashboard</a>
        <a href="/creator-hub/docs?tab=guidelines" style={link}>Guidelines</a>
        <a href="/creator-hub/docs?tab=analytics" style={link}>Creator Hub</a>
        <a href="/home" className="btn btn-outline" style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}>↗ Reading</a>
        <button type="button" onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme" style={{ background: "transparent", border: "none", color: "var(--ivory-muted)", cursor: "pointer", fontSize: "1.1rem" }}>◑</button>
        <form action="/auth/signout" method="post">
          <button type="submit" style={{ ...link, background: "transparent", border: "none", cursor: "pointer" }}>Log out</button>
        </form>
      </div>
    </nav>
  );
}
