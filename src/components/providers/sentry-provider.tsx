"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

let initialized = false;

export function SentryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (initialized || !SENTRY_DSN) return;
    initialized = true;

    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: 0.1,
      debug: false,

      beforeSend(event) {
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

        if (event.request?.cookies) {
          delete event.request.cookies;
        }

        return event;
      },
    });
  }, []);

  return <>{children}</>;
}
