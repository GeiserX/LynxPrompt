/**
 * Diff command - show changes between local and remote blueprints
 * 
 * Compares local AI configuration files with their linked cloud blueprints.
 * If no blueprint is linked, prompts user to link one first.
 * 
 * Usage:
 *   lynxp diff                    - Compare all tracked files with their cloud blueprints
 *   lynxp diff <file>             - Compare specific file with its linked blueprint
 *   lynxp diff --local            - Show diff between .lynxprompt/rules/ and exported files
 */

import chalk from "chalk";
import { createSpinner } from "../utils/spinner.js";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { isAuthenticated } from "../config.js";
import { api, ApiRequestError } from "../api.js";
import { safeText } from "../utils/terminal.js";
import { computeDiff, formatDiff } from "../utils/line-diff.js";
import { checkSyncStatus, findBlueprintByFile, findBlueprintById } from "../utils/blueprint-tracker.js";
import { fillBlueprintVariables } from "../utils/variables.js";
import { blueprintContentOf, blueprintFilename, isInsideRoot, rulesWritePath } from "../utils/blueprint-files.js";

interface DiffOptions {
  local?: boolean;
}

/**
 * Get summary statistics for a diff
 */
function getDiffStats(diff: Array<{ type: "add" | "remove" | "same"; line: string }>): { added: number; removed: number; unchanged: number } {
  return {
    added: diff.filter(d => d.type === "add").length,
    removed: diff.filter(d => d.type === "remove").length,
    unchanged: diff.filter(d => d.type === "same").length,
  };
}

export async function diffCommand(fileOrId?: string, options: DiffOptions = {}): Promise<void> {
  console.log();
  console.log(chalk.cyan("🐱 LynxPrompt Diff"));
  console.log();

  const cwd = process.cwd();

  // Local diff mode - compare .lynxprompt/rules/ with exported files
  if (options.local) {
    await diffLocal(cwd);
    return;
  }

  // Check for tracked blueprints first
  const trackedFiles = await checkSyncStatus(cwd);
  
  // If a specific file or blueprint ID is given
  if (fileOrId) {
    // A tracked file, or the id of a tracked blueprint (pull suggests 'lynxp diff <id>')
    const trackedFile = await findBlueprintByFile(cwd, fileOrId);
    const tracked = trackedFile ?? (await findBlueprintById(cwd, fileOrId));
    if (tracked) {
      if (!trackedFile) console.log(chalk.gray(`Comparing with: ${tracked.file}`));
      await diffFileWithBlueprint(cwd, tracked.file, tracked.id, false, tracked.variables);
      return;
    }
    
    // Otherwise treat it as a blueprint ID
    await diffWithBlueprintId(cwd, fileOrId);
    return;
  }

  // No argument given - show diff for all tracked files
  if (trackedFiles.length === 0) {
    console.log(chalk.yellow("No tracked blueprints found."));
    console.log();
    console.log(chalk.gray("To track a blueprint and compare changes:"));
    console.log(chalk.gray("  1. Pull a blueprint: lynxp pull <blueprint-id>"));
    console.log(chalk.gray("  2. Or link an existing file: lynxp link"));
    console.log();
    console.log(chalk.gray("Other options:"));
    console.log(chalk.gray("  lynxp diff --local    Compare .lynxprompt/rules/ with exported files"));
    return;
  }

  // Show diff for all tracked files. Every file is compared with the cloud copy:
  // an unchanged local file can still be behind a newer cloud version.
  let hasChanges = false;
  let failed = false;
  
  for (const { blueprint, fileExists } of trackedFiles) {
    if (!fileExists) {
      console.log(chalk.red(`✗ ${blueprint.file} - file not found`));
      continue;
    }
    
    console.log(chalk.cyan(`📄 ${blueprint.file}`));
    console.log(chalk.gray(`   Linked to: ${blueprint.name} (${blueprint.id})`));
    
    const result = await diffFileWithBlueprint(cwd, blueprint.file, blueprint.id, true, blueprint.variables);
    if (result === "changed") {
      hasChanges = true;
    } else if (result === "same") {
      console.log(chalk.green("   ✓ In sync with cloud"));
    } else {
      failed = true;
    }
    console.log();
  }
  
  if (failed) {
    console.log(chalk.yellow("⚠ Some files could not be compared with the cloud (see above)."));
  } else if (!hasChanges) {
    console.log(chalk.green("✓ All tracked files are in sync with their cloud blueprints!"));
  } else {
    console.log(chalk.gray("To bring both sides together: lynxp sync"));
  }
  console.log();
}

