import dns from "node:dns";
import net from "node:net";
import { isPrivateIP, validateDomainNotPrivate } from "@/lib/network-security";

// Team admins type the identity provider URLs, so every one of them is
// untrusted input: the browser is sent to the authorization URL, and the server
// itself calls the token, userinfo and discovery URLs.

/** Self-hosters whose IdP sits on their own network opt in with SSO_ALLOW_PRIVATE_IDP=true. */
export function allowPrivateIdp(): boolean {
  const v = process.env.SSO_ALLOW_PRIVATE_IDP;
  return v === "true" || v === "1";
}

/** https only (http too when private IdPs are allowed); never javascript:, data: and the like. */
export function isAllowedIdpUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    if (url.protocol === "https:") return true;
    return url.protocol === "http:" && allowPrivateIdp();
  } catch {
    return false;
  }
}

export class SSOProviderError extends Error {}

async function assertPublicHost(url: URL): Promise<void> {
  if (allowPrivateIdp()) return;
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const ipVersion = net.isIP(host);
  // IPv6 literals have too many spellings of loopback and mapped IPv4 to
  // classify safely, and no real IdP is addressed by one.
  if (ipVersion === 6) throw new SSOProviderError("IdP host is an IP literal");
  if (ipVersion === 4) {
    if (isPrivateIP(host)) throw new SSOProviderError("IdP host is a private address");
    return;
  }
  try {
    await validateDomainNotPrivate(host);
  } catch {
    throw new SSOProviderError("IdP host does not resolve to a public address");
  }
}

/** fetch() for IdP URLs: scheme and address checked first, redirects refused, 10 s timeout. */
export async function idpFetch(url: string, init: RequestInit = {}): Promise<Response> {
  if (!isAllowedIdpUrl(url)) throw new SSOProviderError("IdP URL must use https");
  await assertPublicHost(new URL(url));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    return await fetch(url, { ...init, redirect: "error", signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export interface OidcEndpoints {
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
}

const trimSlash = (s: string) => s.replace(/\/+$/, "");

/**
 * The endpoints set in the config, with any missing one read from the issuer's
 * /.well-known/openid-configuration document.
 */
export async function resolveOidcEndpoints(
  config: Record<string, unknown>
): Promise<OidcEndpoints> {
  let authorizationUrl = config.authorizationUrl;
  let tokenUrl = config.tokenUrl;
  let userInfoUrl = config.userInfoUrl;

  if (!authorizationUrl || !tokenUrl || !userInfoUrl) {
    const issuer = trimSlash(String(config.issuer || ""));
    const res = await idpFetch(`${issuer}/.well-known/openid-configuration`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new SSOProviderError("OIDC discovery failed");
    const doc = (await res.json()) as Record<string, unknown>;
    if (typeof doc.issuer !== "string" || trimSlash(doc.issuer) !== issuer) {
      throw new SSOProviderError("OIDC discovery issuer does not match");
    }
    authorizationUrl ||= doc.authorization_endpoint;
    tokenUrl ||= doc.token_endpoint;
    userInfoUrl ||= doc.userinfo_endpoint;
  }

  if (!isAllowedIdpUrl(authorizationUrl) || !isAllowedIdpUrl(tokenUrl) || !isAllowedIdpUrl(userInfoUrl)) {
    throw new SSOProviderError("OIDC endpoints must use https");
  }
  return {
    authorizationUrl: authorizationUrl as string,
    tokenUrl: tokenUrl as string,
    userInfoUrl: userInfoUrl as string,
  };
}

// ---------------------------------------------------------------------------
// Domain ownership. A team can only sign in addresses on a domain it proved it
// owns, by publishing its token in a TXT record at _lynxprompt-sso.<domain>.
// ---------------------------------------------------------------------------

const DOMAIN_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{0,61}[a-z0-9]$/;

/** Lower-cased bare domain, or null when the input is not a domain name. */
export function normalizeDomain(input: string): string | null {
  const d = input.trim().toLowerCase().replace(/^@/, "").replace(/\.$/, "");
  return DOMAIN_RE.test(d) ? d : null;
}

/** The domain of an email address, taken after the last "@". */
export function emailDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at <= 0) return null;
  return normalizeDomain(email.slice(at + 1));
}

export function verificationRecord(domain: string, token: string) {
  return { name: `_lynxprompt-sso.${domain}`, value: `lynxprompt-sso=${token}` };
}

export async function domainHasVerificationRecord(domain: string, token: string): Promise<boolean> {
  const { name, value } = verificationRecord(domain, token);
  try {
    const records = await dns.promises.resolveTxt(name);
    return records.some((chunks) => chunks.join("") === value);
  } catch {
    return false;
  }
}
