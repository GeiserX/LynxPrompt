import { describe, it, expect } from "vitest";
import { convertMcpConfig } from "@/lib/platforms";

const claude = {
  mcpServers: {
    github: { command: "npx", args: ["-y", "github-mcp"], env: { GITHUB_TOKEN: "${GITHUB_TOKEN}" } },
    docs: { type: "http", url: "https://docs.example/mcp" },
  },
};

describe("convertMcpConfig", () => {
  it("keeps the mcpServers shape for Cursor and Kiro", () => {
    expect(JSON.parse(convertMcpConfig(JSON.stringify(claude), "cursor-mcp"))).toEqual(claude);
    expect(JSON.parse(convertMcpConfig(JSON.stringify(claude), "kiro-mcp"))).toEqual(claude);
  });

  it("moves servers under VS Code's key and names each transport", () => {
    expect(JSON.parse(convertMcpConfig(JSON.stringify(claude), "vscode-mcp"))).toEqual({
      servers: {
        github: { type: "stdio", ...claude.mcpServers.github },
        docs: claude.mcpServers.docs,
      },
    });
  });

  it("reads a VS Code config back, dropping VS Code's prompted inputs", () => {
    const vscode = { servers: { github: { type: "stdio", command: "npx" } }, inputs: [{ id: "token", type: "promptString" }] };
    expect(JSON.parse(convertMcpConfig(JSON.stringify(vscode), "claude-mcp"))).toEqual({ mcpServers: vscode.servers });
    expect(JSON.parse(convertMcpConfig(JSON.stringify(vscode), "vscode-mcp"))).toEqual(vscode);
  });

  it("refuses text that is not an MCP config", () => {
    expect(() => convertMcpConfig("# Rules", "cursor-mcp")).toThrow();
    expect(() => convertMcpConfig('{"servers": []}', "cursor-mcp")).toThrow(/mcpServers/);
    expect(() => convertMcpConfig(JSON.stringify(claude), "nope")).toThrow(/Unknown MCP target/);
  });
});
