/**
 * MCP server configs: the project file each coding agent reads its MCP
 * servers from, and the conversion between their formats. The web download
 * and the CLI (convert, push, pull, sync) all use this file.
 */

/** Blueprint type of an MCP server config. */
export const MCP_BLUEPRINT_TYPE = "MCP_CONFIG";

/**
 * How a tool lays out one server entry:
 * - standard: `{command, args, env}` or `{type, url, headers}` under "mcpServers"
 * - vscode: the same with a required `type`, under "servers"
 * - gemini: remote servers as `httpUrl` (streamable HTTP) or `url` (SSE)
 * - antigravity: remote servers as `serverUrl`, streamable HTTP only
 * - opencode: `{type: "local", command: [cmd, ...args], environment}` or `{type: "remote", url, headers}`
 * - zed: `{command, args, env}` or `{url, headers}` under "context_servers"
 * - codex: TOML tables `[mcp_servers.<name>]`, remote headers in `http_headers`
 * - vibe: TOML array `[[mcp_servers]]` with `name` and `transport`
 */
export type McpShape = "standard" | "vscode" | "gemini" | "antigravity" | "opencode" | "zed" | "codex" | "vibe";

export interface McpConfigTarget {
  id: string;
  name: string;
  /** Project path of the file */
  file: string;
  /** Key the servers sit under */
  key: string;
  /**
   * whole: the file holds only MCP servers and is written whole.
   * settings: one key of a JSON settings file; the other keys must survive.
   * toml: the `mcp_servers` tables of a TOML config; the rest must survive.
   */
  kind: "whole" | "settings" | "toml";
  shape: McpShape;
  /** What a user should know about this target */
  note?: string;
}

const whole = (id: string, name: string, file: string, note?: string): McpConfigTarget => ({
  id, name, file, key: "mcpServers", kind: "whole", shape: "standard", ...(note ? { note } : {}),
});

/**
 * Project MCP configs, one per tool. A config pulled without a stored path is
 * written as the first one.
 */
export const MCP_CONFIGS: readonly McpConfigTarget[] = [
  whole("claude-mcp", "Claude Code", ".mcp.json", "Also read by the GitHub Copilot CLI, VS Code and Grok Build"),
  whole("cursor-mcp", "Cursor", ".cursor/mcp.json"),
  {
    id: "vscode-mcp", name: "VS Code (Copilot)", file: ".vscode/mcp.json", key: "servers", kind: "whole", shape: "vscode",
    note: "VS Code also reads .mcp.json",
  },
  whole("kiro-mcp", "Kiro", ".kiro/settings/mcp.json"),
  whole("copilot-mcp", "GitHub Copilot CLI", ".github/mcp.json"),
  {
    id: "antigravity-mcp", name: "Google Antigravity", file: ".agents/mcp_config.json", key: "mcpServers", kind: "whole", shape: "antigravity",
    note: "Remote servers use serverUrl; SSE servers are left out (streamable HTTP only)",
  },
  whole("devin-mcp", "Devin", ".devin/mcp_config.json"),
  whole("junie-mcp", "JetBrains Junie", ".junie/mcp/mcp.json"),
  whole("factory-mcp", "Factory (Droid)", ".factory/mcp.json"),
  whole("trae-mcp", "Trae", ".trae/mcp.json", "Project MCP must be turned on in Trae"),
  whole("roo-mcp", "Zoo Code", ".roo/mcp.json"),
  whole("kimi-mcp", "Kimi Code", ".kimi-code/mcp.json"),
  whole("pi-mcp", "Pi", ".pi/mcp.json"),
  whole("warp-mcp", "Warp", ".warp/.mcp.json"),
  {
    id: "gemini-mcp", name: "Gemini CLI", file: ".gemini/settings.json", key: "mcpServers", kind: "settings", shape: "gemini",
    note: "Remote servers use httpUrl (streamable HTTP) or url (SSE)",
  },
  { id: "qwen-mcp", name: "Qwen Code", file: ".qwen/settings.json", key: "mcpServers", kind: "settings", shape: "gemini" },
  { id: "augment-mcp", name: "Augment Code", file: ".augment/settings.json", key: "mcpServers", kind: "settings", shape: "standard" },
  { id: "firebender-mcp", name: "Firebender", file: "firebender.json", key: "mcpServers", kind: "settings", shape: "standard" },
  {
    id: "zed-mcp", name: "Zed", file: ".zed/settings.json", key: "context_servers", kind: "settings", shape: "zed",
    note: "Zed starts project servers only in a trusted worktree",
  },
  { id: "amp-mcp", name: "Amp", file: ".amp/settings.json", key: "amp.mcpServers", kind: "settings", shape: "standard" },
  { id: "opencode-mcp", name: "OpenCode", file: "opencode.json", key: "mcp", kind: "settings", shape: "opencode" },
  { id: "kilo-mcp", name: "Kilo Code", file: "kilo.jsonc", key: "mcp", kind: "settings", shape: "opencode" },
  {
    id: "codex-mcp", name: "OpenAI Codex", file: ".codex/config.toml", key: "mcp_servers", kind: "toml", shape: "codex",
    note: "Codex reads a project config only in a trusted project; SSE servers are left out",
  },
  {
    id: "vibe-mcp", name: "Mistral Vibe", file: ".vibe/config.toml", key: "mcp_servers", kind: "toml", shape: "vibe",
    note: "SSE servers are left out",
  },
];

