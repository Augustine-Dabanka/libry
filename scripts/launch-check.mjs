// Pre-launch checklist: `npm run check:launch`
// Fails if required env vars are missing or any [PLACEHOLDER] text is still on a page.
import fs from "fs";
import path from "path";

const required = [
  "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_EMAILS",
  "NEXT_PUBLIC_LEGAL_ENTITY", "NEXT_PUBLIC_LEGAL_ADDRESS", "NEXT_PUBLIC_LEGAL_EFFECTIVE_DATE",
  "NEXT_PUBLIC_CONTACT_EMAIL", "NEXT_PUBLIC_SUPPORT_EMAIL", "NEXT_PUBLIC_PRIVACY_EMAIL",
  "NEXT_PUBLIC_TRUST_SAFETY_EMAIL", "NEXT_PUBLIC_GOVERNING_JURISDICTION", "NEXT_PUBLIC_LEGAL_VENUE",
  "NEXT_PUBLIC_LIABILITY_PERIOD", "NEXT_PUBLIC_APPEAL_WINDOW", "NEXT_PUBLIC_PAYOUT_TERMS",
  "NEXT_PUBLIC_REFUND_WINDOW", "NEXT_PUBLIC_SUPPORT_RESPONSE_TIME", "NEXT_PUBLIC_SUBSCRIPTION_TERMS",
  "NEXT_PUBLIC_MINIMUM_AGE",
];
const payments = ["PAYSTACK_SECRET_KEY", "NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY", "NEXT_PUBLIC_PAYSTACK_ENABLED", "NEXT_PUBLIC_PAYSTACK_CURRENCY"];
const problems = [];

for (const k of required) if (!process.env[k]) problems.push(`missing env: ${k}`);
for (const k of payments) if (!process.env[k]) console.warn(`(payments off) env not set: ${k}`);
if (process.env.ADMIN_PASSCODE) problems.push("remove ADMIN_PASSCODE (no longer used)");
for (const k of Object.keys(process.env)) {
  if (k.startsWith("NEXT_PUBLIC_") && /SECRET|SERVICE_ROLE|PRIVATE/i.test(k)) problems.push(`secret exposed to browsers: ${k}`);
}

const placeholder = /\[[A-Z][A-Z0-9 &;—,/'().:-]{3,}\]/g;
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx|ts)$/.test(e.name) && !p.endsWith(path.join("lib", "legal.ts"))) {
      const hits = (fs.readFileSync(p, "utf8").match(placeholder) || []).filter((h) => !/A-Z|0-9/.test(h)); // skip regex classes like [A-Z0-9-]
      if (hits.length) problems.push(`placeholder text in ${p}: ${[...new Set(hits)].join(", ")}`);
    }
  }
}
walk("src");

if (problems.length) {
  console.error(`\nNot ready to launch (${problems.length}):\n - ` + problems.join("\n - "));
  process.exit(1);
}
console.log("Launch check passed.");
