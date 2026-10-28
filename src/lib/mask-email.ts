/**
 * Mask an address as first character + "***@" + domain, lowercased.
 * The invitation preview only ever sees the masked form, so the join page
 * masks the signed-in address the same way before comparing the two.
 */
export function maskEmail(email: string): string {
  const parts = email.trim().toLowerCase().split("@");
  return parts.length === 2 ? `${parts[0].charAt(0)}***@${parts[1]}` : "***";
}
