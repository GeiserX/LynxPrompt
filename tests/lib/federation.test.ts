import { describe, it, expect, vi, beforeEach } from "vitest";

describe("federation", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  describe("ENABLE_FEDERATION flag", () => {
    it("should default to true", async () => {
      const flags = await import("@/lib/feature-flags");
      expect(flags.ENABLE_FEDERATION).toBe(true);
    });

    it("should respect ENABLE_FEDERATION=false", async () => {
      vi.stubEnv("ENABLE_FEDERATION", "false");
      const flags = await import("@/lib/feature-flags");
      expect(flags.ENABLE_FEDERATION).toBe(false);
    });
  });

  describe("FEDERATION_REGISTRY_URL", () => {
    it("should default to https://lynxprompt.com", async () => {
      const flags = await import("@/lib/feature-flags");
      expect(flags.FEDERATION_REGISTRY_URL).toBe("https://lynxprompt.com");
    });

    it("should use custom registry URL", async () => {
      vi.stubEnv("FEDERATION_REGISTRY_URL", "https://my-registry.example.com");
      const flags = await import("@/lib/feature-flags");
      expect(flags.FEDERATION_REGISTRY_URL).toBe("https://my-registry.example.com");
    });
  });

  describe("getPublicFlags includes federation", () => {
    it("should expose federation flags publicly", async () => {
      const { getPublicFlags } = await import("@/lib/feature-flags");
      const flags = getPublicFlags();
      expect(flags.enableFederation).toBe(true);
      expect(flags.federationRegistryUrl).toBe("https://lynxprompt.com");
    });
  });

  describe("initFederation", () => {
    it("should not register when federation is disabled", async () => {
      vi.stubEnv("ENABLE_FEDERATION", "false");
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const { initFederation } = await import("@/lib/federation");

      initFederation();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Disabled via ENABLE_FEDERATION=false"),
      );
      consoleSpy.mockRestore();
    });

    it("should skip self-registration when this instance IS the registry", async () => {
      vi.stubEnv("APP_URL", "https://lynxprompt.com");
      vi.stubEnv("FEDERATION_REGISTRY_URL", "https://lynxprompt.com");
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const { initFederation } = await import("@/lib/federation");

      initFederation();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("IS the registry"),
      );
      consoleSpy.mockRestore();
    });

    it("should attempt registration when pointing to external registry", async () => {
      vi.stubEnv("APP_URL", "https://test.lynxprompt.com");
      vi.stubEnv("FEDERATION_REGISTRY_URL", "https://lynxprompt.com");

      const fetchSpy = vi.fn().mockRejectedValue(new Error("fetch disabled in test"));
      vi.stubGlobal("fetch", fetchSpy);

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const { initFederation } = await import("@/lib/federation");

      initFederation();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Initializing federation"),
      );

      await vi.waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          "https://lynxprompt.com/api/v1/federation/register",
          expect.objectContaining({ method: "POST" }),
        );
      });

      consoleSpy.mockRestore();
      vi.unstubAllGlobals();
    });
  });
});
