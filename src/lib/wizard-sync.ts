/**
 * Cloud Sync for files downloaded from the web wizard: the blueprint the file
 * is saved as, and the sync instructions written into the file.
 */

import { toBlueprintApiId } from "../../packages/shared/src/sync-header";

// The sync header lives in packages/shared, which the CLI uses too.
export { toBlueprintApiId, addApiSyncHeader, type ApiSyncHeaderOptions } from "../../packages/shared/src/sync-header";

// Wizard platform id -> blueprint type. Platforms without a type of their own
// are saved as CUSTOM; the stored repository path still says which file it is.
const PLATFORM_BLUEPRINT_TYPES: Record<string, string> = {
  universal: "AGENTS_MD",
  cursor: "CURSOR_RULES",
  claude: "CLAUDE_MD",
  copilot: "COPILOT_INSTRUCTIONS",
  windsurf: "WINDSURF_RULES",
  antigravity: "GEMINI_MD",
  "gemini-cli": "GEMINI_MD",
  zed: "ZED_INSTRUCTIONS",
  void: "VOID_CONFIG",
  trae: "TRAE_RULES",
  firebase: "IDX_CONFIG",
  cline: "CLINE_RULES",
  roocode: "ROO_RULES",
  continue: "CONTINUE_CONFIG",
  cody: "CODY_CONFIG",
  tabnine: "TABNINE_CONFIG",
  amazonq: "AMAZONQ_RULES",
  augment: "AUGMENT_RULES",
  kilocode: "KILOCODE_RULES",
  junie: "JUNIE_GUIDELINES",
  kiro: "KIRO_STEERING",
  aider: "AIDER_MD",
  goose: "GOOSEHINTS",
  "cursor-command": "CURSOR_COMMAND",
  "claude-command": "CLAUDE_COMMAND",
  "windsurf-workflow": "WINDSURF_WORKFLOW",
  "copilot-prompt": "COPILOT_PROMPT",
  "continue-prompt": "CONTINUE_PROMPT",
  "opencode-command": "OPENCODE_COMMAND",
};

export function blueprintTypeForPlatform(platform: string | undefined): string {
  return PLATFORM_BLUEPRINT_TYPES[platform || "universal"] ?? "CUSTOM";
}

// Platforms whose wizard output is named after a folder (".cursor/rules/").
// The file inside it, as the CLI writes it (cli/src/utils/generator.ts).
const DIRECTORY_PLATFORM_FILES: Record<string, string> = {
  cursor: ".cursor/rules/project.mdc",
  trae: ".trae/rules/project.mdc",
  firebase: ".idx/rules/project.mdc",
  roocode: ".roo/rules/project.mdc",
  amazonq: ".amazonq/rules/project.md",
  augment: ".augment/rules/project.mdc",
  kilocode: ".kilocode/rules/project.mdc",
  kiro: ".kiro/steering/project.mdc",
};

/**
 * The path of the file a synced blueprint lives in. `lynxp pull` writes the
 * blueprint to its stored repository path, and the sync instructions name
 * it, so it must be a file, never the folder some platforms are listed by.
 */
export function syncFilePath(platform: string | undefined, fileName: string): string {
  if (!fileName.endsWith("/")) return fileName;
  return DIRECTORY_PLATFORM_FILES[platform || ""] ?? `${fileName}project.md`;
}

/** The private blueprint a Cloud Sync download is saved as (create and overwrite alike). */
export function syncBlueprintPayload(
  config: { projectName?: string; projectDescription?: string; platform?: string },
  file: { fileName: string; content: string },
) {
  return {
    name: config.projectName || "My AI Config",
    description: config.projectDescription || "Generated with the LynxPrompt wizard",
    content: file.content, // Keep [[VAR|default]] syntax for blueprints
    type: blueprintTypeForPlatform(config.platform),
    // Where the file lives, so `lynxp pull` writes it back to the same path
    repositoryPath: syncFilePath(config.platform, file.fileName),
    category: "other",
    visibility: "PRIVATE",
  };
}
