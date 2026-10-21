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
  // The person or company legally responsible for Lybry. Until a company exists
  // this is the parent/guardian who runs it: set NEXT_PUBLIC_LEGAL_ENTITY to
  // their full legal name in Vercel. "Lybry" is only a stand-in.
  entity: env(process.env.NEXT_PUBLIC_LEGAL_ENTITY, "Lybry"),
  // Full postal address. Optional: when empty, only the country is shown.
  address: env(process.env.NEXT_PUBLIC_LEGAL_ADDRESS, ""),
  // Left blank on purpose until the operator's state is settled (set e.g. "United States").
  country: env(process.env.NEXT_PUBLIC_LEGAL_COUNTRY, ""),
  effectiveDate: env(process.env.NEXT_PUBLIC_LEGAL_EFFECTIVE_DATE, "20 October 2026"),
  // One inbox is enough. Leave empty and every "contact us" points at /contact.
  contactEmail: env(process.env.NEXT_PUBLIC_CONTACT_EMAIL, ""),
  // Generic until a US state is chosen; then set e.g. "the State of Texas, USA" / "the state and federal courts in Travis County, Texas".
  jurisdiction: env(process.env.NEXT_PUBLIC_GOVERNING_JURISDICTION, "the state and country where Lybry's operator lives"),
  venue: env(process.env.NEXT_PUBLIC_LEGAL_VENUE, "the state and country where Lybry's operator lives"),
  liabilityPeriod: env(process.env.NEXT_PUBLIC_LIABILITY_PERIOD, "12 months"),
  appealWindow: env(process.env.NEXT_PUBLIC_APPEAL_WINDOW, "30 days"),
  refundWindow: env(process.env.NEXT_PUBLIC_REFUND_WINDOW, "14 days"),
  responseTime: env(process.env.NEXT_PUBLIC_SUPPORT_RESPONSE_TIME, "5 business days"),
  minimumAge: env(process.env.NEXT_PUBLIC_MINIMUM_AGE, "13"),
  // Facts from the codebase:
  host: "Supabase",
  web: "Vercel",
  mail: "Resend",
  payments: "Paystack and Stripe",
  monitoring: "Sentry",
};

// "Jane Doe, 1 Main St, Austin, TX", "Jane Doe (United States)" or just "Jane Doe"
export const operatorLine = () =>
  LEGAL.address ? `${LEGAL.entity}, ${LEGAL.address}` : LEGAL.country ? `${LEGAL.entity} (${LEGAL.country})` : LEGAL.entity;
