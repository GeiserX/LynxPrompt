// @vitest-environment node
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { matchConfigFile, rulesWritePath } from "../../cli/src/utils/blueprint-files";
import { mergeAiderConfig } from "../../cli/src/utils/generator";
import {
  isAgentsMdPointer,
  ruleFileLocations,
  agentsMdSkippedFiles,
  agentsMdPointerFiles,
} from "../../packages/shared/src/platforms";

// Every rules file a coding agent reads is recognised by push, check and
// convert; files that only import AGENTS.md and personal overrides are not
// pushed; Aider and Cline files are written without breaking what is there.

vi.mock("../../cli/src/config.js", () => ({
  isAuthenticated: () => true,
  getToken: () => "lp_test",
  getApiUrl: () => "https://lynxprompt.test",
  setUser: () => {},
}));
const spinner = vi.hoisted(() => () => {
  const s = { start: () => s, stop: () => s, succeed: () => s, fail: () => s, warn: () => s };
  return s;
});
vi.mock("ora", () => ({ default: spinner }));
vi.mock("../../cli/node_modules/ora/index.js", () => ({ default: spinner }));

// Non-literal path so the root tsc does not type-check cli/ (see cli-push-sensitive.test.ts)
const CHECK = "../../cli/src/commands/check";
let checkCommand: (options: Record<string, unknown>) => Promise<void>;
beforeAll(async () => {
  ({ checkCommand } = await import(/* @vite-ignore */ CHECK));
});

let dir: string;
let out: string[];
const RULES = "# Project rules\n\nUse TypeScript strict mode and keep functions small.\n";
const write = (rel: string, content: string) => {
  fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
  fs.writeFileSync(path.join(dir, rel), content);
};

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "lp-rules-"));
  out = [];
  process.exitCode = undefined;
  vi.spyOn(process, "cwd").mockReturnValue(dir);
  vi.spyOn(console, "log").mockImplementation((...a: unknown[]) => void out.push(a.join(" ")));
});

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("lynxp push recognises every agent's rules files", () => {
  it.each([
    ["CLAUDE.md", "CLAUDE_MD"],
    [".claude/CLAUDE.md", "CLAUDE_MD"],
    [".claude/rules/testing.md", "CLAUDE_MD"],
    [".github/instructions/api.instructions.md", "COPILOT_INSTRUCTIONS"],
    [".devin/rules/style.md", "WINDSURF_RULES"],
    [".windsurf/rules/style.md", "WINDSURF_RULES"],
    [".windsurfrules", "WINDSURF_RULES"],
    [".clinerules", "CLINE_RULES"],
    [".clinerules/style.md", "CLINE_RULES"],
    [".cline/rules/style.md", "CLINE_RULES"],
    [".junie/AGENTS.md", "JUNIE_GUIDELINES"],
    [".junie/guidelines.md", "JUNIE_GUIDELINES"],
    [".junie/rules/style.md", "JUNIE_GUIDELINES"],
    [".kilocode/rules/style.md", "KILOCODE_RULES"],
    ["WARP.md", "WARP_MD"],
    [".goosehints", "GOOSEHINTS"],
    [".openhands/microagents/repo.md", "OPENHANDS_MD"],
    ["GEMINI.md", "GEMINI_MD"],
    [".trae/rules/project_rules.md", "TRAE_RULES"],
    ["CONVENTIONS.md", "AIDER_MD"],
    [".windsurf/workflows/deploy.md", "WINDSURF_WORKFLOW"],
    // Tools without a blueprint type of their own keep their path as CUSTOM
    [".agents/rules/style.md", "CUSTOM"],
    [".tabnine/guidelines/style.md", "CUSTOM"],
    ["CRUSH.md", "CUSTOM"],
    [".gemini/commands/deploy.toml", "CUSTOM"],
    // Nested AGENTS.md stays the universal file
    ["packages/api/AGENTS.md", "AGENTS_MD"],
  ])("%s -> %s", (file, type) => {
    expect(matchConfigFile(file)?.type).toBe(type);
  });

  it("never picks up personal overrides", () => {
    for (const file of ["CLAUDE.local.md", "AGENTS.local.md", "AGENTS.override.md", "sub/CLAUDE.local.md"]) {
      expect(matchConfigFile(file)).toBeNull();
    }
  });

  it("lists every rules file and folder of the table once, and no config", () => {
    const paths = ruleFileLocations().map((l) => l.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const p of ["AGENTS.md", "CLAUDE.md", ".claude/rules/", ".devin/rules/", ".windsurfrules", ".clinerules",
      ".clinerules/", ".junie/AGENTS.md", "WARP.md", ".goosehints", ".agents/rules/", ".github/instructions/"]) {
      expect(paths).toContain(p);
    }
    expect(paths).not.toContain(".aider.conf.yml");
    expect(ruleFileLocations().find((l) => l.path === "AGENTS.md")?.name).toBe("AGENTS.md");
  });
});

