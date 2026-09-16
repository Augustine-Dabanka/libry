import type { ReactNode } from "react";
import AppNav from "@/components/AppNav";

const PAGES = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/cookies", label: "Cookie Policy" },
  { href: "/refunds", label: "Refund Policy" },
];

// Shared shell for Libry's legal pages: consistent nav, title, "last updated",
// prose styling, and cross-links between the four documents.
export default function LegalDoc({
  title,
  updated,
  current,
  intro,
  children,
}: {
  title: string;
  updated: string;
  current: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <>
      <AppNav />
      <section className="section" style={{ maxWidth: 780, margin: "0 auto" }}>
        <a href="/" style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.85rem", textDecoration: "none" }}>
          ← Back to Libry
        </a>
        <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(1.9rem, 4vw, 2.7rem)", marginTop: "1.1rem", marginBottom: "0.3rem" }}>{title}</h1>
        <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.84rem" }}>Last updated: {updated}</p>

        <nav className="legal-nav" aria-label="Legal documents">
          {PAGES.map((p) => (
            <a key={p.href} href={p.href} aria-current={p.href === current ? "page" : undefined} className={p.href === current ? "on" : ""}>
              {p.label}
            </a>
          ))}
        </nav>

        {intro ? <p className="legal-intro">{intro}</p> : null}

        <div className="legal-body">{children}</div>

        <p className="legal-note">
          This document is provided for transparency. The binding legal terms are those adopted by{" "}
          <strong>[CRAFT &amp; ANCHOR — REGISTERED LEGAL NAME]</strong> (&ldquo;Craft &amp; Anchor&rdquo;, the operator of Libry).
          Placeholder details marked in <strong>[brackets]</strong> are to be completed with counsel before launch.
        </p>
      </section>
    </>
  );
}
