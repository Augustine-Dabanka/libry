import { socials, type Social } from "@/lib/brand";

// Social icons for the footers and link page. Renders nothing until
// NEXT_PUBLIC_SOCIAL_HANDLE is set, so no dead or someone-else's links ship.
const PATHS: Record<Social["label"], string> = {
  YouTube: "M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.8-1.8C19.3 5 12 5 12 5s-7.3 0-8.8.5A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.8 1.8C4.7 19 12 19 12 19s7.3 0 8.8-.5a2.5 2.5 0 0 0 1.8-1.8C23 15.2 23 12 23 12zM9.8 15.3V8.7l5.7 3.3z",
  X: "M18.2 2h3.3l-7.2 8.3L23 22h-6.6l-5.2-6.8L5.3 22H2l7.7-8.8L1.5 2h6.8l4.7 6.2zm-1.2 18h1.8L7.1 3.9H5.2z",
  Instagram: "",
  TikTok: "M16 3c.3 2.1 1.6 3.7 3.7 4.1v2.7c-1.4 0-2.7-.4-3.7-1.1v5.9a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v2.8a2.8 2.8 0 1 0 2 2.7V3z",
};

export function SocialIcon({ label, size }: { label: Social["label"]; size?: number }) {
  if (label === "Instagram") {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d={PATHS[label]} />
    </svg>
  );
}

export default function SocialIcons({ className }: { className?: string }) {
  const list = socials();
  if (!list.length) return null;
  return (
    <div className={className}>
      {list.map((s) => (
        <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
          <SocialIcon label={s.label} />
        </a>
      ))}
    </div>
  );
}
