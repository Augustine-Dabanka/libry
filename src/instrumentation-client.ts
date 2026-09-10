import * as Sentry from "@sentry/nextjs";

// Browser / client runtime. Inert until NEXT_PUBLIC_SENTRY_DSN is set — create a
// project at sentry.io and paste the DSN into your env (and Vercel).
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 100% traces in dev, 10% in production.
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Session Replay: 10% of all sessions, 100% of sessions with an error.
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  enableLogs: true,

  integrations: [Sentry.replayIntegration()],
});

// Instrument App Router navigations.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
