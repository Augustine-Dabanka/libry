import * as Sentry from "@sentry/nextjs";

// Edge runtime (proxy / edge routes). Inert until SENTRY_DSN is set.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  enableLogs: true,
});
