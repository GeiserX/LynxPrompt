import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/feature-flags", () => ({
  getPublicFlags: vi.fn(() => ({
    enableGithubOAuth: false,
    enableGoogleOAuth: false,
    enableEmailAuth: true,
    enablePasskeys: true,
    enableTurnstile: false,
    enableSSO: false,
    enableUserRegistration: true,
    enableAI: false,
    enableBlog: false,
    enableSupportForum: false,
    enableStripe: false,
    appName: "LynxPrompt",
    appUrl: "http://localhost:3000",
    appLogoUrl: "",
    statusPageUrl: "",
  })),
}));

describe("GET /api/config/public", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("should return feature flags with turnstile and umami keys", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "test-site-key");
    vi.stubEnv("NEXT_PUBLIC_UMAMI_WEBSITE_ID", "test-umami-id");

    vi.resetModules();
    const { GET } = await import("@/app/api/config/public/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.turnstileSiteKey).toBe("test-site-key");
    expect(body.umamiWebsiteId).toBe("test-umami-id");
    expect(body.enableEmailAuth).toBe(true);
    expect(body.appName).toBe("LynxPrompt");
  });

  it("should return null for unset turnstile and umami keys", async () => {
    vi.resetModules();
    const { GET } = await import("@/app/api/config/public/route");
    const response = await GET();
    const body = await response.json();

    expect(body.turnstileSiteKey).toBeNull();
    expect(body.umamiWebsiteId).toBeNull();
  });

  it("should include all public flag keys in response", async () => {
    vi.resetModules();
    const { GET } = await import("@/app/api/config/public/route");
    const response = await GET();
    const body = await response.json();

    const expectedKeys = [
      "turnstileSiteKey",
      "umamiWebsiteId",
      "enableGithubOAuth",
      "enableGoogleOAuth",
      "enableEmailAuth",
      "enablePasskeys",
      "enableTurnstile",
      "enableSSO",
      "enableUserRegistration",
      "enableAI",
      "enableBlog",
      "enableSupportForum",
      "enableStripe",
      "appName",
      "appUrl",
      "appLogoUrl",
      "statusPageUrl",
    ];

    for (const key of expectedKeys) {
      expect(body).toHaveProperty(key);
    }
  });
});
