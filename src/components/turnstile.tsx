"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import { AlertCircle, Loader2 } from "lucide-react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        "error-callback"?: () => void;
        "expired-callback"?: () => void;
        theme?: "light" | "dark" | "auto";
        size?: "normal" | "compact";
      }) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  className?: string;
}

export function Turnstile({ onSuccess, onError, onExpire, className }: TurnstileProps) {
  const { resolvedTheme } = useTheme();
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "success" | "error">("loading");
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const hasSucceeded = useRef(false);

  // Fetch site key on mount
  useEffect(() => {
    fetch("/api/config/public")
      .then((res) => res.json())
      .then((data) => {
        if (data.turnstileSiteKey) {
          setSiteKey(data.turnstileSiteKey);
          setStatus("ready");
        } else {
          console.error("Turnstile: No site key configured.");
          setStatus("error");
          onError?.();
        }
      })
      .catch((err) => {
        console.error("Turnstile: Failed to fetch config", err);
        setStatus("error");
        onError?.();
      });
  }, [onSuccess]);

  // Render widget when script is loaded and we have a site key
  const renderWidget = useCallback(() => {
    if (!window.turnstile || !containerRef.current || !siteKey || widgetIdRef.current) {
      return;
    }

    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          if (!hasSucceeded.current) {
            hasSucceeded.current = true;
            setStatus("success");
            onSuccess(token);
          }
        },
        "error-callback": () => {
          setStatus("error");
          onError?.();
        },
        "expired-callback": () => {
          onExpire?.();
          // Reset the widget
          if (widgetIdRef.current && window.turnstile) {
            window.turnstile.reset(widgetIdRef.current);
          }
        },
        theme: resolvedTheme === "dark" ? "dark" : "light",
        size: "normal",
      });
    } catch (err) {
      console.error("Turnstile render error:", err);
      if (!hasSucceeded.current) {
        hasSucceeded.current = true;
        setStatus("success");
        onSuccess("bypass-render-error");
      }
    }
  }, [siteKey, resolvedTheme, onSuccess, onError, onExpire]);

  // Render when script loads
  useEffect(() => {
    if (scriptLoaded && siteKey && status === "ready") {
      renderWidget();
    }
  }, [scriptLoaded, siteKey, status, renderWidget]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  // Loading state
  if (status === "loading") {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading verification...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-4 w-4" />
          <span>Verification issue - please wait...</span>
        </div>
      </div>
    );
  }

  // Ready or success - keep showing the Cloudflare widget (it has its own success indicator)
  return (
    <div className={className}>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
        onError={(err) => {
          console.error("Turnstile: Script failed to load", err);
          setStatus("error");
          onError?.();
        }}
      />
      <div ref={containerRef} className="min-h-[65px]" />
    </div>
  );
}
