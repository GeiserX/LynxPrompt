/**
 * =============================================================================
 * PLATFORM TABLE FOR LYNXPROMPT (web app and CLI)
 * =============================================================================
 *
 * The single list of supported AI tools: the file each one reads, its format,
 * and the blueprint type a file of it is stored as. The web app imports it
 * through src/lib/platforms.ts; the CLI imports it directly (generator, pull,
 * push, convert and the wizard), so a path or format is changed here once.
 *
 * When adding a platform: add it below, then its content in
 * packages/shared/src/generator.ts, which the web wizard and the CLI both use.
 * tests/lib/platform-table.test.ts checks both callers and the CLI's pull and
 * push agree with this table.
 */

import { splitFrontmatter } from "./rules-format";

export interface PlatformDefinition {
  /** Unique identifier used in code */
  id: string;
  /** Human-readable display name */
  name: string;
  /**
   * Output file path. Rules platforms always name a real file (never a bare
   * directory), because the web download uses its last segment as the file
   * name. Command platforms (isCommand) name the directory their files go in.
   */
  file: string;
  /** Emoji icon for UI */
  icon: string;
  /** Tailwind gradient classes for cards */
  gradient: string;
  /** Short description/note */
  note: string;
  /** Category for grouping in UI */
  category: "popular" | "ide" | "editor" | "cli" | "other" | "command";
  /** Output format type */
  format: "markdown" | "mdc" | "json" | "yaml" | "text";
  /** Whether this is a top/recommended platform */
  featured?: boolean;
  /** Website URL */
  url?: string;
  /** Whether this is a command (slash command) rather than a rules file */
  isCommand?: boolean;
  /**
   * Blueprint type (TemplateType in the Prisma schemas) a file of this
   * platform is saved and pushed as. Platforms without one are saved as CUSTOM.
   */
  blueprintType?: string;
  /** A folder the tool reads every rule file from; `lynxp push` finds any .md/.mdc file in it. */
  rulesDirectory?: string;
  /**
   * Other rules files and folders (ending in "/") the tool reads: older names
   * and files that would shadow AGENTS.md. `lynxp push` and `lynxp check`
   * recognise them; the generator never writes them.
   */
  otherFiles?: string[];
  /** The tool follows `@path` imports in its file, so the file can just import AGENTS.md. */
  importsFiles?: boolean;
  /**
   * Every surface of the tool reads the root AGENTS.md with no setting, so
   * next to AGENTS.md it needs no file of its own (a second copy would load
   * the rules twice in tools that merge every rules file).
   */
  readsAgentsMd?: boolean;
}

/**
 * Command definition for AI IDE slash commands
 * Commands are stored in specific directories and trigger AI workflows
 */
export interface CommandDefinition {
  /** Unique identifier (matches platform ID) */
  id: string;
  /** Human-readable name */
  name: string;
  /** Directory where commands are stored */
  directory: string;
  /** File extension for commands */
  extension: string;
  /** Associated platform ID */
  platformId: string;
  /** Icon for UI */
  icon: string;
  /** Gradient for cards */
  gradient: string;
  /** Description */
  note: string;
}

/**
 * All supported AI coding tools. Tools that read only AGENTS.md (Amp, Jules,
 * Factory, Qwen Code, Kimi Code, Mistral Vibe, Pi, CodeGPT) are named in the
 * universal entry instead of having one each.
 * 
 * Categories:
 * - popular: Most commonly used platforms (shown first)
 * - ide: Full AI-powered IDEs
 * - editor: Editor extensions/plugins
 * - cli: Command-line tools
 * - other: Emerging/specialized tools
 */
