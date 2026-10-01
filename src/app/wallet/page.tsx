import { redirect } from "next/navigation";
import AppNav from "@/components/AppNav";
import RewardedAd from "@/components/RewardedAd";
import CouponForm from "@/components/CouponForm";
import CoinPackBuy from "@/components/CoinPackBuy";
import { createClient } from "@/lib/supabase/server";
import { getWallet, coinPurchasesLive } from "@/app/actions/coins";
import { COIN_PACKS, AD_DAILY_CAP } from "@/lib/coins";

export const metadata = { title: "Wallet · Libry" };
export const dynamic = "force-dynamic";

const card = { background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 18, padding: "1.4rem" } as const;

export default async function WalletPage() {
  const wallet = await getWallet();
  if (!wallet) redirect("/login?next=/wallet");
  const live = await coinPurchasesLive();
  const { data: { user } } = await (await createClient()).auth.getUser();
  const email = user?.email ?? null;

  return (
    <>
      <AppNav />
      <section className="section" style={{ maxWidth: 720, margin: "0 auto", display: "grid", gap: "1.2rem" }}>
        <div style={{ ...card, display: "flex", alignItems: "center", gap: "1.2rem" }}>
          <svg width="56" height="56" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="var(--gold)" /><circle cx="24" cy="24" r="16" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" /><text x="24" y="31" textAnchor="middle" fontFamily="var(--serif)" fontWeight="600" fontSize="21" fill="rgba(0,0,0,0.55)">L</text></svg>
          <div>
            <div style={{ fontFamily: "var(--serif)", fontSize: "2.4rem", fontWeight: 600, lineHeight: 1 }}>{wallet.total}</div>
            <div style={{ fontFamily: "var(--sans)", color: "var(--muted)", fontSize: "0.9rem" }}>coins{wallet.paid > 0 ? ` (${wallet.paid} bought, ${wallet.bonus} earned)` : ""}</div>
          </div>
        </div>

        <div style={card}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "0.3rem" }}>Earn coins</h2>
          <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", marginBottom: "1rem" }}>
            Ads only play when you ask. Up to {AD_DAILY_CAP} a day. Finish the ad to earn; skipping is always allowed after 5 seconds.
          </p>
          <RewardedAd />
        </div>

        <div style={card}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "0.3rem" }}>Redeem a code</h2>
          <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", marginBottom: "1rem" }}>From a creator, a launch event or a giveaway. Each code works once per account.</p>
          <CouponForm />
        </div>

        <div style={card}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "0.3rem" }}>Buy coins</h2>
          <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", marginBottom: "1rem" }}>
            {live ? "Paid securely with Paystack. Bought coins are spent first and pay the creator." : "Coin packs open once payments are live. Earned coins already work."}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.8rem" }}>
            {COIN_PACKS.map((p) => (
              <div key={p.id} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "1rem" }}>
                <div style={{ fontFamily: "var(--serif)", fontSize: "1.5rem", fontWeight: 600 }}>{p.coins}</div>
                <div style={{ fontFamily: "var(--sans)", fontSize: "0.8rem", color: "var(--muted)", marginBottom: "0.8rem" }}>coins{"note" in p && p.note ? `, ${p.note}` : ""}</div>
                <CoinPackBuy packId={p.id} price={p.price} label={p.label} email={email} userId={user?.id ?? null} live={live} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
