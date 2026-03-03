/**
 * Validates that a URL uses a safe protocol (http or https only).
 * Prevents javascript:, data:, vbscript:, and other dangerous URI schemes
 * from being used in href attributes.
 */
export function isSafeUrl(url: string): boolean {
  try {
    const trimmed = url.trim().toLowerCase();
    return trimmed.startsWith("http://") || trimmed.startsWith("https://");
  } catch {
    return false;
  }
}
