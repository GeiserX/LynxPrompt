import { describe, it, expect } from "vitest";
import {
  MCP_CONFIGS,
  convertMcpConfig,
  extractMcpConfig,
  mergeMcpConfig,
  mcpConfigForPath,
} from "@/lib/platforms";

// MCP configs for every tool: each target's file, key and entry shape, the
// way back, and writing into a settings file without losing its settings

const servers = {
  github: { command: "npx", args: ["-y", "github-mcp"], env: { GITHUB_TOKEN: "${GITHUB_TOKEN}" } },
  docs: { type: "http", url: "https://docs.example/mcp", headers: { Authorization: "Bearer ${DOCS_TOKEN}" } },
  legacy: { type: "sse", url: "https://old.example/sse" },
};
const claude = JSON.stringify({ mcpServers: servers });

// Tools that speak streamable HTTP only leave SSE servers out
const NO_SSE = new Set(["antigravity-mcp", "codex-mcp", "vibe-mcp"]);
// OpenCode, Kilo and Zed have one remote kind, so an SSE server comes back as HTTP
const ONE_REMOTE = new Set(["opencode-mcp", "kilo-mcp", "zed-mcp"]);

// The common entry with VS Code's added "stdio" type dropped, for comparing
function common(json: string) {
  const out = JSON.parse(json).mcpServers as Record<string, Record<string, unknown>>;
  for (const s of Object.values(out)) if (s.type === "stdio") delete s.type;
  return out;
}

