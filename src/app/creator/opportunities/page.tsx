import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import WaitlistForm from "@/components/WaitlistForm";

export const metadata = { title: "Programs & Opportunities — Libry Creators" };

function ProgramCard({ icon, title, body, cta, href }: { icon: string; title: string; body: string; cta: string; href: string }) {
  return (
    <a href={href} style={{ textDecoration: "none", display: "block", background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.4rem 1.5rem" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "1.1rem" }}>
        <span style={{ flexShrink: 0, width: 52, height: 52, borderRadius: "50%", border: "1.5px solid rgba(196,163,90,0.5)", display: "grid", placeItems: "center", fontSize: "1.4rem" }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: "1.35rem", marginBottom: "0.4rem", color: "var(--ivory)" }}>{title}</h3>
          <p style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "0.7rem" }}>{body}</p>
          <span style={{ color: "var(--gold)", fontFamily: "var(--sans)", fontSize: "0.9rem", fontWeight: 700 }}>{cta} →</span>
        </div>
        <span style={{ color: "var(--muted)", fontSize: "1.3rem", flexShrink: 0 }} aria-hidden="true">›</span>
      </div>
    </a>
  );
}

export default async function CreatorOpportunities() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/creator/opportunities");

  return (
    <>
      <AppNav />
      <section className="section" style={{ maxWidth: 860, marginInline: "auto" }}>
        <div style={{ fontFamily: "var(--sans)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--gold)", marginBottom: "0.6rem" }}>Creator Hub</div>
        <h1 style={{ fontSize: "clamp(2.2rem, 6vw, 3.4rem)", lineHeight: 1.08, marginBottom: "0.8rem" }}>Programs &amp; Opportunities</h1>
        <p style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "1.1rem", marginBottom: "2.4rem", maxWidth: 560 }}>
          Grow your craft. Share your voice. Get discovered with Libry.
        </p>

        {/* Programs */}
        <div style={{ display: "grid", gap: "1rem", marginBottom: "3rem" }}>
          <ProgramCard icon="⭐" title="Brand Opportunities" body="Partner with brands that value creativity and community. Get paid to create content, reviews, and campaigns." cta="Explore opportunities" href="mailto:creators@libry.app?subject=Brand%20Opportunities" />
          <ProgramCard icon="✍️" title="Writing Contests" body="Enter creative writing contests, win prizes, and get published. Elevate your voice on a global stage." cta="Browse contests" href="#featured-contests" />
          <ProgramCard icon="🤝" title="Libry Ambassadors" body="Represent Libry in your community. Inspire others, lead initiatives, and unlock exclusive perks and rewards." cta="Become an ambassador" href="mailto:creators@libry.app?subject=Libry%20Ambassadors" />
        </div>

        {/* Featured contest */}
        <div id="featured-contests" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.2rem" }}>★ Featured contests</h2>
        </div>
        <div style={{ position: "relative", overflow: "hidden", borderRadius: 18, border: "1px solid rgba(196,163,90,0.4)", background: "linear-gradient(120deg, rgba(196,163,90,0.16), rgba(124,77,110,0.12))", padding: "1.8rem", marginBottom: "2.6rem" }}>
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flexShrink: 0, width: 96, height: 96, borderRadius: "50%", background: "rgba(18,16,14,0.5)", border: "2px solid var(--gold)", display: "grid", placeItems: "center", textAlign: "center", fontFamily: "var(--serif)", color: "var(--gold)", lineHeight: 1.1 }}>
              <div><div style={{ fontSize: "1.5rem", fontWeight: 700 }}>30</div><div style={{ fontSize: "0.6rem", letterSpacing: "0.1em" }}>DAY</div></div>
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span className="badge" style={{ background: "var(--gold)", color: "#12100E", fontWeight: 700 }}>Featured</span>
                <span className="badge" style={{ background: "rgba(255,255,255,0.08)", color: "var(--ivory)" }}>New</span>
              </div>
              <h3 style={{ fontSize: "1.5rem", marginBottom: "0.4rem" }}>30 Day Challenge</h3>
              <p style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.95rem", marginBottom: "0.8rem" }}>Write every day. Transform your habit. Share your story.</p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.1rem", color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", display: "grid", gap: "0.3rem" }}>
                <li>🏆 Open to all writers</li>
                <li>🎁 Prizes + a featured spot on Libry</li>
                <li>🗓️ Runs monthly — start any day</li>
              </ul>
              <a href="/creator" className="btn btn-gold" style={{ padding: "0.6rem 1.4rem" }}>Enter the challenge →</a>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.6rem 1.8rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", marginBottom: "0.4rem" }}>
            <span style={{ fontSize: "1.3rem" }}>✉️</span>
            <h3 style={{ fontSize: "1.3rem" }}>Libry Creators</h3>
          </div>
          <p style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.95rem", marginBottom: "1.1rem", maxWidth: 460 }}>
            Get opportunities, contest updates, and creator resources delivered to your inbox.
          </p>
          <div style={{ maxWidth: 420 }}>
            <WaitlistForm role="creator" cta="Subscribe" />
          </div>
          <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.8rem", marginTop: "0.9rem" }}>Join a growing circle of creators building with Libry.</p>
        </div>
      </section>
    </>
  );
}