/** The MCP config a project path is, compared in lower case with "/" separators. */
export function mcpConfigForPath(path: string): McpConfigTarget | undefined {
  const p = path.replace(/\\/g, "/").toLowerCase();
  return MCP_CONFIGS.find((c) => {
    const f = c.file.toLowerCase();
    return p === f || p.endsWith(`/${f}`);
  });
}

function mcpTarget(targetId: string): McpConfigTarget {
  const target = MCP_CONFIGS.find((c) => c.id === targetId);
  if (!target) throw new Error(`Unknown MCP target: ${targetId}`);
  return target;
}

// ========================================
// SERVER ENTRIES
// ========================================

type Obj = Record<string, unknown>;
type Servers = Record<string, Obj>;

const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);
const strList = (v: unknown): string[] | undefined =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : undefined;
const strMap = (v: unknown): Obj | undefined => (isObj(v) ? v : undefined);

/** The object without its undefined values. */
function compact(o: Obj): Obj {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
}

function mapServers(value: Obj, read: (s: Obj, name: string) => Obj): Servers {
  return Object.fromEntries(
    Object.entries(value).map(([name, s]) => {
      if (!isObj(s)) throw new Error(`MCP server "${name}" is not an object`);
      return [name, read(s, name)];
    })
  );
}

/**
 * The common entry every reader returns and every writer takes: a local
 * server is `{command, args, env, cwd}`, a remote one `{type: "http" | "sse",
 * url, headers}`. Other keys of a "mcpServers"-style entry are kept.
 */
function fromStandard(s: Obj, geminiUrls: boolean): Obj {
  const { serverUrl, httpUrl, ...rest } = s;
  if (typeof serverUrl === "string") return { ...rest, type: rest.type ?? "http", url: serverUrl };
  if (typeof httpUrl === "string") return { ...rest, type: "http", url: httpUrl };
  // Gemini CLI and Qwen Code read a bare "url" as an SSE server
  if (geminiUrls && typeof s.url === "string" && s.type === undefined) return { ...s, type: "sse" };
  return s;
}

function fromOpencode(s: Obj): Obj {
  if (s.type === "remote" || (typeof s.url === "string" && !Array.isArray(s.command))) {
    return compact({ type: "http", url: str(s.url), headers: strMap(s.headers) });
  }
  const cmd = strList(s.command) ?? (typeof s.command === "string" ? [s.command] : []);
  return compact({
    command: cmd[0],
    args: cmd.length > 1 ? cmd.slice(1) : undefined,
    env: strMap(s.environment),
  });
}

function fromZed(s: Obj): Obj {
  // Older Zed settings nest the command: {"command": {"path", "args", "env"}}
  const c = isObj(s.command) ? s.command : s;
  if (typeof s.url === "string") return compact({ type: "http", url: s.url, headers: strMap(s.headers) });
  return compact({ command: str(c.path) ?? str(c.command), args: strList(c.args), env: strMap(c.env) });
}