describe("MCP targets", () => {
  it("covers every tool of the research table, and not the files that do not exist", () => {
    const files = MCP_CONFIGS.map((c) => c.file);
    for (const f of [
      ".mcp.json", ".cursor/mcp.json", ".vscode/mcp.json", ".kiro/settings/mcp.json", ".github/mcp.json",
      ".agents/mcp_config.json", ".devin/mcp_config.json", ".junie/mcp/mcp.json", ".factory/mcp.json",
      ".trae/mcp.json", ".roo/mcp.json", ".kimi-code/mcp.json", ".pi/mcp.json", ".warp/.mcp.json",
      ".gemini/settings.json", ".qwen/settings.json", ".augment/settings.json", "firebender.json",
      ".zed/settings.json", ".amp/settings.json", "opencode.json", "kilo.jsonc", ".codex/config.toml", ".vibe/config.toml",
    ]) {
      expect(files).toContain(f);
    }
    expect(files).not.toContain(".windsurf/mcp_config.json");
    expect(files).not.toContain(".idx/mcp.json");
    expect(new Set(MCP_CONFIGS.map((c) => c.id)).size).toBe(MCP_CONFIGS.length);
    expect(mcpConfigForPath("apps/web/.zed/settings.json")?.id).toBe("zed-mcp");
    expect(mcpConfigForPath("settings.json")).toBeUndefined();
    // Warp's file ends in /.mcp.json too, but is not Claude Code's
    expect(mcpConfigForPath(".warp/.mcp.json")?.id).toBe("warp-mcp");
    expect(mcpConfigForPath("apps/web/.warp/.mcp.json")?.id).toBe("warp-mcp");
    expect(mcpConfigForPath("apps/web/.mcp.json")?.id).toBe("claude-mcp");
  });

  for (const target of MCP_CONFIGS) {
    it(`${target.id}: converts there and back without losing a server`, () => {
      const written = convertMcpConfig(claude, target.id);
      const back = common(convertMcpConfig(written, "claude-mcp", target.file));
      const expected = { ...servers } as Record<string, unknown>;
      if (NO_SSE.has(target.id)) delete expected.legacy;
      if (ONE_REMOTE.has(target.id)) expected.legacy = { type: "http", url: "https://old.example/sse" };
      expect(back).toEqual(expected);
    });

    it(`${target.id}: refuses a broken config`, () => {
      expect(() => convertMcpConfig("{", target.id)).toThrow();
      expect(() => convertMcpConfig(JSON.stringify({ [target.key]: "npx" }), target.id)).toThrow(/mcpServers/);
      expect(() => convertMcpConfig(JSON.stringify({ mcpServers: { x: "npx" } }), target.id)).toThrow(/not an object/);
    });
  }

  it("writes each tool's own entry shape", () => {
    const parse = (id: string) => JSON.parse(convertMcpConfig(claude, id));
    expect(parse("gemini-mcp").mcpServers).toEqual({
      github: servers.github,
      docs: { httpUrl: "https://docs.example/mcp", headers: servers.docs.headers },
      legacy: { url: "https://old.example/sse" },
    });
    expect(parse("antigravity-mcp").mcpServers).toEqual({
      github: servers.github,
      docs: { serverUrl: "https://docs.example/mcp", headers: servers.docs.headers },
    });
    expect(parse("opencode-mcp").mcp.github).toEqual({
      type: "local", command: ["npx", "-y", "github-mcp"], environment: servers.github.env,
    });
    expect(parse("kilo-mcp").mcp.docs).toEqual({ type: "remote", url: "https://docs.example/mcp", headers: servers.docs.headers });
    expect(parse("zed-mcp").context_servers.docs).toEqual({ url: "https://docs.example/mcp", headers: servers.docs.headers });
    expect(Object.keys(parse("amp-mcp"))).toEqual(["amp.mcpServers"]);
    expect(parse("vscode-mcp").servers.github.type).toBe("stdio");
  });

  it("writes Codex and Vibe TOML", () => {
    expect(convertMcpConfig(claude, "codex-mcp")).toBe(
      [
        "[mcp_servers.github]",
        'command = "npx"',
        'args = ["-y", "github-mcp"]',
        'env = { GITHUB_TOKEN = "${GITHUB_TOKEN}" }',
        "",
        "[mcp_servers.docs]",
        'url = "https://docs.example/mcp"',
        'http_headers = { Authorization = "Bearer ${DOCS_TOKEN}" }',
        "",
      ].join("\n")
    );
    expect(convertMcpConfig(claude, "vibe-mcp")).toBe(
      [
        "[[mcp_servers]]",
        'name = "github"',
        'transport = "stdio"',
        'command = "npx"',
        'args = ["-y", "github-mcp"]',
        'env = { GITHUB_TOKEN = "${GITHUB_TOKEN}" }',
        "",
        "[[mcp_servers]]",
        'name = "docs"',
        'transport = "streamable-http"',
        'url = "https://docs.example/mcp"',
        'headers = { Authorization = "Bearer ${DOCS_TOKEN}" }',
        "",
      ].join("\n")
    );
  });

  it("reads every tool's format as a source", () => {
    const toClaude = (content: string, from?: string) => JSON.parse(convertMcpConfig(content, "claude-mcp", from)).mcpServers;
    // Gemini: httpUrl is streamable HTTP, a bare url is SSE
    expect(toClaude('{"theme":"dark","mcpServers":{"a":{"httpUrl":"https://a"},"b":{"url":"https://b"}}}', ".gemini/settings.json")).toEqual({
      a: { type: "http", url: "https://a" },
      b: { type: "sse", url: "https://b" },
    });
    expect(toClaude('{"mcpServers":{"a":{"serverUrl":"https://a"}}}', ".agents/mcp_config.json")).toEqual({ a: { type: "http", url: "https://a" } });
    expect(toClaude('{"mcp":{"a":{"type":"local","command":["uvx","srv"],"environment":{"K":"v"},"enabled":true}}}')).toEqual({
      a: { command: "uvx", args: ["srv"], env: { K: "v" } },
    });
    // Zed, current and older nested form
    expect(toClaude('{"context_servers":{"a":{"command":"x","args":["1"]},"b":{"command":{"path":"y","args":[]},"settings":{}}}}')).toEqual({
      a: { command: "x", args: ["1"] },
      b: { command: "y", args: [] },
    });
    expect(toClaude('{"amp.mcpServers":{"a":{"command":"x"}}}')).toEqual({ a: { command: "x" } });
    expect(
      toClaude('model = "o3"\n\n[mcp_servers.a]\ncommand = "x"\nargs = ["1"]\n\n[mcp_servers.a.env]\nK = "v"\n\n[mcp_servers.b]\nurl = "https://b"\nbearer_token_env_var = "TOKEN"\n', ".codex/config.toml")
    ).toEqual({
      a: { command: "x", args: ["1"], env: { K: "v" } },
      b: { type: "http", url: "https://b", headers: { Authorization: "Bearer ${TOKEN}" } },
    });
    expect(
      toClaude('[[mcp_servers]]\nname = "a"\ntransport = "streamable-http"\nurl = "https://a"\n\n[mcp_servers.auth]\ntype = "static"\nheaders = { "X-Key" = "1" }\n')
    ).toEqual({ a: { type: "http", url: "https://a", headers: { "X-Key": "1" } } });
    // kilo.jsonc: comments and trailing commas
    expect(toClaude('{\n  // servers\n  "mcp": {\n    "a": { "type": "remote", "url": "https://a/*x*/", }, /* end */\n  },\n}')).toEqual({
      a: { type: "http", url: "https://a/*x*/" },
    });
  });

  it("reads multi-line TOML strings", () => {
    const toml = [
      "[mcp_servers.a]",
      'command = """',
      "np\\",
      '   x"""',
      "args = ['''",
      "-y \\n''', \"b\"]",
      "",
    ].join("\n");
    expect(JSON.parse(convertMcpConfig(toml, "claude-mcp", ".codex/config.toml"))).toEqual({
      mcpServers: { a: { command: "npx", args: ["-y \\n", "b"] } },
    });
  });

  it("refuses TOML it cannot read rather than misreading it", () => {
    expect(() => convertMcpConfig('[mcp_servers.a]\ncommand = """x\n', "claude-mcp", ".codex/config.toml")).toThrow(/unterminated/);
    expect(() => convertMcpConfig('[mcp_servers.a]\ncommand = "x" extra\n', "claude-mcp", ".codex/config.toml")).toThrow(/TOML line 2/);
    expect(() => convertMcpConfig('[[mcp_servers]]\ncommand = "x"\n', "claude-mcp")).toThrow(/no name/);
  });
});

