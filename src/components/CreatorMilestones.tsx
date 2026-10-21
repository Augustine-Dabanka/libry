"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import CreatorBadge, { TIERS, type BadgeTier } from "@/components/CreatorBadge";

type M = { followers: number; sales: number; tier: BadgeTier | null; next_tier: BadgeTier | null; next_at: number | null; sales_award: number | null };
const AWARD_NAMES: Record<number, string> = { 100: "First 100 sold", 1000: "1,000 sold", 10000: "10,000 sold" };

// Creator dashboard card: current badge, progress to the next, sales award,
// and (from Gold) a button to request the physical award.
export default function CreatorMilestones({ author }: { author: string }) {
  const [m, setM] = useState<M | null>(null);
  const [missing, setMissing] = useState(false);
  const [asked, setAsked] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const sb = createClient();
    sb.rpc("creator_milestones", { p_author: author }).then(({ data, error }) => {
      if (error) { setMissing(true); return; }
      setM(data as M);
    });
    sb.from("award_requests").select("tier").then(({ data }) => setAsked(((data as { tier: string }[] | null) ?? []).map((r) => r.tier)));
  }, [author]);

  if (missing) return null; // 0047 not run yet
  if (!m) return <div className="sk" style={{ height: 120, borderRadius: 16 }} />;

  const cur = TIERS.find((t) => t.key === m.tier);
  const prevAt = cur?.at ?? 0;
  const pct = m.next_at ? Math.min(100, Math.round(((m.followers - prevAt) / (m.next_at - prevAt)) * 100)) : 100;
  const physical = m.tier === "gold" || m.tier === "platinum" || m.tier === "diamond";

  async function request() {
    if (!m?.tier) return;
    const { error } = await createClient().rpc("request_physical_award", { p_tier: m.tier });
    if (error) { setNote(error.message); return; }
    setAsked((a) => [...a, m.tier!]);
    setNote("Requested. We'll email you to confirm the details and where to send it.");
  }

  return (
    <div style={{ display: "grid", gap: "0.9rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.9rem", flexWrap: "wrap" }}>
        {cur ? <CreatorBadge tier={cur.key} size={56} /> : <span aria-hidden="true" style={{ width: 56, height: 56, borderRadius: "50%", border: "3px dashed var(--edge)", display: "grid", placeItems: "center", color: "var(--muted)", fontWeight: 900 }}>?</span>}
        <div style={{ flex: 1, minWidth: 180 }}>
          <strong style={{ display: "block", fontWeight: 900, fontSize: "1.05rem" }}>{cur ? `${cur.name} creator` : "Your first badge"}</strong>
          <span style={{ color: "var(--muted)", fontWeight: 700, fontSize: "0.88rem" }}>
            {m.followers.toLocaleString("en-US")} followers · {m.sales.toLocaleString("en-US")} books sold
          </span>
        </div>
      </div>
      {m.next_tier && m.next_at ? (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "0.82rem", color: "var(--muted)", marginBottom: 6 }}>
            <span>Next: {TIERS.find((t) => t.key === m.next_tier)?.name}</span>
            <span>{(m.next_at - m.followers).toLocaleString("en-US")} followers to go</span>
          </div>
          <div style={{ height: 12, borderRadius: 99, background: "var(--charcoal)", border: "2px solid var(--border)", overflow: "hidden" }}>
            <div style={{ width: `${Math.max(3, pct)}%`, height: "100%", background: "var(--gold)", borderRadius: 99, transition: "width .6s" }} />
          </div>
        </div>
      ) : null}
      {m.sales_award ? (
        <div style={{ fontWeight: 800, fontSize: "0.9rem" }}>Sales award: <span style={{ color: "var(--gold)" }}>{AWARD_NAMES[m.sales_award]}</span> (digital plaque on your creator page)</div>
      ) : null}
      {physical ? (
        asked.includes(m.tier!) ? (
          <p style={{ margin: 0, color: "var(--success)", fontWeight: 800, fontSize: "0.88rem" }}>Physical {cur?.name} award requested ✓</p>
        ) : (
          <button type="button" className="btn btn-outline" onClick={request} style={{ justifySelf: "start" }}>Request my physical {cur?.name} award</button>
        )
      ) : (
        <p style={{ margin: 0, color: "var(--muted)", fontWeight: 600, fontSize: "0.82rem" }}>Every badge shows on your profile. From Gold (2,500 followers) you can also request a physical award.</p>
      )}
      {note ? <p role="status" style={{ margin: 0, fontWeight: 800, fontSize: "0.86rem", color: "var(--muted)" }}>{note}</p> : null}
    </div>
  );
}
