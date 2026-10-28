/**
 * Blueprint limits and role helpers. There is no billing: every account gets
 * the same limits and features.
 */

export type UserRole = "USER" | "ADMIN" | "SUPERADMIN";

export const BLUEPRINT_LIMITS = {
  MAX_LINES: 10000,
  MAX_COUNT: 5000,
} as const;

export function checkBlueprintLineCount(content: string): { valid: boolean; lineCount: number; maxLines: number } {
  const lineCount = content.split("\n").length;
  return {
    valid: lineCount <= BLUEPRINT_LIMITS.MAX_LINES,
    lineCount,
    maxLines: BLUEPRINT_LIMITS.MAX_LINES,
  };
}

export function isAdminRole(role: UserRole): boolean {
  return role === "ADMIN" || role === "SUPERADMIN";
}
