"use client";

import { useEffect } from "react";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { installPasskeyRedirect } from "@/lib/passkey-redirect";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  // A write refused for a missing passkey goes to the passkey step, on every page
  useEffect(() => installPasskeyRedirect(), []);
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
