/**
 * Blueprint Tracker
 * 
 * Tracks which blueprints have been pulled from LynxPrompt cloud and their sync status.
 * Enables:
 * - Detecting if a local file came from a cloud blueprint
 * - Syncing updates from upstream blueprints
 * - Prompting users when they try to modify marketplace blueprints
 * - Managing team/private blueprint versions
 * 
 * Storage: .lynxprompt/blueprints.yml
 */

import { readFile, writeFile, mkdir, access } from "fs/promises";
import { join, dirname, isAbsolute, relative, sep } from "path";
import { createHash } from "crypto";
import * as yaml from "yaml";
import { blueprintContentOf } from "./blueprint-files.js";

// Blueprint source types
export type BlueprintSource = "marketplace" | "team" | "private" | "local";

// Tracked blueprint metadata
export interface TrackedBlueprint {
  id: string;              // Blueprint ID (e.g., bp_abc123)
  source: BlueprintSource; // Where the blueprint came from
  file: string;            // Local file path relative to project root
  name: string;            // Blueprint name for display
  pulledAt: string;        // ISO timestamp of last pull
  checksum: string;        // SHA-256 of content when pulled (to detect local changes)
  version?: string;        // Blueprint version (if available)
  editable: boolean;       // Can the user push changes back?
  canPull: boolean;        // Can pull updates from upstream?
  // Hierarchy info (optional)
  hierarchyId?: string;    // Hierarchy ID (e.g., ha_xyz789)
  hierarchyName?: string;  // Hierarchy name for display
  repositoryPath?: string; // Path within hierarchy (e.g., "packages/core/AGENTS.md")
  // Set by `lynxp pull --vars`: the values written in place of [[VARIABLES]].
  // The file then differs from the cloud content, so localChecksum holds the
  // checksum of the file as written and `checksum` stays the cloud's.
  variables?: Record<string, string>;
  localChecksum?: string;
}

// Blueprints file structure
export interface BlueprintsConfig {
  version: "1";
  blueprints: TrackedBlueprint[];
}

const BLUEPRINTS_FILE = ".lynxprompt/blueprints.yml";

/**
 * Calculate the checksum of blueprint content.
 *
 * Must match the server's contentChecksum (src/lib/content-checksum.ts): the
 * server stores content trimmed, so line endings and leading or trailing
 * whitespace are normalised before hashing. Otherwise a file ending in a
 * newline gets a 409 conflict on every second push.
 */
export function calculateChecksum(content: string): string {
  const normalized = content.replace(/\r\n?/g, "\n").trim();
  return createHash("sha256").update(normalized).digest("hex").substring(0, 16);
}

/**
 * Tracked files are stored as POSIX paths relative to the project root, so
 * "./AGENTS.md", "AGENTS.md", "sub\\AGENTS.md" (Windows) and an absolute path
 * all name the same entry.
 */
export function toTrackedPath(cwd: string, file: string): string {
  let p = isAbsolute(file) ? relative(cwd, file) : file;
  p = p.split(sep).join("/").replace(/\\/g, "/");
  while (p.startsWith("./")) p = p.slice(2);
  return p;
}

function sameFile(cwd: string, a: string, b: string): boolean {
  return toTrackedPath(cwd, a) === toTrackedPath(cwd, b);
}

/**
 * Load blueprints configuration
 */
export async function loadBlueprints(cwd: string): Promise<BlueprintsConfig> {
  const filePath = join(cwd, BLUEPRINTS_FILE);
  
  try {
    await access(filePath);
    const content = await readFile(filePath, "utf-8");
    const config = yaml.parse(content) as BlueprintsConfig;
    return config || { version: "1", blueprints: [] };
  } catch {
    return { version: "1", blueprints: [] };
  }
}

/**
 * Save blueprints configuration
 */
export async function saveBlueprints(cwd: string, config: BlueprintsConfig): Promise<void> {
  const filePath = join(cwd, BLUEPRINTS_FILE);
  const dir = dirname(filePath);
  
  await mkdir(dir, { recursive: true });
  
  const content = yaml.stringify(config, {
    lineWidth: 0,
    singleQuote: false,
  });
  
  await writeFile(filePath, content, "utf-8");
}

/**
 * Track a pulled blueprint
 */
