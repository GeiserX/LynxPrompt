import { describe, it, expect } from "vitest";
import { cn, capitalize, slugify } from "@/lib/utils";

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
});
