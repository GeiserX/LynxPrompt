"use client";

import { useEffect } from "react";
import { usePageTracking, setupErrorTracking } from "@/lib/analytics/client";

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  // Track page views on route changes
  usePageTracking();

  // Set up error tracking on mount
  useEffect(() => {
    setupErrorTracking();
  }, []);

  return <>{children}</>;
}
