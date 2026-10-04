import { describe, it, expect } from "vitest";
import { looksLikeLink, validateDisplayName } from "@/lib/display-name";

describe("validateDisplayName", () => {
  it.each([
    "Developer",
    "José García",
    "J.R.R. Tolkien",
    "Dr. Who",
    "O'Brien-Smith",
    "李雷",
    "Ana María de la Cruz",
    "user_42",
  ])("accepts %s", (name) => {
    expect(validateDisplayName(name)).toEqual({ ok: true, value: name });
  });

  // The report sent to security@: a URL saved as the name
  it.each([
    "https://www.google.com",
    "http://evil.example/login",
    "www.google.com",
    "google.com",
    "Visit example.co.uk now",
    "me@example.com",
    "Dr.Who",
    "john.doe",
    "ftp://files.example",
    "WWW.EXAMPLE.COM",
    "example.com.",
    "(example.com)",
    "example.com's team",
    "google\u3002com",
    "google\uFF0Ecom",
    "пример.рф",
  ])("rejects %s as a link", (name) => {
    expect(validateDisplayName(name)).toEqual({
      ok: false,
      error: "Display name cannot contain a link or web address",
    });
  });

  it("strips zero-width and control characters before checking", () => {
    expect(validateDisplayName("goo​gle.com").ok).toBe(false);
    expect(validateDisplayName("Ja​ne\u0007")).toEqual({ ok: true, value: "Jane" });
  });

  it("collapses whitespace", () => {
    expect(validateDisplayName("  Jane   Doe \n")).toEqual({ ok: true, value: "Jane Doe" });
  });

  it("rejects empty, non-string, too long and angle brackets", () => {
    expect(validateDisplayName("   ")).toEqual({ ok: false, error: "Display name cannot be empty" });
    expect(validateDisplayName(42)).toEqual({ ok: false, error: "Display name must be text" });
    expect(validateDisplayName("a".repeat(101))).toEqual({
      ok: false,
      error: "Display name must be 100 characters or fewer",
    });
    expect(validateDisplayName("<b>Jane</b>")).toEqual({
      ok: false,
      error: "Display name cannot contain < or >",
    });
  });

  it("uses the label in messages", () => {
    expect(validateDisplayName("example.com", "Team name")).toEqual({
      ok: false,
      error: "Team name cannot contain a link or web address",
    });
  });
});

describe("looksLikeLink", () => {
  it("is what the team name schema uses", () => {
    expect(looksLikeLink("Platform Team")).toBe(false);
    expect(looksLikeLink("Platform team (platform.example)")).toBe(true);
  });
});