export async function trackBlueprint(
  cwd: string,
  blueprint: {
    id: string;
    name: string;
    file: string;
    content: string;
    source: BlueprintSource;
    version?: string;
    hierarchyId?: string;
    hierarchyName?: string;
    repositoryPath?: string;
    // The file as written, when pull filled it with --vars
    localContent?: string;
    variables?: Record<string, string>;
  }
): Promise<void> {
  const config = await loadBlueprints(cwd);
  
  const file = toTrackedPath(cwd, blueprint.file);

  // Remove existing entry for same file if exists
  config.blueprints = config.blueprints.filter(b => !sameFile(cwd, b.file, file));
  
  // Determine editability based on source
  const editable = blueprint.source !== "marketplace";
  const canPull = true; // All tracked blueprints can pull updates
  
  config.blueprints.push({
    id: blueprint.id,
    source: blueprint.source,
    file,
    name: blueprint.name,
    pulledAt: new Date().toISOString(),
    checksum: calculateChecksum(blueprint.content),
    version: blueprint.version,
    editable,
    canPull,
    hierarchyId: blueprint.hierarchyId,
    hierarchyName: blueprint.hierarchyName,
    repositoryPath: blueprint.repositoryPath,
    ...(blueprint.variables
      ? {
          variables: blueprint.variables,
          localChecksum: calculateChecksum(blueprint.localContent ?? blueprint.content),
        }
      : // An MCP config written in another tool's shape reads back different
        blueprint.localContent !== undefined &&
          calculateChecksum(blueprint.localContent) !== calculateChecksum(blueprint.content)
        ? { localChecksum: calculateChecksum(blueprint.localContent) }
        : {}),
  });
  
  await saveBlueprints(cwd, config);
}

/**
 * Find tracked blueprint by file path
 */
export async function findBlueprintByFile(cwd: string, file: string): Promise<TrackedBlueprint | null> {
  const config = await loadBlueprints(cwd);
  return config.blueprints.find(b => sameFile(cwd, b.file, file)) || null;
}

/**
 * Find tracked blueprint by ID
 */
export async function findBlueprintById(cwd: string, id: string): Promise<TrackedBlueprint | null> {
  const config = await loadBlueprints(cwd);
  return config.blueprints.find(b => b.id === id) || null;
}

/**
 * Check if local file has been modified since pull
 */
export async function hasLocalChanges(cwd: string, tracked: TrackedBlueprint): Promise<boolean> {
  try {
    const filePath = join(cwd, tracked.file);
    const content = blueprintContentOf(tracked.file, await readFile(filePath, "utf-8")) ?? "";
    const currentChecksum = calculateChecksum(content);
    return currentChecksum !== (tracked.localChecksum ?? tracked.checksum);
  } catch {
    return false;
  }
}

/**
 * Update checksum after a push: the cloud now holds exactly this content.
 */
export async function updateChecksum(cwd: string, file: string, content: string): Promise<void> {
  const config = await loadBlueprints(cwd);
  const blueprint = config.blueprints.find(b => sameFile(cwd, b.file, file));
  
  if (blueprint) {
    blueprint.checksum = calculateChecksum(content);
    delete blueprint.variables;
    delete blueprint.localChecksum;
    blueprint.pulledAt = new Date().toISOString();
    await saveBlueprints(cwd, config);
  }
}

/**
 * Where `lynxp sync` puts the cloud version of a file whose local and cloud
 * copies both changed. While it exists, sync and push leave the file alone.
 */
export function conflictFilePath(cwd: string, file: string): string {
  return join(cwd, `${file}.remote`);
}

/**
 * Untrack a blueprint (disconnect from cloud)
 */
export async function untrackBlueprint(cwd: string, file: string): Promise<boolean> {
  const config = await loadBlueprints(cwd);
  const initialCount = config.blueprints.length;
  config.blueprints = config.blueprints.filter(b => !sameFile(cwd, b.file, file));
  
  if (config.blueprints.length < initialCount) {
    await saveBlueprints(cwd, config);
    return true;
  }
  return false;
}

/**
 * Link an existing local file to a cloud blueprint.
 * The stored checksum is the cloud content's, so status and diff show the local
 * file as changed when it differs from the cloud, and push sends the checksum the
 * server holds. Without remote content the local file is used.
 */
export async function linkBlueprint(
  cwd: string,
  file: string,
  blueprintId: string,
  blueprintName: string,
  source: BlueprintSource,
  remoteContent?: string
): Promise<void> {
  try {
    const filePath = join(cwd, file);
    const localContent = await readFile(filePath, "utf-8");
    
    await trackBlueprint(cwd, {
      id: blueprintId,
      name: blueprintName,
      file,
      content: remoteContent ?? localContent,
      source,
    });
  } catch (error) {
    throw new Error(`Could not read file ${file} to link`);
  }
}

/**
 * Get all tracked blueprints
 */
export async function getAllTrackedBlueprints(cwd: string): Promise<TrackedBlueprint[]> {
  const config = await loadBlueprints(cwd);
  return config.blueprints;
}

/**
 * Check sync status of all tracked blueprints
 */
export async function checkSyncStatus(cwd: string): Promise<Array<{
  blueprint: TrackedBlueprint;
  localModified: boolean;
  fileExists: boolean;
}>> {
  const config = await loadBlueprints(cwd);
  const results = [];
  
  for (const blueprint of config.blueprints) {
    const filePath = join(cwd, blueprint.file);
    let fileExists = false;
    let localModified = false;
    
    try {
      await access(filePath);
      fileExists = true;
      localModified = await hasLocalChanges(cwd, blueprint);
    } catch {
      fileExists = false;
    }
    
    results.push({ blueprint, localModified, fileExists });
  }
  
  return results;
}











