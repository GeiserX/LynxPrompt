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

  it("writes the servers into Gemini CLI's settings and keeps its other settings", async () => {
    write(".mcp.json", JSON.stringify({ mcpServers: { ...servers, docs: { type: "http", url: "https://docs.example/mcp" } } }));
    write(".gemini/settings.json", JSON.stringify({ theme: "Dracula", general: { vimMode: true } }, null, 2));

    await convertCommand(".mcp.json", "gemini-mcp", {});
    expect(JSON.parse(read(".gemini/settings.json"))).toEqual({
      theme: "Dracula",
      general: { vimMode: true },
      mcpServers: { ...servers, docs: { httpUrl: "https://docs.example/mcp" } },
    });

    // Servers are there now: replacing them needs --force, and keeps the rest
    write(".mcp.json", JSON.stringify({ mcpServers: { other: { command: "x" } } }));
    await expect(convertCommand(".mcp.json", "gemini-mcp", {})).rejects.toThrow("exit 1");
    await convertCommand(".mcp.json", "gemini-mcp", { force: true });
    expect(JSON.parse(read(".gemini/settings.json"))).toEqual({
      theme: "Dracula",
      general: { vimMode: true },
      mcpServers: { other: { command: "x" } },
    });
  });

  it("adds Codex tables to an existing config.toml and reads Codex back", async () => {
    write(".mcp.json", JSON.stringify({ mcpServers: servers }));
    write(".codex/config.toml", 'model = "o3"\n\n[tui]\nnotifications = true\n');

    await convertCommand("codex-mcp", undefined, {});
    const toml = read(".codex/config.toml");
    expect(toml).toBe('model = "o3"\n\n[tui]\nnotifications = true\n\n[mcp_servers.github]\ncommand = "npx"\nargs = ["-y", "github-mcp"]\n');

    fs.rmSync(path.join(dir, ".mcp.json"));
    await convertCommand(".codex/config.toml", "cursor-mcp", {});
    expect(JSON.parse(read(".cursor/mcp.json"))).toEqual({ mcpServers: servers });
  });

  it("skips a settings file without MCP servers when looking for a source", async () => {
    // Gemini comes before Codex in the table, but has no servers
    write(".gemini/settings.json", JSON.stringify({ theme: "Dracula" }));
    write(".codex/config.toml", '[mcp_servers.github]\ncommand = "npx"\nargs = ["-y", "github-mcp"]\n');
    await convertCommand("cursor-mcp", undefined, {});
    expect(JSON.parse(read(".cursor/mcp.json"))).toEqual({ mcpServers: servers });

    fs.rmSync(path.join(dir, ".codex"), { recursive: true });
    fs.rmSync(path.join(dir, ".cursor"), { recursive: true });
    await expect(convertCommand("cursor-mcp", undefined, {})).rejects.toThrow("exit 1");
    expect(fs.existsSync(path.join(dir, ".cursor/mcp.json"))).toBe(false);
  });
});