function fromCodex(s: Obj): Obj {
  if (typeof s.url === "string") {
    const headers = { ...strMap(s.http_headers) };
    // Claude Code, Cursor and most others expand ${VAR} in headers
    if (typeof s.bearer_token_env_var === "string") headers.Authorization = `Bearer \${${s.bearer_token_env_var}}`;
    return compact({ type: "http", url: s.url, headers: Object.keys(headers).length ? headers : undefined });
  }
  return compact({ command: str(s.command), args: strList(s.args), env: strMap(s.env), cwd: str(s.cwd) });
}

function fromVibe(s: Obj): Obj {
  if (s.transport !== "stdio" && typeof s.url === "string") {
    const auth = strMap(s.auth);
    return compact({ type: "http", url: s.url, headers: strMap(s.headers) ?? strMap(auth?.headers) });
  }
  // "command" may be the whole command line as a list
  const cmd = strList(s.command) ?? (typeof s.command === "string" ? [s.command] : []);
  const args = [...cmd.slice(1), ...(strList(s.args) ?? [])];
  return compact({ command: cmd[0], args: args.length ? args : undefined, env: strMap(s.env), cwd: str(s.cwd) });
}

function toGemini(s: Obj): Obj {
  const { type, url, ...rest } = s;
  if (typeof url !== "string") return rest;
  return type === "sse" ? { ...rest, url } : { ...rest, httpUrl: url };
}

function toAntigravity(s: Obj): Obj | undefined {
  const { type, url, ...rest } = s;
  if (typeof url !== "string") return rest;
  return type === "sse" ? undefined : { ...rest, serverUrl: url };
}

function toOpencode(s: Obj): Obj {
  if (typeof s.url === "string") return compact({ type: "remote", url: s.url, headers: strMap(s.headers) });
  return compact({
    type: "local",
    command: [str(s.command) ?? "", ...(strList(s.args) ?? [])],
    environment: strMap(s.env),
  });
}

function toZed(s: Obj): Obj {
  if (typeof s.url === "string") return compact({ url: s.url, headers: strMap(s.headers) });
  return compact({ command: str(s.command), args: strList(s.args), env: strMap(s.env) });
}

// ========================================
// READING
// ========================================

/**
 * The servers of an MCP config in any supported format (JSON, JSON with
 * comments, or TOML), as common entries. `sourceFile` tells which tool wrote
 * it when the format alone does not (a Gemini "url" means SSE).
 */
function readMcpServers(content: string, sourceFile?: string): { servers: Servers; inputs?: unknown } {
  let doc: unknown;
  try {
    doc = parseJsonc(content);
  } catch (jsonError) {
    try {
      doc = parseToml(content);
    } catch (tomlError) {
      const tomlFirst = sourceFile?.toLowerCase().endsWith(".toml");
      throw tomlFirst ? tomlError : jsonError;
    }
  }
  if (!isObj(doc)) throw new Error("The MCP config is not an object");
  const geminiUrls = sourceFile !== undefined && mcpConfigForPath(sourceFile)?.shape === "gemini";
  if (isObj(doc.mcpServers)) return { servers: mapServers(doc.mcpServers, (s) => fromStandard(s, geminiUrls)) };
  if (isObj(doc.servers)) return { servers: mapServers(doc.servers, (s) => fromStandard(s, false)), inputs: doc.inputs };
  if (isObj(doc["amp.mcpServers"])) return { servers: mapServers(doc["amp.mcpServers"], (s) => fromStandard(s, false)) };
  if (isObj(doc.mcp)) return { servers: mapServers(doc.mcp, fromOpencode) };
  if (isObj(doc.context_servers)) return { servers: mapServers(doc.context_servers, fromZed) };
  if (isObj(doc.mcp_servers)) return { servers: mapServers(doc.mcp_servers, fromCodex) };
  if (Array.isArray(doc.mcp_servers)) {
    const servers: Servers = {};
    for (const s of doc.mcp_servers) {
      if (!isObj(s) || typeof s.name !== "string") throw new Error("An [[mcp_servers]] entry has no name");
      servers[s.name] = fromVibe(s);
    }
    return { servers };
  }
  throw new Error(
    'No "mcpServers", "servers", "mcp", "context_servers" or "mcp_servers" object in the MCP config'
  );
}

// ========================================
// WRITING
// ========================================

