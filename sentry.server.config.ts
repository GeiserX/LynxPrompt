import * as Sentry from "@sentry/nextjs";

if (process.env.SENTRY_DSN && process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    enabled: true,
    tracesSampleRate: 0.1,
    debug: false,

    beforeSend(event) {
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
}
