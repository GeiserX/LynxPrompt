import { describe, it, expect } from "vitest";
import { safeText } from "../../cli/src/utils/terminal";

describe("CLI safeText", () => {
  it("drops terminal escape sequences' control bytes", () => {
    const out = safeText("Nice\u001b[2J\u001b]0;pwned\u0007 title\r");
    expect(out).not.toMatch(/[\u001b\u0007\r]/);
    expect(out).toBe("Nice[2J]0;pwned title");
  });

  it("drops C1 controls and bidi overrides", () => {
    expect(safeText("a\u009bb\u202ec\u2066d")).toBe("abcd");
  });

  it("keeps tabs, newlines, emoji joiners and ordinary text", () => {
    const text = "line 1\n\tline 2 👨‍👩‍👧 café";
    expect(safeText(text)).toBe(text);
  });

  it("turns null and undefined into an empty string", () => {
    expect(safeText(undefined)).toBe("");
    expect(safeText(null)).toBe("");
  });
});
