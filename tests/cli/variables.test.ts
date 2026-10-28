import { describe, it, expect } from "vitest";
import { fillBlueprintVariables, VARIABLE_PATTERN_SOURCE } from "../../cli/src/utils/variables";
import { VARIABLE_PATTERN_SOURCE as WEB_PATTERN } from "../../src/lib/file-generator";

describe("CLI blueprint variables", () => {
  it("uses the web app's placeholder pattern", () => {
    expect(VARIABLE_PATTERN_SOURCE).toBe(WEB_PATTERN);
  });

  it("fills given values, falls back to defaults and reports the rest", () => {
    const { content, missing } = fillBlueprintVariables(
      "# [[PROJECT_NAME|demo]]\nRepo: [[repo_url]]\nTeam: [[TEAM]]\nIndex: [[IDX|items[0]]]",
      { PROJECT_NAME: "acme", REPO_URL: "https://git.example/acme" }
    );
    expect(content).toBe("# acme\nRepo: https://git.example/acme\nTeam: [[TEAM]]\nIndex: items[0]");
    expect(missing).toEqual(["TEAM"]);
  });

});
