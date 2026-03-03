import dns from "node:dns";

/**
 * Check whether an IP address falls within private, reserved, or loopback ranges.
 * Covers both IPv4 and IPv6 addresses.
 */
export function isPrivateIP(ip: string): boolean {
  // IPv6 checks
  if (ip.includes(":")) {
    const normalized = ip.toLowerCase();
    if (normalized === "::1") return true; // loopback
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // fc00::/7 (unique local)
    if (normalized.startsWith("fe80")) return true; // fe80::/10 (link-local)
    // IPv4-mapped IPv6 (e.g. ::ffff:10.0.0.1)
    const v4Match = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (v4Match) return isPrivateIPv4(v4Match[1]);
    return false;
  }

  return isPrivateIPv4(ip);
}

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // malformed -> treat as private to be safe
  }

  const [a, b] = parts;

  // 0.0.0.0/8
  if (a === 0) return true;
  // 10.0.0.0/8
  if (a === 10) return true;
  // 127.0.0.0/8 (loopback)
  if (a === 127) return true;
  // 169.254.0.0/16 (link-local, includes cloud metadata 169.254.169.254)
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;

  return false;
}

/**
 * Resolve a domain via DNS and throw if ANY resolved address is private/reserved.
 * This prevents SSRF attacks against internal infrastructure and cloud metadata endpoints.
 */
export async function validateDomainNotPrivate(
  domain: string,
): Promise<void> {
  const resolver = new dns.promises.Resolver();
  const allIPs: string[] = [];

  // Resolve IPv4
  try {
    const ipv4Addresses = await resolver.resolve4(domain);
    allIPs.push(...ipv4Addresses);
  } catch {
    // No A records is fine, but we need at least one result overall
  }

  // Resolve IPv6
  try {
    const ipv6Addresses = await resolver.resolve6(domain);
    allIPs.push(...ipv6Addresses);
  } catch {
    // No AAAA records is fine, but we need at least one result overall
  }

  if (allIPs.length === 0) {
    throw new Error(`DNS resolution failed for domain: ${domain}`);
  }

  for (const ip of allIPs) {
    if (isPrivateIP(ip)) {
      throw new Error(
        `Domain resolves to a private/reserved IP address: ${ip}`,
      );
    }
  }
}
