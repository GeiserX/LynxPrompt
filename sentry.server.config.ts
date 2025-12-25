// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
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

  // Filter out sensitive data from error reports
  beforeSend(event) {
    // Remove potentially sensitive headers
    if (event.request?.headers) {
      const sensitiveHeaders = [
        "authorization",
        "cookie",
        "x-api-key",
        "x-auth-token",
      ];
      sensitiveHeaders.forEach((header) => {
        if (event.request?.headers?.[header]) {
          event.request.headers[header] = "[Filtered]";
        }
      });
    }

    // Remove potentially sensitive data from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
        if (
          breadcrumb.data &&
          typeof breadcrumb.data === "object" &&
          "password" in breadcrumb.data
        ) {
          breadcrumb.data.password = "[Filtered]";
        }
        return breadcrumb;
      });
    }

    return event;
  },
});

