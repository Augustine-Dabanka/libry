import { DEFAULT_SEASONS, sanitizeSeasons, type Season } from "@/lib/themes";

// Seasonal schedule, editable in /admin. Read through Supabase's REST API with
// the public (anon) key and Next's fetch cache (5 minutes), so the root layout
// doesn't hit the database on every request. Saving in /admin revalidates it.
// Falls back to the built-in defaults if the table isn't migrated yet.
export async function getThemeSchedule(): Promise<Season[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return DEFAULT_SEASONS;
  try {
    const res = await fetch(`${url}/rest/v1/site_settings?key=eq.theme_schedule&select=value`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 300 },
    });
    if (!res.ok) return DEFAULT_SEASONS;
    const rows = (await res.json()) as { value: unknown }[];
    return rows[0] ? sanitizeSeasons(rows[0].value) : DEFAULT_SEASONS;
  } catch {
    return DEFAULT_SEASONS;
  }
}
