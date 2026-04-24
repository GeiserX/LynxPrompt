import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock feature-flags
vi.mock("@/lib/feature-flags", () => ({
  ENABLE_FEDERATION: true,
  FEDERATION_REGISTRY_URL: "https://registry.example.com",
  APP_URL: "https://app.example.com",
}));

import { isSelfRegistry, initFederation } from "@/lib/federation";

describe("isSelfRegistry", () => {
  it("returns false when registry URL differs from app URL", () => {
    expect(isSelfRegistry()).toBe(false);
  });
});

describe("initFederation", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ name: "test", domain: "app.example.com" }),
      text: () => Promise.resolve(""),
    }) as unknown as ReturnType<typeof vi.spyOn>;
    global.fetch = fetchSpy as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs initialization message", () => {
    initFederation();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Initializing federation")
    );
  });

  it("calls register endpoint", async () => {
    initFederation();
    // Wait for async registration
    await new Promise((r) => setTimeout(r, 50));
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/federation/register"),
      expect.objectContaining({ method: "POST" })
    );
  });
});
