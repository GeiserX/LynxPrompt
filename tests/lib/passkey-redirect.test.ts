import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  installPasskeyRedirect,
  passkeyStepUrl,
  PASSKEY_REDIRECT_EVENT,
} from "@/lib/passkey-redirect";

const refused = () =>
  new Response(JSON.stringify({ error: "Passkey verification required", passkeyRequired: true }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });

function fakeWindow(pathname = "/wizard", search = "?step=3") {
  const server = vi.fn(async () => refused());
  const win = {
    fetch: server,
    location: {
      href: `https://lynxprompt.com${pathname}${search}`,
      origin: "https://lynxprompt.com",
      pathname,
      search,
      assign: vi.fn(),
    },
    dispatchEvent: vi.fn(),
  };
  return { win, server, asWindow: win as unknown as Window };
}

/** Whether the promise settles within a few ticks */
async function settles(p: Promise<unknown>) {
  const pending = Symbol("pending");
  const r = await Promise.race([p, new Promise((ok) => setTimeout(() => ok(pending), 20))]);
  return r !== pending;
}

let w: ReturnType<typeof fakeWindow>;
beforeEach(() => {
  w = fakeWindow();
});

describe("installPasskeyRedirect", () => {
  it("sends a refused write to the passkey step and back to the page", async () => {
    installPasskeyRedirect(w.asWindow);
    const call = w.asWindow.fetch("/api/wizard/drafts", { method: "POST", body: "{}" });

    expect(await settles(call)).toBe(false);
    expect(w.win.location.assign).toHaveBeenCalledWith(
      "/auth/verify-passkey?callbackUrl=%2Fwizard%3Fstep%3D3"
    );
    expect(w.win.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: PASSKEY_REDIRECT_EVENT })
    );
  });

  it("takes the method from a Request too", async () => {
    installPasskeyRedirect(w.asWindow);
    const call = w.asWindow.fetch(new Request("https://lynxprompt.com/api/teams", { method: "DELETE" }));
    expect(await settles(call)).toBe(false);
    expect(w.win.location.assign).toHaveBeenCalledOnce();
  });

  it("leaves a refused read to the page, so a public page keeps its visitor", async () => {
    installPasskeyRedirect(w.asWindow);
    const res = await w.asWindow.fetch("/api/user/favorites");
    expect(res.status).toBe(403);
    expect(w.win.location.assign).not.toHaveBeenCalled();
  });

  it("passes any other 403 through", async () => {
    w.server.mockResolvedValue(new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }));
    installPasskeyRedirect(w.asWindow);
    const res = await w.asWindow.fetch("/api/teams/t1", { method: "PATCH" });
    expect(await res.json()).toEqual({ error: "Forbidden" });
    expect(w.win.location.assign).not.toHaveBeenCalled();
  });

  it("ignores other origins", async () => {
    installPasskeyRedirect(w.asWindow);
    const res = await w.asWindow.fetch("https://elsewhere.example/api/x", { method: "POST" });
    expect(res.status).toBe(403);
    expect(w.win.location.assign).not.toHaveBeenCalled();
  });

  it("leaves the sign-in pages alone, they handle the passkey themselves", async () => {
    w = fakeWindow("/auth/signin", "?cli_session=abc");
    installPasskeyRedirect(w.asWindow);
    const res = await w.asWindow.fetch("/api/cli-auth/callback", { method: "POST" });
    expect(res.status).toBe(403);
    expect(w.win.location.assign).not.toHaveBeenCalled();
  });

  it("removes itself", async () => {
    const uninstall = installPasskeyRedirect(w.asWindow);
    uninstall();
    expect(w.asWindow.fetch).toBe(w.server);
  });
});

describe("passkeyStepUrl", () => {
  it("encodes the way back", () => {
    expect(passkeyStepUrl("/teams/acme?tab=sso")).toBe(
      "/auth/verify-passkey?callbackUrl=%2Fteams%2Facme%3Ftab%3Dsso"
    );
  });
});
