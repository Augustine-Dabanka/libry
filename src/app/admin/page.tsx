import { createClient as createAdmin } from "@supabase/supabase-js";
import { isAdmin, adminViewer } from "@/app/actions/admin";
import AdminGate from "@/components/AdminGate";
import ThemeScheduleAdmin from "@/components/ThemeScheduleAdmin";
import CouponAdmin, { type CouponRow } from "@/components/CouponAdmin";
import { serviceClient } from "@/lib/supabase/service";
import { getThemeSchedule } from "@/lib/themeSchedule";
import AdminPanel, { type PartnerApp, type PayoutReq } from "@/components/AdminPanel";
import StaffHub, { type HubMember, type HubMessage, type RosterEntry } from "@/components/StaffHub";
import { canAssign, getStaff, ROLES, type Role } from "@/lib/staff";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Lybry", robots: { index: false, follow: false } };

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
  const me = (await getStaff())!;

  // Team room (0049): members, their names, and the latest global messages.
  const team: HubMember[] = [];
  let initial: HubMessage[] = [];
  let roster: RosterEntry[] = [];
  {
    const sr = await sb.from("staff_roles").select("user_id, role, finance_access, staff_code");
    const rows = (sr.data ?? []) as { user_id: string; role: Role; finance_access: boolean; staff_code?: string | null }[];
    if (!rows.some((r) => r.user_id === me.userId)) rows.unshift({ user_id: me.userId, role: me.role, finance_access: me.financeAccess, staff_code: null });
    const ids = rows.map((r) => r.user_id);
    const pn = ids.length ? await sb.from("profiles").select("id, full_name, username").in("id", ids) : { data: [] };
    const names = new Map(((pn.data ?? []) as { id: string; full_name: string | null; username: string | null }[]).map((p) => [p.id, p]));
    for (const r of rows.sort((a, b) => ROLES.findIndex((x) => x.key === a.role) - ROLES.findIndex((x) => x.key === b.role))) {
      const n = names.get(r.user_id);
      team.push({ id: r.user_id, name: n?.full_name || n?.username || "Teammate", username: n?.username ?? null, role: r.role, roleName: ROLES.find((x) => x.key === r.role)?.name || r.role, finance: r.finance_access, code: r.staff_code ?? null });
    }
    const ro = await sb.from("staff_roster").select("staff_code, display_name, role, user_id").order("staff_code");
    if (!ro.error && ro.data) {
      const linkedIds = (ro.data as { user_id: string | null }[]).map((r) => r.user_id).filter(Boolean) as string[];
      const ln = linkedIds.length ? await sb.from("profiles").select("id, username").in("id", linkedIds) : { data: [] };
      const handle = new Map(((ln.data ?? []) as { id: string; username: string | null }[]).map((p) => [p.id, p.username ? `@${p.username}` : "account"]));
      roster = (ro.data as { staff_code: string; display_name: string; role: Role; user_id: string | null }[])
        .sort((a, b) => Number(a.staff_code.slice(-1)) - Number(b.staff_code.slice(-1)))
        .map((r) => ({ code: r.staff_code, name: r.display_name, role: r.role, roleName: ROLES.find((x) => x.key === r.role)?.name || r.role, linked: r.user_id ? handle.get(r.user_id) ?? "account" : null }));
    }
    const gm = await sb.from("staff_messages").select("id, channel, sender_id, kind, body, created_at").eq("channel", "global").order("created_at", { ascending: false }).limit(60);
    if (!gm.error && gm.data) initial = (gm.data as HubMessage[]).reverse();
  }
  const assignable = ROLES.filter((r) => canAssign(me, r.key)).map((r) => r.key);

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
      <StaffHub
        me={{ id: me.userId, name: me.email, roleName: me.name, canAssign: assignable.length > 0 }}
        team={team}
        roles={ROLES.map(({ key, name, does }) => ({ key, name, does }))}
        assignable={assignable}
        initial={initial}
        roster={roster}
      />
      {me.perms.has("finance.view") || me.perms.has("creators.review") ? (
        <AdminPanel apps={me.perms.has("creators.review") ? apps : []} payouts={me.perms.has("finance.view") ? payouts : []} />
      ) : null}
      {me.perms.has("promo.manage") ? <CouponAdmin initial={coupons} /> : null}
      {me.perms.has("site.settings") ? <ThemeScheduleAdmin initial={seasons} /> : null}
    </>
  );
}
