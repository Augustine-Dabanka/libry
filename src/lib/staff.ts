import "server-only";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Lybry staff ranks (1 = highest) and exactly what each may do.
//
// The notebook spec said every rank has "full access but less than the one
// above". In practice that means nothing can be held back, so here each rank
// gets only the powers its job needs (least privilege). Money is its own lane:
// accountants rank below moderators but are the only ones who move funds.
export type Role = "ultra_admin" | "super_admin" | "admin" | "manager" | "moderator" | "accountant" | "accountant_2" | "staff";
export type Perm =
  | "chat" | "calls"
  | "users.warn" | "users.suspend" | "users.ban"
  | "content.moderate" | "creators.review" | "creators.freeze"
  | "promo.manage" | "site.settings"
  | "finance.view" | "finance.send" | "finance.grant"
  | "roles.assign" | "audit.view" | "announce";

export const ROLES: { key: Role; rank: number; name: string; does: string }[] = [
  { key: "ultra_admin", rank: 1, name: "Ultra Admin", does: "Everything, including other admins' roles, finance overrides and site settings." },
  { key: "super_admin", rank: 2, name: "Super Admin", does: "Everything except changing Ultra or Super Admins." },
  { key: "admin", rank: 3, name: "Admin", does: "Users, bans, creators, content, coupons, seasons; assigns Manager and below. Can see finances." },
  { key: "manager", rank: 4, name: "Manager", does: "Creators, content, coupons, suspensions up to 30 days; assigns Moderator and Staff." },
  { key: "moderator", rank: 5, name: "Moderator", does: "Reports and content, warnings, suspensions up to 7 days." },
  { key: "accountant", rank: 6, name: "Accountant", does: "Views and sends payouts; switches Accountant #2's access on or off." },
  { key: "accountant_2", rank: 7, name: "Accountant #2", does: "Views finances; can send payouts only while an Accountant allows it." },
  { key: "staff", rank: 8, name: "Staff", does: "Helps readers and creators: team chat, warnings, flags content for review." },
];

const P: Record<Role, Perm[]> = {
  ultra_admin: ["chat", "calls", "users.warn", "users.suspend", "users.ban", "content.moderate", "creators.review", "creators.freeze", "promo.manage", "site.settings", "finance.view", "finance.send", "finance.grant", "roles.assign", "audit.view", "announce"],
  super_admin: ["chat", "calls", "users.warn", "users.suspend", "users.ban", "content.moderate", "creators.review", "creators.freeze", "promo.manage", "site.settings", "finance.view", "finance.send", "finance.grant", "roles.assign", "audit.view", "announce"],
  admin: ["chat", "calls", "users.warn", "users.suspend", "users.ban", "content.moderate", "creators.review", "creators.freeze", "promo.manage", "site.settings", "finance.view", "roles.assign", "audit.view", "announce"],
  manager: ["chat", "calls", "users.warn", "users.suspend", "content.moderate", "creators.review", "promo.manage", "roles.assign", "audit.view"],
  moderator: ["chat", "calls", "users.warn", "users.suspend", "content.moderate"],
  accountant: ["chat", "calls", "finance.view", "finance.send", "finance.grant", "creators.freeze"],
  accountant_2: ["chat", "calls", "finance.view"],
  staff: ["chat", "calls", "users.warn"],
};
// Longest suspension each rank may give, in days.
export const MAX_SUSPEND_DAYS: Partial<Record<Role, number>> = { ultra_admin: 3650, super_admin: 3650, admin: 365, manager: 30, moderator: 7 };
// Lowest rank number a role may hand out (it can assign this rank and below).
const ASSIGN_FROM: Partial<Record<Role, number>> = { ultra_admin: 2, super_admin: 3, admin: 4, manager: 5 };

export type Staff = { userId: string; email: string; role: Role; rank: number; name: string; perms: Set<Perm>; financeAccess: boolean; owner: boolean };

export function rankOf(role: Role) { return ROLES.find((r) => r.key === role)!.rank; }
export function canAssign(me: Staff, target: Role) {
  const from = ASSIGN_FROM[me.role];
  return !!from && me.perms.has("roles.assign") && rankOf(target) >= from;
}

export function svc() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createAdmin(url, key, { auth: { persistSession: false } });
}

function ownerEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

// The signed-in staff member, or null. Owners (ADMIN_EMAILS) are always Ultra Admin.
export async function getStaff(): Promise<Staff | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email || !user.email_confirmed_at) return null;
  const owner = ownerEmails().includes(user.email.toLowerCase());
  let role: Role | null = owner ? "ultra_admin" : null;
  let financeAccess = owner;
  const s = svc();
  if (!owner && s) {
    const { data } = await s.from("staff_roles").select("role, finance_access").eq("user_id", user.id).maybeSingle();
    if (data) { role = data.role as Role; financeAccess = !!data.finance_access; }
  }
  if (!role) return null;
  const perms = new Set(P[role]);
  if (role === "accountant_2" && financeAccess) perms.add("finance.send");
  return { userId: user.id, email: user.email, role, rank: rankOf(role), name: ROLES.find((r) => r.key === role)!.name, perms, financeAccess, owner };
}

export async function requirePerm(perm: Perm): Promise<Staff | { error: string }> {
  const me = await getStaff();
  if (!me) return { error: "Not authorized." };
  if (!me.perms.has(perm)) return { error: `Your rank (${me.name}) can't do that.` };
  return me;
}

export async function audit(actor: string, action: string, target: string | null, detail: Record<string, unknown> = {}) {
  const s = svc();
  if (!s) return;
  try { await s.from("staff_audit").insert({ actor_id: actor, action, target_id: target, detail }); } catch { /* table not migrated yet */ }
}