export const PLATFORMS: PlatformDefinition[] = [
  // ========================================
  // POPULAR - Featured platforms (shown first)
  // ========================================
  {
    id: "universal",
    name: "Universal (AGENTS.md)",
    file: "AGENTS.md",
    blueprintType: "AGENTS_MD",
    icon: "🌐",
    gradient: "from-violet-500 to-purple-500",
    note: "Read natively by Codex, Cursor, Copilot, Claude Code (when no CLAUDE.md), Antigravity, Devin, Jules, Amp, Kiro, Junie, Goose, Warp, OpenCode, OpenHands, Crush, Factory, Qwen Code, Kimi Code, Mistral Vibe, Pi, Augment, Kilo Code, Cline, Zed and CodeGPT",
    category: "popular",
    format: "markdown",
    featured: true,
    url: "https://agents.md",
  },
  {
    id: "codex",
    name: "OpenAI Codex",
    file: "AGENTS.md",
    blueprintType: "CODEX_MD",
    readsAgentsMd: true,
    icon: "🧩",
    gradient: "from-emerald-500 to-teal-600",
    note: "OpenAI's coding agent (reads AGENTS.md)",
    category: "popular",
    format: "markdown",
    featured: true,
    url: "https://learn.chatgpt.com/docs/agent-configuration/agents-md",
  },
  {
    id: "cursor",
    name: "Cursor",
    file: ".cursor/rules/project.mdc",
    rulesDirectory: ".cursor/rules/",
    blueprintType: "CURSOR_RULES",
    readsAgentsMd: true,
    icon: "⚡",
    gradient: "from-blue-500 to-cyan-500",
    note: "AI-powered code editor with native rules",
    category: "popular",
    format: "mdc",
    featured: true,
    url: "https://cursor.com",
  },
  {
    id: "claude",
    name: "Claude Code",
    file: "CLAUDE.md",
    rulesDirectory: ".claude/rules/",
    otherFiles: [".claude/CLAUDE.md"],
    blueprintType: "CLAUDE_MD",
    // Claude Code skips AGENTS.md whenever a CLAUDE.md exists, so CLAUDE.md stays as an @AGENTS.md import
    importsFiles: true,
    icon: "🧠",
    gradient: "from-orange-500 to-amber-500",
    note: "Anthropic's agentic coding tool",
    category: "popular",
    format: "markdown",
    featured: true,
    url: "https://code.claude.com/docs",
  },
  {
    id: "copilot",
    name: "GitHub Copilot",
    file: ".github/copilot-instructions.md",
    rulesDirectory: ".github/instructions/",
    blueprintType: "COPILOT_INSTRUCTIONS",
    // Not readsAgentsMd: Copilot in Visual Studio, JetBrains and code review reads only this file
    icon: "🐙",
    gradient: "from-gray-600 to-gray-800",
    note: "GitHub's AI pair programmer",
    category: "popular",
    format: "markdown",
    featured: true,
    url: "https://github.com/features/copilot",
  },
  {
    id: "windsurf",
    name: "Devin Desktop (formerly Windsurf)",
    file: ".devin/rules/project.md",
    rulesDirectory: ".devin/rules/",
    otherFiles: [".windsurfrules", ".windsurf/rules/"],
    blueprintType: "WINDSURF_RULES",
    readsAgentsMd: true,
    icon: "🏄",
    gradient: "from-teal-500 to-emerald-500",
    note: "Cognition's IDE, renamed from Windsurf on 2026-06-02",
    category: "popular",
    format: "markdown",
    featured: true,
    url: "https://devin.ai/desktop",
  },

  // ========================================
  // AI-POWERED IDEs
  // ========================================
  {
    id: "antigravity",
    name: "Antigravity",
    file: "AGENTS.md",
    // Every rule here needs a trigger frontmatter key, or Antigravity drops it
    rulesDirectory: ".agents/rules/",
    readsAgentsMd: true,
    icon: "💎",
    gradient: "from-blue-600 to-indigo-600",
    note: "Google's agent IDE and CLI (successor of Gemini CLI)",
    category: "ide",
    format: "markdown",
    featured: true,
    url: "https://antigravity.google",
  },
  {
    id: "zed",
    name: "Zed",
    file: ".rules",
    blueprintType: "ZED_INSTRUCTIONS",
    // Zed reads the first of .rules, .cursorrules, .windsurfrules, .clinerules,
    // copilot-instructions.md, AGENTS.md...; next to AGENTS.md it needs no .rules
    readsAgentsMd: true,
    icon: "⚡",
    gradient: "from-amber-500 to-yellow-500",
    note: "High-performance editor with AI",
    category: "ide",
    format: "markdown",
    url: "https://zed.dev",
  },
  {
    id: "trae",
    name: "Trae AI",
    file: ".trae/rules/project_rules.md",
    rulesDirectory: ".trae/rules/",
    blueprintType: "TRAE_RULES",
    // Not readsAgentsMd: Trae reads AGENTS.md only after a settings switch
    icon: "🔷",
    gradient: "from-blue-400 to-blue-600",
    note: "ByteDance's AI IDE",
    category: "ide",
    format: "markdown",
    url: "https://trae.ai",
  },
  {
    id: "firebase",
    name: "Firebase Studio",
    file: ".idx/airules.md",
    blueprintType: "IDX_CONFIG",
    icon: "🔥",
    gradient: "from-yellow-500 to-orange-500",
    note: "Sunsetting: no new workspaces since 2026-06-22, shutdown 2027-03-22; move to Antigravity",
    category: "ide",
    format: "markdown",
    url: "https://firebase.google.com/studio",
  },

  // ========================================
  // EDITOR EXTENSIONS & PLUGINS
  // ========================================
  {
    id: "cline",
    name: "Cline",
    file: ".clinerules/project.md",
    rulesDirectory: ".clinerules/",
    otherFiles: [".clinerules", ".cline/rules/"],
    blueprintType: "CLINE_RULES",
    readsAgentsMd: true,
    icon: "🔧",
    gradient: "from-purple-500 to-pink-500",
    note: "Autonomous coding agent for VS Code",
    category: "editor",
    format: "markdown",
    url: "https://cline.bot",
  },
  {
    id: "roocode",
    name: "Roo Code (discontinued) / Zoo Code",
    file: ".roo/rules/project.md",
    rulesDirectory: ".roo/rules/",
    blueprintType: "ROO_RULES",
    readsAgentsMd: true,
    icon: "🦘",
    gradient: "from-orange-400 to-red-500",
    note: "Roo shut down 2026-05-15; the Zoo Code fork reads the same .roo/ paths",
    category: "editor",
    format: "markdown",
    url: "https://github.com/Zoo-Code-Org/Zoo-Code",
  },
  {
    id: "tabnine",
    name: "Tabnine",
    file: ".tabnine/guidelines/project.md",
    rulesDirectory: ".tabnine/guidelines/",
    // No blueprintType: TABNINE_CONFIG blueprints hold the old .tabnine.yaml, not guidelines
    icon: "📝",
    gradient: "from-cyan-500 to-blue-500",
    note: "AI code assistant; reads project guidelines",
    category: "editor",
    format: "markdown",
    url: "https://docs.tabnine.com/main/getting-started/tabnine-agent/guidelines",
  },
  {
    id: "amazonq",
    name: "Amazon Q",
    file: ".amazonq/rules/project.md",
    rulesDirectory: ".amazonq/rules/",
    blueprintType: "AMAZONQ_RULES",
    icon: "📦",
    gradient: "from-orange-400 to-amber-500",
    note: "Merged into Kiro; IDE plugin support ends 2027-04-30",
    category: "editor",
    format: "markdown",
    url: "https://aws.amazon.com/q/developer/",
  },
  {
    id: "augment",
    name: "Augment Code",
    file: ".augment/rules/project.md",
    rulesDirectory: ".augment/rules/",
    blueprintType: "AUGMENT_RULES",
    readsAgentsMd: true,
    icon: "🔮",
    gradient: "from-violet-500 to-purple-600",
    note: "AI code augmentation",
    category: "editor",
    format: "markdown",
    url: "https://augmentcode.com",
  },
  {
    id: "kilocode",
    name: "Kilo Code",
    file: "AGENTS.md",
    rulesDirectory: ".kilocode/rules/",
    blueprintType: "KILOCODE_RULES",
    readsAgentsMd: true,
    icon: "📊",
    gradient: "from-green-500 to-emerald-500",
    note: "AI coding agent (reads AGENTS.md; .kilocode/rules/ still loads)",
    category: "editor",
    format: "markdown",
    url: "https://kilo.ai",
  },
  {
    id: "junie",
    name: "Junie",
    file: "AGENTS.md",
    rulesDirectory: ".junie/rules/",
    // .junie/AGENTS.md wins over the root AGENTS.md, so it is read, never written
    otherFiles: [".junie/AGENTS.md", ".junie/guidelines.md"],
    blueprintType: "JUNIE_GUIDELINES",
    readsAgentsMd: true,
    icon: "🎯",
    gradient: "from-pink-400 to-rose-500",
    note: "JetBrains coding agent (reads AGENTS.md)",
    category: "editor",
    format: "markdown",
    url: "https://www.jetbrains.com/junie/",
  },
  {
    id: "kiro",
    name: "Kiro",
    file: ".kiro/steering/project.md",
    rulesDirectory: ".kiro/steering/",
    blueprintType: "KIRO_STEERING",
    readsAgentsMd: true,
    icon: "🚀",
    gradient: "from-blue-500 to-purple-500",
    note: "AWS spec-driven agent",
    category: "editor",
    format: "markdown",
    url: "https://kiro.dev",
  },

  // ========================================
  // CLI TOOLS
  // ========================================
  {
    id: "aider",
    name: "Aider",
    // Aider loads no rules file by itself; its config lists AGENTS.md under read:
    file: ".aider.conf.yml",
    icon: "🤖",
    gradient: "from-green-500 to-lime-500",
    note: "AI pair programming in terminal (reads AGENTS.md through .aider.conf.yml)",
    category: "cli",
    format: "yaml",
    url: "https://aider.chat",
  },
  {
    id: "goose",
    name: "Goose",
    file: "AGENTS.md",
    otherFiles: [".goosehints"],
    blueprintType: "GOOSEHINTS",
    readsAgentsMd: true,
    icon: "🪿",
    gradient: "from-gray-500 to-gray-700",
    note: "Open-source AI agent, now under the Agentic AI Foundation",
    category: "cli",
    format: "markdown",
    url: "https://github.com/aaif-goose/goose",
  },
  {
    id: "warp",
    name: "Warp AI",
    file: "AGENTS.md",
    // WARP.md wins over AGENTS.md in the same folder, so it is read, never written
    otherFiles: ["WARP.md"],
    blueprintType: "WARP_MD",
    readsAgentsMd: true,
    icon: "🚀",
    gradient: "from-purple-500 to-pink-500",
    note: "AI-powered terminal (reads AGENTS.md)",
    category: "cli",
    format: "markdown",
    url: "https://warp.dev",
  },
  {
    id: "gemini-cli",
    name: "Gemini CLI",
    file: "GEMINI.md",
    blueprintType: "GEMINI_MD",
    importsFiles: true,
    icon: "💎",
    gradient: "from-blue-500 to-cyan-500",
    note: "Gemini CLI; consumer users moved to Antigravity CLI on 2026-06-18",
    category: "cli",
    format: "markdown",
    url: "https://geminicli.com",
  },
  {
    id: "opencode",
    name: "OpenCode",
    file: "AGENTS.md",
    blueprintType: "OPENCODE_JSON",
    readsAgentsMd: true,
    icon: "🔓",
    gradient: "from-gray-600 to-gray-800",
    note: "Open-source AI coding agent (reads AGENTS.md)",
    category: "cli",
    format: "markdown",
    url: "https://opencode.ai",
  },

  // ========================================
  // OTHER EMERGING TOOLS
  // ========================================
  {
    id: "openhands",
    name: "OpenHands",
    file: "AGENTS.md",
    otherFiles: [".openhands/microagents/repo.md"],
    blueprintType: "OPENHANDS_MD",
    readsAgentsMd: true,
    icon: "🤲",
    gradient: "from-indigo-500 to-purple-500",
    note: "Open-source AI agent (reads AGENTS.md)",
    category: "other",
    format: "markdown",
    url: "https://github.com/OpenHands/OpenHands",
  },
  {
    id: "crush",
    name: "Crush",
    file: "CRUSH.md",
    readsAgentsMd: true,
    icon: "💥",
    gradient: "from-red-500 to-orange-500",
    note: "Charm's terminal coding agent",
    category: "other",
    format: "markdown",
    url: "https://github.com/charmbracelet/crush",
  },
  {
    id: "firebender",
    name: "Firebender",
    file: ".firebender/rules/project.mdc",
    rulesDirectory: ".firebender/rules/",
    readsAgentsMd: true,
    icon: "🔥",
    gradient: "from-orange-600 to-red-600",
    note: "AI agent for Android Studio and IntelliJ",
    category: "other",
    format: "mdc",
    url: "https://firebender.com",
  },

  // ========================================
  // AI AGENT COMMANDS - Slash commands for IDEs
  // ========================================
  {
    id: "cursor-command",
    name: "Cursor Command",
    file: ".cursor/commands/",
    blueprintType: "CURSOR_COMMAND",
    icon: "⚡",
    gradient: "from-blue-500 to-cyan-500",
    note: "Custom slash commands for Cursor IDE",
    category: "command",
    format: "markdown",
    isCommand: true,
    url: "https://cursor.com/docs",
  },
  {
    id: "claude-command",
    name: "Claude Code Command",
    file: ".claude/commands/",
    blueprintType: "CLAUDE_COMMAND",
    icon: "🧠",
    gradient: "from-orange-500 to-amber-500",
    note: "Slash commands for Claude Code (legacy format, still works; skills preferred)",
    category: "command",
    format: "markdown",
    isCommand: true,
    url: "https://code.claude.com/docs",
  },
  {
    id: "windsurf-workflow",
    name: "Devin Desktop Workflow",
    file: ".devin/workflows/",
    blueprintType: "WINDSURF_WORKFLOW",
    icon: "🏄",
    gradient: "from-teal-500 to-emerald-500",
    note: "Workflows for Devin Desktop (formerly Windsurf)",
    category: "command",
    format: "markdown",
    isCommand: true,
    url: "https://devin.ai/desktop",
  },
  {
    id: "copilot-prompt",
    name: "Copilot Prompt",
    file: ".github/prompts/",
    blueprintType: "COPILOT_PROMPT",
    icon: "🐙",
    gradient: "from-gray-600 to-gray-800",
    note: "Custom prompts for GitHub Copilot Chat",
    category: "command",
    format: "markdown",
    isCommand: true,
    url: "https://github.com/features/copilot",
  },
  {
    id: "opencode-command",
    name: "OpenCode Command",
    file: ".opencode/commands/",
    blueprintType: "OPENCODE_COMMAND",
    icon: "🔓",
    gradient: "from-gray-600 to-gray-800",
    note: "Custom commands for OpenCode TUI",
    category: "command",
    format: "markdown",
    isCommand: true,
    url: "https://opencode.ai",
  },
];

