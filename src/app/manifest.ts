import type { MetadataRoute } from "next";

// Web app manifest — makes Libry installable as a standalone app on Android,
// iOS (Add to Home Screen), and desktop, with no native build. This is the
// non-breaking first surface of the cross-platform plan: the same SSR app,
// wrapped as an installable PWA. A native Capacitor/Electron shell can later
// point at the same hosted URL.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Libry — Stories worth lingering in",
    short_name: "Libry",
    description: "Interactive stories, comics, books and communities. Creators keep 65%.",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0c0a09",
    theme_color: "#0c0a09",
    categories: ["books", "entertainment", "social"],
    icons: [
      { src: "/icon.jpg", sizes: "192x192", type: "image/jpeg", purpose: "any" },
      { src: "/icon.jpg", sizes: "512x512", type: "image/jpeg", purpose: "any" },
    ],
  };
}