/**
 * Compare a specific file with its linked blueprint
 */
async function diffFileWithBlueprint(
  cwd: string,
  file: string,
  blueprintId: string,
  compact: boolean = false,
  variables?: Record<string, string>
): Promise<"same" | "changed" | "error"> {
  const filePath = join(cwd, file);
  
  if (!existsSync(filePath)) {
    console.log(chalk.red(`✗ File not found: ${file}`));
    return "error";
  }

  const spinner = compact ? null : createSpinner("Fetching blueprint...").start();

  try {
    const { blueprint } = await api.getBlueprint(blueprintId);
    spinner?.stop();

    if (!blueprint || !blueprint.content) {
      console.log(chalk.red(`✗ Blueprint has no content`));
      return "error";
    }

    // Of a settings file only its MCP servers are the blueprint
    const localContent = blueprintContentOf(file, await readFile(filePath, "utf-8")) ?? "";
    // A file pulled with --vars is compared with the cloud content filled the same way
    const cloudContent = variables
      ? fillBlueprintVariables(blueprint.content, variables).content
      : blueprint.content;
    const diff = computeDiff(cloudContent, localContent);
    const stats = getDiffStats(diff);

    if (stats.added === 0 && stats.removed === 0) {
      if (!compact) {
        console.log(chalk.green("✓ Files are identical!"));
      }
      return "same";
    }
    if (!compact) {
      console.log(chalk.gray("Changes (cloud → local):"));
      console.log();
    }
    console.log(formatDiff(diff));
    console.log(chalk.gray(`   ${chalk.green(`+${stats.added}`)} ${chalk.red(`-${stats.removed}`)} lines`));
    return "changed";

  } catch (error) {
    spinner?.stop();
    if (error instanceof ApiRequestError) {
      console.log(chalk.red(`✗ Could not fetch blueprint: ${error.message}`));
    } else {
      console.log(chalk.red("✗ Failed to compare"));
    }
    return "error";
  }
}

/**
 * Compare with a specific blueprint ID (legacy behavior)
 */
async function diffWithBlueprintId(cwd: string, blueprintId: string): Promise<void> {
  // Check if logged in
  if (!isAuthenticated()) {
    console.log(chalk.yellow("⚠ Not logged in. Some blueprints may not be accessible."));
    console.log(chalk.gray("Run 'lynxp login' to authenticate."));
    console.log();
  }

  const spinner = createSpinner("Fetching blueprint...").start();

  try {
    const { blueprint } = await api.getBlueprint(blueprintId);
    spinner.stop();

    if (!blueprint || !blueprint.content) {
      console.log(chalk.red(`✗ Blueprint not found or has no content: ${blueprintId}`));
      return;
    }

    console.log(chalk.green(`✓ Blueprint: ${safeText(blueprint.name || blueprintId)}`));
    if (blueprint.description) {
      console.log(chalk.gray(`  ${safeText(blueprint.description)}`));
    }
    console.log();

    // The file 'lynxp pull' writes this blueprint to
    const localPath = rulesWritePath(cwd, blueprintFilename(blueprint));
    let localContent: string | null = null;
    try {
      if (isInsideRoot(cwd, localPath)) {
        localContent = blueprintContentOf(localPath, await readFile(join(cwd, localPath), "utf-8")) ?? "";
      }
    } catch {
      // No such file
    }

    if (localContent === null) {
      console.log(chalk.yellow(`⚠ ${localPath} not found.`));
      console.log(chalk.gray(`Run 'lynxp pull ${blueprintId}' to download the blueprint.`));
      return;
    }

    console.log(chalk.gray(`Comparing with: ${localPath}`));
    console.log();

    // Compute and display diff
    const diff = computeDiff(blueprint.content, localContent);
    const stats = getDiffStats(diff);

    if (stats.added === 0 && stats.removed === 0) {
      console.log(chalk.green("✓ Files are identical!"));
    } else {
      console.log(chalk.gray("Changes (remote → local):"));
      console.log();
      console.log(formatDiff(diff));
      console.log();
      console.log(chalk.gray(`Summary: ${chalk.green(`+${stats.added}`)} ${chalk.red(`-${stats.removed}`)} lines changed`));
    }
    console.log();

  } catch (error) {
    spinner.stop();
    if (error instanceof ApiRequestError) {
      if (error.statusCode === 401) {
        console.log(chalk.red("✗ Authentication required. Run 'lynxp login' first."));
      } else if (error.statusCode === 404) {
        console.log(chalk.red(`✗ Blueprint not found: ${blueprintId}`));
      } else if (error.statusCode === 403) {
        console.log(chalk.red("✗ Access denied to this blueprint."));
      } else {
        console.log(chalk.red(`✗ API error: ${error.message}`));
      }
    } else {
      console.log(chalk.red("✗ Failed to fetch blueprint"));
      if (error instanceof Error) {
        console.log(chalk.gray(`  ${error.message}`));
      }
    }
  }
}