/**
 * Folders AI coding tools read slash commands (or workflows, or prompts) from,
 * one file per command. The first five have a blueprint type of their own
 * (the command platforms above); a command from any other folder is pushed as
 * CUSTOM and pulled back to the path it came from.
 *
 * Not listed: Antigravity workflows (stopped working 2026-10-19, replaced by
 * skills) and Codex prompts (user folder only, deprecated for skills).
 * Augment also reads .claude/commands, and Factory imports it.
 */
const command = (
  id: string,
  name: string,
  directory: string,
  platformId: string,
  icon: string,
  note: string,
  extension = ".md"
): CommandDefinition => ({ id, name, directory, extension, platformId, icon, gradient: "from-gray-600 to-gray-800", note });

export const COMMANDS: CommandDefinition[] = [
  {
    id: "cursor-command",
    name: "Cursor Command",
    directory: ".cursor/commands",
    extension: ".md",
    platformId: "cursor",
    icon: "⚡",
    gradient: "from-blue-500 to-cyan-500",
    note: "Custom slash commands for Cursor IDE (e.g., /deploy, /test)",
  },
  {
    id: "claude-command",
    name: "Claude Code Command",
    directory: ".claude/commands",
    extension: ".md",
    platformId: "claude",
    icon: "🧠",
    gradient: "from-orange-500 to-amber-500",
    note: "Slash commands for Claude Code (legacy format, still works; skills preferred)",
  },
  {
    id: "windsurf-workflow",
    name: "Devin Desktop Workflow",
    directory: ".devin/workflows",
    extension: ".md",
    platformId: "windsurf",
    icon: "🏄",
    gradient: "from-teal-500 to-emerald-500",
    note: "Workflows for Devin Desktop (formerly Windsurf; .windsurf/workflows is still read)",
  },
  {
    id: "copilot-prompt",
    name: "Copilot Prompt",
    directory: ".github/prompts",
    extension: ".prompt.md",
    platformId: "copilot",
    icon: "🐙",
    gradient: "from-gray-600 to-gray-800",
    note: "Custom prompts for GitHub Copilot Chat",
  },
  {
    id: "opencode-command",
    name: "OpenCode Command",
    directory: ".opencode/commands",
    extension: ".md",
    platformId: "opencode",
    icon: "🔓",
    gradient: "from-gray-600 to-gray-800",
    note: "Custom commands for OpenCode TUI",
  },
  command("gemini-command", "Gemini CLI Command", ".gemini/commands", "gemini-cli", "💎", "Custom commands for Gemini CLI (TOML)", ".toml"),
  command("kiro-prompt", "Kiro Prompt", ".kiro/prompts", "kiro", "🚀", "Custom prompts for Kiro"),
  command("junie-command", "Junie Command", ".junie/commands", "junie", "🎯", "Custom commands for Junie"),
  command("augment-command", "Augment Command", ".augment/commands", "augment", "🔮", "Custom commands for Augment Code"),
  command("trae-command", "Trae Command", ".trae/commands", "trae", "🔷", "Custom commands for Trae"),
  command("kilo-command", "Kilo Code Command", ".kilo/commands", "kilocode", "📊", "Custom commands for Kilo Code"),
  command("cline-workflow", "Cline Workflow", ".clinerules/workflows", "cline", "🔧", "Workflows for Cline"),
  command("roo-command", "Roo / Zoo Code Command", ".roo/commands", "roocode", "🦘", "Custom commands for Roo Code and Zoo Code"),
  command("crush-command", "Crush Command", ".crush/commands", "crush", "💥", "Custom commands for Crush"),
  command("firebender-command", "Firebender Command", ".firebender/commands", "firebender", "🔥", "Custom commands for Firebender", ".mdc"),
  command("factory-command", "Factory Droid Command", ".factory/commands", "factory", "🏭", "Custom commands for Factory Droid"),
  command("qwen-command", "Qwen Code Command", ".qwen/commands", "qwen", "🐉", "Custom commands for Qwen Code"),
  command("pi-prompt", "Pi Prompt", ".pi/prompts", "pi", "🥧", "Prompt templates for Pi"),
];