function writeServers(target: McpConfigTarget, servers: Servers, inputs: unknown): string {
  const each = (write: (s: Obj) => Obj | undefined) =>
    Object.fromEntries(
      Object.entries(servers).flatMap(([name, s]) => {
        const out = write(s);
        return out ? [[name, out]] : [];
      })
    );
  switch (target.shape) {
    case "codex":
      return writeCodexToml(servers);
    case "vibe":
      return writeVibeToml(servers);
    case "vscode": {
      // VS Code wants each server's transport in "type"
      const out: Obj = {
        servers: each((s) => (s.type ? s : { type: s.url ? "http" : "stdio", ...s })),
      };
      // VS Code's prompted inputs (${input:...}) only mean something to VS Code
      if (inputs) out.inputs = inputs;
      return json(out);
    }
    case "gemini":
      return json({ [target.key]: each(toGemini) });
    case "antigravity":
      return json({ [target.key]: each(toAntigravity) });
    case "opencode":
      return json({ [target.key]: each(toOpencode) });
    case "zed":
      return json({ [target.key]: each(toZed) });
    default:
      return json({ [target.key]: servers });
  }
}

const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

/**
 * Rewrite an MCP server config for another tool: the same servers in the
 * target's file format, key and entry shape. For a settings or TOML target
 * this is only the MCP part; see mergeMcpConfig to write it into an existing
 * file. Throws on a file that is not a readable MCP config.
 */
export function convertMcpConfig(content: string, targetId: string, sourceFile?: string): string {
  const target = mcpTarget(targetId);
  const { servers, inputs } = readMcpServers(content, sourceFile);
  return writeServers(target, servers, inputs);
}

/**
 * The MCP part of a target file, as a blueprint stores it: the whole file for
 * a file that only holds servers, the servers key for a settings file, the
 * `mcp_servers` tables for a TOML config. Null when the file has none.
 */
export function extractMcpConfig(text: string, targetId: string): string | null {
  const target = mcpTarget(targetId);
  if (target.kind === "whole") return text;
  if (target.kind === "toml") return splitTomlMcp(text).mcp || null;
  const doc = text.trim() ? parseJsonc(text) : {};
  if (!isObj(doc) || doc[target.key] === undefined) return null;
  return json({ [target.key]: doc[target.key] });
}

/**
 * The text of a target file after writing an MCP config into it. A file that
 * only holds servers is replaced. A settings file keeps every other key, and
 * its comments and layout; a TOML config keeps everything but its
 * `mcp_servers` tables. `content` in the target's own shape goes in as it is,
 * anything else is converted first.
 */
export function mergeMcpConfig(existing: string, content: string, targetId: string, sourceFile?: string): string {
  const target = mcpTarget(targetId);
  if (target.kind === "whole") {
    return sameShape(content, target, sourceFile) ? content : convertMcpConfig(content, targetId, sourceFile);
  }
  if (target.kind === "toml") {
    // Only the server tables: a root key after them would land in the last table
    const mcp = sameShape(content, target, sourceFile)
      ? splitTomlMcp(content).mcp
      : convertMcpConfig(content, targetId, sourceFile);
    const rest = splitTomlMcp(existing).rest.trimEnd();
    return `${rest ? `${rest}\n\n` : ""}${mcp.trim()}\n`;
  }
  const own = sameShape(content, target, sourceFile) ? content : convertMcpConfig(content, targetId, sourceFile);
  const value = (parseJsonc(own) as Obj)[target.key];
  return setJsoncKey(existing, target.key, value);
}

/**
 * Whether content already is the target's own MCP format. A Claude file and a
 * Gemini file share the "mcpServers" key but not the meaning of "url", so when
 * the source file is known its tool's shape must match too.
 */
function sameShape(content: string, target: McpConfigTarget, sourceFile?: string): boolean {
  const from = sourceFile ? mcpConfigForPath(sourceFile) : undefined;
  if (from && from.shape !== target.shape) return false;
  let doc: unknown;
  try {
    doc = target.kind === "toml" ? parseToml(content) : parseJsonc(content);
  } catch {
    return false;
  }
  if (!isObj(doc)) return false;
  if (target.shape === "codex") return isObj(doc.mcp_servers);
  if (target.shape === "vibe") return Array.isArray(doc.mcp_servers);
  return isObj(doc[target.key]);
}

// ========================================
// JSON WITH COMMENTS
// ========================================

/**
 * The text with comments blanked out and trailing commas removed, so
 * JSON.parse reads JSONC (kilo.jsonc, VS Code and Zed settings). Strings are
 * skipped intact. Linear, no regular expressions on the input.
 */
