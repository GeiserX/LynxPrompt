import { describe, it, expect } from "vitest";
import { safeCallbackUrl } from "@/lib/safe-callback-url";

describe("safeCallbackUrl", () => {
  it.each([
    "/\\evil.com",
    "/\\/evil.com",
    "//evil.com",
    "/\t/evil.com",
    "/.//evil.com",
    "/..//evil.com",
    "/a/..//evil.com",
    "/%2e//evil.com",
    "/./\\evil.com",
    "https://evil.com",
    "javascript:alert(1)",
    "evil.com",
    "",
  ])("rejects %j", (raw) => {
    expect(safeCallbackUrl(raw)).toBe("/dashboard");
  });

  it("falls back when missing", () => {
    expect(safeCallbackUrl(null)).toBe("/dashboard");
    expect(safeCallbackUrl(undefined, "/home")).toBe("/home");
  });

  it.each([
    ["/dashboard", "/dashboard"],
    ["/settings?tab=security#passkeys", "/settings?tab=security#passkeys"],
    ["/auth/signin?cli_session=abc123", "/auth/signin?cli_session=abc123"],
  ])("keeps the same-origin path %j", (raw, expected) => {
    expect(safeCallbackUrl(raw)).toBe(expected);
  });
});
