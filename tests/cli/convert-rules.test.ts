// @vitest-environment node
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";

// `lynxp convert` on rules files, in a temp project

vi.mock("ora", () => ({
  default: () => {
    const s = { start: () => s, stop: () => s, succeed: () => s, fail: () => s, warn: () => s };
    return s;
  },
}));

// Non-literal path so the root tsc does not type-check cli/ (see cli-push-sensitive.test.ts)
const CONVERT = "../../cli/src/commands/convert";
let convertCommand: (first: string, second: string | undefined, options: Record<string, unknown>) => Promise<void>;
beforeAll(async () => {
  ({ convertCommand } = await import(/* @vite-ignore */ CONVERT));
});

let dir: string;
let out: string[];
const RULES = '# Project\n\nBuild with C:\\tools\\make.exe\nSay "hi" and end with a backslash \\\n';

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "lp-convert-rules-"));
  out = [];
  fs.writeFileSync(path.join(dir, "AGENTS.md"), RULES);
  vi.spyOn(process, "cwd").mockReturnValue(dir);
  vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    throw new Error(`exit ${code}`);
  }) as never);
  vi.spyOn(console, "log").mockImplementation((...a: unknown[]) => void out.push(a.join(" ")));
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("lynxp convert with rules files", () => {
  it("copies Markdown rules to a plain Markdown file unchanged", async () => {
    await convertCommand("AGENTS.md", "crush", {});
    expect(fs.readFileSync(path.join(dir, "CRUSH.md"), "utf-8")).toBe(RULES);
  });

  it("writes no rules file for Aider and says how Aider reads AGENTS.md", async () => {
    await expect(convertCommand("AGENTS.md", "aider", {})).rejects.toThrow("exit 1");
    expect(fs.readdirSync(dir)).toEqual(["AGENTS.md"]);
    expect(out.join("\n")).toContain("lynxp wizard -f aider");
  });
});
