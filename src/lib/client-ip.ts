/**
 * The client address used for rate limits and dedupe keys.
 *
 * Every address header arrives exactly as the client wrote it unless a proxy we
 * trust overwrites or appends to it, so we read only the part a trusted proxy
 * wrote. `TRUSTED_PROXY` says which part that is:
 *
 * - unset or a number n (default 1): the n-th X-Forwarded-For entry counted
 *   from the right. Each reverse proxy appends the address it received the
 *   request from, so with n proxies in front of the app that entry is the real
 *   client and everything to its left is client-supplied. When no proxy set the
 *   header, Next.js fills it with the socket address.
 * - `cloudflare`: the CF-Connecting-IP header, which Cloudflare always
 *   overwrites. Only safe when the app cannot be reached except through
 *   Cloudflare; falls back to the rightmost X-Forwarded-For entry when absent.
 *
 * Leftmost X-Forwarded-For, X-Real-IP and an unconditional CF-Connecting-IP are
 * never read: any client can set them and get a fresh rate-limit bucket.
 */
export function getClientIP(request: { headers: Headers }): string {
  const setting = (process.env.TRUSTED_PROXY ?? "").trim().toLowerCase();

  if (setting === "cloudflare") {
    const cfIP = request.headers.get("cf-connecting-ip")?.trim();
    if (cfIP) return cfIP;
  }

  const hops = /^\d+$/.test(setting) && Number(setting) >= 1 ? Number(setting) : 1;
  const entries = (request.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (entries.length === 0) return "unknown";

  // Fewer entries than trusted hops means every entry came from a trusted
  // proxy, so the leftmost one is the client.
  return entries[Math.max(0, entries.length - hops)];
}
