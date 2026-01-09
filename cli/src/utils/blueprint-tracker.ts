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
import { join, dirname } from "path";
import { createHash } from "crypto";
import * as yaml from "yaml";

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
}

// Blueprints file structure
export interface BlueprintsConfig {
  version: "1";
  blueprints: TrackedBlueprint[];
}

const BLUEPRINTS_FILE = ".lynxprompt/blueprints.yml";

/**
 * Calculate SHA-256 checksum of content
 */
export function calculateChecksum(content: string): string {
  return createHash("sha256").update(content).digest("hex").substring(0, 16);
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
  }
): Promise<void> {
  const config = await loadBlueprints(cwd);
  
  // Remove existing entry for same file if exists
  config.blueprints = config.blueprints.filter(b => b.file !== blueprint.file);
  
  // Determine editability based on source
  const editable = blueprint.source !== "marketplace";
  const canPull = true; // All tracked blueprints can pull updates
  
  config.blueprints.push({
    id: blueprint.id,
    source: blueprint.source,
    file: blueprint.file,
    name: blueprint.name,
    pulledAt: new Date().toISOString(),
    checksum: calculateChecksum(blueprint.content),
    version: blueprint.version,
    editable,
    canPull,
    hierarchyId: blueprint.hierarchyId,
    hierarchyName: blueprint.hierarchyName,
    repositoryPath: blueprint.repositoryPath,
  });
  
  await saveBlueprints(cwd, config);
}

/**
 * Find tracked blueprint by file path
 */
export async function findBlueprintByFile(cwd: string, file: string): Promise<TrackedBlueprint | null> {
  const config = await loadBlueprints(cwd);
  return config.blueprints.find(b => b.file === file) || null;
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
    const content = await readFile(filePath, "utf-8");
    const currentChecksum = calculateChecksum(content);
    return currentChecksum !== tracked.checksum;
  } catch {
    return false;
  }
}

/**
 * Update checksum after syncing
 */
export async function updateChecksum(cwd: string, file: string, content: string): Promise<void> {
  const config = await loadBlueprints(cwd);
  const blueprint = config.blueprints.find(b => b.file === file);
  
  if (blueprint) {
    blueprint.checksum = calculateChecksum(content);
    blueprint.pulledAt = new Date().toISOString();
    await saveBlueprints(cwd, config);
  }
}

/**
 * Untrack a blueprint (disconnect from cloud)
 */
export async function untrackBlueprint(cwd: string, file: string): Promise<boolean> {
  const config = await loadBlueprints(cwd);
  const initialCount = config.blueprints.length;
  config.blueprints = config.blueprints.filter(b => b.file !== file);
  
  if (config.blueprints.length < initialCount) {
    await saveBlueprints(cwd, config);
    return true;
  }
  return false;
}

/**
 * Link an existing local file to a cloud blueprint
 */
export async function linkBlueprint(
  cwd: string,
  file: string,
  blueprintId: string,
  blueprintName: string,
  source: BlueprintSource
): Promise<void> {
  try {
    const filePath = join(cwd, file);
    const content = await readFile(filePath, "utf-8");
    
    await trackBlueprint(cwd, {
      id: blueprintId,
      name: blueprintName,
      file,
      content,
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











