import { describe, it, expect, vi } from "vitest";
import { isPrivateIP, validateDomainNotPrivate } from "@/lib/network-security";

// ============================================================================
// isPrivateIP - Extended tests
// ============================================================================
describe("isPrivateIP - extended coverage", () => {
  // IPv4 private ranges
  it("returns true for 0.0.0.0/8", () => {
    expect(isPrivateIP("0.0.0.0")).toBe(true);
    expect(isPrivateIP("0.1.2.3")).toBe(true);
  });

  it("returns true for 10.0.0.0/8", () => {
    expect(isPrivateIP("10.0.0.1")).toBe(true);
    expect(isPrivateIP("10.255.255.255")).toBe(true);
  });

  it("returns true for 127.0.0.0/8 (loopback)", () => {
    expect(isPrivateIP("127.0.0.1")).toBe(true);
    expect(isPrivateIP("127.255.255.255")).toBe(true);
  });

  it("returns true for 169.254.0.0/16 (link-local)", () => {
    expect(isPrivateIP("169.254.0.1")).toBe(true);
    expect(isPrivateIP("169.254.169.254")).toBe(true); // Cloud metadata
  });

  it("returns true for 172.16.0.0/12", () => {
    expect(isPrivateIP("172.16.0.1")).toBe(true);
    expect(isPrivateIP("172.31.255.255")).toBe(true);
    expect(isPrivateIP("172.15.0.1")).toBe(false); // Below range
    expect(isPrivateIP("172.32.0.1")).toBe(false); // Above range
  });

  it("returns true for 192.168.0.0/16", () => {
    expect(isPrivateIP("192.168.0.1")).toBe(true);
    expect(isPrivateIP("192.168.255.255")).toBe(true);
  });

  it("returns true for 100.64.0.0/10 (CGNAT/Tailscale)", () => {
    expect(isPrivateIP("100.64.0.1")).toBe(true);
    expect(isPrivateIP("100.127.255.255")).toBe(true);
    expect(isPrivateIP("100.63.0.1")).toBe(false); // Below range
    expect(isPrivateIP("100.128.0.1")).toBe(false); // Above range
  });

  it("returns true for 224-239 (multicast)", () => {
    expect(isPrivateIP("224.0.0.1")).toBe(true);
    expect(isPrivateIP("239.255.255.255")).toBe(true);
  });

  it("returns true for 240+ (reserved)", () => {
    expect(isPrivateIP("240.0.0.1")).toBe(true);
    expect(isPrivateIP("255.255.255.255")).toBe(true);
  });

  it("returns false for public IPs", () => {
    expect(isPrivateIP("8.8.8.8")).toBe(false);
    expect(isPrivateIP("1.1.1.1")).toBe(false);
    expect(isPrivateIP("142.250.80.46")).toBe(false); // Google
    expect(isPrivateIP("151.101.1.140")).toBe(false); // Reddit
  });

  it("returns true for malformed IPs (safety)", () => {
    expect(isPrivateIP("not-an-ip")).toBe(true);
    expect(isPrivateIP("256.1.1.1")).toBe(true);
    expect(isPrivateIP("1.2.3")).toBe(true);
  });

  // IPv6 tests
  it("returns true for ::1 (IPv6 loopback)", () => {
    expect(isPrivateIP("::1")).toBe(true);
  });

  it("returns true for :: (IPv6 unspecified)", () => {
    expect(isPrivateIP("::")).toBe(true);
  });

  it("returns true for fc00::/7 (unique local)", () => {
    expect(isPrivateIP("fc00::1")).toBe(true);
    expect(isPrivateIP("fd00::1")).toBe(true);
  });

  it("returns true for fe80::/10 (link-local IPv6)", () => {
    expect(isPrivateIP("fe80::1")).toBe(true);
    expect(isPrivateIP("fe90::1")).toBe(true);
    expect(isPrivateIP("fea0::1")).toBe(true);
    expect(isPrivateIP("feb0::1")).toBe(true);
  });

  it("returns true for ff00::/8 (multicast IPv6)", () => {
    expect(isPrivateIP("ff02::1")).toBe(true);
  });

  it("returns true for IPv4-mapped IPv6 with private IPv4", () => {
    expect(isPrivateIP("::ffff:10.0.0.1")).toBe(true);
    expect(isPrivateIP("::ffff:192.168.1.1")).toBe(true);
    expect(isPrivateIP("::ffff:127.0.0.1")).toBe(true);
  });

  it("returns false for IPv4-mapped IPv6 with public IPv4", () => {
    expect(isPrivateIP("::ffff:8.8.8.8")).toBe(false);
    expect(isPrivateIP("::ffff:1.1.1.1")).toBe(false);
  });

  it("returns false for public IPv6", () => {
    expect(isPrivateIP("2001:4860:4860::8888")).toBe(false); // Google DNS
  });
});

