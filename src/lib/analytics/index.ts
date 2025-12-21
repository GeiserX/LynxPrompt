// Server-side analytics (ClickHouse)
export {
  initializeClickHouse,
  trackEvent,
  getTrendingTemplates,
  getPopularSearches,
  getPlatformStats,
  getWizardFunnel,
  isAnalyticsEnabled,
  type AnalyticsEvent,
  type AnalyticsEventType,
} from "./clickhouse";

// Client-side analytics
export {
  trackPageView,
  trackTemplateView,
  trackTemplateDownload,
  trackTemplateFavorite,
  trackSearch,
  trackWizardStep,
  trackWizardComplete,
  trackWizardAbandon,
  trackFeatureUse,
  trackError,
  usePageTracking,
  useTemplateTracking,
  useWizardTracking,
  setupErrorTracking,
} from "./client";
