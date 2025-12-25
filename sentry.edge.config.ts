// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // GlitchTip DSN - configured via environment variable
  dsn: process.env.SENTRY_DSN,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Performance Monitoring - adjust based on traffic
  tracesSampleRate: 0.1, // 10% of transactions

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});

