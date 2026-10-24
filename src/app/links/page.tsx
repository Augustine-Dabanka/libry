import { BRAND, socials } from "@/lib/brand";
import { SocialIcon } from "@/components/SocialIcons";
import { ArrowRight } from "lucide-react";

import Glyph from "@/components/Glyph";
export const metadata = {
  title: "Lybry — links",
  description: "The bookstore that actually pays its writers. Read free or publish your own story.",
};


const LINKS = [
  { emoji: "📖", title: "Create your free account", sub: "Start reading and publishing", href: "/login?auth=signup", primary: true },
  { emoji: "📚", title: "Read free", sub: "Classics & interactive stories, no card", href: "/catalog" },
  { emoji: "🌿", title: "Interactive stories", sub: "Choose-your-path tales", href: "/catalog?type=Interactive" },
  { emoji: "✦", title: "Lybry Unlimited", sub: "Your genres, your book box. Try it free for 7 days", href: "/unlimited" },
  { emoji: "✍️", title: "Become a creator", sub: "Publish in minutes · keep 65%", href: "/creator" },
];

export default function LinksPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "radial-gradient(1200px 600px at 50% -10%, color-mix(in srgb, var(--gold) 10%, transparent), transparent 60%), var(--charcoal)",
        display: "flex",
        justifyContent: "center",
        padding: "clamp(2rem, 7vw, 4rem) 1.2rem 3rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 460 }}>
        {/* header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontFamily: "var(--serif)", fontWeight: 600, fontSize: "2.4rem", color: "var(--ivory)", letterSpacing: "-0.02em" }}>
            Lybry<span style={{ color: "var(--gold)" }}>.</span>
          </div>
          <p style={{ fontFamily: "var(--sans)", color: "var(--ivory-muted)", fontSize: "1rem", margin: "0.5rem auto 0", maxWidth: 320, lineHeight: 1.5 }}>
            The bookstore that actually{" "}
            <span style={{ color: "var(--gold)", fontStyle: "italic", fontFamily: "var(--serif)" }}>pays its writers</span>.
          </p>
          {BRAND.socialHandle ? <p style={{ fontFamily: "var(--sans)", color: "var(--muted)", fontSize: "0.85rem", marginTop: "0.4rem" }}>@{BRAND.socialHandle}</p> : null}
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
                boxShadow: l.primary ? "0 10px 30px color-mix(in srgb, var(--gold) 18%, transparent)" : "none",
              }}
            >
              <span style={{ fontSize: "1.35rem", lineHeight: 1, flexShrink: 0, display: "inline-flex" }}><Glyph e={l.emoji} /></span>
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", fontFamily: "var(--sans)", fontWeight: 700, fontSize: "1rem", color: l.primary ? "#12100E" : "var(--ivory)" }}>{l.title}</span>
                <span style={{ display: "block", fontFamily: "var(--sans)", fontSize: "0.82rem", color: l.primary ? "rgba(18,16,14,0.72)" : "var(--muted)" }}>{l.sub}</span>
              </span>
              <span style={{ color: l.primary ? "#12100E" : "var(--muted)", display: "inline-flex", flexShrink: 0 }}><ArrowRight size={18} strokeWidth={2} aria-hidden="true" /></span>
            </a>
          ))}
        </div>

        {/* socials */}
        <div style={{ display: "flex", justifyContent: "center", gap: "1.4rem", marginTop: "2.2rem" }}>
          {socials().map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} style={{ color: "var(--muted)", display: "inline-flex" }}>
              <SocialIcon label={s.label} size={22} />
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
