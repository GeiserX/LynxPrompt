import { describe, it, expect } from "vitest";
import { isPrivateIP } from "@/lib/network-security";

describe("isPrivateIP", () => {
  // IPv4 private ranges
  it("returns true for 10.x.x.x (RFC 1918)", () => {
    expect(isPrivateIP("10.0.0.1")).toBe(true);
    expect(isPrivateIP("10.255.255.255")).toBe(true);
  });

  it("returns true for 172.16-31.x.x (RFC 1918)", () => {
    expect(isPrivateIP("172.16.0.1")).toBe(true);
    expect(isPrivateIP("172.31.255.255")).toBe(true);
  });

  it("returns false for 172.15.x.x and 172.32.x.x", () => {
    expect(isPrivateIP("172.15.0.1")).toBe(false);
    expect(isPrivateIP("172.32.0.1")).toBe(false);
  });

  it("returns true for 192.168.x.x (RFC 1918)", () => {
    expect(isPrivateIP("192.168.0.1")).toBe(true);
    expect(isPrivateIP("192.168.10.100")).toBe(true);
  });

  it("returns true for 127.x.x.x (loopback)", () => {
    expect(isPrivateIP("127.0.0.1")).toBe(true);
    expect(isPrivateIP("127.255.255.255")).toBe(true);
  });

  it("returns true for 0.0.0.0/8", () => {
    expect(isPrivateIP("0.0.0.0")).toBe(true);
  });

  it("returns true for 169.254.x.x (link-local / cloud metadata)", () => {
    expect(isPrivateIP("169.254.169.254")).toBe(true);
    expect(isPrivateIP("169.254.0.1")).toBe(true);
  });

  it("returns true for 100.64-127.x.x (CGNAT/Tailscale)", () => {
    expect(isPrivateIP("100.64.0.1")).toBe(true);
    expect(isPrivateIP("100.127.255.255")).toBe(true);
  });

  it("returns false for 100.63.x.x and 100.128.x.x", () => {
    expect(isPrivateIP("100.63.0.1")).toBe(false);
    expect(isPrivateIP("100.128.0.1")).toBe(false);
  });

  it("returns true for multicast range 224-239.x.x.x", () => {
    expect(isPrivateIP("224.0.0.1")).toBe(true);
    expect(isPrivateIP("239.255.255.255")).toBe(true);
  });

  it("returns true for reserved range 240+", () => {
    expect(isPrivateIP("240.0.0.1")).toBe(true);
    expect(isPrivateIP("255.255.255.255")).toBe(true);
  });

  it("returns false for public IPs", () => {
    expect(isPrivateIP("8.8.8.8")).toBe(false);
    expect(isPrivateIP("1.1.1.1")).toBe(false);
    expect(isPrivateIP("203.0.113.1")).toBe(false);
    expect(isPrivateIP("142.250.185.46")).toBe(false);
  });

  it("returns true for malformed IPv4 (safety fallback)", () => {
    expect(isPrivateIP("999.999.999.999")).toBe(true);
    expect(isPrivateIP("abc.def.ghi.jkl")).toBe(true);
    expect(isPrivateIP("1.2.3")).toBe(true);
  });

  // IPv6
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

  it("returns true for fe80::/10 (link-local)", () => {
    expect(isPrivateIP("fe80::1")).toBe(true);
    expect(isPrivateIP("fe90::1")).toBe(true);
    expect(isPrivateIP("fea0::1")).toBe(true);
    expect(isPrivateIP("feb0::1")).toBe(true);
  });

  it("returns true for ff00::/8 (multicast)", () => {
    expect(isPrivateIP("ff02::1")).toBe(true);
  });

  it("returns true for IPv4-mapped IPv6 with private IPv4", () => {
    expect(isPrivateIP("::ffff:10.0.0.1")).toBe(true);
    expect(isPrivateIP("::ffff:192.168.1.1")).toBe(true);
    expect(isPrivateIP("::ffff:127.0.0.1")).toBe(true);
  });

  it("returns false for IPv4-mapped IPv6 with public IPv4", () => {
    expect(isPrivateIP("::ffff:8.8.8.8")).toBe(false);
  });

  it("returns false for public IPv6 addresses", () => {
    expect(isPrivateIP("2001:4860:4860::8888")).toBe(false);
  });
});
