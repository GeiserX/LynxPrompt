import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Test different federation configurations
describe("federation - disabled", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs disabled message when ENABLE_FEDERATION is false", async () => {
    vi.doMock("@/lib/feature-flags", () => ({
      ENABLE_FEDERATION: false,
      FEDERATION_REGISTRY_URL: "https://registry.example.com",
      APP_URL: "https://app.example.com",
    }));

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { initFederation } = await import("@/lib/federation");

    initFederation();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Disabled")
    );
  });

  it("skips self-registration when instance IS the registry", async () => {
    vi.doMock("@/lib/feature-flags", () => ({
      ENABLE_FEDERATION: true,
      FEDERATION_REGISTRY_URL: "https://same.example.com",
      APP_URL: "https://same.example.com",
    }));

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { initFederation } = await import("@/lib/federation");

    initFederation();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("IS the registry")
    );
  });
});

describe("federation - registration", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    fetchSpy = vi.fn();
    global.fetch = fetchSpy;
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("registers successfully and schedules heartbeat", async () => {
    vi.doMock("@/lib/feature-flags", () => ({
      ENABLE_FEDERATION: true,
      FEDERATION_REGISTRY_URL: "https://registry.example.com",
      APP_URL: "https://app.example.com",
    }));

    fetchSpy.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ name: "test", domain: "app.example.com" }),
      text: () => Promise.resolve(""),
    });

    const { initFederation } = await import("@/lib/federation");
    initFederation();

    // Let async registration complete
    await vi.advanceTimersByTimeAsync(100);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/federation/register"),
      expect.objectContaining({ method: "POST" })
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Registered with")
    );
  });

  it("retries registration on failure", async () => {
    vi.doMock("@/lib/feature-flags", () => ({
      ENABLE_FEDERATION: true,
      FEDERATION_REGISTRY_URL: "https://registry.example.com",
      APP_URL: "https://app.example.com",
    }));

    // First call fails, retry succeeds
    fetchSpy
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Server Error"),
      })
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ name: "test", domain: "app.example.com" }),
        text: () => Promise.resolve(""),
      });

    const { initFederation } = await import("@/lib/federation");
    initFederation();

    // Let initial registration fail
    await vi.advanceTimersByTimeAsync(100);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Registration failed")
    );

    // Advance past retry timeout (5 minutes)
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000 + 100);
    // Retry should have been called
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("handles registration network error", async () => {
    vi.doMock("@/lib/feature-flags", () => ({
      ENABLE_FEDERATION: true,
      FEDERATION_REGISTRY_URL: "https://registry.example.com",
      APP_URL: "https://app.example.com",
    }));

    fetchSpy.mockRejectedValue(new Error("Network failure"));

    const { initFederation } = await import("@/lib/federation");
    initFederation();

    await vi.advanceTimersByTimeAsync(100);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Registration error")
    );
  });

  it("sends heartbeat periodically", async () => {
    vi.doMock("@/lib/feature-flags", () => ({
      ENABLE_FEDERATION: true,
      FEDERATION_REGISTRY_URL: "https://registry.example.com",
      APP_URL: "https://app.example.com",
    }));

    fetchSpy.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ name: "test", domain: "app.example.com" }),
      text: () => Promise.resolve(""),
    });

    const { initFederation } = await import("@/lib/federation");
    initFederation();

    // Let registration complete
    await vi.advanceTimersByTimeAsync(100);

    // Advance past heartbeat interval (6 hours)
    fetchSpy.mockClear();
    fetchSpy.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(""),
    });

    await vi.advanceTimersByTimeAsync(6 * 60 * 60 * 1000 + 100);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/federation/heartbeat"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("re-registers on heartbeat 404", async () => {
    vi.doMock("@/lib/feature-flags", () => ({
      ENABLE_FEDERATION: true,
      FEDERATION_REGISTRY_URL: "https://registry.example.com",
      APP_URL: "https://app.example.com",
    }));

    // Initial registration succeeds
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ name: "test", domain: "app.example.com" }),
      text: () => Promise.resolve(""),
    });

    const { initFederation } = await import("@/lib/federation");
    initFederation();
    await vi.advanceTimersByTimeAsync(100);

    // Heartbeat returns 404
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: () => Promise.resolve("Not found"),
    });
    // Re-registration succeeds
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ name: "test", domain: "app.example.com" }),
      text: () => Promise.resolve(""),
    });

    await vi.advanceTimersByTimeAsync(6 * 60 * 60 * 1000 + 100);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Not registered")
    );
  });

  it("handles heartbeat network error", async () => {
    vi.doMock("@/lib/feature-flags", () => ({
      ENABLE_FEDERATION: true,
      FEDERATION_REGISTRY_URL: "https://registry.example.com",
      APP_URL: "https://app.example.com",
    }));

    // Registration succeeds
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ name: "test", domain: "app.example.com" }),
      text: () => Promise.resolve(""),
    });

    const { initFederation } = await import("@/lib/federation");
    initFederation();
    await vi.advanceTimersByTimeAsync(100);

    // Heartbeat network error
    fetchSpy.mockRejectedValueOnce(new Error("Connection refused"));
    await vi.advanceTimersByTimeAsync(6 * 60 * 60 * 1000 + 100);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Heartbeat error")
    );
  });
});

describe("isSelfRegistry", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns true when URLs match", async () => {
    vi.doMock("@/lib/feature-flags", () => ({
      ENABLE_FEDERATION: true,
      FEDERATION_REGISTRY_URL: "https://app.example.com",
      APP_URL: "https://app.example.com",
    }));

    const { isSelfRegistry } = await import("@/lib/federation");
    expect(isSelfRegistry()).toBe(true);
  });

  it("returns false when URLs differ", async () => {
    vi.doMock("@/lib/feature-flags", () => ({
      ENABLE_FEDERATION: true,
      FEDERATION_REGISTRY_URL: "https://registry.example.com",
      APP_URL: "https://app.example.com",
    }));

    const { isSelfRegistry } = await import("@/lib/federation");
    expect(isSelfRegistry()).toBe(false);
  });

  it("returns false for invalid URL", async () => {
    vi.doMock("@/lib/feature-flags", () => ({
      ENABLE_FEDERATION: true,
      FEDERATION_REGISTRY_URL: "not-a-url",
      APP_URL: "https://app.example.com",
    }));

    const { isSelfRegistry } = await import("@/lib/federation");
    expect(isSelfRegistry()).toBe(false);
  });
});
