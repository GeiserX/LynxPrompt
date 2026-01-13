/**
 * Subscription tier utilities
 * 
 * NEW PRICING MODEL (January 2026):
 * - Users (free): Full wizard access, all features EXCEPT AI
 * - Teams: All features including AI, SSO, team-shared blueprints
 * 
 * All users can now access the full wizard (basic + intermediate + advanced).
 * AI features are the only restriction for non-Teams users.
 * 
 * ADMIN and SUPERADMIN roles automatically get Teams-level features.
 */

export type SubscriptionTier = "free" | "teams";
export type WizardTier = "basic" | "intermediate" | "advanced";
export type UserRole = "USER" | "ADMIN" | "SUPERADMIN";

/**
 * Teams pricing: €10/seat/month (minimum 3 seats)
 * Only active users (logged in during billing period) are charged
 */
export const TEAMS_PRICE_PER_SEAT = 1000; // €10.00 in cents
export const TEAMS_MIN_SEATS = 3;
export const TEAMS_AI_LIMIT_PER_USER = 500; // €5.00 max AI spend per user/month

/**
 * Blueprint limits per tier
 * All users now get the same generous limits
 */
export const BLUEPRINT_LIMITS = {
  MAX_LINES: 10000, // Maximum lines per blueprint (all tiers)
  MAX_COUNT: {
    free: 5000,    // Users: 5,000 blueprints (was 50 for free)
    teams: 10000,  // Teams users: 10,000 blueprints
  },
} as const;

/**
 * Get maximum blueprint count for a tier
 */
export function getMaxBlueprintCount(tier: SubscriptionTier): number {
  return BLUEPRINT_LIMITS.MAX_COUNT[tier] || BLUEPRINT_LIMITS.MAX_COUNT.free;
}

/**
 * Check if content exceeds line limit
 * @returns Number of lines if valid, or negative number indicating excess
 */
export function checkBlueprintLineCount(content: string): { valid: boolean; lineCount: number; maxLines: number } {
  const lineCount = content.split("\n").length;
  return {
    valid: lineCount <= BLUEPRINT_LIMITS.MAX_LINES,
    lineCount,
    maxLines: BLUEPRINT_LIMITS.MAX_LINES,
  };
}

/**
 * Get effective subscription tier based on role and subscription
 * Admins get Teams tier automatically
 */
export function getEffectiveTier(
  role: UserRole,
  subscriptionPlan: SubscriptionTier | "pro" | "max" // Accept legacy values
): SubscriptionTier {
  if (role === "ADMIN" || role === "SUPERADMIN") {
    return "teams";
  }
  // Map legacy plans to new model
  if (subscriptionPlan === "pro" || subscriptionPlan === "max") {
    return "free"; // Legacy pro/max users are now regular users with full access
  }
  return subscriptionPlan === "teams" ? "teams" : "free";
}

/**
 * Check if a tier has Teams-level features (AI, SSO, team sharing)
 */
export function hasTeamsFeatures(tier: SubscriptionTier): boolean {
  return tier === "teams";
}

/**
 * Check if user can access AI features (Teams only)
 */
export function canAccessAI(tier: SubscriptionTier): boolean {
  return tier === "teams";
}

/**
 * Check if user can access a specific wizard tier
 * NEW: All users can access ALL wizard tiers
 */
export function canAccessWizard(
  _effectiveTier: SubscriptionTier,
  _wizardTier: WizardTier
): boolean {
  // All users can access all wizard tiers now
  return true;
}

/**
 * Get the required tier for a wizard level
 * NEW: All wizard levels are available to all users
 */
export function getRequiredTier(_wizardTier: WizardTier): SubscriptionTier {
  // All wizard tiers are now free
  return "free";
}

/**
 * Get available wizard tiers for a subscription level
 * NEW: All users get all tiers
 */
export function getAvailableWizards(_effectiveTier: SubscriptionTier): WizardTier[] {
  // All users get all wizard tiers
  return ["basic", "intermediate", "advanced"];
}

/**
 * Check if user is an admin (ADMIN or SUPERADMIN)
 */
export function isAdminRole(role: UserRole): boolean {
  return role === "ADMIN" || role === "SUPERADMIN";
}

/**
 * Check if user is on a Teams plan
 */
export function isTeamsPlan(tier: SubscriptionTier): boolean {
  return tier === "teams";
}

/**
 * Calculate prorated amount for adding seats mid-cycle
 * @param daysRemaining Days left in billing cycle
 * @param totalDays Total days in billing cycle (usually 30)
 * @param newSeats Number of new seats to add
 * @returns Amount in cents to charge
 */
export function calculateProratedAmount(
  daysRemaining: number,
  totalDays: number,
  newSeats: number
): number {
  const dailyRate = TEAMS_PRICE_PER_SEAT / totalDays;
  return Math.round(dailyRate * daysRemaining * newSeats);
}

/**
 * Calculate credit for inactive seats
 * @param billedSeats Seats that were billed
 * @param activeSeats Seats that were actually used
 * @returns Credit amount in cents (for next cycle)
 */
export function calculateInactiveCredit(
  billedSeats: number,
  activeSeats: number
): number {
  // Minimum 3 seats always billed
  const effectiveActive = Math.max(activeSeats, TEAMS_MIN_SEATS);
  if (billedSeats <= effectiveActive) return 0;
  
  const unusedSeats = billedSeats - effectiveActive;
  return unusedSeats * TEAMS_PRICE_PER_SEAT;
}

// Legacy compatibility - keep hasMaxFeatures for code that might still reference it
/** @deprecated Use hasTeamsFeatures instead */
export function hasMaxFeatures(tier: SubscriptionTier | "pro" | "max"): boolean {
  return tier === "teams";
}