/**
 * Compare .lynxprompt/rules/ with exported agent files
 */
async function diffLocal(cwd: string): Promise<void> {
  const rulesDir = join(cwd, ".lynxprompt/rules");
  
  if (!existsSync(rulesDir)) {
    console.log(chalk.yellow("⚠ No .lynxprompt/rules/ directory found."));
    console.log(chalk.gray("Run 'lynxp wizard' to generate configuration files."));
    return;
  }

  console.log(chalk.gray("Comparing .lynxprompt/rules/ with exported files..."));
  console.log();

  // Read the rules file(s)
  const rulesPath = join(rulesDir, "agents.md");
  if (!existsSync(rulesPath)) {
    console.log(chalk.yellow("⚠ No rules files found in .lynxprompt/rules/"));
    return;
  }

  let rulesContent: string;
  try {
    rulesContent = await readFile(rulesPath, "utf-8");
  } catch {
    console.log(chalk.red("✗ Could not read .lynxprompt/rules/agents.md"));
    return;
  }

  // Compare with each exported file
  const exportedFiles = [
    { path: "AGENTS.md", name: "AGENTS.md" },
    { path: ".cursor/rules/lynxprompt-rules.mdc", name: "Cursor" },
  ];

  let hasChanges = false;

  for (const file of exportedFiles) {
    const filePath = join(cwd, file.path);
    if (existsSync(filePath)) {
      try {
        const exportedContent = await readFile(filePath, "utf-8");
        
        // For MDC files, strip frontmatter for comparison
        let compareContent = exportedContent;
        if (file.path.endsWith(".mdc")) {
          const frontmatterEnd = exportedContent.indexOf("---", 3);
          if (frontmatterEnd !== -1) {
            compareContent = exportedContent.substring(frontmatterEnd + 3).trim();
          }
        }

        // Strip headers added by sync
        compareContent = compareContent
          .replace(/^# AI Coding Rules\n\n> Generated by \[LynxPrompt\].*\n\n/m, "")
          .trim();

        const diff = computeDiff(rulesContent.trim(), compareContent);
        const stats = getDiffStats(diff);

        if (stats.added > 0 || stats.removed > 0) {
          hasChanges = true;
          console.log(chalk.yellow(`⚠ ${file.name} differs from source:`));
          console.log(formatDiff(diff));
          console.log(chalk.gray(`  ${chalk.green(`+${stats.added}`)} ${chalk.red(`-${stats.removed}`)} lines`));
          console.log();
        } else {
          console.log(chalk.green(`✓ ${file.name} is in sync`));
        }
      } catch {
        // File exists but couldn't be read
      }
    }
  }

  if (!hasChanges) {
    console.log();
    console.log(chalk.green("✓ All exported files are in sync with .lynxprompt/rules/"));
  } else {
    console.log();
    console.log(chalk.gray("Update the exported files from .lynxprompt/rules/ to bring them back in sync."));
  }
  console.log();
}

