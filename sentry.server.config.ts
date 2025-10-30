// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

// Accept either server DSN or the public DSN (Netlify/Vercel convenience)
const DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (DSN) {
  Sentry.init({
    dsn: DSN,

    tracesSampleRate: Number(process.env.SENTRY_TRACES ?? "0.1"),

    // Keep default integrations; customize here if needed
    integrations: (integrations) => integrations,

    enabled:
      process.env.NODE_ENV === "production" ||
      process.env.SENTRY_ENABLE_DEV === "1",

    release:
      process.env.SENTRY_RELEASE ||
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    environment:
      process.env.SENTRY_ENV ||
      process.env.NEXT_PUBLIC_SENTRY_ENV ||
      process.env.NODE_ENV ||
      "development",
  });
}
