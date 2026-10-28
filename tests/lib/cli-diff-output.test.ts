import { describe, it, expect } from "vitest";
import { computeDiff, formatDiff } from "../../cli/src/utils/line-diff";

describe("lynxp diff output", () => {
  it("prints no escape or bidi controls from remote blueprint content", () => {
    const remote = "# Rules\n\u001b[2J\u001b]0;pwned\u0007cleared\nshared\n\u202eevil\u009b";
    const local = "# Rules\nlocal only\nshared";
    // chalk may add its own color codes (ESC [ n m) when colors are on; strip
    // only those, then no ESC may be left.
    const out = formatDiff(computeDiff(remote, local)).replace(/\u001b\[\d+(;\d+)*m/g, "");
    expect(out).not.toMatch(/[\u001b\u0007\u009b\u202e]/);
    expect(out).toContain("[2J]0;pwnedcleared");
    expect(out).toContain("evil");
    expect(out).toContain("local only");
  });

  it("still compares the raw text, so a control-only change shows as a change", () => {
    const diff = computeDiff("a\u001b[2J", "a[2J");
    expect(diff.some((d) => d.type !== "same")).toBe(true);
  });

  it("treats a final newline as the end of the last line, not an added line", () => {
    expect(computeDiff("# Rules\nshared", "# Rules\nshared\n").every((d) => d.type === "same")).toBe(true);
    expect(computeDiff("# Rules\nshared", "# Rules\nshared\n\n").some((d) => d.type === "add")).toBe(true);
  });
});
