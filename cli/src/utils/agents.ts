/**
 * Comprehensive agent definitions for LynxPrompt
 * Supports 40+ AI coding agents with simple, discoverable patterns
 */

export interface AgentDefinition {
  /** Unique identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Short description */
  description: string;
  /** File/directory patterns to detect this agent */
  patterns: string[];
  /** Output file path when exporting */
  output: string;
  /** Output format type */
  format: "markdown" | "mdc" | "json" | "yaml" | "toml" | "text";
  /** Category for grouping */
  category: "popular" | "markdown" | "config" | "mcp" | "directory";
  /** Whether this is a commonly used agent */
  popular?: boolean;
}

/**
 * All supported AI coding agents
 * Organized by popularity and format type
 */
export const AGENTS: AgentDefinition[] = [
  // === POPULAR AGENTS ===
  {
    id: "cursor",
    name: "Cursor",
    description: "AI-powered code editor with .cursor/rules/ support",
    patterns: [".cursor/rules/"],
    output: ".cursor/rules/",
    format: "mdc",
    category: "popular",
    popular: true,
  },
  {
    id: "agents",
    name: "AGENTS.md",
    description: "Universal format for Claude Code, GitHub Copilot, Aider, and others",
    patterns: ["AGENTS.md"],
    output: "AGENTS.md",
    format: "markdown",
    category: "popular",
    popular: true,
  },
  {
    id: "claude",
    name: "Claude Code",
    description: "Anthropic's Claude with CLAUDE.md support",
    patterns: ["CLAUDE.md"],
    output: "CLAUDE.md",
    format: "markdown",
    category: "popular",
    popular: true,
  },
  {
    id: "copilot",
    name: "GitHub Copilot",
    description: "GitHub's AI pair programmer",
    patterns: [".github/copilot-instructions.md"],
    output: ".github/copilot-instructions.md",
    format: "markdown",
    category: "popular",
    popular: true,
  },
  {
    id: "windsurf",
    name: "Windsurf",
    description: "Codeium's AI IDE with .windsurfrules support",
    patterns: [".windsurfrules", ".windsurf/rules/"],
    output: ".windsurfrules",
    format: "text",
    category: "popular",
    popular: true,
  },

  // === MARKDOWN FORMAT AGENTS ===
  {
    id: "gemini",
    name: "Gemini",
    description: "Google's Gemini AI assistant",
    patterns: ["GEMINI.md"],
    output: "GEMINI.md",
    format: "markdown",
    category: "markdown",
  },
  {
    id: "warp",
    name: "Warp AI",
    description: "Warp terminal's AI assistant",
    patterns: ["WARP.md"],
    output: "WARP.md",
    format: "markdown",
    category: "markdown",
  },
  {
    id: "zed",
    name: "Zed",
    description: "High-performance code editor with AI features",
    patterns: [".zed/instructions.md", "ZED.md"],
    output: ".zed/instructions.md",
    format: "markdown",
    category: "markdown",
  },
  {
    id: "crush",
    name: "Crush",
    description: "AI coding assistant",
    patterns: ["CRUSH.md"],
    output: "CRUSH.md",
    format: "markdown",
    category: "markdown",
  },
  {
    id: "junie",
    name: "Junie",
    description: "JetBrains' AI coding assistant",
    patterns: [".junie/guidelines.md"],
    output: ".junie/guidelines.md",
    format: "markdown",
    category: "markdown",
  },
  {
    id: "openhands",
    name: "OpenHands",
    description: "Open-source AI coding agent",
    patterns: [".openhands/microagents/repo.md"],
    output: ".openhands/microagents/repo.md",
    format: "markdown",
    category: "markdown",
  },

  // === PLAIN TEXT FORMAT ===
  {
    id: "cline",
    name: "Cline",
    description: "VS Code AI assistant extension",
    patterns: [".clinerules"],
    output: ".clinerules",
    format: "text",
    category: "config",
  },
  {
    id: "goose",
    name: "Goose",
    description: "Block's AI coding assistant",
    patterns: [".goosehints"],
    output: ".goosehints",
    format: "text",
    category: "config",
  },
  {
    id: "aider",
    name: "Aider",
    description: "AI pair programming in your terminal",
    patterns: [".aider.conf.yml", "AIDER.md"],
    output: "AIDER.md",
    format: "markdown",
    category: "config",
  },

  // === DIRECTORY-BASED AGENTS ===
  {
    id: "amazonq",
    name: "Amazon Q",
    description: "AWS's AI coding assistant",
    patterns: [".amazonq/rules/"],
    output: ".amazonq/rules/",
    format: "mdc",
    category: "directory",
  },
  {
    id: "augmentcode",
    name: "Augment Code",
    description: "AI code augmentation tool",
    patterns: [".augment/rules/"],
    output: ".augment/rules/",
    format: "mdc",
    category: "directory",
  },
  {
    id: "kilocode",
    name: "Kilocode",
    description: "AI-powered code generation",
    patterns: [".kilocode/rules/"],
    output: ".kilocode/rules/",
    format: "mdc",
    category: "directory",
  },
  {
    id: "kiro",
    name: "Kiro",
    description: "AWS's spec-driven AI coding agent",
    patterns: [".kiro/steering/"],
    output: ".kiro/steering/",
    format: "mdc",
    category: "directory",
  },
  {
    id: "trae-ai",
    name: "Trae AI",
    description: "ByteDance's AI coding assistant",
    patterns: [".trae/rules/"],
    output: ".trae/rules/",
    format: "mdc",
    category: "directory",
  },
  {
    id: "firebase-studio",
    name: "Firebase Studio",
    description: "Google's Firebase development environment",
    patterns: [".idx/"],
    output: ".idx/",
    format: "mdc",
    category: "directory",
  },
  {
    id: "roocode",
    name: "Roo Code",
    description: "AI coding assistant for VS Code",
    patterns: [".roo/rules/"],
    output: ".roo/rules/",
    format: "mdc",
    category: "directory",
  },

  // === JSON/CONFIG FORMAT ===
  {
    id: "firebender",
    name: "Firebender",
    description: "AI code transformation tool",
    patterns: ["firebender.json"],
    output: "firebender.json",
    format: "json",
    category: "config",
  },
  {
    id: "opencode",
    name: "Open Code",
    description: "Open-source AI coding tool",
    patterns: ["opencode.json"],
    output: "opencode.json",
    format: "json",
    category: "config",
  },

  // === MCP (Model Context Protocol) AGENTS ===
  {
    id: "vscode-mcp",
    name: "VS Code MCP",
    description: "VS Code with Model Context Protocol",
    patterns: [".vscode/mcp.json"],
    output: ".vscode/mcp.json",
    format: "json",
    category: "mcp",
  },
  {
    id: "cursor-mcp",
    name: "Cursor MCP",
    description: "Cursor with Model Context Protocol",
    patterns: [".cursor/mcp.json"],
    output: ".cursor/mcp.json",
    format: "json",
    category: "mcp",
  },
  {
    id: "root-mcp",
    name: "Root MCP",
    description: "Root-level MCP config for Claude Code, Aider",
    patterns: [".mcp.json"],
    output: ".mcp.json",
    format: "json",
    category: "mcp",
  },
  {
    id: "windsurf-mcp",
    name: "Windsurf MCP",
    description: "Windsurf with Model Context Protocol",
    patterns: [".windsurf/mcp_config.json"],
    output: ".windsurf/mcp_config.json",
    format: "json",
    category: "mcp",
  },
];

/**
 * Get agent by ID
 */
export function getAgent(id: string): AgentDefinition | undefined {
  return AGENTS.find((a) => a.id === id);
}

/**
 * Get all popular agents (commonly used)
 */
export function getPopularAgents(): AgentDefinition[] {
  return AGENTS.filter((a) => a.popular);
}

/**
 * Get agents by category
 */
export function getAgentsByCategory(category: AgentDefinition["category"]): AgentDefinition[] {
  return AGENTS.filter((a) => a.category === category);
}

/**
 * Get all agent IDs
 */
export function getAllAgentIds(): string[] {
  return AGENTS.map((a) => a.id);
}

/**
 * Get display name for an agent
 */
export function getAgentDisplayName(id: string): string {
  const agent = getAgent(id);
  return agent?.name ?? id;
}