describe("AGENTS.md pointers", () => {
  it("is only a file whose whole body imports AGENTS.md", () => {
    expect(isAgentsMdPointer("@AGENTS.md\n")).toBe(true);
    expect(isAgentsMdPointer("  @./AGENTS.md  \n")).toBe(true);
    expect(isAgentsMdPointer("@AGENTS.md\n\n# Claude-only notes\n")).toBe(false);
    expect(isAgentsMdPointer("@docs/AGENTS.md\n")).toBe(false);
  });

  it("skips readers of AGENTS.md and points importers at it only when AGENTS.md is generated", () => {
    const targets = [
      { platform: "universal", file: "AGENTS.md" },
      { platform: "cursor", file: ".cursor/rules/project.mdc" },
      { platform: "copilot", file: ".github/copilot-instructions.md" },
      { platform: "claude", file: "CLAUDE.md" },
    ];
    expect([...agentsMdSkippedFiles(targets)]).toEqual([".cursor/rules/project.mdc"]);
    expect([...agentsMdPointerFiles(targets)]).toEqual(["CLAUDE.md"]);
    expect(agentsMdSkippedFiles(targets.slice(1)).size).toBe(0);
    expect(agentsMdPointerFiles(targets.slice(1)).size).toBe(0);
  });
});

describe("lynxp check", () => {
  it("finds the rules of every tool and does not warn about a pointer CLAUDE.md", async () => {
    write("AGENTS.md", RULES);
    write("CLAUDE.md", "@AGENTS.md\n");
    write(".junie/guidelines.md", RULES);
    write(".devin/rules/style.md", RULES);
    write(".claude/rules/testing.md", RULES);
    write(".github/instructions/api.instructions.md", RULES);
    await checkCommand({ json: true });
    const result = JSON.parse(out.join("\n"));
    expect(result.warnings).toEqual([]);
    expect(result.files).toEqual(expect.arrayContaining([
      "AGENTS.md", "CLAUDE.md", ".junie/guidelines.md", ".devin/rules/style.md",
      ".claude/rules/testing.md", ".github/instructions/api.instructions.md",
    ]));
  });
});

describe("writing next to what is already there", () => {
  it("writes Cline's rule to .cline/rules/ when a legacy .clinerules file exists", () => {
    expect(rulesWritePath(dir, ".clinerules/project.md")).toBe(".clinerules/project.md");
    write(".clinerules", RULES);
    expect(rulesWritePath(dir, ".clinerules/project.md")).toBe(".cline/rules/project.md");
    expect(rulesWritePath(dir, "AGENTS.md")).toBe("AGENTS.md");
  });

  it("adds AGENTS.md to an existing Aider config and keeps the rest", () => {
    const existing = "# my settings\nmodel: sonnet\nread: CONVENTIONS.md\n";
    const merged = mergeAiderConfig(existing);
    expect(merged).toContain("# my settings");
    expect(merged).toContain("model: sonnet");
    expect(merged).toMatch(/read:\n\s+- CONVENTIONS\.md\n\s+- AGENTS\.md/);
    expect(mergeAiderConfig(merged)).toBe(merged);
    expect(mergeAiderConfig("")).toMatch(/read:\n\s+- AGENTS\.md/);
    expect(() => mergeAiderConfig("- a list\n")).toThrow();
  });
});
