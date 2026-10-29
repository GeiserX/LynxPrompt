import { describe, it, expect, vi, beforeEach } from "vitest";

describe("federation", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  describe("ENABLE_FEDERATION flag", () => {
    it("should default to false, so federation is opt-in", async () => {
      const flags = await import("@/lib/feature-flags");
      expect(flags.ENABLE_FEDERATION).toBe(false);
    });

    it("should respect ENABLE_FEDERATION=false", async () => {
      vi.stubEnv("ENABLE_FEDERATION", "false");
      const flags = await import("@/lib/feature-flags");
      expect(flags.ENABLE_FEDERATION).toBe(false);
    });
  });

  describe("FEDERATION_REGISTRY_URL", () => {
    it("should default to https://lynxprompt.geiser.cloud", async () => {
      const flags = await import("@/lib/feature-flags");
      expect(flags.FEDERATION_REGISTRY_URL).toBe("https://lynxprompt.geiser.cloud");
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
      expect(flags.enableFederation).toBe(false);
      expect(flags.federationRegistryUrl).toBe("https://lynxprompt.geiser.cloud");
    });
  });

  describe("initFederation", () => {
    it("should not register when federation is disabled", async () => {
      vi.stubEnv("ENABLE_FEDERATION", "false");
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const { initFederation } = await import("@/lib/federation");

      initFederation();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Disabled"),
      );
      consoleSpy.mockRestore();
    });

    it("should skip self-registration when this instance IS the registry", async () => {
      vi.stubEnv("ENABLE_FEDERATION", "true");
      vi.stubEnv("APP_URL", "https://lynxprompt.geiser.cloud");
      vi.stubEnv("FEDERATION_REGISTRY_URL", "https://lynxprompt.geiser.cloud");
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const { initFederation } = await import("@/lib/federation");

      initFederation();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("IS the registry"),
      );
      consoleSpy.mockRestore();
    });

    it("should attempt registration when pointing to external registry", async () => {
      vi.stubEnv("ENABLE_FEDERATION", "true");
      vi.stubEnv("APP_URL", "https://instance.example.test");
      vi.stubEnv("FEDERATION_REGISTRY_URL", "https://lynxprompt.geiser.cloud");

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
          "https://lynxprompt.geiser.cloud/api/v1/federation/register",
          expect.objectContaining({ method: "POST" }),
        );
      });

      consoleSpy.mockRestore();
      vi.unstubAllGlobals();
    });

    // A fresh self-hosted instance used to post its domain to the public
    // registry at start and every six hours, without the operator asking.
    it("makes no registry call on an instance that never set ENABLE_FEDERATION", async () => {
      vi.stubEnv("APP_URL", "https://team.example.com");
      const fetchSpy = vi.fn().mockResolvedValue(new Response("{}"));
      vi.stubGlobal("fetch", fetchSpy);
      vi.spyOn(console, "log").mockImplementation(() => {});
      const { initFederation } = await import("@/lib/federation");

      initFederation();
      await new Promise((r) => setTimeout(r, 10));

      expect(fetchSpy).not.toHaveBeenCalled();
      vi.unstubAllGlobals();
    });

    it.each(["http://localhost:3000", "https://localhost:3000", "http://team.example.com", "https://10.0.0.5", "https://team.example.com:8443"])(
      "does not try to register APP_URL %s, which the registry cannot reach",
      async (appUrl) => {
        vi.stubEnv("ENABLE_FEDERATION", "true");
        vi.stubEnv("APP_URL", appUrl);
        const fetchSpy = vi.fn().mockResolvedValue(new Response("{}"));
        vi.stubGlobal("fetch", fetchSpy);
        vi.spyOn(console, "log").mockImplementation(() => {});
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const { initFederation } = await import("@/lib/federation");

        initFederation();
        await new Promise((r) => setTimeout(r, 10));

        expect(fetchSpy).not.toHaveBeenCalled();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("Not joining"));
        vi.unstubAllGlobals();
        warn.mockRestore();
      },
    );
  });

  describe("isFederationDomain", () => {
    it("accepts a public DNS name and rejects what the registry would refuse", async () => {
      const { isFederationDomain } = await import("@/lib/federation");
      expect(isFederationDomain("lynxprompt.example.com")).toBe(true);
      for (const bad of ["localhost", "localhost:3000", "example.com:8443", "10.0.0.5", "a".repeat(250) + ".com"]) {
        expect(isFederationDomain(bad), bad).toBe(false);
      }
    });
  });
});
