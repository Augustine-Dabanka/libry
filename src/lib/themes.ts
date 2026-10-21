// Lybry theme system (shared by server and client; no "use client").
//
// Three layers, applied as attributes on <html> by the inline script in layout.tsx:
//   data-brand  – accent presets the reader picked (existing)
//   data-look   – genre looks the reader picked (Horror, Noir, Sci-fi, …)
//   data-season – seasonal themes, switched on/off automatically by date
// Seasons win while they're active; the reader's own look returns after.
// Colours live in globals.css ("Batch 5: looks and seasons").

export type Season = {
  key: string;
  name: string;
  start: string; // "MM-DD", inclusive
  end: string;   // "MM-DD", inclusive (may wrap past New Year)
  enabled: boolean;
  accent: string;
  // Collabs/events only: the partner or event name shown on loaders ("Lybry × ...").
  label?: string;
};

// Order = priority (first match wins). "collab" is a staff-set event or partner
// takeover; it's off until you switch it on in /admin. Easter moves every year,
// so its dates are computed (Good Friday to Easter Monday) and the fields are ignored.
export const DEFAULT_SEASONS: Season[] = [
  { key: "collab", name: "Collab / special event", start: "01-01", end: "01-01", enabled: false, accent: "#7C83FF", label: "" },
  { key: "newyear", name: "New Year", start: "12-31", end: "01-02", enabled: true, accent: "#E8C170" },
  { key: "valentines", name: "Valentine’s week", start: "02-10", end: "02-15", enabled: true, accent: "#FF6B8A" },
  { key: "independence", name: "Independence Day (Ghana)", start: "03-05", end: "03-07", enabled: false, accent: "#2F9E44" },
  { key: "july4", name: "Independence Day (US)", start: "07-02", end: "07-05", enabled: true, accent: "#2B59C3" },
  { key: "easter", name: "Easter (dates set automatically)", start: "easter", end: "easter", enabled: true, accent: "#B197FC" },
  { key: "halloween", name: "Halloween", start: "10-25", end: "11-01", enabled: true, accent: "#FF7A1A" },
  // 4th Thursday of November always falls on the 22nd–28th.
  { key: "thanksgiving", name: "Thanksgiving week (US)", start: "11-22", end: "11-28", enabled: true, accent: "#C8471F" },
  { key: "christmas", name: "Christmas", start: "12-18", end: "12-27", enabled: true, accent: "#D7263D" },
];

export const LOOKS = [
  { key: "horror", name: "Horror", accent: "#C1121F", blurb: "Blood red on black" },
  { key: "noir", name: "Noir", accent: "#E5E5E5", blurb: "Black and white, like a case file" },
  { key: "scifi", name: "Sci-fi", accent: "#35D0FF", blurb: "Cyan signals on deep navy" },
  { key: "romance", name: "Romance", accent: "#FF8FAB", blurb: "Soft rose and wine" },
  { key: "fantasy", name: "Fantasy", accent: "#D9B45A", blurb: "Old gold on forest green" },
  { key: "hero", name: "Hero", accent: "#FFD23F", blurb: "Comic-book yellow on midnight blue" },
] as const;

export type LookKey = (typeof LOOKS)[number]["key"];

const MMDD = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

// Easter Sunday (Gregorian, "anonymous" algorithm). Month is 1-based.
export function easterSunday(year: number): { month: number; day: number } {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}
const mmdd = (d: Date) => `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function easterRange(year: number): [string, string] {
  const { month, day } = easterSunday(year);
  const sun = new Date(year, month - 1, day);
  return [mmdd(new Date(year, month - 1, day - 2)), mmdd(new Date(sun.getFullYear(), sun.getMonth(), sun.getDate() + 1))];
}
const cleanLabel = (v: unknown) => (typeof v === "string" ? v.replace(/[<>"'`]/g, "").trim().slice(0, 40) : "");

// Keep only well-formed entries for known season keys (admin input is untrusted).
export function sanitizeSeasons(input: unknown): Season[] {
  const byKey = new Map(DEFAULT_SEASONS.map((s) => [s.key, s]));
  const out: Season[] = [];
  if (Array.isArray(input)) {
    for (const raw of input) {
      const r = raw as Partial<Season>;
      const base = r && typeof r.key === "string" ? byKey.get(r.key) : undefined;
      if (!base) continue;
      out.push({
        ...base,
        start: typeof r.start === "string" && MMDD.test(r.start) ? r.start : base.start,
        end: typeof r.end === "string" && MMDD.test(r.end) ? r.end : base.end,
        enabled: typeof r.enabled === "boolean" ? r.enabled : base.enabled,
        ...(base.key === "collab" ? { label: cleanLabel(r.label) } : {}),
        ...(base.key === "easter" ? { start: "easter", end: "easter" } : {}),
      });
      byKey.delete(base.key);
    }
  }
  return [...out, ...byKey.values()];
}

// Which season (if any) covers this date. Handles ranges that wrap past New Year.
export function seasonFor(seasons: Season[], date: Date): string | null {
  const md = mmdd(date);
  for (const s of seasons) {
    if (!s.enabled) continue;
    const [a, b] = s.key === "easter" ? easterRange(date.getFullYear()) : [s.start, s.end];
    const inRange = a <= b ? md >= a && md <= b : md >= a || md <= b;
    if (inRange) return s.key;
  }
  return null;
}

// Tiny inline script (runs before paint) that applies look + season.
// Mirrors seasonFor() in plain ES5 so it can run before React loads.
export function themeBootScript(seasons: Season[]): string {
  const y = new Date().getFullYear();
  // Easter dates for this year and next, so a page cached over New Year still works.
  const E: Record<number, [string, string]> = { [y]: easterRange(y), [y + 1]: easterRange(y + 1) };
  const compact = seasons.filter((s) => s.enabled).map((s) => [s.key, s.start, s.end]);
  const label = seasons.find((s) => s.key === "collab" && s.enabled)?.label || "";
  return `try{var r=document.documentElement;var l=localStorage.getItem('libry-look');if(l)r.setAttribute('data-look',l);if(localStorage.getItem('libry-seasonal')!=='off'){var d=new Date();var m=('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);var E=${JSON.stringify(E)}[d.getFullYear()];var S=${JSON.stringify(compact)};for(var i=0;i<S.length;i++){var a=S[i][1],b=S[i][2];if(S[i][0]==='easter'){if(!E)continue;a=E[0];b=E[1];}if(a<=b?(m>=a&&m<=b):(m>=a||m<=b)){r.setAttribute('data-season',S[i][0]);if(S[i][0]==='collab')r.setAttribute('data-season-label',${JSON.stringify(label)});break;}}}}catch(e){}`;
}
