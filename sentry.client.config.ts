// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

// Guard: only init when a DSN is present
const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (DSN) {
  Sentry.init({
    dsn: DSN,

    // Tune via env if you like; these defaults are safe
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES ?? "0.1"),
    replaysOnErrorSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR ?? "1"),

    // Keep integrations default; add more if needed
    integrations: (integrations) => integrations,

    // Turn off in non-prod unless you explicitly enable it
    enabled:
      process.env.NODE_ENV === "production" ||
      process.env.NEXT_PUBLIC_SENTRY_ENABLE_DEV === "1",

    // Helpful release tagging (optional)
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    environment:
      process.env.NEXT_PUBLIC_SENTRY_ENV ??
      process.env.NODE_ENV ??
      "development",
  });
}
