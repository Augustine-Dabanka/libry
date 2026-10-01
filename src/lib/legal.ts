// One place for the legal details shown in Terms, Privacy, Cookies and Refunds.
// Fill these in Vercel env vars (NEXT_PUBLIC_LEGAL_*) once confirmed with counsel.
// Anything not set shows as a visible [BRACKETED] placeholder, and
// `npm run check:launch` fails until they are all set.
const env = (k: string, fallback: string) => (process.env[k] && String(process.env[k]).trim()) || fallback;

export const LEGAL = {
  entity: env("NEXT_PUBLIC_LEGAL_ENTITY", "[CRAFT & ANCHOR — REGISTERED LEGAL NAME]"),
  address: env("NEXT_PUBLIC_LEGAL_ADDRESS", "[REGISTERED ADDRESS]"),
  effectiveDate: env("NEXT_PUBLIC_LEGAL_EFFECTIVE_DATE", "[EFFECTIVE DATE]"),
  contactEmail: env("NEXT_PUBLIC_CONTACT_EMAIL", "[CONTACT EMAIL]"),
  supportEmail: env("NEXT_PUBLIC_SUPPORT_EMAIL", "[SUPPORT EMAIL]"),
  privacyEmail: env("NEXT_PUBLIC_PRIVACY_EMAIL", "[PRIVACY EMAIL]"),
  safetyEmail: env("NEXT_PUBLIC_TRUST_SAFETY_EMAIL", "[TRUST & SAFETY EMAIL]"),
  jurisdiction: env("NEXT_PUBLIC_GOVERNING_JURISDICTION", "[GOVERNING JURISDICTION]"),
  venue: env("NEXT_PUBLIC_LEGAL_VENUE", "[VENUE]"),
  liabilityPeriod: env("NEXT_PUBLIC_LIABILITY_PERIOD", "[LIABILITY PERIOD]"),
  appealWindow: env("NEXT_PUBLIC_APPEAL_WINDOW", "[APPEAL WINDOW]"),
  payoutTerms: env("NEXT_PUBLIC_PAYOUT_TERMS", "[MINIMUM PAYOUT / SCHEDULE]"),
  refundWindow: env("NEXT_PUBLIC_REFUND_WINDOW", "[REQUEST WINDOW]"),
  responseTime: env("NEXT_PUBLIC_SUPPORT_RESPONSE_TIME", "[RESPONSE TIME]"),
  subscriptionTerms: env("NEXT_PUBLIC_SUBSCRIPTION_TERMS", "[CONFIRM SUBSCRIPTION TERMS]"),
  minimumAge: env("NEXT_PUBLIC_MINIMUM_AGE", "[MINIMUM AGE]"),
  // Facts from the codebase, no need to confirm:
  host: "Supabase",
  web: "Vercel",
  mail: "Resend",
  payments: "Paystack",
  monitoring: "Sentry",
};
