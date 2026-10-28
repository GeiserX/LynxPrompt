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
 * src/lib/file-generator.ts (web) and cli/src/utils/generator.ts (CLI).
 * tests/lib/platform-table.test.ts checks both generators and the CLI's
 * pull and push agree with this table.
 */

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
 * All supported AI IDE platforms (30+ and growing!)
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
    note: "Works with Claude Code, Copilot, Aider, and many others",
    category: "popular",
    format: "markdown",
    featured: true,
    url: "https://agents-md.dev",
  },
  {
    id: "cursor",
    name: "Cursor",
    file: ".cursor/rules/project.mdc",
    rulesDirectory: ".cursor/rules/",
    blueprintType: "CURSOR_RULES",
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
    blueprintType: "CLAUDE_MD",
    icon: "🧠",
    gradient: "from-orange-500 to-amber-500",
    note: "Anthropic's agentic coding tool",
    category: "popular",
    format: "markdown",
    featured: true,
    url: "https://docs.anthropic.com/en/docs/claude-code",
  },
  {
    id: "copilot",
    name: "GitHub Copilot",
    file: ".github/copilot-instructions.md",
    blueprintType: "COPILOT_INSTRUCTIONS",
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
    name: "Windsurf",
    file: ".windsurfrules",
    blueprintType: "WINDSURF_RULES",
    icon: "🏄",
    gradient: "from-teal-500 to-emerald-500",
    note: "Codeium's AI-native IDE",
    category: "popular",
    format: "text",
    featured: true,
    url: "https://windsurf.com",
  },

  // ========================================
  // AI-POWERED IDEs
  // ========================================
  {
    id: "antigravity",
    name: "Antigravity",
    file: "GEMINI.md",
    blueprintType: "GEMINI_MD",
    icon: "💎",
    gradient: "from-blue-600 to-indigo-600",
    note: "Google's Gemini-powered IDE",
    category: "ide",
    format: "markdown",
    featured: true,
    url: "https://idx.google.com",
  },
  {
    id: "zed",
    name: "Zed",
    file: ".rules",
    blueprintType: "ZED_INSTRUCTIONS",
    icon: "⚡",
    gradient: "from-amber-500 to-yellow-500",
    note: "High-performance editor with AI",
    category: "ide",
    format: "markdown",
    url: "https://zed.dev",
  },
  {
    id: "void",
    name: "Void",
    file: ".void/config.json",
    blueprintType: "VOID_CONFIG",
    icon: "🕳️",
    gradient: "from-slate-600 to-slate-800",
    note: "Open-source Cursor alternative",
    category: "ide",
    format: "json",
    url: "https://voideditor.com",
  },
  {
    id: "trae",
    name: "Trae AI",
    file: ".trae/rules/project_rules.md",
    rulesDirectory: ".trae/rules/",
    blueprintType: "TRAE_RULES",
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
    note: "Google's cloud IDE",
    category: "ide",
    format: "markdown",
    url: "https://idx.dev",
  },

  // ========================================
  // EDITOR EXTENSIONS & PLUGINS
  // ========================================
  {
    id: "cline",
    name: "Cline",
    file: ".clinerules",
    blueprintType: "CLINE_RULES",
    icon: "🔧",
    gradient: "from-purple-500 to-pink-500",
    note: "Autonomous coding agent for VS Code",
    category: "editor",
    format: "text",
    url: "https://cline.bot",
  },
  {
    id: "roocode",
    name: "Roo Code",
    file: ".roo/rules/project.md",
    rulesDirectory: ".roo/rules/",
    blueprintType: "ROO_RULES",
    icon: "🦘",
    gradient: "from-orange-400 to-red-500",
    note: "AI coding assistant for VS Code",
    category: "editor",
    format: "markdown",
    url: "https://roocode.com",
  },
  {
    id: "continue",
    name: "Continue",
    file: ".continue/config.json",
    blueprintType: "CONTINUE_CONFIG",
    icon: "➡️",
    gradient: "from-blue-600 to-indigo-500",
    note: "Open-source AI autopilot",
    category: "editor",
    format: "json",
    url: "https://continue.dev",
  },
  {
    id: "cody",
    name: "Sourcegraph Cody",
    file: ".cody/config.json",
    blueprintType: "CODY_CONFIG",
    icon: "🔍",
    gradient: "from-pink-500 to-rose-500",
    note: "Context-aware AI assistant",
    category: "editor",
    format: "json",
    url: "https://sourcegraph.com/cody",
  },
  {
    id: "tabnine",
    name: "Tabnine",
    file: ".tabnine.yaml",
    blueprintType: "TABNINE_CONFIG",
    icon: "📝",
    gradient: "from-cyan-500 to-blue-500",
    note: "AI code completion",
    category: "editor",
    format: "yaml",
    url: "https://tabnine.com",
  },
  {
    id: "supermaven",
    name: "Supermaven",
    file: ".supermaven/config.json",
    icon: "🦸",
    gradient: "from-amber-500 to-orange-500",
    note: "Fast AI code completions",
    category: "editor",
    format: "json",
    url: "https://supermaven.com",
  },
  {
    id: "codegpt",
    name: "CodeGPT",
    file: ".codegpt/config.json",
    icon: "💬",
    gradient: "from-emerald-500 to-teal-500",
    note: "VS Code AI assistant",
    category: "editor",
    format: "json",
    url: "https://codegpt.co",
  },
  {
    id: "amazonq",
    name: "Amazon Q",
    file: ".amazonq/rules/project.md",
    rulesDirectory: ".amazonq/rules/",
    blueprintType: "AMAZONQ_RULES",
    icon: "📦",
    gradient: "from-orange-400 to-amber-500",
    note: "AWS AI coding companion",
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
    file: ".kilocode/rules/project.md",
    rulesDirectory: ".kilocode/rules/",
    blueprintType: "KILOCODE_RULES",
    icon: "📊",
    gradient: "from-green-500 to-emerald-500",
    note: "AI code generation",
    category: "editor",
    format: "markdown",
    url: "https://kilocode.ai",
  },
  {
    id: "junie",
    name: "Junie",
    file: ".junie/guidelines.md",
    blueprintType: "JUNIE_GUIDELINES",
    icon: "🎯",
    gradient: "from-pink-400 to-rose-500",
    note: "JetBrains AI assistant",
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
    file: "CONVENTIONS.md",
    blueprintType: "AIDER_MD",
    icon: "🤖",
    gradient: "from-green-500 to-lime-500",
    note: "AI pair programming in terminal",
    category: "cli",
    format: "markdown",
    url: "https://aider.chat",
  },
  {
    id: "goose",
    name: "Goose",
    file: ".goosehints",
    blueprintType: "GOOSEHINTS",
    icon: "🪿",
    gradient: "from-gray-500 to-gray-700",
    note: "Block's AI coding agent",
    category: "cli",
    format: "text",
    url: "https://github.com/block/goose",
  },
  {
    id: "warp",
    name: "Warp AI",
    file: "WARP.md",
    blueprintType: "WARP_MD",
    icon: "🚀",
    gradient: "from-purple-500 to-pink-500",
    note: "AI-powered terminal",
    category: "cli",
    format: "markdown",
    url: "https://warp.dev",
  },
  {
    id: "gemini-cli",
    name: "Gemini CLI",
    file: "GEMINI.md",
    blueprintType: "GEMINI_MD",
    icon: "💎",
    gradient: "from-blue-500 to-cyan-500",
    note: "Google's Gemini in terminal",
    category: "cli",
    format: "markdown",
    url: "https://github.com/google-gemini/gemini-cli",
  },
  {
    id: "opencode",
    name: "Open Code",
    file: "AGENTS.md",
    blueprintType: "OPENCODE_JSON",
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
    file: ".openhands/microagents/repo.md",
    blueprintType: "OPENHANDS_MD",
    icon: "🤲",
    gradient: "from-indigo-500 to-purple-500",
    note: "Open-source AI agent",
    category: "other",
    format: "markdown",
    url: "https://github.com/All-Hands-AI/OpenHands",
  },
  {
    id: "crush",
    name: "Crush",
    file: "CRUSH.md",
    icon: "💥",
    gradient: "from-red-500 to-orange-500",
    note: "AI coding assistant",
    category: "other",
    format: "markdown",
  },
  {
    id: "firebender",
    name: "Firebender",
    file: ".firebender/rules/project.mdc",
    rulesDirectory: ".firebender/rules/",
    icon: "🔥",
    gradient: "from-orange-600 to-red-600",
    note: "AI code transformation",
    category: "other",
    format: "mdc",
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
    url: "https://docs.cursor.com/context/rules",
  },
  {
    id: "claude-command",
    name: "Claude Code Command",
    file: ".claude/commands/",
    blueprintType: "CLAUDE_COMMAND",
    icon: "🧠",
    gradient: "from-orange-500 to-amber-500",
    note: "Custom slash commands for Claude Code",
    category: "command",
    format: "markdown",
    isCommand: true,
    url: "https://docs.anthropic.com/en/docs/claude-code",
  },
  {
    id: "windsurf-workflow",
    name: "Windsurf Workflow",
    file: ".windsurf/workflows/",
    blueprintType: "WINDSURF_WORKFLOW",
    icon: "🏄",
    gradient: "from-teal-500 to-emerald-500",
    note: "Cascade workflows for Windsurf IDE",
    category: "command",
    format: "markdown",
    isCommand: true,
    url: "https://windsurf.com",
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
    id: "continue-prompt",
    name: "Continue Prompt",
    file: ".continue/prompts/",
    blueprintType: "CONTINUE_PROMPT",
    icon: "➡️",
    gradient: "from-blue-600 to-indigo-500",
    note: "Invokable prompts for Continue.dev",
    category: "command",
    format: "markdown",
    isCommand: true,
    url: "https://continue.dev",
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
 * All supported AI agent command types
 * Commands are reusable workflows triggered via slash commands
 * 
 * Supported tools (from research):
 * - Cursor: .cursor/commands/*.md
 * - Claude Code: .claude/commands/*.md  
 * - Windsurf: .windsurf/workflows/*.md
 * - GitHub Copilot: .github/prompts/*.prompt.md
 * - Continue.dev: .continue/prompts/*.md (with invokable: true)
 * - OpenCode: .opencode/commands/*.md
 * - Zed: Custom slash command extensions
 * - Aider: Built-in commands (not storable)
 * 
 * NOT supported (no executable slash commands):
 * - JetBrains AI Assistant (uses Alt+Enter menu)
 * - Replit Agent
 * - Bolt.new
 */
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
    note: "Custom slash commands for Claude Code (e.g., /review, /refactor)",
  },
  {
    id: "windsurf-workflow",
    name: "Windsurf Workflow",
    directory: ".windsurf/workflows",
    extension: ".md",
    platformId: "windsurf",
    icon: "🏄",
    gradient: "from-teal-500 to-emerald-500",
    note: "Cascade workflows for Windsurf IDE",
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
    id: "continue-prompt",
    name: "Continue Prompt",
    directory: ".continue/prompts",
    extension: ".md",
    platformId: "continue",
    icon: "➡️",
    gradient: "from-blue-600 to-indigo-500",
    note: "Invokable prompts for Continue.dev extension",
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
];

