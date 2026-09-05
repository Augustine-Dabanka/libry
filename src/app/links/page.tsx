export const metadata = {
  title: "Libry — links",
  description: "The bookstore that actually pays its writers. Read free, join the waitlist, or publish your own story.",
};

const SOCIALS = [
  { label: "YouTube", href: "https://www.youtube.com/@officially_libry", d: "M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.8-1.8C19.3 5 12 5 12 5s-7.3 0-8.8.5A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.8 1.8C4.7 19 12 19 12 19s7.3 0 8.8-.5a2.5 2.5 0 0 0 1.8-1.8C23 15.2 23 12 23 12zM9.8 15.3V8.7l5.7 3.3z" },
  { label: "X", href: "https://x.com/officially_libry", d: "M18.2 2h3.3l-7.2 8.3L23 22h-6.6l-5.2-6.8L5.3 22H2l7.7-8.8L1.5 2h6.8l4.7 6.2zm-1.2 18h1.8L7.1 3.9H5.2z" },
  { label: "Instagram", href: "https://www.instagram.com/officially_libry", instagram: true },
  { label: "TikTok", href: "https://www.tiktok.com/@officially_libry", d: "M16 3c.3 2.1 1.6 3.7 3.7 4.1v2.7c-1.4 0-2.7-.4-3.7-1.1v5.9a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v2.8a2.8 2.8 0 1 0 2 2.7V3z" },
];

const LINKS = [
  { emoji: "⭐", title: "Join the early-access waitlist", sub: "Be first through the door", href: "/waitlist", primary: true },
  { emoji: "📚", title: "Read free", sub: "Classics & interactive stories, no card", href: "/catalog" },
  { emoji: "🌿", title: "Interactive stories", sub: "Choose-your-path tales", href: "/catalog?type=Interactive" },
  { emoji: "✦", title: "Libry Unlimited", sub: "One price, the whole library — coming soon", href: "/unlimited" },
  { emoji: "✍️", title: "Become a creator", sub: "Publish in minutes · keep 70%", href: "/creator" },
];

export default function LinksPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "radial-gradient(1200px 600px at 50% -10%, rgba(197,160,89,0.10), transparent 60%), var(--charcoal)",
        display: "flex",
        justifyContent: "center",
        padding: "clamp(2rem, 7vw, 4rem) 1.2rem 3rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 460 }}>
        {/* header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontFamily: "var(--serif)", fontWeight: 600, fontSize: "2.4rem", color: "var(--ivory)", letterSpacing: "-0.02em" }}>
            Libry<span style={{ color: "var(--gold)" }}>.</span>
          </div>
          <p style={{ fontFamily: "var(--sans)", color: "var(--ivory-muted)", fontSize: "1rem", margin: "0.5rem auto 0", maxWidth: 320, lineHeight: 1.5 }}>
            The bookstore that actually{" "}
            <span style={{ color: "var(--gold)", fontStyle: "italic", fontFamily: "var(--serif)" }}>pays its writers</span>.
          </p>
          <p style={{ fontFamily: "var(--sans)", color: "var(--muted)", fontSize: "0.85rem", marginTop: "0.4rem" }}>@officially_libry</p>
        </div>

        {/* links */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
          {LINKS.map((l) => (
            <a
              key={l.title}
              href={l.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.9rem",
                textDecoration: "none",
                background: l.primary ? "var(--gold)" : "var(--stone)",
                border: `1px solid ${l.primary ? "var(--gold)" : "var(--border)"}`,
                borderRadius: 14,
                padding: "0.95rem 1.1rem",
                boxShadow: l.primary ? "0 10px 30px rgba(197,160,89,0.18)" : "none",
              }}
            >
              <span style={{ fontSize: "1.35rem", lineHeight: 1, flexShrink: 0 }}>{l.emoji}</span>
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", fontFamily: "var(--sans)", fontWeight: 700, fontSize: "1rem", color: l.primary ? "#12100E" : "var(--ivory)" }}>{l.title}</span>
                <span style={{ display: "block", fontFamily: "var(--sans)", fontSize: "0.82rem", color: l.primary ? "rgba(18,16,14,0.72)" : "var(--muted)" }}>{l.sub}</span>
              </span>
              <span style={{ color: l.primary ? "#12100E" : "var(--muted)", fontSize: "1.1rem" }}>→</span>
            </a>
          ))}
        </div>

        {/* socials */}
        <div style={{ display: "flex", justifyContent: "center", gap: "1.4rem", marginTop: "2.2rem" }}>
          {SOCIALS.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} style={{ color: "var(--muted)", display: "inline-flex" }}>
              {s.instagram ? (
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d={s.d} /></svg>
              )}
            </a>
          ))}
        </div>

        <p style={{ textAlign: "center", marginTop: "2rem", fontFamily: "var(--sans)", fontSize: "0.78rem", color: "var(--muted)" }}>
          Stories worth lingering in.
        </p>
      </div>
    </main>
  );
}
