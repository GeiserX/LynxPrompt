// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { findRuleLocations, findRuleFiles } from "../../cli/src/utils/rule-locations";

// lynxp status and lynxp link see every file the wizard writes, from the
// shared platform table, not a list of their own.

let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "lp-rules-"));
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

function write(rel: string, content = "# Rules\n") {
  fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
  fs.writeFileSync(path.join(dir, rel), content);
}

describe("findRuleLocations", () => {
  it("finds the files the wizard writes for Kiro, Devin, Gemini CLI, Roo, Trae and Cline", () => {
    for (const f of [
      ".clinerules/project.md",
      ".devin/rules/project.md",
      ".kiro/steering/project.md",
      ".roo/rules/project.md",
      ".trae/rules/project_rules.md",
      "GEMINI.md",
    ]) write(f);
    const files = findRuleFiles(dir);
    expect(files.sort()).toEqual(
      [
        ".clinerules/project.md",
        ".devin/rules/project.md",
        ".kiro/steering/project.md",
        ".roo/rules/project.md",
        ".trae/rules/project_rules.md",
        "GEMINI.md",
      ].sort()
    );
  });

  it("never offers a folder as a file", () => {
    write(".clinerules/project.md");
    expect(findRuleFiles(dir)).not.toContain(".clinerules");
    expect(findRuleLocations(dir).files.map((f) => f.path)).not.toContain(".clinerules");
  });

  it("still reads a legacy .clinerules file", () => {
    write(".clinerules");
    expect(findRuleFiles(dir)).toEqual([".clinerules"]);
  });

  it("reports a rules folder once, with its files", () => {
    write(".cursor/rules/project.mdc");
    write(".cursor/rules/style.mdc");
    const { files, dirs } = findRuleLocations(dir);
    expect(files).toEqual([]);
    expect(dirs).toEqual([{ path: ".cursor/rules/", name: "Cursor", files: ["project.mdc", "style.mdc"] }]);
  });

  it("drops retired locations", () => {
    write(".amazonq/rules/a.md");
    expect(findRuleFiles(dir)).toEqual([]);
  });
});

