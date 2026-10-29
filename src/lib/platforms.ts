/**
 * The platform table lives in packages/shared so the web app and the CLI
 * read the same file paths, formats and blueprint types. See
 * packages/shared/src/platforms.ts.
 */
export {
  PLATFORMS,
  COMMANDS,
  getPlatform,
  getAllPlatformIds,
  getFeaturedPlatforms,
  getPlatformsByCategory,
  getPlatformDisplayName,
  getPlatformFile,
  PLATFORM_COUNT,
  PLATFORM_FILES,
  getCommand,
  getCommandPlatforms,
  getCommandForPlatform,
  isCommandFile,
  inferCommandType,
  getCommandTemplateType,
  BLUEPRINT_TYPE_ALIASES,
  platformForBlueprintType,
  convertCommand,
  commandContent,
  SKILL_BLUEPRINT_TYPE,
  SKILL_DIRECTORIES,
  SKILL_TARGETS,
  skillFolder,
  skillFiles,
  checkSkillContent,
  SUBAGENT_BLUEPRINT_TYPE,
  SUBAGENT_DIRECTORIES,
  SUBAGENT_TARGETS,
  subagentName,
  subagentFiles,
  agentAssetFiles,
  MCP_BLUEPRINT_TYPE,
  MCP_CONFIGS,
  mcpConfigForPath,
  convertMcpConfig,
  extractMcpConfig,
  mergeMcpConfig,
  getCommandDirectories,
  COMMAND_COUNT,
  AGENTS_MD_POINTER,
  agentsMdPointerFiles,
  resolvePlatformId,
} from "../../packages/shared/src/platforms";
export type { PlatformDefinition, CommandDefinition, AgentAssetFile, AgentAssetTarget, McpConfigTarget } from "../../packages/shared/src/platforms";

import { PLATFORMS as ALL_PLATFORMS } from "../../packages/shared/src/platforms";

// Coding agents only: the table also holds the slash-command formats
// (cursor-command, claude-command...), which are not separate tools
export const AGENT_PLATFORM_COUNT = ALL_PLATFORMS.filter((p) => !p.isCommand).length;

/**
 * Blueprint types of retired tools whose blueprints hold that tool's own JSON
 * or YAML config, not rules, and the file each one was written to. Older
 * blueprints of these types download as they are, under that name; new ones
 * are refused.
 */
export const RETIRED_CONFIG_FILES: Record<string, { tool: string; file: string }> = {
  CONTINUE_CONFIG: { tool: "Continue", file: ".continue/config.json" },
  CODY_CONFIG: { tool: "Sourcegraph Cody", file: ".cody/config.json" },
  VOID_CONFIG: { tool: "Void", file: ".void/config.json" },
  TABNINE_CONFIG: { tool: "Tabnine", file: ".tabnine.yaml" },
};
