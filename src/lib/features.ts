import { createClient } from "@/lib/supabase/server";

// Launch switches live in site_settings (key 'features', a jsonb object).
// Read on the server. A missing row, missing key or blocked read returns the
// fallback, so a switch is safe before its migration has run.
export async function getFeatures(): Promise<Record<string, unknown>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("site_settings").select("value").eq("key", "features").maybeSingle();
    if (error || !data) return {};
    const v = (data as { value?: unknown }).value;
    return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function featureOn(name: string, fallback = false): Promise<boolean> {
  const f = await getFeatures();
  const v = f[name];
  return typeof v === "boolean" ? v : fallback;
}

// Digital products (courses, files, links) are hidden while Lybry focuses on
// reading. People who already bought one keep access in My Library.
export async function productsOn(): Promise<boolean> {
  return featureOn("products", false);
}
