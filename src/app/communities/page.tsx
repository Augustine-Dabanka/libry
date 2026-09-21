import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import CommunityCreate from "@/components/CommunityCreate";

export const metadata = { title: "Discover communities — Libry" };

type Community = { id: number; slug: string; name: string; description: string | null; emoji: string | null; category: string | null; price: number | null; price_period: string | null; member_count: number };

const CATS = ["All", "Stories", "Comics", "Hobbies", "Tech", "Self-Improvement", "Kids", "Teen", "YA", "Adult"];

function priceLabel(c: Community) {
  const p = Number(c.price) || 0;
  return p > 0 ? `$${p.toFixed(2)}/${(c.price_period || "month").replace("month", "mo").replace("year", "yr")}` : "Free";
}

export default async function CommunitiesPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat } = await searchParams;
  const active = CATS.includes(cat || "") ? (cat as string) : "All";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/communities");

  const { data: comms } = await supabase
    .from("communities")
    .select("id, slug, name, description, emoji, category, price, price_period, member_count, is_official")
    .order("member_count", { ascending: false })
    .order("is_official", { ascending: false });
  let communities = (comms ?? []) as Community[];
  const trending = [...communities].sort((a, b) => b.member_count - a.member_count).slice(0, 5);
  if (active !== "All") communities = communities.filter((c) => (c.category || "Stories") === active);

  // Which the user has joined.
  const { data: mem } = await supabase.from("community_members").select("community_id").eq("user_id", user.id);
  const mine = new Set((mem ?? []).map((m: { community_id: number }) => m.community_id));

  const chipHref = (label: string) => (label === "All" ? "/communities" : `/communities?cat=${encodeURIComponent(label)}`);

  return (
    <>
      <AppNav />
      <section className="section" style={{ maxWidth: 1040, marginInline: "auto" }}>
        <div className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap", marginBottom: "0.6rem" }}>
          <div>
            <h1>Discover communities</h1>
            <p style={{ color: "var(--muted)", fontFamily: "var(--sans)" }}>Find your people. Share your passion.</p>
          </div>
          <CommunityCreate />
        </div>

        {/* Category chips */}
        <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.4rem", marginBottom: "1.4rem" }}>
          {CATS.map((label) => (
            <a key={label} href={chipHref(label)} style={{ flexShrink: 0, textDecoration: "none", padding: "0.45rem 0.95rem", borderRadius: 999, fontFamily: "var(--sans)", fontSize: "0.85rem", fontWeight: 600, whiteSpace: "nowrap", border: "1px solid var(--border)", background: active === label ? "var(--gold)" : "var(--stone)", color: active === label ? "#12100E" : "var(--ivory-muted)" }}>{label}</a>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: "1.6rem", alignItems: "start" }} className="communities-grid">
          {/* Popular grid */}
          <div>
            <div className="section-header" style={{ marginBottom: "0.9rem" }}>
              <h2>{active === "All" ? "Popular ⚡" : active}</h2>
            </div>
            {communities.length === 0 ? (
              <div style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 14, padding: "2.4rem 1.6rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.8rem", marginBottom: "0.4rem" }}>✦</div>
                <p style={{ color: "var(--ivory)", marginBottom: "0.3rem" }}>No communities in {active} yet.</p>
                <p style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.9rem" }}>Be the first — start one above.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
                {communities.map((c) => {
                  const paid = (Number(c.price) || 0) > 0;
                  return (
                    <a key={c.id} href={`/c/${c.slug}`} style={{ textDecoration: "none", display: "block", background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
                      <div style={{ position: "relative", height: 96, background: "linear-gradient(150deg, hsl(35 30% 24%), hsl(20 35% 15%))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.2rem" }}>
                        {c.emoji || "📚"}
                        <span style={{ position: "absolute", top: 8, left: 8, background: paid ? "var(--gold)" : "rgba(18,16,14,0.75)", color: paid ? "#12100E" : "var(--ivory)", fontFamily: "var(--sans)", fontSize: "0.7rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 6 }}>{priceLabel(c)}</span>
                        {mine.has(c.id) ? <span style={{ position: "absolute", top: 8, right: 8, background: "rgba(95,160,104,0.9)", color: "#0c1a0e", fontFamily: "var(--sans)", fontSize: "0.68rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 6 }}>Joined</span> : null}
                      </div>
                      <div style={{ padding: "0.9rem 1rem 1.1rem" }}>
                        <div style={{ fontFamily: "var(--serif)", color: "var(--ivory)", fontSize: "1.02rem", marginBottom: "0.25rem" }}>{c.name}</div>
                        {c.description ? <p style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.84rem", lineHeight: 1.45, margin: "0 0 0.6rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.description}</p> : null}
                        <div style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.78rem" }}>👥 {c.member_count.toLocaleString()} member{c.member_count === 1 ? "" : "s"}</div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Trending sidebar */}
          <aside style={{ background: "var(--stone)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.2rem 1.3rem", position: "sticky", top: "1.5rem" }} className="communities-trending">
            <div style={{ fontFamily: "var(--sans)", fontWeight: 700, color: "var(--ivory)", marginBottom: "0.9rem" }}>🔥 Trending now</div>
            <div style={{ display: "grid", gap: "0.9rem" }}>
              {trending.map((c, i) => (
                <a key={c.id} href={`/c/${c.slug}`} style={{ display: "flex", alignItems: "center", gap: "0.7rem", textDecoration: "none" }}>
                  <span style={{ width: 22, color: i < 3 ? "var(--gold)" : "var(--muted)", fontFamily: "var(--serif)", fontWeight: 700, textAlign: "center", flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--charcoal)", border: "1px solid var(--border)", display: "grid", placeItems: "center", fontSize: "1.05rem", flexShrink: 0 }}>{c.emoji || "📚"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--sans)", fontWeight: 600, color: "var(--ivory)", fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                    <div style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.74rem" }}>{c.category || "Stories"}</div>
                  </div>
                  <span style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: "0.74rem", flexShrink: 0 }}>{c.member_count.toLocaleString()}</span>
                </a>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
