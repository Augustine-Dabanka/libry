import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://libry-sigma.vercel.app";

// Public sitemap: static marketing pages + every published book's shareable
// page + author pages, all derived from real data (spec §40). Private app
// routes are excluded here and in robots.ts.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = ["", "/unlimited", "/terms", "/privacy", "/cookies", "/refunds", "/ad"];
  const entries: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: `${BASE}${p}`,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.5,
  }));

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("books")
      .select("id, author, updated_at")
      .eq("is_published", true)
      .order("id", { ascending: false })
      .limit(2000);
    const authors = new Set<string>();
    for (const b of (data ?? []) as { id: number; author: string | null; updated_at: string | null }[]) {
      entries.push({
        url: `${BASE}/book/${b.id}`,
        lastModified: b.updated_at ? new Date(b.updated_at) : undefined,
        changeFrequency: "weekly",
        priority: 0.7,
      });
      if (b.author) authors.add(b.author);
    }
    for (const a of authors) {
      entries.push({ url: `${BASE}/author/${encodeURIComponent(a)}`, changeFrequency: "weekly", priority: 0.6 });
    }
  } catch {
    // If the DB is unreachable at build/request time, still return static routes.
  }

  return entries;
}
