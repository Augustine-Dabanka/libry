import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Baseline security headers on every response. (No strict Content-Security-
// Policy yet: Paystack, Sentry and the inline theme script would need an
// allowlist first. frame-ancestors still blocks clickjacking.)
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self \"https://checkout.paystack.com\")" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

// Source-map upload + org/project/authToken are read from SENTRY_ORG,
// SENTRY_PROJECT and SENTRY_AUTH_TOKEN env vars when present.
export default withSentryConfig(nextConfig, {
  widenClientFileUpload: true,
  // Proxy Sentry requests through the app to dodge ad-blockers.
  tunnelRoute: "/monitoring",
  silent: !process.env.CI,
});
