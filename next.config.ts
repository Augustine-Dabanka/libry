import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

// Source-map upload + org/project/authToken are read from SENTRY_ORG,
// SENTRY_PROJECT and SENTRY_AUTH_TOKEN env vars when present.
export default withSentryConfig(nextConfig, {
  widenClientFileUpload: true,
  // Proxy Sentry requests through the app to dodge ad-blockers.
  tunnelRoute: "/monitoring",
  silent: !process.env.CI,
});
