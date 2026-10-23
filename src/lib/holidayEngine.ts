/**
 * Data-driven seasonal theme selection. Dates are evaluated in the visitor's
 * local calendar, and all functions accept an injected Date for deterministic tests.
 * Lunar dates that are authority-dependent are intentionally configured per year.
 */
export type HolidayRule =
  | { type: "fixed"; month: number; day: number }
  | { type: "range"; startMonth: number; startDay: number; endMonth: number; endDay: number }
  | { type: "easter"; offsetStart?: number; offsetEnd?: number }
  | { type: "annual-dates"; dates: Record<number, { month: number; day: number; endMonth?: number; endDay?: number }> };

export type HolidayTheme = {
  id: string;
  name: string;
  countries: string[];
  priority: number;
  enabled: boolean;
  activationDays?: number;
  rule: HolidayRule;
  colors: { background: string; surface: string; accent: string; glow: string };
};

const dateAt = (year: number, month: number, day: number) => new Date(year, month - 1, day, 12);
const dayNumber = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000;

// Gregorian Easter algorithm (Western/Gregorian calendar).
export function easterSunday(year: number): Date {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  return dateAt(year, Math.floor((h + l - 7 * m + 114) / 31), ((h + l - 7 * m + 114) % 31) + 1);
}

export const HOLIDAY_REGISTRY: HolidayTheme[] = [
  { id: "new-year", name: "New Year", countries: ["*"], priority: 20, enabled: true, activationDays: 2, rule: { type: "range", startMonth: 12, startDay: 31, endMonth: 1, endDay: 2 }, colors: { background: "#15111f", surface: "#241c31", accent: "#e8c170", glow: "rgba(232,193,112,.14)" } },
  { id: "valentines", name: "Valentine's Day", countries: ["*"], priority: 10, enabled: true, activationDays: 3, rule: { type: "fixed", month: 2, day: 14 }, colors: { background: "#1b1017", surface: "#2a1924", accent: "#ff7798", glow: "rgba(255,119,152,.13)" } },
  { id: "lunar-new-year", name: "Lunar New Year", countries: ["CN", "VN", "KR", "SG", "MY"], priority: 30, enabled: true, activationDays: 2, rule: { type: "annual-dates", dates: { 2026: { month: 2, day: 17 }, 2027: { month: 2, day: 6 }, 2028: { month: 1, day: 26 }, 2029: { month: 2, day: 13 }, 2030: { month: 2, day: 3 } } }, colors: { background: "#1b1010", surface: "#2b1716", accent: "#e64b42", glow: "rgba(230,75,66,.13)" } },
  { id: "easter", name: "Easter", countries: ["*"], priority: 10, enabled: true, activationDays: 1, rule: { type: "easter", offsetStart: -2, offsetEnd: 1 }, colors: { background: "#171323", surface: "#252039", accent: "#b9a2ff", glow: "rgba(185,162,255,.13)" } },
  { id: "ghana-independence", name: "Ghana Independence Day", countries: ["GH"], priority: 40, enabled: true, activationDays: 2, rule: { type: "fixed", month: 3, day: 6 }, colors: { background: "#121b17", surface: "#1c2b22", accent: "#36a765", glow: "rgba(54,167,101,.13)" } },
  { id: "eid-al-fitr", name: "Eid al-Fitr", countries: ["*"], priority: 35, enabled: true, activationDays: 1, rule: { type: "annual-dates", dates: {} }, colors: { background: "#111c1b", surface: "#1b2b29", accent: "#62c7a6", glow: "rgba(98,199,166,.13)" } },
  { id: "eid-al-adha", name: "Eid al-Adha", countries: ["*"], priority: 34, enabled: true, activationDays: 1, rule: { type: "annual-dates", dates: {} }, colors: { background: "#111c1b", surface: "#1b2b29", accent: "#62c7a6", glow: "rgba(98,199,166,.13)" } },
  { id: "holi", name: "Holi", countries: ["IN", "NP"], priority: 15, enabled: true, activationDays: 1, rule: { type: "annual-dates", dates: { 2026: { month: 3, day: 4 }, 2027: { month: 3, day: 22 }, 2028: { month: 3, day: 11 }, 2029: { month: 3, day: 1 }, 2030: { month: 3, day: 20 } } }, colors: { background: "#1b1320", surface: "#2b2033", accent: "#f27dce", glow: "rgba(242,125,206,.13)" } },
  { id: "diwali", name: "Diwali", countries: ["IN", "NP", "SG", "MY"], priority: 20, enabled: true, activationDays: 2, rule: { type: "annual-dates", dates: { 2026: { month: 11, day: 8 }, 2027: { month: 10, day: 29 }, 2028: { month: 11, day: 17 }, 2029: { month: 11, day: 5 }, 2030: { month: 10, day: 26 } } }, colors: { background: "#1d140e", surface: "#302116", accent: "#f2a94a", glow: "rgba(242,169,74,.13)" } },
  { id: "halloween", name: "Halloween", countries: ["*"], priority: 25, enabled: true, activationDays: 6, rule: { type: "range", startMonth: 10, startDay: 25, endMonth: 11, endDay: 1 }, colors: { background: "#111019", surface: "#201b2b", accent: "#f28b35", glow: "rgba(242,139,53,.16)" } },
  { id: "christmas", name: "Christmas", countries: ["*"], priority: 20, enabled: true, activationDays: 7, rule: { type: "range", startMonth: 12, startDay: 18, endMonth: 12, endDay: 27 }, colors: { background: "#101a17", surface: "#1a2923", accent: "#d94b57", glow: "rgba(217,75,87,.13)" } },
];

