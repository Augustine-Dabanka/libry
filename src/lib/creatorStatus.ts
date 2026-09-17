// Creator account governance — the reader side is never affected by any of this.
// See migration 0021_creator_status.sql for the source of truth.

export type CreatorStatus = "active" | "suspended" | "banned";

export function normalizeStatus(s?: string | null): CreatorStatus {
  return s === "suspended" || s === "banned" ? s : "active";
}

// The gate: can this creator publish / upload / earn right now? Reading is
// always allowed regardless — that's a separate account concern.
export function isCreatorActive(s?: string | null): boolean {
  return normalizeStatus(s) === "active";
}

export type StatusMeta = { label: string; tone: "ok" | "warn" | "bad"; heading: string; blurb: string };

export function creatorStatusMeta(s?: string | null, until?: string | null, reason?: string | null): StatusMeta {
  const status = normalizeStatus(s);
  if (status === "suspended") {
    const when = until ? new Date(until) : null;
    const lifts = when && !Number.isNaN(when.getTime()) ? when.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : null;
    return {
      label: "Suspended",
      tone: "warn",
      heading: "Your creator account is temporarily suspended",
      blurb:
        (reason ? `${reason} ` : "") +
        `Publishing and payouts are paused${lifts ? ` until ${lifts}` : " while we review"}. Your reading, library, and existing published books stay exactly as they are.`,
    };
  }
  if (status === "banned") {
    return {
      label: "Banned",
      tone: "bad",
      heading: "Your creator account has been closed",
      blurb:
        (reason ? `${reason} ` : "") +
        "Publishing and payouts are permanently disabled. You keep full access to read and to your library — only the creator side is closed.",
    };
  }
  return { label: "Active", tone: "ok", heading: "Your creator account is in good standing", blurb: "Publishing, payouts, and everything else are fully available." };
}
