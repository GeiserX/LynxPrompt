import { describe, it, expect } from "vitest";
import { isSafeUrl } from "@/lib/url-safety";

describe("isSafeUrl", () => {
  it("returns true for http URLs", () => {
    expect(isSafeUrl("http://example.com")).toBe(true);
  });

  it("returns true for https URLs", () => {
    expect(isSafeUrl("https://example.com/path?q=1")).toBe(true);
  });

  it("returns false for javascript: protocol", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
  });

  it("returns false for data: protocol", () => {
    expect(isSafeUrl("data:text/html,<h1>hi</h1>")).toBe(false);
  });

  it("returns false for vbscript: protocol", () => {
    expect(isSafeUrl("vbscript:MsgBox('hi')")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isSafeUrl("")).toBe(false);
  });

  it("handles leading/trailing whitespace", () => {
    expect(isSafeUrl("  https://example.com  ")).toBe(true);
  });

  it("is case insensitive for protocol", () => {
    expect(isSafeUrl("HTTPS://EXAMPLE.COM")).toBe(true);
    expect(isSafeUrl("HTTP://example.com")).toBe(true);
  });

  it("returns false for file: protocol", () => {
    expect(isSafeUrl("file:///etc/passwd")).toBe(false);
  });

  it("returns false for ftp: protocol", () => {
    expect(isSafeUrl("ftp://example.com")).toBe(false);
  });
});
