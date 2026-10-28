const BASE = "http://callback.invalid";

/**
 * Turn an untrusted callbackUrl into a same-origin path, or the fallback.
 * A plain startsWith("/") check lets "/\evil.com" through: URL parsing treats
 * the backslash as a slash, so the browser goes to evil.com.
 */
export function safeCallbackUrl(raw: string | null | undefined, fallback = "/dashboard"): string {
  if (!raw || !raw.startsWith("/")) return fallback;
  try {
    const url = new URL(raw, BASE);
    if (url.origin !== BASE) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
