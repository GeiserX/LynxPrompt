/**
 * Subscription tier utilities
 * 
 * Wizard access levels:
 * - FREE: Basic wizard only
 * - PRO: Basic + Intermediate wizards
 * - MAX/TEAMS: All wizards (Basic + Intermediate + Advanced)
 * 
 * ADMIN and SUPERADMIN roles automatically get MAX tier for free.
 * TEAMS users get MAX-level features plus team-specific features.
 */

export type SubscriptionTier = "free" | "pro" | "max" | "teams";
export type WizardTier = "basic" | "intermediate" | "advanced";
export type UserRole = "USER" | "ADMIN" | "SUPERADMIN";

/**
 * Teams pricing: €30/seat/month (minimum 3 seats)
 * Only active users (logged in during billing period) are charged
 */
export const TEAMS_PRICE_PER_SEAT = 3000; // €30.00 in cents
export const TEAMS_MIN_SEATS = 3;
export const TEAMS_AI_LIMIT_PER_USER = 1500; // €15.00 max AI spend per user/month

/**
 * Get effective subscription tier based on role and subscription
 * Admins get MAX tier automatically
 * Teams users get teams tier (which includes all MAX features)
 */
export function getEffectiveTier(
  role: UserRole,
  subscriptionPlan: SubscriptionTier
): SubscriptionTier {
  if (role === "ADMIN" || role === "SUPERADMIN") {
    return "max";
  }
  return subscriptionPlan;
}

/**
 * Check if a tier has MAX-level features (includes Teams)
 */
export function hasMaxFeatures(tier: SubscriptionTier): boolean {
  return tier === "max" || tier === "teams";
}

/**
 * Check if user can access a specific wizard tier
 */
export function canAccessWizard(
  effectiveTier: SubscriptionTier,
  wizardTier: WizardTier
): boolean {
  switch (wizardTier) {
    case "basic":
      // Everyone can access basic
      return true;
    case "intermediate":
      // Pro, Max, and Teams can access intermediate
      return effectiveTier === "pro" || hasMaxFeatures(effectiveTier);
    case "advanced":
      // Max and Teams can access advanced
      return hasMaxFeatures(effectiveTier);
    default:
      return false;
  }
}

/**
 * Get the required tier for a wizard level
 */
export function getRequiredTier(wizardTier: WizardTier): SubscriptionTier {
  switch (wizardTier) {
    case "basic":
      return "free";
    case "intermediate":
      return "pro";
    case "advanced":
      return "max"; // Max or Teams
    default:
      return "free";
  }
}

/**
 * Get available wizard tiers for a subscription level
 */
export function getAvailableWizards(effectiveTier: SubscriptionTier): WizardTier[] {
  switch (effectiveTier) {
    case "max":
    case "teams":
      return ["basic", "intermediate", "advanced"];
    case "pro":
      return ["basic", "intermediate"];
    case "free":
    default:
      return ["basic"];
  }
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


