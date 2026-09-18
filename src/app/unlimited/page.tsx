import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import UnlimitedPlans, { type ActiveSub } from "@/components/UnlimitedPlans";
import { type Plan } from "@/lib/plans";

export const metadata = {
  title: "Libry Unlimited — your book box, your genres",
  description: "Pick your genres, choose weekly, monthly or yearly, and keep the books you want each cycle. Reading is always free to start.",
};

const perk = (icon: string, title: string, body: string) => (
  <div style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.3rem 1.4rem" }}>
    <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{icon}</div>
    <h3 style={{ fontFamily: "var(--serif)", fontSize: "1.12rem", marginBottom: "0.35rem" }}>{title}</h3>
    <p style={{ fontFamily: "var(--sans)", color: "var(--ivory-muted)", fontSize: "0.92rem", lineHeight: 1.6, margin: 0 }}>{body}</p>
  </div>
);

export default async function UnlimitedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/unlimited");

  let sub: ActiveSub = null;
  {
    const { data } = await supabase.from("subscriptions").select("plan, genres, max_age, picks_per_cycle, status, current_period_end").eq("user_id", user.id).maybeSingle();
    if (data && data.status === "active") {
      sub = { plan: data.plan as Plan, genres: (data.genres ?? []) as string[], max_age: data.max_age as string, picks_per_cycle: data.picks_per_cycle as number, current_period_end: data.current_period_end as string | null };
    }
  }

  return (
    <>
      <AppNav />
      <section className="section" style={{ maxWidth: 820, margin: "0 auto" }}>
        <div style={{ display: "inline-block", fontFamily: "var(--sans)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--gold)", border: "1px solid rgba(197,160,89,0.4)", borderRadius: 999, padding: "0.35rem 0.9rem", marginBottom: "1.3rem" }}>
          ✦ Libry Unlimited
        </div>

        <h1 style={{ fontSize: "clamp(2.2rem, 6vw, 3.4rem)", lineHeight: 1.1, letterSpacing: "-0.01em", marginBottom: "1rem" }}>
          Your book box, <span style={{ color: "var(--gold)", fontStyle: "italic" }}>your way.</span>
        </h1>
        <p style={{ fontFamily: "var(--sans)", fontSize: "1.12rem", lineHeight: 1.7, color: "var(--ivory-muted)", maxWidth: 640, marginBottom: "2.4rem" }}>
          Not the whole shelf — the shelf you actually want. Pick your genres and a max age rating,
          choose weekly, monthly or yearly, and keep the books you choose each cycle. Reading is always free to start.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2.6rem" }}>
          {perk("🎯", "Curated to you", "Tell us your genres and age rating — every box is drawn from what you love, not a firehose.")}
          {perk("🔖", "Keep what you pick", "Each cycle you choose books to keep — they stay in your library, yours for good.")}
          {perk("🗓️", "Weekly, monthly, yearly", "Read a little or a lot. Switch cadence whenever you like; cancel anytime.")}
          {perk("💛", "Writers still paid", "Your box shares back to the authors you actually read — 65% stays theirs.")}
        </div>

        <div style={{ background: "var(--stone)", border: "1px solid rgba(197,160,89,0.35)", borderRadius: 18, padding: "1.8rem" }}>
          <UnlimitedPlans email={user.email ?? undefined} sub={sub} />
        </div>

        <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", marginTop: "1.6rem" }}>
          Not ready? <a href="/catalog" style={{ color: "var(--gold)" }}>Browse the free shelf →</a> — hundreds of pages, no card required.
        </p>
      </section>
    </>
  );
}
