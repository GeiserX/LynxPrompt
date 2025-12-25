// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // GlitchTip DSN - configured via environment variable
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Performance Monitoring - adjust based on traffic
  tracesSampleRate: 0.1, // 10% of transactions

  // Session Replay - disabled for privacy
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Filter out sensitive data from error reports
  beforeSend(event) {
    // Remove potentially sensitive query parameters
    if (event.request?.query_string) {
      const sensitiveParams = ["token", "key", "secret", "password", "code"];
      const params = new URLSearchParams(event.request.query_string);
      sensitiveParams.forEach((param) => params.delete(param));
      event.request.query_string = params.toString();
    }

    // Remove cookies from error reports
    if (event.request?.cookies) {
      delete event.request.cookies;
    }

    return event;
  },
});

