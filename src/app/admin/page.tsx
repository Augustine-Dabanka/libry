import { createClient as createAdmin } from "@supabase/supabase-js";
import { isAdmin, adminViewer } from "@/app/actions/admin";
import AdminGate from "@/components/AdminGate";
import ThemeScheduleAdmin from "@/components/ThemeScheduleAdmin";
import CouponAdmin, { type CouponRow } from "@/components/CouponAdmin";
import { serviceClient } from "@/lib/supabase/service";
import { getThemeSchedule } from "@/lib/themeSchedule";
import AdminPanel, { type PartnerApp, type PayoutReq } from "@/components/AdminPanel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Libry", robots: { index: false, follow: false } };

type PayAcct = { method: string; provider: string | null; account_name: string | null; account_number: string | null };

export default async function AdminPage() {
  if (!(await isAdmin())) {
    const v = await adminViewer();
    return <AdminGate signedIn={v.signedIn} email={v.email} />;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>Admin isn&apos;t configured (missing service role key).</div>;
  }
  const sb = createAdmin(url, key, { auth: { persistSession: false } });

  // Pending partnership applications.
  const { data: profs } = await sb
    .from("profiles")
    .select("id, username, full_name, pen_name, partner_applied_at")
    .eq("partner_status", "pending")
    .order("partner_applied_at", { ascending: true });
  const appIds = (profs ?? []).map((p: { id: string }) => p.id);

  // Payout accounts + lifetime earnings for those applicants.
  const acctMap = new Map<string, PayAcct>();
  if (appIds.length) {
    const { data: accts } = await sb.from("payout_accounts").select("user_id, method, provider, account_name, account_number").in("user_id", appIds);
    (accts ?? []).forEach((a: PayAcct & { user_id: string }) => acctMap.set(a.user_id, a));
  }
  const apps: PartnerApp[] = [];
  for (const p of (profs ?? []) as { id: string; username: string | null; full_name: string | null; pen_name: string | null; partner_applied_at: string | null }[]) {
    const { data: net } = await sb.rpc("creator_net_earned", { p_user: p.id });
    apps.push({
      id: p.id,
      name: p.pen_name || p.full_name || p.username || "Creator",
      applied_at: p.partner_applied_at,
      net_earned: typeof net === "number" ? net : 0,
      payout: acctMap.get(p.id) ?? null,
    });
  }

  // Pending payout requests.
  const { data: pos } = await sb.from("payouts").select("id, creator_id, amount, requested_at").eq("status", "pending").order("requested_at", { ascending: true });
  const creatorIds = [...new Set((pos ?? []).map((r: { creator_id: string }) => r.creator_id))];
  const nameMap = new Map<string, string>();
  const paMap = new Map<string, PayAcct>();
  if (creatorIds.length) {
    const { data: cp } = await sb.from("profiles").select("id, username, full_name, pen_name").in("id", creatorIds);
    (cp ?? []).forEach((c: { id: string; username: string | null; full_name: string | null; pen_name: string | null }) => nameMap.set(c.id, c.pen_name || c.full_name || c.username || "Creator"));
    const { data: accts } = await sb.from("payout_accounts").select("user_id, method, provider, account_name, account_number").in("user_id", creatorIds);
    (accts ?? []).forEach((a: PayAcct & { user_id: string }) => paMap.set(a.user_id, a));
  }
  const payouts: PayoutReq[] = ((pos ?? []) as { id: number; creator_id: string; amount: number; requested_at: string }[]).map((r) => ({
    id: r.id,
    creator_id: r.creator_id,
    creator_name: nameMap.get(r.creator_id) || "Creator",
    amount: Number(r.amount),
    requested_at: r.requested_at,
    payout: paMap.get(r.creator_id) ?? null,
  }));

  const seasons = await getThemeSchedule();
  let coupons: CouponRow[] = [];
  {
    const svc = serviceClient();
    if (svc) {
      const { data } = await svc.from("coupons").select("code, coins, max_uses, used, ends_at, active").order("created_at", { ascending: false }).limit(50);
      if (data) coupons = data as CouponRow[];
    }
  }
  return (
    <>
      <AdminPanel apps={apps} payouts={payouts} />
      <CouponAdmin initial={coupons} />
      <ThemeScheduleAdmin initial={seasons} />
    </>
  );
}
