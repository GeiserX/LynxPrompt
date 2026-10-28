// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";

// api.checkLogin, used by `lynxp config set-url` and `reset-url` to ask the
// instance whether the token saved for it still works. fetch is stubbed.
vi.mock("../../cli/src/config.js", () => ({
  getToken: () => "lp_saved",
  getApiUrl: () => "https://prompts.example.org",
}));

// Non-literal path so the root tsc does not type-check cli/
const API = "../../cli/src/api";
type CheckResult = { ok: true; email: string } | { ok: false; rejected: boolean; reason: string };
async function checkLogin(): Promise<CheckResult> {
  const { api } = await import(/* @vite-ignore */ API);
  return api.checkLogin();
}

const respond = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

afterEach(() => vi.unstubAllGlobals());

describe("api.checkLogin", () => {
  it("sends the saved token to the current instance and returns the account", async () => {
    const fetchMock = vi.fn(async () => respond(200, { user: { id: "u1", email: "me@example.org" } }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await checkLogin()).toEqual({ ok: true, email: "me@example.org" });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://prompts.example.org/api/v1/user");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer lp_saved");
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it.each([401, 403])("calls a %s a rejected login", async (status) => {
    vi.stubGlobal("fetch", vi.fn(async () => respond(status, { error: "Invalid token" })));
    expect(await checkLogin()).toEqual({ ok: false, rejected: true, reason: "Invalid token" });
  });

  it("does not call a server error a rejected login", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => respond(502, { error: "Bad gateway" })));
    expect(await checkLogin()).toMatchObject({ ok: false, rejected: false });
  });

  it("reports an unreachable instance without throwing", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("fetch failed"))));
    expect(await checkLogin()).toEqual({ ok: false, rejected: false, reason: "fetch failed" });
  });
});
