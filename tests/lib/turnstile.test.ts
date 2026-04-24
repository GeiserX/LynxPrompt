import { describe, it, expect, vi, beforeEach } from "vitest";

describe("verifyTurnstileToken", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns true when turnstile is disabled", async () => {
    vi.stubEnv("ENABLE_TURNSTILE", "false");
    const { verifyTurnstileToken } = await import("@/lib/turnstile");
    const result = await verifyTurnstileToken("any-token");
    expect(result).toBe(true);
  });

  it("returns true when secret key is not configured", async () => {
    vi.stubEnv("ENABLE_TURNSTILE", "true");
    // No TURNSTILE_SECRET_KEY set
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { verifyTurnstileToken } = await import("@/lib/turnstile");
    const result = await verifyTurnstileToken("any-token");
    expect(result).toBe(true);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("returns true for dev bypass token in development", async () => {
    vi.stubEnv("ENABLE_TURNSTILE", "true");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "test-secret");
    vi.stubEnv("NODE_ENV", "development");
    const { verifyTurnstileToken } = await import("@/lib/turnstile");
    const result = await verifyTurnstileToken("dev-bypass-token");
    expect(result).toBe(true);
  });

  it("calls Cloudflare API and returns true on success", async () => {
    vi.stubEnv("ENABLE_TURNSTILE", "true");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "test-secret");
    vi.stubEnv("NODE_ENV", "production");

    const fetchSpy = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const { verifyTurnstileToken } = await import("@/lib/turnstile");
    const result = await verifyTurnstileToken("valid-token");

    expect(result).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("returns false when Cloudflare returns success=false", async () => {
    vi.stubEnv("ENABLE_TURNSTILE", "true");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "test-secret");
    vi.stubEnv("NODE_ENV", "production");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: false, "error-codes": ["invalid-input-response"] }),
    }));

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { verifyTurnstileToken } = await import("@/lib/turnstile");
    const result = await verifyTurnstileToken("bad-token");

    expect(result).toBe(false);
    errorSpy.mockRestore();
  });

  it("returns false on fetch error", async () => {
    vi.stubEnv("ENABLE_TURNSTILE", "true");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "test-secret");
    vi.stubEnv("NODE_ENV", "production");

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { verifyTurnstileToken } = await import("@/lib/turnstile");
    const result = await verifyTurnstileToken("any-token");

    expect(result).toBe(false);
    errorSpy.mockRestore();
  });
});
