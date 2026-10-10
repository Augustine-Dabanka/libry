import type { MetadataRoute } from "next";

import { BRAND } from "@/lib/brand";
const BASE = BRAND.siteUrl;

// Index the public/shareable surfaces; keep the authenticated app and API out of
// search results (spec §40 — protect private/subscriber content).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/home", "/discover", "/catalog", "/my-library", "/settings", "/creator", "/communities", "/reader", "/admin", "/api", "/cart", "/onboarding"],
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