// ========================================
// AGENT SKILLS AND MCP SERVERS
// ========================================

/** Blueprint type of an Agent Skill: the SKILL.md of one skill folder. */
export const SKILL_BLUEPRINT_TYPE = "AGENT_SKILL";

/**
 * Folders tools read Agent Skills from, one folder per skill holding a
 * SKILL.md: Claude Code, Codex, GitHub Copilot, Cursor, Gemini CLI, OpenCode.
 * A skill pulled without a stored path goes in the first one.
 */
export const SKILL_DIRECTORIES = [
  ".claude/skills",
  ".agents/skills",
  ".github/skills",
  ".cursor/skills",
  ".gemini/skills",
  ".opencode/skills",
];

/**
 * Folder a skill goes in under a skills directory: the "name" in its SKILL.md
 * frontmatter (the Agent Skills format wants the two to match), else the
 * blueprint name, slugified. The web download and `lynxp pull` both use it.
 */
export function skillFolder(bp: { name?: string; content?: string }): string {
  const frontmatter = bp.content?.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
  const name = frontmatter?.match(/^name:\s*["']?([^"'\r\n]+?)["']?\s*$/m)?.[1];
  const slug = (name || bp.name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "skill";
}

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
  CODEX_MD: "universal", // Codex reads AGENTS.md
  FIREBASE_RULES: "firebase",
  GOOSE_HINTS: "goose",
  OPENCODE_CONFIG: "opencode",
  OPENHANDS_CONFIG: "openhands",
  FIREBENDER_CONFIG: "firebender",
};

/**
 * The platform a blueprint type belongs to: the first platform with that
 * blueprintType (AGENTS_MD is universal, GEMINI_MD is Antigravity), then the
 * aliases. Undefined for CUSTOM and for types that are not rule files.
 */
export function platformForBlueprintType(type: string): string | undefined {
  return PLATFORMS.find((p) => p.blueprintType === type)?.id ?? BLUEPRINT_TYPE_ALIASES[type];
}

/**
 * Convert a command to a different IDE format
 * Currently supports Cursor <-> Claude Code conversion
 */
export function convertCommand(
  content: string,
  _fromType: string,
  toType: string
): { content: string; filename: string; directory: string } {
  // Both use markdown, so content conversion is straightforward
  // The main difference is the directory structure
  
  const toCommand = COMMANDS.find((c) => c.id === toType);
  if (!toCommand) {
    throw new Error(`Unknown command type: ${toType}`);
  }

  return {
    content: content,
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

