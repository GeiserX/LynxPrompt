/**
 * Subscription tier utilities
 *
 * SIMPLIFIED (billing removed):
 * All users get full access to all features.
 * AI access will be controlled by ENABLE_AI env var.
 * Teams are organizational units only (no billing).
 */

export type SubscriptionTier = "free" | "teams";
export type WizardTier = "basic" | "intermediate" | "advanced";
export type UserRole = "USER" | "ADMIN" | "SUPERADMIN";

/**
 * Blueprint limits (same for all users)
 */
export const BLUEPRINT_LIMITS = {
  MAX_LINES: 10000,
  MAX_COUNT: {
    free: 5000,
    teams: 10000,
  },
} as const;

export function getMaxBlueprintCount(tier: SubscriptionTier): number {
  return BLUEPRINT_LIMITS.MAX_COUNT[tier] || BLUEPRINT_LIMITS.MAX_COUNT.free;
}

export function checkBlueprintLineCount(content: string): { valid: boolean; lineCount: number; maxLines: number } {
  const lineCount = content.split("\n").length;
  return {
    valid: lineCount <= BLUEPRINT_LIMITS.MAX_LINES,
    lineCount,
    maxLines: BLUEPRINT_LIMITS.MAX_LINES,
  };
}

/**
 * Get effective subscription tier - always returns "free" (billing removed)
 */
export function getEffectiveTier(
  _role: UserRole,
  _subscriptionPlan: string
): SubscriptionTier {
  return "free";
}

export function hasTeamsFeatures(_tier: SubscriptionTier): boolean {
  return true;
}

export function canAccessAI(_tier: SubscriptionTier): boolean {
  return true;
}

export function canAccessWizard(
  _effectiveTier: SubscriptionTier,
  _wizardTier: WizardTier
): boolean {
  return true;
}

export function getRequiredTier(_wizardTier: WizardTier): SubscriptionTier {
  return "free";
}

export function getAvailableWizards(_effectiveTier: SubscriptionTier): WizardTier[] {
  return ["basic", "intermediate", "advanced"];
}

export function isAdminRole(role: UserRole): boolean {
  return role === "ADMIN" || role === "SUPERADMIN";
}
