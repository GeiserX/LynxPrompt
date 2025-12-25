"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// GlitchTip DSN - hardcoded for client-side (NEXT_PUBLIC_* vars are build-time only)
const SENTRY_DSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  "https://84ae8dcc6c4b4028ade54aea25172088@glitchtip.lynxprompt.com/1";

let initialized = false;

export function SentryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (initialized) return;
    initialized = true;

    Sentry.init({
      dsn: SENTRY_DSN,

      // Performance Monitoring - 10% of transactions
      tracesSampleRate: 0.1,

      // Debug mode - set to true to troubleshoot
      debug: false,

      // Filter out sensitive data
      beforeSend(event) {
        // Remove potentially sensitive query parameters
        if (event.request?.query_string) {
          const sensitiveParams = [
            "token",
            "key",
            "secret",
            "password",
            "code",
          ];
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

    console.log("[GlitchTip] Sentry initialized");
  }, []);

  return <>{children}</>;
}