/**
 * A command written for another tool, in the format of `toCommandId`: the
 * Markdown body as it is, except Gemini CLI, which reads TOML with the
 * prompt in `prompt` and the frontmatter description in `description`.
 */
export function commandContent(content: string, toCommandId: string): string {
  if (toCommandId !== "gemini-command") return content;
  const { frontmatter, body } = splitFrontmatter(content);
  const descLine = frontmatter.split(/\r?\n/).find((l) => l.startsWith("description:"));
  const description = descLine?.slice("description:".length).trim().replace(/^["']|["']$/g, "");
  const prompt = body.trimEnd();
  // A TOML literal string keeps backslashes and quotes as written; a basic
  // string with escapes only when the prompt itself holds '''
  const quoted = prompt.includes("'''")
    ? `"""\n${prompt.replace(/\\/g, "\\\\").replace(/"""/g, '""\\"')}\n"""`
    : `'''\n${prompt}\n'''`;
  return `${description ? `description = ${JSON.stringify(description)}\n` : ""}prompt = ${quoted}\n`;
}

// ========================================
// AGENT SKILLS AND MCP SERVERS
// ========================================

// Skills and subagents live in agent-assets.ts; re-exported so imports of
// this table keep working
export * from "./agent-assets";

/** Blueprint type of an MCP server config. */
export const MCP_BLUEPRINT_TYPE = "MCP_CONFIG";

/**
 * Project MCP server configs and the key each nests the servers under. The
 * server entries are the same everywhere; VS Code names the key "servers".
 * A config pulled without a stored path is written as the first one.
 */
export const MCP_CONFIGS = [
  { id: "claude-mcp", name: "Claude Code", file: ".mcp.json", key: "mcpServers" },
  { id: "cursor-mcp", name: "Cursor", file: ".cursor/mcp.json", key: "mcpServers" },
  { id: "vscode-mcp", name: "VS Code (Copilot)", file: ".vscode/mcp.json", key: "servers" },
  { id: "kiro-mcp", name: "Kiro", file: ".kiro/settings/mcp.json", key: "mcpServers" },
] as const;

/**
 * Rewrite an MCP server config for another tool: the same servers under the
 * target's key. VS Code wants each server's transport in "type", so a server
 * without one gets "stdio" (it has a command) or "http" (it has a url).
 * Throws on a file that is not JSON or holds no server map.
 */
export function convertMcpConfig(content: string, targetId: string): string {
  const target = MCP_CONFIGS.find((c) => c.id === targetId);
  if (!target) throw new Error(`Unknown MCP target: ${targetId}`);
  const source = JSON.parse(content) as Record<string, unknown>;
  const servers = (source.mcpServers ?? source.servers) as Record<string, Record<string, unknown>> | undefined;
  if (!servers || typeof servers !== "object" || Array.isArray(servers)) {
    throw new Error("No \"mcpServers\" or \"servers\" object in the MCP config");
  }
  const out: Record<string, unknown> = {};
  if (target.key === "servers") {
    out.servers = Object.fromEntries(
      Object.entries(servers).map(([name, server]) => [
        name,
        server.type ? server : { type: server.url ? "http" : "stdio", ...server },
      ])
    );
    // VS Code's prompted inputs (${input:...}) only mean something to VS Code
    if (source.inputs) out.inputs = source.inputs;
  } else {
    out[target.key] = servers;
  }
  return `${JSON.stringify(out, null, 2)}\n`;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Get platform by ID
 */
export function getPlatform(id: string): PlatformDefinition | undefined {
  return PLATFORMS.find((p) => p.id === id);
}

/**
 * Get all platform IDs
 */
export function getAllPlatformIds(): string[] {
  return PLATFORMS.map((p) => p.id);
}

/**
 * Get featured/popular platforms
 */
export function getFeaturedPlatforms(): PlatformDefinition[] {
  return PLATFORMS.filter((p) => p.featured);
}

/**
 * Get platforms by category
 */
export function getPlatformsByCategory(
  category: PlatformDefinition["category"]
): PlatformDefinition[] {
  return PLATFORMS.filter((p) => p.category === category);
}

/**
 * Get display name for a platform
 */
export function getPlatformDisplayName(id: string): string {
  const platform = getPlatform(id);
  return platform?.name ?? id;
}

/**
 * Get output file path for a platform
 */
export function getPlatformFile(id: string): string {
  const platform = getPlatform(id);
  return platform?.file ?? `${id}.md`;
}

/**
 * Total count of supported platforms
 */
export const PLATFORM_COUNT = PLATFORMS.length;

/**
 * Platform file mappings (for file-generator.ts)
 * Maps platform ID to output file path
 */
export const PLATFORM_FILES: Record<string, string> = Object.fromEntries(
  PLATFORMS.map((p) => [p.id, p.file])
);

// ========================================
// COMMAND HELPER FUNCTIONS
// ========================================

/**
 * Get command definition by ID
 */
export function getCommand(id: string): CommandDefinition | undefined {
  return COMMANDS.find((c) => c.id === id);
}

/**
 * Get all command platforms (for UI selection)
 */
export function getCommandPlatforms(): PlatformDefinition[] {
  return PLATFORMS.filter((p) => p.isCommand);
}

/**
 * Get command platform by platform ID (e.g., "cursor" -> cursor-command)
 */
export function getCommandForPlatform(platformId: string): CommandDefinition | undefined {
  return COMMANDS.find((c) => c.platformId === platformId);
}

/**
 * Check if a file path is a command file
 */
export function isCommandFile(filePath: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, "/");
  return COMMANDS.some((cmd) => normalizedPath.includes(cmd.directory));
}

/**
 * Infer command type from file path
 */
export function inferCommandType(filePath: string): CommandDefinition | undefined {
  const normalizedPath = filePath.replace(/\\/g, "/");
  return COMMANDS.find((cmd) => normalizedPath.includes(cmd.directory));
}

/**
 * Get the template type for a command
 */
export function getCommandTemplateType(commandId: string): string | undefined {
  const platform = getPlatform(commandId);
  return platform?.isCommand ? platform.blueprintType : undefined;
}

/**
 * Blueprint types that are not the blueprintType of any platform, and the
 * platform each one belongs to: legacy types, and names older CLIs sent.
 */
export const BLUEPRINT_TYPE_ALIASES: Record<string, string> = {
  CURSOR_MDC: "cursor",
  CURSORRULES: "cursor", // .cursorrules is deprecated; Cursor reads .cursor/rules/
  AIDER_MD: "universal", // Aider conventions: Markdown rules, which Aider now reads from AGENTS.md
  FIREBASE_RULES: "firebase",
  GOOSE_HINTS: "goose",
  OPENCODE_CONFIG: "opencode",
  OPENHANDS_CONFIG: "openhands",
  FIREBENDER_CONFIG: "firebender",
};

/**
 * The platform a blueprint type belongs to: the first platform with that
 * blueprintType (AGENTS_MD is universal), then the aliases. Undefined for
 * CUSTOM, for types that are not rule files, and for the types of retired
 * platforms (VOID_CONFIG, CODY_CONFIG, CONTINUE_CONFIG, CONTINUE_PROMPT,
 * TABNINE_CONFIG): those stored blueprints hold a JSON or YAML config, not
 * rules, so they load and download as they are.
 */
export function platformForBlueprintType(type: string): string | undefined {
  return PLATFORMS.find((p) => p.blueprintType === type)?.id ?? BLUEPRINT_TYPE_ALIASES[type];
}

/**
 * Platform ids that are no longer in the table, and the platform that now
 * covers each, so a saved wizard draft or CLI preference still generates.
 */
export const RETIRED_PLATFORM_IDS: Record<string, string> = {
  devin: "windsurf", // Windsurf became Devin Desktop; both read .devin/rules/
  continue: "universal",
  cody: "universal",
  supermaven: "universal",
  codegpt: "universal",
  void: "universal",
};

/** A platform id as the table knows it today. */
export function resolvePlatformId(id: string): string {
  return RETIRED_PLATFORM_IDS[id] ?? id;
}

/** A rules file that holds no rules of its own and imports AGENTS.md. */
export const AGENTS_MD_POINTER = "@AGENTS.md\n";

/** A rules file whose whole body is an AGENTS.md import: no content of its own to push or check. */
export function isAgentsMdPointer(content: string): boolean {
  return /^@(\.\/)?AGENTS\.md$/.test(content.trim());
}

/**
 * Of the files generated together, the ones that can be AGENTS_MD_POINTER
 * instead of a second copy of the rules: AGENTS.md is generated with them, and
 * every tool reading the file follows @path imports (Claude Code, Gemini CLI).
 */
export function agentsMdPointerFiles(targets: { platform: string; file: string }[]): Set<string> {
  return agentsMdFiles(targets, (p) => p.importsFiles);
}

/**
 * Of the files generated together, the ones to leave out: AGENTS.md is
 * generated with them, and every tool reading the file reads AGENTS.md too.
 */
export function agentsMdSkippedFiles(targets: { platform: string; file: string }[]): Set<string> {
  return agentsMdFiles(targets, (p) => p.readsAgentsMd);
}

function agentsMdFiles(
  targets: { platform: string; file: string }[],
  covered: (p: PlatformDefinition) => boolean | undefined
): Set<string> {
  const files = new Set<string>();
  if (!targets.some((t) => t.file === "AGENTS.md")) return files;
  for (const { file } of targets) {
    if (file === "AGENTS.md") continue;
    const readers = targets.filter((t) => t.file === file);
    if (readers.every((t) => covered(getPlatform(t.platform)!))) files.add(file);
  }
  return files;
}

/**
 * Whether AGENTS.md joins a set of picked platforms: with two or more tools it
 * is the one copy they share, and Claude Code and Gemini CLI import it.
 */
export function needsAgentsMd(platforms: string[]): boolean {
  return platforms.length > 1 || platforms.some((p) => getPlatform(p)?.importsFiles);
}

/**
 * Rules files tools read that no table entry writes: Qwen Code's own file and
 * Cursor's legacy root file. Found by check and push, never generated.
 */
export const EXTRA_RULE_FILES: { path: string; name: string }[] = [
  { path: "QWEN.md", name: "Qwen Code" },
  { path: ".cursorrules", name: "Cursor (legacy)" },
];

/**
 * Every rules file and folder (ending in "/") the table's tools read, with the
 * tool's name: generated files, rules folders, other files, then
 * EXTRA_RULE_FILES. Configs (Aider's YAML) are not rules files, so they are
 * left out. Each path once.
 */
export function ruleFileLocations(): { path: string; name: string }[] {
  const seen = new Map<string, string>();
  for (const p of PLATFORMS) {
    if (p.isCommand || p.format === "json" || p.format === "yaml") continue;
    for (const path of [p.file, p.rulesDirectory, ...(p.otherFiles ?? [])]) {
      if (path && !seen.has(path)) seen.set(path, p.id === "universal" ? "AGENTS.md" : p.name);
    }
  }
  for (const { path, name } of EXTRA_RULE_FILES) if (!seen.has(path)) seen.set(path, name);
  return [...seen].map(([path, name]) => ({ path, name }));
}

/**
 * Convert a command to a different IDE format (see commandContent)
 */
export function convertCommand(
  content: string,
  _fromType: string,
  toType: string
): { content: string; filename: string; directory: string } {
  const toCommand = COMMANDS.find((c) => c.id === toType);
  if (!toCommand) {
    throw new Error(`Unknown command type: ${toType}`);
  }

  return {
    content: commandContent(content, toType),
    filename: "command.md", // Will be replaced with actual filename
    directory: toCommand.directory,
  };
}

/**
 * Get all command directories to scan
 */
export function getCommandDirectories(): string[] {
  return COMMANDS.map((c) => c.directory);
}

/**
 * Total count of supported commands
 */
export const COMMAND_COUNT = COMMANDS.length;

