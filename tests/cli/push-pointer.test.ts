// @vitest-environment node
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";

// A CLAUDE.md or GEMINI.md whose whole body is @AGENTS.md holds no rules of
// its own: `lynxp push` must not upload it as a separate blueprint.

vi.mock("../../cli/src/config.js", () => ({
  isAuthenticated: () => true,
  getToken: () => "lp_test",
  getApiUrl: () => "https://lynxprompt.test",
}));

vi.mock("../../cli/src/utils/blueprint-tracker.js", () => ({
  findBlueprintByFile: vi.fn(async () => null),
  trackBlueprint: vi.fn(async () => {}),
  updateChecksum: vi.fn(async () => {}),
  loadBlueprints: vi.fn(async () => ({ version: "1", blueprints: [] })),
  toTrackedPath: (_cwd: string, file: string) => file,
  conflictFilePath: (cwd: string, file: string) => `${cwd}/${file}.remote`,
}));

vi.mock("ora", () => ({
  default: () => {
    const s = { start: () => s, stop: () => s, succeed: () => s, fail: () => s };
    return s;
  },
}));

const prompt = vi.hoisted(() => vi.fn());
vi.mock("prompts", () => ({ default: prompt }));
vi.mock("../../cli/node_modules/prompts/index.js", () => ({ default: prompt }));

// Non-literal path so the root tsc does not type-check cli/ (see cli-push-sensitive.test.ts)
const PUSH_MODULE = "../../cli/src/commands/push";
let pushCommand: (file: string | undefined, options: Record<string, unknown>) => Promise<void>;
beforeAll(async () => {
  ({ pushCommand } = await import(/* @vite-ignore */ PUSH_MODULE));
});

let dir: string;
let out: string[];
let fetchMock: ReturnType<typeof vi.fn>;
const write = (rel: string, content: string) => {
  fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
  fs.writeFileSync(path.join(dir, rel), content);
};

beforeEach(() => {
  prompt.mockReset();
  out = [];
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "lp-push-pointer-"));
  vi.spyOn(process, "cwd").mockReturnValue(dir);
  vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    throw new Error(`exit ${code}`);
  }) as never);
  vi.spyOn(console, "log").mockImplementation((...a: unknown[]) => void out.push(a.join(" ")));
  vi.spyOn(console, "error").mockImplementation(() => {});
  fetchMock = vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}), text: async () => "{}" }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("lynxp push and AGENTS.md pointers", () => {
  it("refuses a file that only imports AGENTS.md, and sends nothing", async () => {
    write("CLAUDE.md", "@AGENTS.md\n");
    await expect(pushCommand(path.join(dir, "CLAUDE.md"), { yes: true })).rejects.toThrow("exit 1");
    expect(out.join("\n")).toContain("only imports AGENTS.md");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("--all lists AGENTS.md and the tools' own rules, never a pointer or a personal override", async () => {
    write("AGENTS.md", "# Rules\n\nUse pnpm.\n");
    write("CLAUDE.md", "@AGENTS.md\n");
    write("GEMINI.md", "@AGENTS.md\n");
    write("CLAUDE.local.md", "# My own notes\n");
    write("AGENTS.override.md", "# Local override\n");
    write(".junie/guidelines.md", "# Junie\n");
    prompt.mockResolvedValue({ confirm: false });
    await pushCommand(undefined, { all: true });
    const listed = out.join("\n");
    expect(listed).toContain("Found 2 AI config files");
    expect(listed).toContain("AGENTS.md");
    expect(listed).toContain(".junie/guidelines.md");
    expect(listed).not.toContain("CLAUDE.md");
    expect(listed).not.toContain("GEMINI.md");
    expect(listed).not.toContain("override");
  });
});
