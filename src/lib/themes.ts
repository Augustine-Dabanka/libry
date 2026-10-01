// Libry theme system (shared by server and client; no "use client").
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
};

export const DEFAULT_SEASONS: Season[] = [
  { key: "valentines", name: "Valentine’s week", start: "02-10", end: "02-15", enabled: true, accent: "#FF6B8A" },
  { key: "independence", name: "Independence Day (Ghana)", start: "03-05", end: "03-07", enabled: true, accent: "#2F9E44" },
  { key: "halloween", name: "Halloween", start: "10-25", end: "11-01", enabled: true, accent: "#FF7A1A" },
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
      });
      byKey.delete(base.key);
    }
  }
  return [...out, ...byKey.values()];
}

// Which season (if any) covers this date. Handles ranges that wrap past New Year.
export function seasonFor(seasons: Season[], date: Date): string | null {
  const md = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  for (const s of seasons) {
    if (!s.enabled) continue;
    const inRange = s.start <= s.end ? md >= s.start && md <= s.end : md >= s.start || md <= s.end;
    if (inRange) return s.key;
  }
  return null;
}

// Tiny inline script (runs before paint) that applies look + season.
// Mirrors seasonFor() in plain ES5 so it can run before React loads.
export function themeBootScript(seasons: Season[]): string {
  const compact = seasons.filter((s) => s.enabled).map((s) => [s.key, s.start, s.end]);
  return `try{var r=document.documentElement;var l=localStorage.getItem('libry-look');if(l)r.setAttribute('data-look',l);if(localStorage.getItem('libry-seasonal')!=='off'){var d=new Date();var m=('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);var S=${JSON.stringify(compact)};for(var i=0;i<S.length;i++){var a=S[i][1],b=S[i][2];if(a<=b?(m>=a&&m<=b):(m>=a||m<=b)){r.setAttribute('data-season',S[i][0]);break;}}}}catch(e){}`;
}
