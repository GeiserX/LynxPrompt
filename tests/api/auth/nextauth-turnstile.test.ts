import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// The magic-link send (POST /api/auth/signin/email) must itself carry a
// Turnstile token the server verifies; a check on another endpoint can be
// skipped by posting here directly.

const nextAuthHandler = vi.fn(
  async (_req: NextRequest, _ctx: unknown) => new Response(JSON.stringify({ url: "https://x/verify" }), { status: 200 }),
);
const mockVerify = vi.fn();

vi.mock("next-auth", () => ({ default: () => nextAuthHandler }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/turnstile", () => ({ verifyTurnstileToken: mockVerify }));

function emailSignIn(fields: Record<string, string>, contentType = "application/x-www-form-urlencoded") {
  const body = contentType.includes("json") ? JSON.stringify(fields) : new URLSearchParams(fields).toString();
  return new NextRequest("https://lynxprompt.com/api/auth/signin/email", {
    method: "POST",
    headers: { "Content-Type": contentType },
    body,
  });
}

const ctx = (segments: string[]) => ({ params: Promise.resolve({ nextauth: segments }) });

async function loadRoute() {
  return import("@/app/api/auth/[...nextauth]/route");
}

describe("POST /api/auth/[...nextauth] Turnstile gate", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    nextAuthHandler.mockClear();
    mockVerify.mockReset();
  });

  it("refuses a magic-link send with no token and sends no mail", async () => {
    vi.stubEnv("ENABLE_TURNSTILE", "true");
    const { POST } = await loadRoute();

    const res = await POST(emailSignIn({ email: "a@example.com", csrfToken: "c", json: "true" }), ctx(["signin", "email"]));

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(new URL(body.url).searchParams.get("error")).toBe("TurnstileFailed");
    expect(nextAuthHandler).not.toHaveBeenCalled();
  });

  it("refuses a token Cloudflare rejects", async () => {
    vi.stubEnv("ENABLE_TURNSTILE", "true");
    mockVerify.mockResolvedValue(false);
    const { POST } = await loadRoute();

    const res = await POST(
      emailSignIn({ email: "a@example.com", csrfToken: "c", turnstileToken: "used" }),
      ctx(["signin", "email"]),
    );

    expect(res.status).toBe(403);
    expect(mockVerify).toHaveBeenCalledWith("used");
    expect(nextAuthHandler).not.toHaveBeenCalled();
  });

  it("passes a verified token through to NextAuth (form and JSON bodies)", async () => {
    vi.stubEnv("ENABLE_TURNSTILE", "true");
    mockVerify.mockResolvedValue(true);
    const { POST } = await loadRoute();

    const form = await POST(
      emailSignIn({ email: "a@example.com", csrfToken: "c", turnstileToken: "good" }),
      ctx(["signin", "email"]),
    );
    const json = await POST(
      emailSignIn({ email: "a@example.com", csrfToken: "c", turnstileToken: "good" }, "application/json"),
      ctx(["signin", "email"]),
    );

    expect(form.status).toBe(200);
    expect(json.status).toBe(200);
    expect(nextAuthHandler).toHaveBeenCalledTimes(2);
    // NextAuth can still read the body after the gate did
    const forwarded = nextAuthHandler.mock.calls[0][0];
    expect(new URLSearchParams(await forwarded.text()).get("email")).toBe("a@example.com");
  });

  it("does not gate other NextAuth actions", async () => {
    vi.stubEnv("ENABLE_TURNSTILE", "true");
    const { POST } = await loadRoute();

    const res = await POST(
      new NextRequest("https://lynxprompt.com/api/auth/signout", { method: "POST" }),
      ctx(["signout"]),
    );

    expect(res.status).toBe(200);
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it("does not gate anything when Turnstile is off", async () => {
    vi.stubEnv("ENABLE_TURNSTILE", "false");
    const { POST } = await loadRoute();

    const res = await POST(emailSignIn({ email: "a@example.com", csrfToken: "c" }), ctx(["signin", "email"]));

    expect(res.status).toBe(200);
    expect(nextAuthHandler).toHaveBeenCalledTimes(1);
  });
});
