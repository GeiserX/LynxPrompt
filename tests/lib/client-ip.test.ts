import { describe, it, expect, afterEach, vi } from "vitest";
import { getClientIP } from "@/lib/client-ip";

function req(headers: Record<string, string>) {
  return { headers: new Headers(headers) };
}

describe("getClientIP", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("takes the entry the proxy appended, not the client-supplied left ones", () => {
    expect(getClientIP(req({ "x-forwarded-for": "6.6.6.6, 203.0.113.9" }))).toBe("203.0.113.9");
  });

  it("ignores CF-Connecting-IP and X-Real-IP unless Cloudflare is trusted", () => {
    expect(
      getClientIP(req({
        "cf-connecting-ip": "1.2.3.4",
        "x-real-ip": "5.6.7.8",
        "x-forwarded-for": "203.0.113.9",
      })),
    ).toBe("203.0.113.9");
  });

  it("counts TRUSTED_PROXY hops from the right", () => {
    vi.stubEnv("TRUSTED_PROXY", "2");
    expect(getClientIP(req({ "x-forwarded-for": "6.6.6.6, 203.0.113.9, 10.0.0.2" }))).toBe("203.0.113.9");
  });

  it("uses the leftmost entry when there are fewer entries than hops", () => {
    vi.stubEnv("TRUSTED_PROXY", "3");
    expect(getClientIP(req({ "x-forwarded-for": "203.0.113.9, 10.0.0.2" }))).toBe("203.0.113.9");
  });

  it("reads CF-Connecting-IP when TRUSTED_PROXY=cloudflare", () => {
    vi.stubEnv("TRUSTED_PROXY", "cloudflare");
    expect(
      getClientIP(req({ "cf-connecting-ip": "198.51.100.7", "x-forwarded-for": "6.6.6.6, 172.68.1.1" })),
    ).toBe("198.51.100.7");
  });

  it("falls back to the rightmost entry when Cloudflare is trusted but the header is missing", () => {
    vi.stubEnv("TRUSTED_PROXY", "cloudflare");
    expect(getClientIP(req({ "x-forwarded-for": "6.6.6.6, 203.0.113.9" }))).toBe("203.0.113.9");
  });

  it("treats an invalid TRUSTED_PROXY as one hop", () => {
    vi.stubEnv("TRUSTED_PROXY", "0");
    expect(getClientIP(req({ "x-forwarded-for": "6.6.6.6, 203.0.113.9" }))).toBe("203.0.113.9");
  });

  it("returns unknown without any address header", () => {
    expect(getClientIP(req({}))).toBe("unknown");
  });
});
