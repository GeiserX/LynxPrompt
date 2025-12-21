"use client";

/**
 * Client-side Analytics for LynxPrompt
 *
 * Lightweight tracking that sends events to our ClickHouse backend.
 * All tracking respects user privacy - no PII is collected.
 */

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

// Generate a session ID (persisted for the browser session)
function getSessionId(): string {
  if (typeof window === "undefined") return "";

  let sessionId = sessionStorage.getItem("lynx_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("lynx_session_id", sessionId);
  }
  return sessionId;
}

// Check if tracking should be enabled
function isTrackingEnabled(): boolean {
  if (typeof window === "undefined") return false;

  // Respect Do Not Track
  if (navigator.doNotTrack === "1") return false;

  // Only track in production
  if (process.env.NODE_ENV !== "production") return false;

  return true;
}

/**
 * Send an analytics event to the server
 */
async function sendEvent(
  eventType: string,
  data: Record<string, unknown> = {}
): Promise<void> {
  if (!isTrackingEnabled()) return;

  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: eventType,
        session_id: getSessionId(),
        page_path: window.location.pathname,
        referrer: document.referrer || undefined,
        ...data,
      }),
      // Use keepalive to ensure events are sent even on page unload
      keepalive: true,
    });
  } catch {
    // Silently fail - analytics should never break the app
  }
}

// =============================================================================
// TRACKING FUNCTIONS - Use these throughout the app
// =============================================================================

/**
 * Track a page view
 */
export function trackPageView(path?: string): void {
  sendEvent("page_view", { page_path: path || window.location.pathname });
}

/**
 * Track template view
 */
export function trackTemplateView(
  templateId: string,
  templateName?: string,
  category?: string
): void {
  sendEvent("template_view", {
    template_id: templateId,
    template_name: templateName,
    template_category: category,
  });
}

/**
 * Track template download
 */
export function trackTemplateDownload(
  templateId: string,
  platform: string,
  templateName?: string
): void {
  sendEvent("template_download", {
    template_id: templateId,
    platform,
    template_name: templateName,
  });
}

/**
 * Track template favorite/unfavorite
 */
export function trackTemplateFavorite(
  templateId: string,
  isFavorited: boolean
): void {
  sendEvent("template_favorite", {
    template_id: templateId,
    properties: { favorited: isFavorited },
  });
}

/**
 * Track search query
 */
export function trackSearch(query: string, resultsCount: number): void {
  sendEvent("template_search", {
    search_query: query,
    search_results_count: resultsCount,
  });
}

/**
 * Track wizard step progression
 */
export function trackWizardStep(stepId: string, stepNumber: number): void {
  sendEvent("wizard_step", {
    wizard_step: stepId,
    wizard_step_number: stepNumber,
  });
}

/**
 * Track wizard completion
 */
export function trackWizardComplete(platforms: string[]): void {
  sendEvent("wizard_complete", {
    properties: { platforms: platforms.join(",") },
  });
}

/**
 * Track wizard abandonment
 */
export function trackWizardAbandon(lastStep: string, stepNumber: number): void {
  sendEvent("wizard_abandon", {
    wizard_step: lastStep,
    wizard_step_number: stepNumber,
  });
}

/**
 * Track feature usage
 */
export function trackFeatureUse(featureName: string): void {
  sendEvent("feature_use", { feature_name: featureName });
}

/**
 * Track client-side error
 */
export function trackError(message: string, stack?: string): void {
  sendEvent("error", {
    error_message: message,
    error_stack: stack?.slice(0, 500),
  });
}

// =============================================================================
// REACT HOOKS
// =============================================================================

/**
 * Hook to automatically track page views on route changes
 */
export function usePageTracking(): void {
  const pathname = usePathname();
  const lastPathRef = useRef<string>("");

  useEffect(() => {
    // Only track if the path actually changed
    if (pathname && pathname !== lastPathRef.current) {
      lastPathRef.current = pathname;
      trackPageView(pathname);
    }
  }, [pathname]);
}

/**
 * Hook for tracking template views (with deduplication)
 */
export function useTemplateTracking(
  templateId: string,
  templateName?: string,
  category?: string
): void {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!trackedRef.current && templateId) {
      trackedRef.current = true;
      trackTemplateView(templateId, templateName, category);
    }
  }, [templateId, templateName, category]);
}

/**
 * Hook for wizard step tracking
 */
export function useWizardTracking(): {
  trackStep: (stepId: string, stepNumber: number) => void;
  trackComplete: (platforms: string[]) => void;
  trackAbandon: () => void;
} {
  const lastStepRef = useRef<{ id: string; number: number } | null>(null);

  const trackStep = useCallback((stepId: string, stepNumber: number) => {
    lastStepRef.current = { id: stepId, number: stepNumber };
    trackWizardStep(stepId, stepNumber);
  }, []);

  const trackComplete = useCallback((platforms: string[]) => {
    trackWizardComplete(platforms);
  }, []);

  const trackAbandon = useCallback(() => {
    if (lastStepRef.current) {
      trackWizardAbandon(lastStepRef.current.id, lastStepRef.current.number);
    }
  }, []);

  // Track abandonment on unmount
  useEffect(() => {
    return () => {
      // Only track abandon if wizard wasn't completed
      // (This is called on any unmount, so the calling component should
      // set a flag when complete to prevent false positives)
    };
  }, []);

  return { trackStep, trackComplete, trackAbandon };
}

// =============================================================================
// ERROR BOUNDARY HELPER
// =============================================================================

/**
 * Set up global error tracking
 */
export function setupErrorTracking(): void {
  if (typeof window === "undefined") return;

  // Track unhandled errors
  window.addEventListener("error", (event) => {
    trackError(event.message, event.error?.stack);
  });

  // Track unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    trackError(
      event.reason?.message || "Unhandled promise rejection",
      event.reason?.stack
    );
  });
}

