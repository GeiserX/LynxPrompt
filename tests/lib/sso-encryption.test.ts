import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("sso-encryption", () => {
  const VALID_KEY = "a".repeat(64); // 64-char hex string

  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws when SSO_ENCRYPTION_KEY is not set on encrypt", async () => {
    const { encryptSSOConfig } = await import("@/lib/sso-encryption");
    expect(() => encryptSSOConfig({ clientSecret: "secret" })).toThrow(
      "SSO_ENCRYPTION_KEY is not set"
    );
  });

  it("throws when SSO_ENCRYPTION_KEY is not set on decrypt", async () => {
    const { decryptSSOConfig } = await import("@/lib/sso-encryption");
    expect(() =>
      decryptSSOConfig({
        clientSecret: { encrypted: true, iv: "x", data: "y", tag: "z" },
      })
    ).toThrow("SSO_ENCRYPTION_KEY is not set");
  });

  it("throws when SSO_ENCRYPTION_KEY has wrong length", async () => {
    vi.stubEnv("SSO_ENCRYPTION_KEY", "tooshort");
    const { encryptSSOConfig } = await import("@/lib/sso-encryption");
    expect(() => encryptSSOConfig({ clientSecret: "secret" })).toThrow(
      "64-character hex string"
    );
  });

  it("encrypts and decrypts clientSecret round-trip", async () => {
    vi.stubEnv("SSO_ENCRYPTION_KEY", VALID_KEY);
    const { encryptSSOConfig, decryptSSOConfig } = await import(
      "@/lib/sso-encryption"
    );

    const original = { clientSecret: "my-super-secret", issuer: "https://auth.example.com" };
    const encrypted = encryptSSOConfig(original);

    // clientSecret should be an encrypted object, not plaintext
    expect(encrypted.clientSecret).not.toBe("my-super-secret");
    expect(typeof encrypted.clientSecret).toBe("object");
    expect((encrypted.clientSecret as Record<string, unknown>).encrypted).toBe(true);

    // Non-sensitive field should be unchanged
    expect(encrypted.issuer).toBe("https://auth.example.com");

    // Decrypt should restore original
    const decrypted = decryptSSOConfig(encrypted);
    expect(decrypted.clientSecret).toBe("my-super-secret");
    expect(decrypted.issuer).toBe("https://auth.example.com");
  });

  it("encrypts and decrypts bindPassword round-trip", async () => {
    vi.stubEnv("SSO_ENCRYPTION_KEY", VALID_KEY);
    const { encryptSSOConfig, decryptSSOConfig } = await import(
      "@/lib/sso-encryption"
    );

    const original = { bindPassword: "ldap-password-123" };
    const encrypted = encryptSSOConfig(original);

    expect((encrypted.bindPassword as Record<string, unknown>).encrypted).toBe(true);

    const decrypted = decryptSSOConfig(encrypted);
    expect(decrypted.bindPassword).toBe("ldap-password-123");
  });

  it("does not encrypt non-sensitive fields", async () => {
    vi.stubEnv("SSO_ENCRYPTION_KEY", VALID_KEY);
    const { encryptSSOConfig } = await import("@/lib/sso-encryption");

    const result = encryptSSOConfig({
      clientId: "my-client-id",
      issuer: "https://auth.example.com",
    });

    expect(result.clientId).toBe("my-client-id");
    expect(result.issuer).toBe("https://auth.example.com");
  });

  it("handles legacy plaintext values in decryptSSOConfig gracefully", async () => {
    vi.stubEnv("SSO_ENCRYPTION_KEY", VALID_KEY);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { decryptSSOConfig } = await import("@/lib/sso-encryption");

    const result = decryptSSOConfig({
      clientSecret: "plaintext-legacy-secret",
    });

    expect(result.clientSecret).toBe("plaintext-legacy-secret");
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("plaintext")
    );
    warnSpy.mockRestore();
  });

  it("produces unique ciphertext for same plaintext (random IV)", async () => {
    vi.stubEnv("SSO_ENCRYPTION_KEY", VALID_KEY);
    const { encryptSSOConfig } = await import("@/lib/sso-encryption");

    const enc1 = encryptSSOConfig({ clientSecret: "same-secret" });
    const enc2 = encryptSSOConfig({ clientSecret: "same-secret" });

    // Different IVs should produce different encrypted data
    expect((enc1.clientSecret as Record<string, unknown>).iv).not.toBe(
      (enc2.clientSecret as Record<string, unknown>).iv
    );
  });
});
