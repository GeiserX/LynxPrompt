// @ts-nocheck
import { describe, it, expect } from "vitest";
import { isSafeUrl } from "@/lib/url-safety";

describe("isSafeUrl - catch block coverage", () => {
  it("returns false when input causes an exception", () => {
    // Pass a non-string value that will cause .trim() to throw
    // The catch block on line 11 should handle this
    const badInput = { toString() { throw new Error("boom"); } };
    expect(isSafeUrl(badInput as unknown as string)).toBe(false);
  });

  it("returns false for null input", () => {
    expect(isSafeUrl(null as unknown as string)).toBe(false);
  });

  it("returns false for undefined input", () => {
    expect(isSafeUrl(undefined as unknown as string)).toBe(false);
  });

  it("returns false for numeric input", () => {
    expect(isSafeUrl(123 as unknown as string)).toBe(false);
  });
});
