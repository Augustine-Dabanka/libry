import type { Metadata } from "next";
import AppNav from "@/components/AppNav";
import ContactForm from "./ContactForm";
import { LEGAL, operatorLine } from "@/lib/legal";

export const metadata: Metadata = { title: "Contact — Leep" };

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams;
  return (
    <>
      <AppNav />
      <section className="section" style={{ maxWidth: 620, margin: "0 auto" }}>
        <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(1.9rem, 4vw, 2.5rem)", marginBottom: "0.4rem" }}>Contact us</h1>
        <p style={{ fontFamily: "var(--sans)", color: "var(--muted)", marginTop: 0, lineHeight: 1.6 }}>
          Help, refunds, privacy requests, reports and appeals all come here. We aim to reply within {LEGAL.responseTime}.
          {LEGAL.contactEmail ? <> You can also email <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.</> : null}
        </p>
        <ContactForm topic={topic} />
        <p style={{ fontFamily: "var(--sans)", color: "var(--muted)", fontSize: "0.8rem", marginTop: "2rem" }}>
          Leep is operated by {operatorLine()}. What you send is used only to answer you; see the <a href="/privacy">Privacy Policy</a>.
        </p>
      </section>
    </>
  );
}
