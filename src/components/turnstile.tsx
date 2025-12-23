"use client";

import { Turnstile as TurnstileWidget } from "@marsidev/react-turnstile";
import { useTheme } from "next-themes";

interface TurnstileProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  className?: string;
}

export function Turnstile({ onSuccess, onError, onExpire, className }: TurnstileProps) {
  const { resolvedTheme } = useTheme();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // Don't render if site key is not configured
  if (!siteKey) {
    console.warn("Turnstile site key not configured");
    // Auto-succeed in development without key
    if (process.env.NODE_ENV === "development") {
      onSuccess("dev-bypass-token");
    }
    return null;
  }

  return (
    <div className={className}>
      <TurnstileWidget
        siteKey={siteKey}
        onSuccess={onSuccess}
        onError={onError}
        onExpire={onExpire}
        options={{
          theme: resolvedTheme === "dark" ? "dark" : "light",
          size: "normal",
        }}
      />
    </div>
  );
}
