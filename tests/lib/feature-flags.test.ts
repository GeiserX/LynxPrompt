import { describe, it, expect, vi, beforeEach } from "vitest";

describe("feature-flags", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  describe("envBool via exported flags", () => {
    it("should use defaults when env vars are not set", async () => {
      const flags = await import("@/lib/feature-flags");
      expect(flags.ENABLE_EMAIL_AUTH).toBe(true);
      expect(flags.ENABLE_PASSKEYS).toBe(true);
      expect(flags.ENABLE_USER_REGISTRATION).toBe(true);
      expect(flags.ENABLE_GITHUB_OAUTH).toBe(false);
      expect(flags.ENABLE_GOOGLE_OAUTH).toBe(false);
      expect(flags.ENABLE_TURNSTILE).toBe(false);
      expect(flags.ENABLE_SSO).toBe(false);
      expect(flags.ENABLE_AI).toBe(false);
      expect(flags.ENABLE_BLOG).toBe(false);
      expect(flags.ENABLE_SUPPORT_FORUM).toBe(false);
      expect(flags.ENABLE_STRIPE).toBe(false);
      expect(flags.ENABLE_FEDERATION).toBe(true);
    });

    it("should read 'true' from env var", async () => {
      vi.stubEnv("ENABLE_GITHUB_OAUTH", "true");
      const flags = await import("@/lib/feature-flags");
      expect(flags.ENABLE_GITHUB_OAUTH).toBe(true);
    });

    it("should read '1' as true", async () => {
      vi.stubEnv("ENABLE_STRIPE", "1");
      const flags = await import("@/lib/feature-flags");
      expect(flags.ENABLE_STRIPE).toBe(true);
    });

    it("should read 'false' from env var", async () => {
      vi.stubEnv("ENABLE_EMAIL_AUTH", "false");
      const flags = await import("@/lib/feature-flags");
      expect(flags.ENABLE_EMAIL_AUTH).toBe(false);
    });

    it("should treat empty string as default", async () => {
      vi.stubEnv("ENABLE_EMAIL_AUTH", "");
      const flags = await import("@/lib/feature-flags");
      expect(flags.ENABLE_EMAIL_AUTH).toBe(true);
    });
  });

  describe("branding and string flags", () => {
    it("should use defaults for APP_NAME and APP_URL", async () => {
      const flags = await import("@/lib/feature-flags");
      expect(flags.APP_NAME).toBe("LynxPrompt");
      expect(flags.APP_URL).toBe("http://localhost:3000");
    });

    it("should prefer APP_URL over NEXTAUTH_URL", async () => {
      vi.stubEnv("APP_URL", "https://custom.example.com");
      vi.stubEnv("NEXTAUTH_URL", "https://auth.example.com");
      const flags = await import("@/lib/feature-flags");
      expect(flags.APP_URL).toBe("https://custom.example.com");
    });

    it("should fall back to NEXTAUTH_URL when APP_URL is not set", async () => {
      vi.stubEnv("NEXTAUTH_URL", "https://auth.example.com");
      const flags = await import("@/lib/feature-flags");
      expect(flags.APP_URL).toBe("https://auth.example.com");
    });

    it("should use custom APP_NAME", async () => {
      vi.stubEnv("APP_NAME", "MyInstance");
      const flags = await import("@/lib/feature-flags");
      expect(flags.APP_NAME).toBe("MyInstance");
    });

    it("should use custom AI_MODEL", async () => {
      vi.stubEnv("AI_MODEL", "gpt-4o");
      const flags = await import("@/lib/feature-flags");
      expect(flags.AI_MODEL).toBe("gpt-4o");
    });

    it("should default AI_MODEL to claude-3-5-haiku-latest", async () => {
      const flags = await import("@/lib/feature-flags");
      expect(flags.AI_MODEL).toBe("claude-3-5-haiku-latest");
    });
  });

  describe("getPublicFlags", () => {
    it("should return all expected public flag keys", async () => {
      const { getPublicFlags } = await import("@/lib/feature-flags");
      const flags = getPublicFlags();

      expect(flags).toHaveProperty("enableGithubOAuth");
      expect(flags).toHaveProperty("enableGoogleOAuth");
      expect(flags).toHaveProperty("enableEmailAuth");
      expect(flags).toHaveProperty("enablePasskeys");
      expect(flags).toHaveProperty("enableTurnstile");
      expect(flags).toHaveProperty("enableSSO");
      expect(flags).toHaveProperty("enableUserRegistration");
      expect(flags).toHaveProperty("enableAI");
      expect(flags).toHaveProperty("enableBlog");
      expect(flags).toHaveProperty("enableSupportForum");
      expect(flags).toHaveProperty("enableStripe");
      expect(flags).toHaveProperty("enableFederation");
      expect(flags).toHaveProperty("federationRegistryUrl");
      expect(flags).toHaveProperty("appName");
      expect(flags).toHaveProperty("appUrl");
      expect(flags).toHaveProperty("appLogoUrl");
      expect(flags).toHaveProperty("statusPageUrl");
    });

    it("should reflect env var overrides", async () => {
      vi.stubEnv("ENABLE_AI", "true");
      vi.stubEnv("APP_NAME", "TestInstance");
      const { getPublicFlags } = await import("@/lib/feature-flags");
      const flags = getPublicFlags();

      expect(flags.enableAI).toBe(true);
      expect(flags.appName).toBe("TestInstance");
    });

    it("should not expose server-only values", async () => {
      const { getPublicFlags } = await import("@/lib/feature-flags");
      const flags = getPublicFlags();
      const keys = Object.keys(flags);

      expect(keys).not.toContain("umamiScriptUrl");
      expect(keys).not.toContain("contactEmail");
      expect(keys).not.toContain("platformOwnerEmail");
    });
  });
});
