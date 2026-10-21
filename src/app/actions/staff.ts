"use server";

import { randomBytes } from "node:crypto";
import { audit, canAssign, getStaff, MAX_SUSPEND_DAYS, rankOf, requirePerm, ROLES, svc, type Role, type Staff } from "@/lib/staff";

// Team chat + slash commands. Every message and command is checked here on
// the server against the sender's rank; the browser only ever reads.
//
//   /help                          list commands you're allowed to use
//   /warn @user reason             sends the user a notice
//   /suspend @user 3d reason       blocks sign-in for N days (h, d)
//   /ban @user reason              blocks sign-in indefinitely
//   /unban @user                   lifts a suspension or ban
//   /freeze @creator  /unfreeze    pause or resume a creator's payouts
//   /role @user moderator          give a rank (/role @user none removes it)
//   /finance @user on|off          let Accountant #2 send payouts, or not
//   /announce text                 pinned-style message to the whole team
//   /call                          starts a video call link for this chat

type Result = { ok: true; note?: string } | { error: string };
const DM_RE = /^dm:[0-9a-f-]{36}:[0-9a-f-]{36}$/;

export async function dmChannel(a: string, b: string) {
  return `dm:${[a, b].sort().join(":")}`;
}

async function findUser(handle: string): Promise<{ id: string; name: string } | null> {
  const s = svc();
  if (!s) return null;
  const u = handle.replace(/^@/, "").trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(u)) return null;
  const { data } = await s.from("profiles").select("id, username, full_name").ilike("username", u).maybeSingle();
  return data ? { id: data.id as string, name: (data.full_name as string) || (data.username as string) } : null;
}

// Staff can't act on someone of equal or higher rank (or on the owner).
async function outranks(me: Staff, targetId: string): Promise<boolean> {
  if (me.owner) return targetId !== me.userId;
  const s = svc();
  if (!s) return false;
  const { data } = await s.from("staff_roles").select("role").eq("user_id", targetId).maybeSingle();
  if (!data) return true;
  return rankOf(data.role as Role) > me.rank;
}

async function post(channel: string, sender: string | null, body: string, kind: "text" | "system" | "call" | "command" = "text") {
  const s = svc();
  if (!s) return { error: "Server isn't configured (service key missing)." };
  const { error } = await s.from("staff_messages").insert({ channel, sender_id: sender, body: body.slice(0, 4000), kind });
  return error ? { error: error.message } : { ok: true as const };
}

export async function sendStaffMessage(channel: string, raw: string): Promise<Result> {
  const me = await getStaff();
  if (!me) return { error: "Not authorized." };
  const text = raw.trim();
  if (!text) return { error: "Type a message." };
  if (channel !== "global" && !(DM_RE.test(channel) && channel.includes(me.userId))) return { error: "Not your conversation." };
  if (!text.startsWith("/")) { const r = await post(channel, me.userId, text); return "error" in r ? r : { ok: true }; }
  return runCommand(me, channel, text);
}

async function runCommand(me: Staff, channel: string, text: string): Promise<Result> {
  const [cmd, ...rest] = text.slice(1).split(/\s+/);
  const s = svc();
  if (!s) return { error: "Server isn't configured (service key missing)." };
  const need = async (perm: Parameters<typeof requirePerm>[0]) => (me.perms.has(perm) ? null : { error: `Your rank (${me.name}) can't use /${cmd}.` });

  switch ((cmd || "").toLowerCase()) {
    case "help": {
      const lines = [
        "/call — start a video call",
        me.perms.has("users.warn") && "/warn @user reason",
        me.perms.has("users.suspend") && `/suspend @user 3d reason (up to ${MAX_SUSPEND_DAYS[me.role] ?? 0} days)`,
        me.perms.has("users.ban") && "/ban @user reason · /unban @user",
        me.perms.has("creators.freeze") && "/freeze @creator · /unfreeze @creator",
        me.perms.has("roles.assign") && "/role @user <rank|none>",
        me.perms.has("finance.grant") && "/finance @user on|off",
        me.perms.has("announce") && "/announce message",
      ].filter(Boolean);
      return { ok: true, note: `You're ${me.name}. You can use:\n${lines.join("\n")}` };
    }
    case "call": {
      const room = `lybry-team-${randomBytes(9).toString("hex")}`;
      const r = await post(channel, me.userId, `https://meet.jit.si/${room}`, "call");
      return "error" in r ? r : { ok: true };
    }
    case "announce": {
      const deny = await need("announce"); if (deny) return deny;
      const msg = rest.join(" ").trim();
      if (!msg) return { error: "Usage: /announce message" };
      await audit(me.userId, "announce", null, { msg });
      const r = await post("global", me.userId, msg, "system");
      return "error" in r ? r : { ok: true };
    }
    case "warn": case "suspend": case "ban": case "unban": case "freeze": case "unfreeze": case "role": case "finance": {
      const target = rest[0] ? await findUser(rest[0]) : null;
      if (!target) return { error: `Usage: /${cmd} @username …  (user not found)` };
      if (target.id === me.userId) return { error: "You can't do that to yourself." };
      if (!(await outranks(me, target.id))) return { error: "That person is your rank or above." };
      const reason = rest.slice(cmd === "suspend" ? 2 : 1).join(" ").trim();

      if (cmd === "warn") {
        const deny = await need("users.warn"); if (deny) return deny;
        await s.from("notifications").insert({ user_id: target.id, actor_name: "Lybry team", kind: "staff_notice", summary: reason || "Please review our community guidelines.", link: "/docs" });
      } else if (cmd === "suspend" || cmd === "ban" || cmd === "unban") {
        const deny = await need(cmd === "ban" ? "users.ban" : "users.suspend"); if (deny) return deny;
        let duration = "none";
        if (cmd === "ban") duration = "876000h";
        if (cmd === "suspend") {
          const m = /^(\d{1,4})([hd])$/i.exec(rest[1] || "");
          if (!m) return { error: "Usage: /suspend @user 3d reason   (h = hours, d = days)" };
          const days = m[2].toLowerCase() === "d" ? Number(m[1]) : Number(m[1]) / 24;
          if (days > (MAX_SUSPEND_DAYS[me.role] ?? 0)) return { error: `Your rank can suspend for up to ${MAX_SUSPEND_DAYS[me.role] ?? 0} days.` };
          duration = `${Math.round(days * 24)}h`;
        }
        const { error } = await s.auth.admin.updateUserById(target.id, { ban_duration: duration } as never);
        if (error) return { error: error.message };
      } else if (cmd === "freeze" || cmd === "unfreeze") {
        const deny = await need("creators.freeze"); if (deny) return deny;
        const { error } = await s.from("profiles").update({ payout_frozen: cmd === "freeze" }).eq("id", target.id);
        if (error) return { error: error.message };
      } else if (cmd === "role") {
        const want = (rest[1] || "").toLowerCase() as Role | "none";
        if (want === "none") {
          const deny = await need("roles.assign"); if (deny) return deny;
          await s.from("staff_roles").delete().eq("user_id", target.id);
        } else {
          if (!ROLES.some((r) => r.key === want)) return { error: `Ranks: ${ROLES.map((r) => r.key).join(", ")}, or none` };
          if (!canAssign(me, want)) return { error: `Your rank (${me.name}) can't give ${want}.` };
          const { error } = await s.from("staff_roles").upsert({ user_id: target.id, role: want, granted_by: me.userId, updated_at: new Date().toISOString(), finance_access: false });
          if (error) return { error: error.message };
        }
      } else if (cmd === "finance") {
        const deny = await need("finance.grant"); if (deny) return deny;
        const on = (rest[1] || "").toLowerCase() === "on";
        const { data } = await s.from("staff_roles").select("role").eq("user_id", target.id).maybeSingle();
        if (data?.role !== "accountant_2") return { error: "Only an Accountant #2 needs this switch." };
        await s.from("staff_roles").update({ finance_access: on, updated_at: new Date().toISOString() }).eq("user_id", target.id);
      }
      await audit(me.userId, cmd, target.id, { reason, args: rest.slice(1) });
      await post(channel, me.userId, `${me.name} used /${cmd} on @${rest[0]!.replace(/^@/, "")}${reason ? `: ${reason}` : ""}`, "command");
      return { ok: true };
    }
    default:
      return { error: `Unknown command /${cmd}. Type /help.` };
  }
}

