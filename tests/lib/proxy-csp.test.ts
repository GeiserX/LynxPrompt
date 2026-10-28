import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// The CSP must not allow inline script by default: only scripts that carry
// this response's nonce run, so an injected <script> or a javascript: URL
// does nothing. Next.js reads the nonce from the forwarded request headers.

function pageRequest(path = "/") {
  return new NextRequest(`https://lynxprompt.com${path}`, {
    headers: { "x-forwarded-for": "198.51.100.7" },
  });
}

function directive(csp: string, name: string): string[] {
  const part = csp.split(";").map((d) => d.trim()).find((d) => d.startsWith(`${name} `));
  return part ? part.split(/\s+/).slice(1) : [];
}

async function loadProxy() {
  vi.resetModules();
  return (await import("@/proxy")).proxy;
}

describe("proxy Content-Security-Policy", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("drops 'unsafe-inline' from script-src and allows only this response's nonce", async () => {
    const proxy = await loadProxy();
    const res = proxy(pageRequest());
    const csp = res.headers.get("Content-Security-Policy") ?? "";
    const scriptSrc = directive(csp, "script-src");

    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");

    const nonce = res.headers.get("x-middleware-request-x-nonce");
    expect(nonce).toMatch(/^[A-Za-z0-9+/=]{16,}$/);
    expect(scriptSrc).toContain(`'nonce-${nonce}'`);
  });

  it("forwards the same policy to the render so Next.js nonces its own scripts", async () => {
    const proxy = await loadProxy();
    const res = proxy(pageRequest("/wizard"));
    expect(res.headers.get("x-middleware-request-content-security-policy")).toBe(
      res.headers.get("Content-Security-Policy"),
    );
  });

  it("uses a fresh nonce on every request", async () => {
    const proxy = await loadProxy();
    const a = proxy(pageRequest()).headers.get("x-middleware-request-x-nonce");
    const b = proxy(pageRequest()).headers.get("x-middleware-request-x-nonce");
    expect(a).toBeTruthy();
    expect(a).not.toBe(b);
  });

  it("keeps the Umami and Turnstile origins when they are configured", async () => {
    vi.stubEnv("UMAMI_SCRIPT_URL", "https://stats.example.org/script.js");
    vi.stubEnv("ENABLE_TURNSTILE", "true");
    const proxy = await loadProxy();
    const csp = proxy(pageRequest()).headers.get("Content-Security-Policy") ?? "";

    expect(directive(csp, "script-src")).toEqual(
      expect.arrayContaining(["https://stats.example.org", "https://challenges.cloudflare.com"]),
    );
    expect(directive(csp, "connect-src")).toContain("https://stats.example.org");
    expect(directive(csp, "frame-src")).toContain("https://challenges.cloudflare.com");
    expect(directive(csp, "script-src")).not.toContain("'unsafe-inline'");
  });

  it("allows eval only in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const proxy = await loadProxy();
    const csp = proxy(pageRequest()).headers.get("Content-Security-Policy") ?? "";
    expect(directive(csp, "script-src")).toContain("'unsafe-eval'");
    expect(directive(csp, "script-src")).not.toContain("'unsafe-inline'");
  });
});
