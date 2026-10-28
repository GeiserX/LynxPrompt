/**
 * Cloud Sync for files downloaded from the web wizard: the blueprint the file
 * is saved as, and the sync instructions written into the file.
 */

import { toBlueprintApiId } from "../../packages/shared/src/sync-header";
import { getPlatform, resolvePlatformId } from "../../packages/shared/src/platforms";

// The sync header lives in packages/shared, which the CLI uses too.
export { toBlueprintApiId, addApiSyncHeader, type ApiSyncHeaderOptions } from "../../packages/shared/src/sync-header";

// Wizard platform id -> blueprint type: the platform table's, AGENTS_MD for a
// tool whose file is AGENTS.md, else CUSTOM (the stored repository path still
// says which file it is).
export function blueprintTypeForPlatform(platform: string | undefined): string {
  const p = getPlatform(resolvePlatformId(platform || "universal"));
  return p?.blueprintType ?? (p?.file === "AGENTS.md" ? "AGENTS_MD" : "CUSTOM");
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