// Rank changes from the Team table (same rules as /role).
export async function setStaffRole(userId: string, role: Role | "none"): Promise<Result> {
  const me = await getStaff();
  if (!me) return { error: "Not authorized." };
  const s = svc();
  if (!s) return { error: "Server isn't configured." };
  if (userId === me.userId) return { error: "You can't change your own rank." };
  if (!(await outranks(me, userId))) return { error: "That person is your rank or above." };
  if (role === "none") {
    if (!me.perms.has("roles.assign")) return { error: "Your rank can't remove staff." };
    await s.from("staff_roles").delete().eq("user_id", userId);
  } else {
    if (!canAssign(me, role)) return { error: `Your rank (${me.name}) can't give that rank.` };
    const { error } = await s.from("staff_roles").upsert({ user_id: userId, role, granted_by: me.userId, updated_at: new Date().toISOString(), finance_access: false });
    if (error) return { error: error.message };
  }
  await audit(me.userId, "role", userId, { role });
  return { ok: true };
}

// Add a teammate by username (lowest rank by default).
export async function addStaff(handle: string, role: Role): Promise<Result> {
  const me = await getStaff();
  if (!me) return { error: "Not authorized." };
  const t = await findUser(handle);
  if (!t) return { error: "No user with that username." };
  return setStaffRole(t.id, role);
}

// Link a roster entry (staff ID + name + rank) to someone's Lybry account.
// Owners can link any rank; others follow the normal "who can assign what" rules.
export async function linkRoster(staffCode: string, handle: string): Promise<Result> {
  const me = await getStaff();
  if (!me) return { error: "Not authorized." };
  const s = svc();
  if (!s) return { error: "Server isn't configured." };
  const { data: entry } = await s.from("staff_roster").select("staff_code, display_name, role, user_id").eq("staff_code", staffCode).maybeSingle();
  if (!entry) return { error: "No roster entry with that staff ID." };
  const role = entry.role as Role;
  if (!(me.owner || canAssign(me, role))) return { error: `Your rank (${me.name}) can't link a ${role}.` };
  const t = await findUser(handle);
  if (!t) return { error: "No user with that username." };
  if (!me.owner && !(await outranks(me, t.id))) return { error: "That person is your rank or above." };
  await s.from("staff_roles").update({ staff_code: null }).eq("staff_code", staffCode);
  const up = await s.from("staff_roles").upsert({ user_id: t.id, role, staff_code: staffCode, granted_by: me.userId, updated_at: new Date().toISOString() });
  if (up.error) return { error: up.error.message };
  await s.from("staff_roster").update({ user_id: null }).eq("user_id", t.id);
  await s.from("staff_roster").update({ user_id: t.id }).eq("staff_code", staffCode);
  await audit(me.userId, "link_roster", t.id, { staffCode, role });
  return { ok: true, note: `${entry.display_name} (${staffCode}) is now linked to @${handle.replace(/^@/, "")} as ${ROLES.find((r) => r.key === role)?.name}.` };
}