// ============================================================================
// validateDomainNotPrivate
// ============================================================================
describe("validateDomainNotPrivate", () => {
  it("throws when DNS resolves to private IP", async () => {
    // Mock dns.promises.Resolver to return private IP
    const dns = await import("node:dns");
    const resolverPrototype = dns.promises.Resolver.prototype;
    const resolve4Spy = vi.spyOn(resolverPrototype, "resolve4").mockResolvedValue(["10.0.0.1"]);
    const resolve6Spy = vi.spyOn(resolverPrototype, "resolve6").mockRejectedValue(new Error("no AAAA"));

    await expect(validateDomainNotPrivate("evil.local")).rejects.toThrow(
      "private/reserved IP"
    );

    resolve4Spy.mockRestore();
    resolve6Spy.mockRestore();
  });

  it("throws when DNS resolution fails completely", async () => {
    const dns = await import("node:dns");
    const resolverPrototype = dns.promises.Resolver.prototype;
    const resolve4Spy = vi.spyOn(resolverPrototype, "resolve4").mockRejectedValue(new Error("NXDOMAIN"));
    const resolve6Spy = vi.spyOn(resolverPrototype, "resolve6").mockRejectedValue(new Error("NXDOMAIN"));

    await expect(validateDomainNotPrivate("nonexistent.test")).rejects.toThrow(
      "DNS resolution failed"
    );

    resolve4Spy.mockRestore();
    resolve6Spy.mockRestore();
  });

  it("passes for domain resolving to public IP", async () => {
    const dns = await import("node:dns");
    const resolverPrototype = dns.promises.Resolver.prototype;
    const resolve4Spy = vi.spyOn(resolverPrototype, "resolve4").mockResolvedValue(["8.8.8.8"]);
    const resolve6Spy = vi.spyOn(resolverPrototype, "resolve6").mockRejectedValue(new Error("no AAAA"));

    await expect(validateDomainNotPrivate("public.example.com")).resolves.toBeUndefined();

    resolve4Spy.mockRestore();
    resolve6Spy.mockRestore();
  });

  it("throws when any resolved IP is private (mixed results)", async () => {
    const dns = await import("node:dns");
    const resolverPrototype = dns.promises.Resolver.prototype;
    const resolve4Spy = vi.spyOn(resolverPrototype, "resolve4").mockResolvedValue(["8.8.8.8", "127.0.0.1"]);
    const resolve6Spy = vi.spyOn(resolverPrototype, "resolve6").mockRejectedValue(new Error("no AAAA"));

    await expect(validateDomainNotPrivate("mixed.example.com")).rejects.toThrow(
      "private/reserved IP"
    );

    resolve4Spy.mockRestore();
    resolve6Spy.mockRestore();
  });

  it("checks IPv6 addresses too", async () => {
    const dns = await import("node:dns");
    const resolverPrototype = dns.promises.Resolver.prototype;
    const resolve4Spy = vi.spyOn(resolverPrototype, "resolve4").mockRejectedValue(new Error("no A"));
    const resolve6Spy = vi.spyOn(resolverPrototype, "resolve6").mockResolvedValue(["::1"]);

    await expect(validateDomainNotPrivate("ipv6-loopback.test")).rejects.toThrow(
      "private/reserved IP"
    );

    resolve4Spy.mockRestore();
    resolve6Spy.mockRestore();
  });
});
