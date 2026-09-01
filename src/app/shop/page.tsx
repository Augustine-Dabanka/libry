import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import BuyTokensButton from "@/components/BuyTokensButton";

const BUNDLES = [
  { tokens: 10, price: 2 },
  { tokens: 30, price: 5 },
  { tokens: 100, price: 12 },
];

export default async function Shop() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: st } = await supabase
    .from("user_stats")
    .select("tokens")
    .eq("user_id", user.id)
    .maybeSingle();
  const tokens = st?.tokens ?? 0;

  // Active token sale (for the discount), if any.
  const nowIso = new Date().toISOString();
  const { data: sale } = await supabase
    .from("sale_campaigns")
    .select("title, discount_pct")
    .eq("active", true)
    .eq("kind", "tokens")
    .lte("starts_at", nowIso)
    .gte("ends_at", nowIso)
    .order("created_at", { ascending: false })
    .limit(1);
  const discount = sale?.[0]?.discount_pct ?? 0;

  return (
    <>
      <AppNav />
      <section className="section">
        <div className="section-header">
          <h2>Token Shop</h2>
          <span style={{ color: "var(--gold)", fontWeight: 800, fontFamily: "var(--sans)" }}>
            ⚡ {tokens} tokens
          </span>
        </div>
        <p style={{ color: "var(--muted)", marginTop: "-1.5rem", marginBottom: "2rem" }}>
          Tokens let you start new stories. They refill on their own — or stock up here.
          {discount > 0 ? (
            <span style={{ color: "var(--gold)", fontWeight: 700 }}> {sale?.[0]?.title}: {discount}% off!</span>
          ) : null}
        </p>

        <div className="book-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
          {BUNDLES.map((b) => {
            const finalPrice = (b.price * (1 - discount / 100)).toFixed(2);
            return (
              <div
                key={b.tokens}
                style={{
                  background: "var(--stone)",
                  border: "1px solid var(--border)",
                  borderRadius: 18,
                  padding: "1.6rem",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "var(--gold)", fontFamily: "var(--sans)" }}>
                  {b.tokens}⚡
                </div>
                <div style={{ margin: "0.6rem 0 1.2rem", fontFamily: "var(--sans)" }}>
                  {discount > 0 ? (
                    <>
                      <span style={{ color: "var(--muted)", textDecoration: "line-through", marginRight: "0.4rem" }}>
                        ${b.price.toFixed(2)}
                      </span>
                      <span style={{ color: "var(--ivory)", fontWeight: 700 }}>${finalPrice}</span>
                    </>
                  ) : (
                    <span style={{ color: "var(--ivory)", fontWeight: 700 }}>${b.price.toFixed(2)}</span>
                  )}
                </div>
                <BuyTokensButton amount={b.tokens} label={`Get ${b.tokens}⚡`} />
              </div>
            );
          })}
        </div>
        <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginTop: "1.5rem" }}>
          Purchases are simulated for now — real payment arrives with checkout.
        </p>
      </section>
    </>
  );
}
