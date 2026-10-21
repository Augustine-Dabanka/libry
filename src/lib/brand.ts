// One place for the brand name, site URL, contact address and social handles.
// Nothing here is a placeholder: anything that isn't configured is simply
// hidden (no social icons, contact goes through /contact), so the site never
// shows made-up details.
const env = (v: string | undefined) => (v && v.trim()) || "";

export const BRAND = {
  name: "Lybry",
  tagline: "Stories worth lingering in",
  siteUrl: (env(process.env.NEXT_PUBLIC_SITE_URL) || "https://libry-sigma.vercel.app").replace(/\/+$/, ""),
  // Public inbox (e.g. hello@yourdomain). Empty = use the /contact form.
  contactEmail: env(process.env.NEXT_PUBLIC_CONTACT_EMAIL),
  // One handle used across every network, without the @. Empty = no socials shown.
  socialHandle: env(process.env.NEXT_PUBLIC_SOCIAL_HANDLE).replace(/^@/, ""),
};

export type Social = { label: "YouTube" | "X" | "Instagram" | "TikTok"; href: string };

export function socials(): Social[] {
  const h = BRAND.socialHandle;
  if (!h) return [];
  const on = (k: string) => {
    const list = env(process.env.NEXT_PUBLIC_SOCIAL_NETWORKS) || "instagram,tiktok,x,youtube";
    return list.toLowerCase().split(",").map((s) => s.trim()).includes(k);
  };
  const out: Social[] = [];
  if (on("youtube")) out.push({ label: "YouTube", href: `https://www.youtube.com/@${h}` });
  if (on("x")) out.push({ label: "X", href: `https://x.com/${h}` });
  if (on("instagram")) out.push({ label: "Instagram", href: `https://www.instagram.com/${h}` });
  if (on("tiktok")) out.push({ label: "TikTok", href: `https://www.tiktok.com/@${h}` });
  return out;
}

// "email us at x" when an inbox is configured, otherwise the contact page.
export const contactHref = () => (BRAND.contactEmail ? `mailto:${BRAND.contactEmail}` : "/contact");
export const contactLabel = () => BRAND.contactEmail || "our contact page";