function stripJsonc(text: string): string {
  const out: string[] = [];
  let i = 0;
  let pendingComma = -1; // index in out of a comma that may be trailing
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"') {
      const end = stringEnd(text, i);
      out.push(text.slice(i, end));
      pendingComma = -1;
      i = end;
    } else if (ch === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++;
    } else if (ch === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2);
      const stop = end < 0 ? text.length : end + 2;
      out.push(text.slice(i, stop).replace(/[^\n]/g, " "));
      i = stop;
    } else {
      if ((ch === "}" || ch === "]") && pendingComma >= 0) out[pendingComma] = " ";
      if (ch === ",") pendingComma = out.length;
      else if (!/\s/.test(ch)) pendingComma = -1;
      out.push(ch);
      i++;
    }
  }
  return out.join("");
}

/** Index just past the string that opens at `start`. */
function stringEnd(text: string, start: number): number {
  let i = start + 1;
  while (i < text.length && text[i] !== '"') i += text[i] === "\\" ? 2 : 1;
  return Math.min(i + 1, text.length);
}

function parseJsonc(text: string): unknown {
  return JSON.parse(stripJsonc(text));
}

/**
 * Set one top-level key of a JSON or JSONC object, leaving the rest of the
 * text (other keys, comments, layout) as it was. A blank text becomes a new
 * object. Throws on text that is not an object.
 */
function setJsoncKey(text: string, key: string, value: unknown): string {
  const valueText = JSON.stringify(value, null, 2).replace(/\n/g, "\n  ");
  if (!text.trim()) return json({ [key]: value });
  if (!isObj(parseJsonc(text))) throw new Error("The settings file is not a JSON object");

  // Walk the top-level object: where each member's value starts and ends
  let depth = 0;
  let phase: "key" | "colon" | "value" = "key";
  let currentKey = "";
  let valueStart = -1;
  let valueEnd = -1;
  let found: { start: number; end: number } | null = null;
  let lastEnd = -1; // end of the last token before the closing brace
  let lastChar = "";
  let close = -1;
  const finishMember = () => {
    if (phase === "value" && currentKey === key && valueStart >= 0) found = { start: valueStart, end: valueEnd };
  };
  let i = 0;
  while (i < text.length && close < 0) {
    const ch = text[i];
    if (ch === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      continue;
    }
    if (ch === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2);
      i = end < 0 ? text.length : end + 2;
      continue;
    }
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    let end = i + 1;
    if (ch === '"') end = stringEnd(text, i);
    if (depth === 1 && phase === "key" && ch === '"') {
      currentKey = JSON.parse(text.slice(i, end)) as string;
      phase = "colon";
    } else if (depth === 1 && phase === "colon" && ch === ":") {
      phase = "value";
      valueStart = -1;
    } else if (depth === 1 && ch === ",") {
      finishMember();
      phase = "key";
    } else if (depth === 1 && ch === "}") {
      finishMember();
      close = i;
      break;
    } else {
      if (ch === "{" || ch === "[") depth++;
      else if (ch === "}" || ch === "]") depth--;
      if (phase === "value" && depth >= 1) {
        if (valueStart < 0) valueStart = i;
        valueEnd = end;
      }
    }
    lastEnd = end;
    lastChar = ch;
    i = end;
  }
  if (close < 0) throw new Error("The settings file is not a JSON object");

  let result: string;
  if (found) {
    const { start, end } = found as { start: number; end: number };
    result = text.slice(0, start) + valueText + text.slice(end);
  } else {
    const member = `${JSON.stringify(key)}: ${valueText}`;
    const insert = lastChar === "{" ? `\n  ${member}\n` : lastChar === "," ? `\n  ${member}` : `,\n  ${member}`;
    result = text.slice(0, lastEnd) + insert + text.slice(lastEnd);
  }
  parseJsonc(result); // never hand back a file the tool cannot read
  return result;
}

// ========================================
// TOML (the subset MCP configs use)
// ========================================

