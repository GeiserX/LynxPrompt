/**
 * Subscription tier utilities
 * 
 * Wizard access levels:
 * - FREE: Basic wizard only
 * - PRO: Basic + Intermediate wizards
 * - MAX: All wizards (Basic + Intermediate + Advanced)
 * 
 * ADMIN and SUPERADMIN roles automatically get MAX tier for free.
 */

export type SubscriptionTier = "free" | "pro" | "max";
export type WizardTier = "basic" | "intermediate" | "advanced";
export type UserRole = "USER" | "ADMIN" | "SUPERADMIN";

/**
 * Get effective subscription tier based on role and subscription
 * Admins get MAX tier automatically
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
      // Pro and Max can access intermediate
      return effectiveTier === "pro" || effectiveTier === "max";
    case "advanced":
      // Only Max can access advanced
      return effectiveTier === "max";
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
      return "max";
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

