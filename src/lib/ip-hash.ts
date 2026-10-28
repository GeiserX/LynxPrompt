import { createHmac, randomBytes } from "crypto";

// A plain sha256 of an IP can be reversed by hashing all 2^32 IPv4 addresses,
// so the stored value is keyed with the server secret. Without a secret the
// key is random per process: hashes then only match within one run.
const fallbackKey = randomBytes(32);

export function hashIP(ip: string): string {
  const key = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || fallbackKey;
  return createHmac("sha256", key).update(ip).digest("hex").substring(0, 16);
}
