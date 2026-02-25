import * as Sentry from "@sentry/nextjs";

if (process.env.SENTRY_DSN && process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    enabled: true,
    tracesSampleRate: 0.1,
    debug: false,
  });
}
