import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { existsSync } from "fs";
import path from "path";
import { render, screen, waitFor } from "@testing-library/react";

const replace = vi.fn();
let pathname = "/teams/acme";
// Stable like Next's own router and session, so the guard's effect runs once
const router = { push: vi.fn(), replace, prefetch: vi.fn(), back: vi.fn() };
const session = { data: { user: { id: "u1" } }, status: "authenticated" };
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => pathname,
}));
vi.mock("next-auth/react", () => ({
  useSession: () => session,
}));

import { PasskeyGuard } from "@/components/passkey-guard";

function stubPasskeyCheck(body: { required: boolean; verified: boolean }) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(new Response(JSON.stringify(body))))
  );
}

beforeEach(() => {
  replace.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

describe("PasskeyGuard", () => {
  it("sends an unverified passkey user to the passkey step, keeping the query", async () => {
    pathname = "/teams/acme";
    window.history.replaceState(null, "", "/teams/acme?tab=members&token=tok_1");
    stubPasskeyCheck({ required: true, verified: false });

    render(<PasskeyGuard>private</PasskeyGuard>);

    await waitFor(() => expect(replace).toHaveBeenCalledTimes(1));
    const target = new URL(replace.mock.calls[0][0], "http://localhost");
    expect(target.pathname).toBe("/auth/verify-passkey");
    expect(target.searchParams.get("callbackUrl")).toBe(
      "/teams/acme?tab=members&token=tok_1"
    );
    expect(screen.queryByText("private")).toBeNull();
  });

  it("uses the bare path when the page has no query", async () => {
    pathname = "/dashboard";
    window.history.replaceState(null, "", "/dashboard");
    stubPasskeyCheck({ required: true, verified: false });

    render(<PasskeyGuard>private</PasskeyGuard>);

    await waitFor(() => expect(replace).toHaveBeenCalledTimes(1));
    expect(replace.mock.calls[0][0]).toBe(
      "/auth/verify-passkey?callbackUrl=%2Fdashboard"
    );
  });

  it("renders the page for a verified session", async () => {
    pathname = "/teams/acme";
    window.history.replaceState(null, "", "/teams/acme");
    stubPasskeyCheck({ required: true, verified: true });

    render(<PasskeyGuard>private</PasskeyGuard>);

    expect(await screen.findByText("private")).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("teams pages under the guard", () => {
  const app = path.resolve(__dirname, "../../src/app/teams");

  it("guards the private team page", () => {
    expect(existsSync(path.join(app, "[slug]/layout.tsx"))).toBe(true);
  });

  it("leaves the public teams page and the invite link page unguarded", () => {
    // The landing page is public and indexed; the join page reads its invite
    // token from the query and the fetch wrapper covers its accept POST
    expect(existsSync(path.join(app, "layout.tsx"))).toBe(false);
    expect(existsSync(path.join(app, "join/layout.tsx"))).toBe(false);
  });
});
