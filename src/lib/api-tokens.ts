/**
 * API Token utilities for LynxPrompt
 * 
 * Token format: lp_<random_32_chars>
 * Storage: SHA-256 hash of the full token
 * 
 * Tokens are only shown once on creation and cannot be retrieved.
 */

import { createHash, randomBytes } from "crypto";
import { prismaUsers } from "@/lib/db-users";
import type { ApiTokenRole } from "@/generated/prisma-users/enums";

// Token prefix for easy identification
export const TOKEN_PREFIX = "lp_";

// Blueprint ID prefix for API responses
export const BLUEPRINT_PREFIX = "bp_";

// Default expiration: 1 week
export const DEFAULT_EXPIRATION_DAYS = 7;

// Maximum expiration: 1 year
export const MAX_EXPIRATION_DAYS = 365;

/**
 * Generate a new API token
 * Returns the raw token (to show user ONCE) and its hash (for storage)
 */
export function generateToken(): { rawToken: string; tokenHash: string; lastFourChars: string } {
  // Generate 32 random bytes = 64 hex chars
  const randomPart = randomBytes(32).toString("hex");
  const rawToken = `${TOKEN_PREFIX}${randomPart}`;
  
  // Hash the full token for storage
  const tokenHash = hashToken(rawToken);
  
  // Last 4 chars for display
  const lastFourChars = randomPart.slice(-4);
  
  return { rawToken, tokenHash, lastFourChars };
}

/**
 * Hash a token using SHA-256
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Validate token format
 */
export function isValidTokenFormat(token: string): boolean {
  // lp_ prefix + 64 hex chars
  return token.startsWith(TOKEN_PREFIX) && token.length === TOKEN_PREFIX.length + 64;
}

/**
 * Add blueprint prefix to ID for API responses
 */
export function toBlueprintApiId(id: string): string {
  if (id.startsWith(BLUEPRINT_PREFIX)) return id;
  return `${BLUEPRINT_PREFIX}${id}`;
}

/**
 * Remove blueprint prefix from API ID for database queries
 * Supports both bp_ (v1 API) and usr_ (marketplace) prefixes
 */
export function fromBlueprintApiId(apiId: string): string {
  if (apiId.startsWith(BLUEPRINT_PREFIX)) {
    return apiId.slice(BLUEPRINT_PREFIX.length);
  }
  // Also support usr_ prefix (same table, different UI)
  if (apiId.startsWith("usr_")) {
    return apiId.slice(4); // "usr_".length = 4
  }
  return apiId;
}

/**
 * Validate and authenticate an API token
 * Returns user info and token if valid, null if invalid/expired
 */
export async function validateApiToken(authHeader: string | null): Promise<{
  userId: string;
  tokenId: string;
  role: ApiTokenRole;
  user: {
    id: string;
    email: string | null;
    name: string | null;
    subscriptionPlan: string;
  };
} | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const rawToken = authHeader.slice(7); // Remove "Bearer "
  
  if (!isValidTokenFormat(rawToken)) {
    return null;
  }

  const tokenHash = hashToken(rawToken);
  
  const token = await prismaUsers.apiToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          subscriptionPlan: true,
        },
      },
    },
  });

  if (!token) {
    return null;
  }

  // Check if revoked
  if (token.revokedAt) {
    return null;
  }

  // Check if expired
  if (token.expiresAt < new Date()) {
    return null;
  }
  
  // Update lastUsedAt (fire and forget)
  prismaUsers.apiToken.update({
    where: { id: token.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {
    // Ignore errors on lastUsedAt update
  });

  return {
    userId: token.userId,
    tokenId: token.id,
    role: token.role,
    user: token.user,
  };
}

/**
 * Check if token is expired and return expiration info
 */
export async function checkTokenExpiration(authHeader: string | null): Promise<{
  isExpired: boolean;
  expiredAt?: Date;
}> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { isExpired: false };
  }

  const rawToken = authHeader.slice(7);
  
  if (!isValidTokenFormat(rawToken)) {
    return { isExpired: false };
  }

  const tokenHash = hashToken(rawToken);
  
  const token = await prismaUsers.apiToken.findUnique({
    where: { tokenHash },
    select: { expiresAt: true, revokedAt: true },
  });

  if (!token || token.revokedAt) {
    return { isExpired: false };
  }

  const now = new Date();
  if (token.expiresAt < now) {
    return { isExpired: true, expiredAt: token.expiresAt };
  }

  return { isExpired: false };
}

/**
 * Check if a role has permission for an action
 */
export function hasPermission(role: ApiTokenRole, action: "blueprints:read" | "blueprints:write" | "profile:read" | "profile:write"): boolean {
  switch (role) {
    case "FULL":
      return true;
    case "BLUEPRINTS_FULL":
      return action === "blueprints:read" || action === "blueprints:write";
    case "BLUEPRINTS_READONLY":
      return action === "blueprints:read";
    case "PROFILE_FULL":
      return action === "profile:read" || action === "profile:write";
    default:
      return false;
  }
}

/**
 * Check if user's subscription plan allows API access
 */
export function canUseApi(subscriptionPlan: string): boolean {
  // All users can now use the API (previously Pro/Max/Teams only)
  // Teams users get additional features like AI editing
  return true;
}

/**
 * Role display names for UI
 */
export const ROLE_DISPLAY_NAMES: Record<ApiTokenRole, string> = {
  BLUEPRINTS_FULL: "Blueprints (Full Access)",
  BLUEPRINTS_READONLY: "Blueprints (Read Only)",
  PROFILE_FULL: "Profile (Full Access)",
  FULL: "Full Access",
};

/**
 * Role descriptions for UI
 */
export const ROLE_DESCRIPTIONS: Record<ApiTokenRole, string> = {
  BLUEPRINTS_FULL: "Create, read, update, and delete your blueprints",
  BLUEPRINTS_READONLY: "List and download your blueprints (read-only)",
  PROFILE_FULL: "Read and update your profile information",
  FULL: "Full access to blueprints and profile",
};


