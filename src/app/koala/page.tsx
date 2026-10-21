import type { Metadata } from "next";
import AppNav from "@/components/AppNav";
import KoalaLab from "./KoalaLab";

// Playground for the mascot: every mood, tilt, parallax and tap reactions.
// Not linked anywhere and hidden from search engines.
export const metadata: Metadata = { title: "Mascot lab — Lybry", robots: { index: false, follow: false } };

export default function KoalaPage() {
  return (
    <>
      <AppNav />
      <section className="section" style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontFamily: "var(--serif)", marginBottom: "1rem", textAlign: "center" }}>Mascot lab</h1>
        <KoalaLab />
      </section>
    </>
  );
}
