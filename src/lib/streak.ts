// Reading-streak math, shared by the streak card and the nav flame. Pure
// functions — no I/O — so they're trivial to reason about and test.

export const GOAL_MIN: Record<string, number> = { casual: 5, regular: 15, bookworm: 30 };

// The daily goal (minutes) a reader picked in onboarding; defaults to Regular.
export function goalMinutes(goal?: string | null): number {
  return GOAL_MIN[(goal ?? "").toLowerCase()] ?? 15;
}

export type DayRow = { day: string; minutes: number };

export type StreakInfo = {
  current: number;
  longest: number;
  minutesToday: number;
  minutesWeek: number;
  goalMin: number;
  // The seven days ending today, oldest → newest, for the week strip.
  week: { date: string; label: string; minutes: number; met: boolean; isToday: boolean }[];
};

function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y!, (m! - 1), d! + n);
  return isoDay(dt);
}

// Today's local date (YYYY-MM-DD). The reader passes this to the increment RPC
// too, so the day boundary follows the reader's own clock.
export function todayISO(now: Date = new Date()): string {
  return isoDay(now);
}

const WEEKDAY = ["S", "M", "T", "W", "T", "F", "S"];

export function computeStreak(rows: DayRow[], goalMin: number, today: string = todayISO()): StreakInfo {
  const mins = new Map<string, number>();
  for (const r of rows) mins.set(r.day, r.minutes);
  const met = (iso: string) => (mins.get(iso) ?? 0) >= goalMin;

  // Current streak: walk back from today (or yesterday, if today isn't met yet
  // but is still "in progress") while each day meets the goal.
  let cursor = met(today) ? today : (met(addDays(today, -1)) ? addDays(today, -1) : null);
  let current = 0;
  while (cursor && met(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }

  // Longest streak across everything we fetched.
  const metDays = rows.filter((r) => r.minutes >= goalMin).map((r) => r.day).sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of metDays) {
    run = prev && addDays(prev, 1) === day ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = day;
  }
  longest = Math.max(longest, current);

  const week: StreakInfo["week"] = [];
  let weekTotal = 0;
  for (let i = 6; i >= 0; i--) {
    const iso = addDays(today, -i);
    const m = mins.get(iso) ?? 0;
    weekTotal += m;
    const wd = new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))).getDay();
    week.push({ date: iso, label: WEEKDAY[wd]!, minutes: m, met: m >= goalMin, isToday: iso === today });
  }

  return {
    current,
    longest,
    minutesToday: mins.get(today) ?? 0,
    minutesWeek: weekTotal,
    goalMin,
    week,
  };
}

// Milestone ladder — hours read, badges only (no coins, per Libry's no-casino rule).
export const STREAK_MILESTONES = [
  { hours: 5, name: "Kindling" },
  { hours: 25, name: "Gold Reader" },
  { hours: 100, name: "Devoted" },
  { hours: 500, name: "Lifer" },
];

export function nextMilestone(totalHours: number): { name: string; hours: number; prev: number } {
  for (let i = 0; i < STREAK_MILESTONES.length; i++) {
    if (totalHours < STREAK_MILESTONES[i]!.hours) {
      return { name: STREAK_MILESTONES[i]!.name, hours: STREAK_MILESTONES[i]!.hours, prev: i > 0 ? STREAK_MILESTONES[i - 1]!.hours : 0 };
    }
  }
  const last = STREAK_MILESTONES[STREAK_MILESTONES.length - 1]!;
  return { name: last.name, hours: last.hours, prev: last.hours };
}
