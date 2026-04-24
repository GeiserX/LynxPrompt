import { describe, it, expect, vi } from "vitest";
import { cn, capitalize, slugify, formatDate, delay, getGravatarUrl } from "@/lib/utils";

describe("cn (classnames)", () => {
  it("should merge class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("should handle conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("should merge tailwind classes correctly", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
});

describe("capitalize", () => {
  it("should capitalize first letter", () => {
    expect(capitalize("hello")).toBe("Hello");
  });

  it("should handle empty string", () => {
    expect(capitalize("")).toBe("");
  });

  it("should handle already capitalized", () => {
    expect(capitalize("Hello")).toBe("Hello");
  });
});

describe("slugify", () => {
  it("should convert to lowercase slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("should remove special characters", () => {
    expect(slugify("Hello! World?")).toBe("hello-world");
  });

  it("should handle multiple spaces", () => {
    expect(slugify("Hello   World")).toBe("hello-world");
  });

  it("should trim leading and trailing hyphens", () => {
    expect(slugify("-Hello World-")).toBe("hello-world");
  });

  it("should handle underscores", () => {
    expect(slugify("hello_world")).toBe("hello-world");
  });
});

describe("formatDate", () => {
  it("formats a Date object to human-readable string", () => {
    const result = formatDate(new Date("2024-01-15T00:00:00Z"));
    expect(result).toContain("Jan");
    expect(result).toContain("15");
    expect(result).toContain("2024");
  });

  it("formats a date string", () => {
    const result = formatDate("2024-06-01");
    expect(result).toContain("Jun");
    expect(result).toContain("2024");
  });

  it("handles ISO date strings", () => {
    const result = formatDate("2023-12-25T12:00:00Z");
    expect(result).toContain("Dec");
    expect(result).toContain("2023");
  });
});

describe("delay", () => {
  it("resolves after the specified time", async () => {
    vi.useFakeTimers();
    const promise = delay(100);
    vi.advanceTimersByTime(100);
    await promise;
    vi.useRealTimers();
  });

  it("returns a Promise<void>", () => {
    vi.useFakeTimers();
    const result = delay(10);
    expect(result).toBeInstanceOf(Promise);
    vi.advanceTimersByTime(10);
    vi.useRealTimers();
  });
});

describe("getGravatarUrl", () => {
  it("returns a gravatar.com URL", () => {
    const url = getGravatarUrl("test@example.com");
    expect(url).toMatch(/^https:\/\/www\.gravatar\.com\/avatar\//);
  });

  it("uses default size of 80", () => {
    const url = getGravatarUrl("test@example.com");
    expect(url).toContain("s=80");
  });

  it("uses default image style of identicon", () => {
    const url = getGravatarUrl("test@example.com");
    expect(url).toContain("d=identicon");
  });

  it("accepts custom size", () => {
    const url = getGravatarUrl("test@example.com", 200);
    expect(url).toContain("s=200");
  });

  it("accepts custom default image", () => {
    const url = getGravatarUrl("test@example.com", 80, "retro");
    expect(url).toContain("d=retro");
  });

  it("produces consistent hash for same email", () => {
    const url1 = getGravatarUrl("test@example.com");
    const url2 = getGravatarUrl("test@example.com");
    expect(url1).toBe(url2);
  });

  it("normalizes email to lowercase and trims", () => {
    const url1 = getGravatarUrl("Test@Example.com");
    const url2 = getGravatarUrl("  test@example.com  ");
    expect(url1).toBe(url2);
  });

  it("produces different hashes for different emails", () => {
    const url1 = getGravatarUrl("alice@example.com");
    const url2 = getGravatarUrl("bob@example.com");
    expect(url1).not.toBe(url2);
  });
});
