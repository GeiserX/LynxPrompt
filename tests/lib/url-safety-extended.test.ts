import { describe, it, expect } from "vitest";
import { isSafeUrl } from "@/lib/url-safety";

describe("isSafeUrl - comprehensive", () => {
  it("accepts http URLs", () => {
    expect(isSafeUrl("http://example.com")).toBe(true);
  });

  it("accepts https URLs", () => {
    expect(isSafeUrl("https://example.com")).toBe(true);
  });

  it("accepts URLs with paths", () => {
    expect(isSafeUrl("https://example.com/path/to/resource")).toBe(true);
  });

  it("accepts URLs with query strings", () => {
    expect(isSafeUrl("https://example.com?key=value")).toBe(true);
  });

  it("rejects javascript: protocol", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
  });

  it("rejects data: protocol", () => {
    expect(isSafeUrl("data:text/html,<h1>test</h1>")).toBe(false);
  });

  it("rejects vbscript: protocol", () => {
    expect(isSafeUrl("vbscript:msgbox")).toBe(false);
  });

  it("rejects ftp: protocol", () => {
    expect(isSafeUrl("ftp://files.example.com")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isSafeUrl("")).toBe(false);
  });

  it("rejects plain text", () => {
    expect(isSafeUrl("not a url")).toBe(false);
  });

  it("handles leading whitespace", () => {
    expect(isSafeUrl("  https://example.com")).toBe(true);
  });

  it("handles trailing whitespace", () => {
    expect(isSafeUrl("https://example.com  ")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isSafeUrl("HTTPS://EXAMPLE.COM")).toBe(true);
    expect(isSafeUrl("HTTP://EXAMPLE.COM")).toBe(true);
  });

  it("rejects JAVASCRIPT: with mixed case", () => {
    expect(isSafeUrl("JavaScript:alert(1)")).toBe(false);
  });

  it("rejects file: protocol", () => {
    expect(isSafeUrl("file:///etc/passwd")).toBe(false);
  });
});
