import { expect, it } from "vitest";

// PLANTED, reverted next commit: proves the release workflow stops on a red test.
it("planted failure", () => {
  expect(1).toBe(2);
});
