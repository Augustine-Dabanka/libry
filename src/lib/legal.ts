// One place for the details shown in Terms, Privacy, Cookies and Refunds.
// Every value has a real, launch-safe default, so nothing ever renders as a
// bracketed placeholder. Override any of them in Vercel env vars
// (NEXT_PUBLIC_LEGAL_*) when you register the business or change a policy.
// Defaults set 10 Oct 2026. They are policy decisions, not filler: read them.
import { BRAND } from "@/lib/brand";

// Literal process.env.NEXT_PUBLIC_* reads (not process.env[k]) so Next can
// inline them into client components like the footer, too.
const env = (v: string | undefined, fallback: string) => (v && v.trim()) || fallback;

export const LEGAL = {
  brand: BRAND.name,
  entity: env(process.env.NEXT_PUBLIC_LEGAL_ENTITY, "Craft & Anchor"),
  // Full postal address. Optional: when empty, only the country is shown.
  address: env(process.env.NEXT_PUBLIC_LEGAL_ADDRESS, ""),
  country: env(process.env.NEXT_PUBLIC_LEGAL_COUNTRY, "Ghana"),
  effectiveDate: env(process.env.NEXT_PUBLIC_LEGAL_EFFECTIVE_DATE, "10 October 2026"),
  // One inbox is enough. Leave empty and every "contact us" points at /contact.
  contactEmail: env(process.env.NEXT_PUBLIC_CONTACT_EMAIL, ""),
  jurisdiction: env(process.env.NEXT_PUBLIC_GOVERNING_JURISDICTION, "the Republic of Ghana"),
  venue: env(process.env.NEXT_PUBLIC_LEGAL_VENUE, "the courts of Ghana"),
  liabilityPeriod: env(process.env.NEXT_PUBLIC_LIABILITY_PERIOD, "12 months"),
  appealWindow: env(process.env.NEXT_PUBLIC_APPEAL_WINDOW, "30 days"),
  refundWindow: env(process.env.NEXT_PUBLIC_REFUND_WINDOW, "14 days"),
  responseTime: env(process.env.NEXT_PUBLIC_SUPPORT_RESPONSE_TIME, "5 business days"),
  minimumAge: env(process.env.NEXT_PUBLIC_MINIMUM_AGE, "13"),
  // Facts from the codebase:
  host: "Supabase",
  web: "Vercel",
  mail: "Resend",
  payments: "Paystack",
  monitoring: "Sentry",
};

// "Craft & Anchor, Accra, Ghana" or "Craft & Anchor (Ghana)"
export const operatorLine = () =>
  LEGAL.address ? `${LEGAL.entity}, ${LEGAL.address}` : `${LEGAL.entity} (${LEGAL.country})`;
