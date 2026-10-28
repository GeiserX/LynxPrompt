/**
 * Helpers for the CLI login flow (/api/cli-auth/*).
 *
 * The session ID travels in the sign-in URL, so it is not a secret: it can end
 * up in browser history, proxy logs or a Referer header. Two things keep the
 * token safe anyway:
 *
 * - The CLI keeps a random verifier to itself and sends only its SHA-256
 *   (the challenge) at init. Polling must present the verifier, so knowing the
 *   session ID is not enough to collect the token.
 * - The token waits in the database encrypted with a key derived from the
 *   session ID and the server secret, so a copy of the row alone does not
 *   reveal it.
 */

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "crypto";

// base64url SHA-256 is 43 characters; verifiers follow RFC 7636 (43-128 chars).
const CHALLENGE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const VERIFIER_PATTERN = /^[A-Za-z0-9._~-]{43,128}$/;

export function isValidCodeChallenge(value: unknown): value is string {
  return typeof value === "string" && CHALLENGE_PATTERN.test(value);
}

export function codeChallengeFor(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function verifierMatches(verifier: string | null, challenge: string): boolean {
  if (!verifier || !VERIFIER_PATTERN.test(verifier)) return false;
  const expected = Buffer.from(challenge);
  const actual = Buffer.from(codeChallengeFor(verifier));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function tokenKey(sessionId: string): Buffer {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "";
  // Hash the whole input: the secret must change the key, not be cut off.
  return createHash("sha256").update(`${sessionId}:${secret}`).digest();
}

export function encryptCliToken(rawToken: string, sessionId: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", tokenKey(sessionId), iv);
  const encrypted = Buffer.concat([cipher.update(rawToken, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${encrypted.toString("base64")}:${tag.toString("base64")}`;
}

export function decryptCliToken(stored: string, sessionId: string): string {
  const [ivB64, dataB64, tagB64] = stored.split(":");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    tokenKey(sessionId),
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return decipher.update(dataB64, "base64", "utf8") + decipher.final("utf8");
}
