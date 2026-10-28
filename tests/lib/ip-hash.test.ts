import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createHash, createHmac } from "crypto";
import { hashIP } from "@/lib/ip-hash";

const IP = "203.0.113.7";

describe("hashIP", () => {
  const originalSecret = process.env.NEXTAUTH_SECRET;

  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = "test-secret";
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.NEXTAUTH_SECRET;
    else process.env.NEXTAUTH_SECRET = originalSecret;
  });

  it("is keyed with the server secret, not a plain sha256 of the IP", () => {
    const plain = createHash("sha256").update(IP).digest("hex").substring(0, 16);
    const keyed = createHmac("sha256", "test-secret").update(IP).digest("hex").substring(0, 16);

    expect(hashIP(IP)).not.toBe(plain);
    expect(hashIP(IP)).toBe(keyed);
  });
});