function ruleWindow(rule: HolidayRule, year: number): [Date, Date] | null {
  if (rule.type === "fixed") { const d = dateAt(year, rule.month, rule.day); return [d, d]; }
  if (rule.type === "range") return [dateAt(year, rule.startMonth, rule.startDay), dateAt(rule.endMonth < rule.startMonth ? year + 1 : year, rule.endMonth, rule.endDay)];
  if (rule.type === "easter") { const e = easterSunday(year); const start = new Date(e); start.setDate(start.getDate() + (rule.offsetStart ?? 0)); const end = new Date(e); end.setDate(end.getDate() + (rule.offsetEnd ?? 0)); return [start, end]; }
  const x = rule.dates[year]; if (!x) return null;
  const start = dateAt(year, x.month, x.day);
  return [start, dateAt(x.endMonth ?? x.month, x.endDay ?? x.day, year)];
}

export function holidayIsActive(holiday: HolidayTheme, date: Date): boolean {
  if (!holiday.enabled) return false;
  const years = [date.getFullYear() - 1, date.getFullYear(), date.getFullYear() + 1];
  return years.some((year) => {
    const win = ruleWindow(holiday.rule, year);
    if (!win) return false;
    const [start, end] = win;
    const activation = new Date(start); activation.setDate(activation.getDate() - (holiday.activationDays ?? 0));
    return dayNumber(date) >= dayNumber(activation) && dayNumber(date) <= dayNumber(end);
  });
}

export function selectHolidayTheme(input: { date: Date; country?: string; registry?: HolidayTheme[]; automatic?: boolean; manualTheme?: string | null }): HolidayTheme | null {
  const { date, country = "GH", registry = HOLIDAY_REGISTRY, automatic = true, manualTheme = null } = input;
  if (manualTheme) return registry.find((h) => h.id === manualTheme) ?? null;
  if (!automatic) return null;
  return [...registry].filter((h) => holidayIsActive(h, date) && (h.countries.includes("*") || h.countries.includes(country.toUpperCase()))).sort((a, b) => {
    const ar = a.countries.includes(country.toUpperCase()) ? 1 : 0;
    const br = b.countries.includes(country.toUpperCase()) ? 1 : 0;
    return br - ar || b.priority - a.priority;
  })[0] ?? null;
}
