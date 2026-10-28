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
  SKILL_BLUEPRINT_TYPE,
  SKILL_DIRECTORIES,
  skillFolder,
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
} from "../../packages/shared/src/platforms";
export type { PlatformDefinition, CommandDefinition, McpConfigTarget } from "../../packages/shared/src/platforms";
