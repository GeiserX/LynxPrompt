"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
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
  const [retryCount, setRetryCount] = useState(0);
  const [widgetRendered, setWidgetRendered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const hasSucceeded = useRef(false);
  const renderAttempts = useRef(0);

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
  }, []); // Remove onSuccess from deps to prevent re-fetching

  // Render widget when script is loaded and we have a site key
  const renderWidget = useCallback(() => {
    if (!window.turnstile || !containerRef.current || !siteKey || widgetIdRef.current) {
      return false;
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
      setWidgetRendered(true);
      return true;
    } catch (err) {
      console.error("Turnstile render error:", err);
      setStatus("error");
      onError?.();
      return false;
    }
  }, [siteKey, resolvedTheme, onSuccess, onError, onExpire]);

  // Render when script loads - with retry logic
  useEffect(() => {
    if (scriptLoaded && siteKey && status === "ready" && !widgetIdRef.current) {
      // Try to render immediately
      const success = renderWidget();
      
      // If failed, retry with increasing delays
      if (!success && renderAttempts.current < 5) {
        renderAttempts.current++;
        const retryDelay = Math.min(500 * renderAttempts.current, 2000);
        const timer = setTimeout(() => {
          if (!widgetIdRef.current && window.turnstile) {
            renderWidget();
          }
        }, retryDelay);
        return () => clearTimeout(timer);
      }
    }
  }, [scriptLoaded, siteKey, status, renderWidget, retryCount]);

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

  // Retry handler
  const handleRetry = () => {
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        // Ignore
      }
      widgetIdRef.current = null;
    }
    renderAttempts.current = 0;
    hasSucceeded.current = false;
    setWidgetRendered(false);
    setRetryCount(c => c + 1);
    setStatus("ready");
  };

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

  // Error state with retry button
  if (status === "error") {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-4 w-4" />
          <span>Verification issue</span>
          <button
            type="button"
            onClick={handleRetry}
            className="ml-2 inline-flex items-center gap-1 text-xs underline hover:no-underline"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
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
        onLoad={() => {
          setScriptLoaded(true);
          // Also check if turnstile is already available (script may have been cached)
          if (window.turnstile && siteKey && !widgetIdRef.current) {
            setTimeout(() => renderWidget(), 100);
          }
        }}
        onError={(err) => {
          console.error("Turnstile: Script failed to load", err);
          setStatus("error");
          onError?.();
        }}
      />
      <div ref={containerRef} className="min-h-[65px]">
        {/* Show loading while waiting for widget to render */}
        {status === "ready" && !widgetRendered && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading captcha...</span>
          </div>
        )}
      </div>
    </div>
  );
}
