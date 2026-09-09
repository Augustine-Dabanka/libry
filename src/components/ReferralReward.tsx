import { createClient } from "@/lib/supabase/server";

// Referral reward ladder — invite readers with your link, hit a milestone,
// earn a perk. Rewards are permanent (they never expire) and granted once via
// the rewards table. This rewards the *referrer*; it does not gate anyone's
// earnings.
const TIERS = [
  { at: 5, kind: "referral_5", detail: "15% off any book", short: "15% off a book" },
  { at: 10, kind: "referral_10", detail: "1 free book — on us", short: "A free book" },
];

export default async function ReferralReward() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const rc = await supabase.rpc("my_referral_count");
  const count = typeof rc.data === "number" ? rc.data : 0;

  // Grant any tier the reader has reached (idempotent, never expires).
  const earned = new Map<string, { code: string | null; redeemed: boolean }>();
  for (const t of TIERS) {
    if (count < t.at) continue;
    const code = `LIBRY-${t.kind.toUpperCase()}-${user.id.slice(0, 5).toUpperCase()}`;
    try {
      await supabase.from("rewards").upsert(
        { user_id: user.id, kind: t.kind, code, detail: t.detail },
        { onConflict: "user_id,kind", ignoreDuplicates: true }
      );
      const got = await supabase.from("rewards").select("code, redeemed").eq("user_id", user.id).eq("kind", t.kind).maybeSingle();
      if (!got.error && got.data) earned.set(t.kind, got.data as { code: string | null; redeemed: boolean });
    } catch { /* rewards table not migrated yet */ }
  }

  const next = TIERS.find((t) => count < t.at);
  const goal = next?.at ?? TIERS[TIERS.length - 1]!.at;
  const pct = Math.min(100, Math.round((count / goal) * 100));

  return (
    <div style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.5rem 1.6rem", marginBottom: "1.4rem" }}>
      <h3 style={{ fontSize: "1.1rem", marginBottom: "0.3rem" }}>Refer &amp; earn rewards</h3>
      <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem", marginBottom: "1.2rem" }}>
        Invite readers with your link above. Every friend who joins counts — rewards are yours to keep and never expire.
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--sans)", fontSize: "0.9rem", marginBottom: "0.4rem" }}>
        <span style={{ color: "var(--ivory)" }}>{count} referral{count === 1 ? "" : "s"}</span>
        <span style={{ color: "var(--muted)" }}>{next ? `${goal - count} to go for "${next.short}"` : "All rewards unlocked 🎉"}</span>
      </div>
      <div style={{ height: 10, background: "rgba(250,247,242,0.08)", borderRadius: 6, overflow: "hidden", marginBottom: "1.3rem" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,var(--gold),var(--gold-hi))", borderRadius: 6 }} />
      </div>

      <div style={{ display: "grid", gap: "0.6rem" }}>
        {TIERS.map((t) => {
          const on = count >= t.at;
          const r = earned.get(t.kind);
          return (
            <div key={t.kind} style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.7rem 0.9rem", border: "1px solid var(--border)", borderRadius: 12, background: on ? "rgba(197,160,89,0.08)" : "var(--charcoal)", opacity: on ? 1 : 0.7 }}>
              <span style={{ fontSize: "1.1rem" }}>{on ? "🎁" : "🔒"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: "0.92rem", color: "var(--ivory)" }}>Refer {t.at} · {t.detail}</div>
                {on && r?.code ? (
                  <div style={{ fontFamily: "var(--sans)", fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.15rem" }}>
                    Code <code style={{ color: "var(--gold)", fontWeight: 700 }}>{r.code}</code>{r.redeemed ? " · used" : " · ready when paid books go live"}
                  </div>
                ) : null}
              </div>
              <span style={{ fontFamily: "var(--sans)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", color: on ? "#7DBE86" : "var(--muted)" }}>{on ? "EARNED" : "LOCKED"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