describe("mergeMcpConfig and extractMcpConfig", () => {
  const gemini = convertMcpConfig(claude, "gemini-mcp");

  it("adds the servers to a settings file and keeps every other key", () => {
    const merged = mergeMcpConfig('{\n  "theme": "dark",\n  "general": { "vimMode": true }\n}\n', gemini, "gemini-mcp", ".gemini/settings.json");
    const doc = JSON.parse(merged);
    expect(doc.theme).toBe("dark");
    expect(doc.general).toEqual({ vimMode: true });
    expect(doc.mcpServers).toEqual(JSON.parse(gemini).mcpServers);
    // What push reads back is what was written
    expect(extractMcpConfig(merged, "gemini-mcp")).toBe(gemini);
  });

  it("replaces the servers already there, and nothing else", () => {
    const existing = '{\n  "mcpServers": { "old": { "command": "old" } },\n  "theme": "dark"\n}\n';
    const merged = mergeMcpConfig(existing, gemini, "gemini-mcp", ".gemini/settings.json");
    expect(JSON.parse(merged)).toEqual({ mcpServers: JSON.parse(gemini).mcpServers, theme: "dark" });
    expect(merged.endsWith('  "theme": "dark"\n}\n')).toBe(true);
  });

  it("keeps the comments of a JSONC file and writes into an empty or trailing-comma object", () => {
    const kilo = '{\n  // my model\n  "model": "x", /* keep */\n  "instructions": ["a.md"],\n}\n';
    const merged = mergeMcpConfig(kilo, claude, "kilo-mcp", "kilo.jsonc");
    expect(merged).toContain("// my model");
    expect(merged).toContain("/* keep */");
    expect(merged).toContain('"instructions": ["a.md"],');
    expect(JSON.parse(convertMcpConfig(merged, "claude-mcp")).mcpServers.github).toEqual(servers.github);
    expect(JSON.parse(mergeMcpConfig("{}", claude, "zed-mcp")).context_servers.github.command).toBe("npx");
    expect(JSON.parse(mergeMcpConfig("", claude, "amp-mcp"))["amp.mcpServers"].github.command).toBe("npx");
  });

  it("converts content in another tool's shape before merging", () => {
    // A Claude config into Gemini: the http server becomes httpUrl
    const merged = mergeMcpConfig('{"theme":"dark"}', claude, "gemini-mcp", ".mcp.json");
    expect(JSON.parse(merged).mcpServers.docs.httpUrl).toBe("https://docs.example/mcp");
  });

  it("refuses a settings file that is not a JSON object instead of overwriting it", () => {
    expect(() => mergeMcpConfig("[1, 2]", gemini, "gemini-mcp")).toThrow();
    expect(() => mergeMcpConfig('{"theme": ', gemini, "gemini-mcp")).toThrow();
  });

  it("replaces only the MCP tables of a TOML config", () => {
    const config = 'model = "o3"\n\n[profiles.fast]\nmodel = "mini"\n\n[mcp_servers.old]\ncommand = "old"\n\n[mcp_servers.old.env]\nK = "v"\n\n[tui]\nnotifications = true\n';
    const codex = convertMcpConfig(claude, "codex-mcp");
    const merged = mergeMcpConfig(config, codex, "codex-mcp", ".codex/config.toml");
    expect(merged).toContain('model = "o3"');
    expect(merged).toContain("[profiles.fast]");
    expect(merged).toContain("[tui]\nnotifications = true");
    expect(merged).not.toContain("old");
    expect(extractMcpConfig(merged, "codex-mcp")).toBe(codex);
    expect(extractMcpConfig('model = "o3"\n', "codex-mcp")).toBeNull();
  });

  it("finds no servers in a settings file without the key", () => {
    expect(extractMcpConfig('{"theme":"dark"}', "gemini-mcp")).toBeNull();
    expect(extractMcpConfig("whatever", "claude-mcp")).toBe("whatever");
  });
});
