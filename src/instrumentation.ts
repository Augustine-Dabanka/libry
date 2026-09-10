import * as Sentry from "@sentry/nextjs";

// Server-side registration hook — loads the runtime-appropriate Sentry config.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Captures unhandled server-side request errors (requires @sentry/nextjs >= 8.28.0).
export const onRequestError = Sentry.captureRequestError;