/** A TOML header line for the MCP servers: [mcp_servers.x], [mcp_servers.x.env], [[mcp_servers]]. */
const MCP_TOML_HEADER = /^\[\[?\s*(?:mcp_servers|"mcp_servers"|'mcp_servers')\s*[.\]]/;
const TOML_HEADER = /^\[\[?[^\]]*\]\]?\s*(?:#.*)?$/;

/** A TOML config split into its MCP server tables and everything else. */
function splitTomlMcp(text: string): { mcp: string; rest: string } {
  const mcp: string[] = [];
  const rest: string[] = [];
  let inMcp = false;
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (MCP_TOML_HEADER.test(t)) inMcp = true;
    else if (TOML_HEADER.test(t)) inMcp = false;
    (inMcp ? mcp : rest).push(line);
  }
  return { mcp: mcp.join("\n").trim() ? `${mcp.join("\n").trim()}\n` : "", rest: rest.join("\n") };
}

const tomlKey = (k: string) => (/^[A-Za-z0-9_-]+$/.test(k) ? k : JSON.stringify(k));

function tomlValue(v: unknown): string {
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return `[${v.map(tomlValue).join(", ")}]`;
  if (isObj(v)) {
    const items = Object.entries(v).filter(([, x]) => x !== undefined && x !== null);
    return items.length ? `{ ${items.map(([k, x]) => `${tomlKey(k)} = ${tomlValue(x)}`).join(", ")} }` : "{}";
  }
  return '""';
}

function tomlLines(fields: Obj): string[] {
  return Object.entries(compact(fields)).map(([k, v]) => `${tomlKey(k)} = ${tomlValue(v)}`);
}

function writeCodexToml(servers: Servers): string {
  const blocks = Object.entries(servers).flatMap(([name, s]) => {
    // Codex speaks stdio and streamable HTTP only
    if (s.type === "sse") return [];
    const fields =
      typeof s.url === "string"
        ? { url: s.url, http_headers: strMap(s.headers) }
        : { command: str(s.command), args: strList(s.args), env: strMap(s.env), cwd: str(s.cwd) };
    return [[`[mcp_servers.${tomlKey(name)}]`, ...tomlLines(fields)].join("\n")];
  });
  return blocks.length ? `${blocks.join("\n\n")}\n` : "";
}

function writeVibeToml(servers: Servers): string {
  const blocks = Object.entries(servers).flatMap(([name, s]) => {
    if (s.type === "sse") return [];
    const fields =
      typeof s.url === "string"
        ? { name, transport: "streamable-http", url: s.url, headers: strMap(s.headers) }
        : { name, transport: "stdio", command: str(s.command), args: strList(s.args), env: strMap(s.env), cwd: str(s.cwd) };
    return [["[[mcp_servers]]", ...tomlLines(fields)].join("\n")];
  });
  return blocks.length ? `${blocks.join("\n\n")}\n` : "";
}

/**
 * Read TOML: tables, arrays of tables, dotted keys, basic and literal strings,
 * numbers, booleans, arrays and inline tables. Multi-line strings are refused
 * rather than misread. Dates come back as their text.
 */
