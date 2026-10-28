// @vitest-environment node
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";

// `lynxp convert` on MCP configs, in a temp project

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
const write = (p: string, content: string) => {
  fs.mkdirSync(path.dirname(path.join(dir, p)), { recursive: true });
  fs.writeFileSync(path.join(dir, p), content);
};
const read = (p: string) => fs.readFileSync(path.join(dir, p), "utf-8");
const servers = { github: { command: "npx", args: ["-y", "github-mcp"] } };

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "lp-convert-mcp-"));
  vi.spyOn(process, "cwd").mockReturnValue(dir);
  vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    throw new Error(`exit ${code}`);
  }) as never);
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("lynxp convert with MCP configs", () => {
  it("writes the project's .mcp.json servers as VS Code's .vscode/mcp.json", async () => {
    write(".mcp.json", JSON.stringify({ mcpServers: servers }));

    await convertCommand("vscode-mcp", undefined, {});

    expect(JSON.parse(read(".vscode/mcp.json"))).toEqual({ servers: { github: { type: "stdio", ...servers.github } } });
  });

  it("converts a named source to Cursor and keeps an existing file without --force", async () => {
    write(".vscode/mcp.json", JSON.stringify({ servers }));

    await convertCommand(".vscode/mcp.json", "cursor-mcp", {});
    expect(JSON.parse(read(".cursor/mcp.json"))).toEqual({ mcpServers: servers });

    write(".cursor/mcp.json", "{}");
    await expect(convertCommand(".vscode/mcp.json", "cursor-mcp", {})).rejects.toThrow("exit 1");
    expect(read(".cursor/mcp.json")).toBe("{}");
  });

  it("refuses to turn an MCP config into a rules file", async () => {
    write(".mcp.json", JSON.stringify({ mcpServers: servers }));

    await expect(convertCommand(".mcp.json", "cursor", {})).rejects.toThrow("exit 1");
    expect(fs.existsSync(path.join(dir, ".cursor/rules/project.mdc"))).toBe(false);
  });
});
