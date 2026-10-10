// Auth cookies follow the scheme of the address people open, not NODE_ENV.
// Browsers refuse `__Secure-` and `__Host-` cookies (and any `Secure` cookie
// outside localhost) on a plain http:// address, so an instance served over
// http, such as http://localhost:3000 or http://192.168.1.10:3000, could never
// sign anyone in while the production image always picked the secure names.

export function secureCookiesEnabled(): boolean {
  const url = process.env.NEXTAUTH_URL || process.env.APP_URL;
  if (url) return url.trim().toLowerCase().startsWith("https://");
  return process.env.NODE_ENV === "production";
}

export function sessionCookieName(): string {
  return secureCookiesEnabled()
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";
}
