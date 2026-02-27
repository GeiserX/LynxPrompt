/**
 * Feature flags system for LynxPrompt self-hosting configuration.
 * All flags are controlled via environment variables with sensible defaults
 * for minimal self-hosted deployments.
 */

export function envBool(key: string, defaultValue: boolean): boolean {
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

// Federation
export const ENABLE_FEDERATION = envBool("ENABLE_FEDERATION", true);
export const FEDERATION_REGISTRY_URL = process.env.FEDERATION_REGISTRY_URL || "https://lynxprompt.com";

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
 * Reads process.env at call time to avoid build-time baking in standalone mode.
 */
export function getPublicFlags() {
  return {
    enableGithubOAuth: envBool("ENABLE_GITHUB_OAUTH", false),
    enableGoogleOAuth: envBool("ENABLE_GOOGLE_OAUTH", false),
    enableEmailAuth: envBool("ENABLE_EMAIL_AUTH", true),
    enablePasskeys: envBool("ENABLE_PASSKEYS", true),
    enableTurnstile: envBool("ENABLE_TURNSTILE", false),
    enableSSO: envBool("ENABLE_SSO", false),
    enableUserRegistration: envBool("ENABLE_USER_REGISTRATION", true),
    enableAI: envBool("ENABLE_AI", false),
    enableBlog: envBool("ENABLE_BLOG", false),
    enableSupportForum: envBool("ENABLE_SUPPORT_FORUM", false),
    enableFederation: envBool("ENABLE_FEDERATION", true),
    federationRegistryUrl: process.env.FEDERATION_REGISTRY_URL || "https://lynxprompt.com",
    appName: process.env.APP_NAME || "LynxPrompt",
    appUrl: process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000",
    appLogoUrl: process.env.APP_LOGO_URL || "",
    statusPageUrl: process.env.STATUS_PAGE_URL || "",
  };
}