export function parseToml(text: string): Obj {
  const root: Obj = {};
  let table: Obj = root;
  let i = 0;
  const n = text.length;
  const fail = (msg: string) => new Error(`TOML line ${text.slice(0, i).split("\n").length}: ${msg}`);
  const blank = () => {
    while (i < n && (text[i] === " " || text[i] === "\t")) i++;
  };
  const blankLines = () => {
    for (;;) {
      blank();
      if (text[i] === "#") while (i < n && text[i] !== "\n") i++;
      if (text[i] === "\n" || text[i] === "\r") i++;
      else return;
    }
  };
  const expect = (s: string) => {
    if (!text.startsWith(s, i)) throw fail(`expected ${s}`);
    i += s.length;
  };
  const basic = (): string => {
    if (text.startsWith('"""', i)) throw fail("multi-line strings are not supported");
    i++;
    let s = "";
    while (i < n && text[i] !== '"') {
      const ch = text[i];
      if (ch === "\n") throw fail("unterminated string");
      if (ch !== "\\") {
        s += ch;
        i++;
        continue;
      }
      const e = text[i + 1];
      const simple: Record<string, string> = { b: "\b", t: "\t", n: "\n", f: "\f", r: "\r", '"': '"', "\\": "\\" };
      if (e in simple) {
        s += simple[e];
        i += 2;
      } else if (e === "u" || e === "U") {
        const len = e === "u" ? 4 : 8;
        const hex = text.slice(i + 2, i + 2 + len);
        if (!/^[0-9A-Fa-f]+$/.test(hex) || hex.length !== len) throw fail("bad escape");
        s += String.fromCodePoint(parseInt(hex, 16));
        i += 2 + len;
      } else {
        throw fail("bad escape");
      }
    }
    if (i >= n) throw fail("unterminated string");
    i++;
    return s;
  };
  const literal = (): string => {
    if (text.startsWith("'''", i)) throw fail("multi-line strings are not supported");
    const end = text.indexOf("'", i + 1);
    const nl = text.indexOf("\n", i + 1);
    if (end < 0 || (nl >= 0 && nl < end)) throw fail("unterminated string");
    const s = text.slice(i + 1, end);
    i = end + 1;
    return s;
  };
  const bare = /[A-Za-z0-9_-]+/y;
  const key = (): string[] => {
    const parts: string[] = [];
    for (;;) {
      blank();
      let k: string;
      if (text[i] === '"') k = basic();
      else if (text[i] === "'") k = literal();
      else {
        bare.lastIndex = i;
        const m = bare.exec(text);
        if (!m) throw fail("expected a key");
        k = m[0];
        i += k.length;
      }
      if (k === "__proto__") throw fail("reserved key");
      parts.push(k);
      blank();
      if (text[i] !== ".") return parts;
      i++;
    }
  };
  const tableAt = (base: Obj, path: string[]): Obj => {
    let t = base;
    for (const k of path) {
      let next = t[k];
      if (Array.isArray(next)) next = next[next.length - 1];
      if (next === undefined) {
        next = {};
        t[k] = next;
      }
      if (!isObj(next)) throw fail(`${k} is not a table`);
      t = next;
    }
    return t;
  };
  const setKey = (base: Obj, path: string[], v: unknown) => {
    const t = tableAt(base, path.slice(0, -1));
    const last = path[path.length - 1];
    if (last in t) throw fail(`duplicate key ${last}`);
    t[last] = v;
  };
  const scalar = /[^\s,\]}#]+/y;
  const value = (): unknown => {
    blank();
    const ch = text[i];
    if (ch === '"') return basic();
    if (ch === "'") return literal();
    if (ch === "[") {
      i++;
      const arr: unknown[] = [];
      for (;;) {
        blankLines();
        if (text[i] === "]") {
          i++;
          return arr;
        }
        arr.push(value());
        blankLines();
        if (text[i] === ",") i++;
        else if (text[i] !== "]") throw fail("expected , or ]");
      }
    }
    if (ch === "{") {
      i++;
      const obj: Obj = {};
      blank();
      if (text[i] === "}") {
        i++;
        return obj;
      }
      for (;;) {
        const k = key();
        expect("=");
        setKey(obj, k, value());
        blank();
        if (text[i] === ",") i++;
        else if (text[i] === "}") {
          i++;
          return obj;
        } else throw fail("expected , or }");
      }
    }
    scalar.lastIndex = i;
    const m = scalar.exec(text);
    if (!m) throw fail("expected a value");
    i += m[0].length;
    const s = m[0];
    if (s === "true") return true;
    if (s === "false") return false;
    const num = s.replace(/_/g, "");
    if (/^[+-]?(\d+(\.\d+)?([eE][+-]?\d+)?|inf|nan)$/.test(num)) return Number(num);
    if (/^\d{4}-\d{2}-\d{2}/.test(s) || /^\d{2}:\d{2}/.test(s)) return s;
    throw fail(`unknown value ${s}`);
  };

  for (;;) {
    blankLines();
    if (i >= n) break;
    if (text[i] === "[") {
      if (text[i + 1] === "[") {
        i += 2;
        const path = key();
        expect("]]");
        const parent = tableAt(root, path.slice(0, -1));
        const last = path[path.length - 1];
        const arr = parent[last] ?? (parent[last] = []);
        if (!Array.isArray(arr)) throw fail(`${last} is not an array of tables`);
        table = {};
        arr.push(table);
      } else {
        i++;
        const path = key();
        expect("]");
        table = tableAt(root, path);
      }
    } else {
      const path = key();
      expect("=");
      setKey(table, path, value());
    }
    blank();
    if (text[i] === "#") while (i < n && text[i] !== "\n") i++;
    if (i < n && text[i] !== "\n" && text[i] !== "\r") throw fail("expected the end of the line");
  }
  return root;
}
