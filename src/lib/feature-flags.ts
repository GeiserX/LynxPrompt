/**
 * Feature flags system for LynxPrompt self-hosting configuration.
 * All flags are controlled via environment variables with sensible defaults
 * for minimal self-hosted deployments.
 */

function envBool(key: string, defaultValue: boolean): boolean {
  const val = process.env[key];
  if (val === undefined || val === "") return defaultValue;
  return val === "true" || val === "1";
}

// Auth
export const ENABLE_GITHUB_OAUTH = envBool("ENABLE_GITHUB_OAUTH", false);
export const ENABLE_GOOGLE_OAUTH = envBool("ENABLE_GOOGLE_OAUTH", false);
export const ENABLE_EMAIL_AUTH = envBool("ENABLE_EMAIL_AUTH", true);
export const ENABLE_PASSKEYS = envBool("ENABLE_PASSKEYS", true);
export const ENABLE_TURNSTILE = envBool("ENABLE_TURNSTILE", false);
export const ENABLE_SSO = envBool("ENABLE_SSO", false);
export const ENABLE_USER_REGISTRATION = envBool("ENABLE_USER_REGISTRATION", true);

// AI
export const ENABLE_AI = envBool("ENABLE_AI", false);
export const AI_MODEL = process.env.AI_MODEL || "claude-3-5-haiku-latest";

// Content
export const ENABLE_BLOG = envBool("ENABLE_BLOG", false);
export const ENABLE_SUPPORT_FORUM = envBool("ENABLE_SUPPORT_FORUM", false);

// Marketplace / Payments
export const ENABLE_STRIPE = envBool("ENABLE_STRIPE", false);

// Branding
export const APP_NAME = process.env.APP_NAME || "LynxPrompt";
export const APP_URL = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
export const APP_LOGO_URL = process.env.APP_LOGO_URL || "";

// Analytics
export const UMAMI_SCRIPT_URL = process.env.UMAMI_SCRIPT_URL || "";

// Contact / Status
export const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "";
export const STATUS_PAGE_URL = process.env.STATUS_PAGE_URL || "";
export const PLATFORM_OWNER_EMAIL = process.env.PLATFORM_OWNER_EMAIL || "";

/**
 * Public feature flags exposed to the client via /api/config/public.
 * Only include flags safe to expose publicly.
 */
export function getPublicFlags() {
  return {
    enableGithubOAuth: ENABLE_GITHUB_OAUTH,
    enableGoogleOAuth: ENABLE_GOOGLE_OAUTH,
    enableEmailAuth: ENABLE_EMAIL_AUTH,
    enablePasskeys: ENABLE_PASSKEYS,
    enableTurnstile: ENABLE_TURNSTILE,
    enableSSO: ENABLE_SSO,
    enableUserRegistration: ENABLE_USER_REGISTRATION,
    enableAI: ENABLE_AI,
    enableBlog: ENABLE_BLOG,
    enableSupportForum: ENABLE_SUPPORT_FORUM,
    enableStripe: ENABLE_STRIPE,
    appName: APP_NAME,
    appUrl: APP_URL,
    appLogoUrl: APP_LOGO_URL,
    statusPageUrl: STATUS_PAGE_URL,
  };
}
