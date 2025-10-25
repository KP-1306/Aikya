import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
  tracesSampleRate: 0.1,      // adjust later
  replaysSessionSampleRate: 0, // set >0 if you enable @sentry/replay
});
