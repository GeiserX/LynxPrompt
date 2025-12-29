"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const COOKIE_CONSENT_KEY = "lynxprompt-cookie-notice-dismissed";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the banner
    const dismissed = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!dismissed) {
      // Small delay for better UX - let the page load first
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      localStorage.setItem(COOKIE_CONSENT_KEY, "true");
      setIsVisible(false);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 max-w-sm rounded-lg border bg-card p-4 shadow-lg transition-all duration-300 ${
        isAnimatingOut
          ? "translate-y-4 opacity-0"
          : "translate-y-0 opacity-100 animate-in slide-in-from-bottom-4"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Cookie className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">
              Cookie Notice
            </h3>
            <button
              onClick={handleDismiss}
              className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            We use essential cookies for authentication and security (including
            Cloudflare Turnstile for bot protection). No tracking or advertising
            cookies.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" onClick={handleDismiss} className="h-7 text-xs">
              Got it
            </Button>
            <Link
              href="/cookies"
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Learn more
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}






