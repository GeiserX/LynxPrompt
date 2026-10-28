const BASE = "http://callback.invalid";

/**
 * Turn an untrusted callbackUrl into a same-origin path, or the fallback.
 * A plain startsWith("/") check lets "/\evil.com" through: URL parsing treats
 * the backslash as a slash, so the browser goes to evil.com.
 * The returned path is checked too: dot-segment removal turns "/.//evil.com"
 * into "//evil.com", which a browser reads as another host.
 */
export function safeCallbackUrl(raw: string | null | undefined, fallback = "/dashboard"): string {
  if (!raw || !raw.startsWith("/")) return fallback;
  try {
    const url = new URL(raw, BASE);
    if (url.origin !== BASE) return fallback;
    const out = `${url.pathname}${url.search}${url.hash}`;
    if (out.startsWith("//") || new URL(out, BASE).origin !== BASE) return fallback;
    return out;
  } catch {
    return fallback;
  }
}
