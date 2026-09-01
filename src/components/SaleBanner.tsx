import { createClient } from "@/lib/supabase/server";

// Platform-wide, time-gated sale banner. Renders nothing when no sale is live.
export default async function SaleBanner() {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const { data } = await supabase
    .from("sale_campaigns")
    .select("title, description, ends_at")
    .eq("active", true)
    .lte("starts_at", nowIso)
    .gte("ends_at", nowIso)
    .order("created_at", { ascending: false })
    .limit(1);

  const c = data?.[0];
  if (!c) return null;

  const days = Math.max(1, Math.ceil((new Date(c.ends_at).getTime() - Date.now()) / 86_400_000));

  return (
    <a
      href="/shop"
      className="lb-float-in"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.7rem",
        flexWrap: "wrap",
        textDecoration: "none",
        background: "linear-gradient(90deg, rgba(196,163,90,0.18), rgba(180,83,9,0.16))",
        border: "1px solid rgba(196,163,90,0.35)",
        borderRadius: 14,
        padding: "0.85rem 1.2rem",
        marginBottom: "1.4rem",
      }}
    >
      <span style={{ fontSize: "1.2rem" }}>🎉</span>
      <span style={{ fontWeight: 800, color: "var(--ivory)", fontFamily: "var(--sans)" }}>{c.title}</span>
      <span style={{ color: "var(--ivory-muted)", fontFamily: "var(--sans)", fontSize: "0.92rem" }}>{c.description}</span>
      <span style={{ marginLeft: "auto", color: "var(--gold)", fontWeight: 700, fontFamily: "var(--sans)", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
        Ends in {days}d · Shop →
      </span>
    </a>
  );
}
