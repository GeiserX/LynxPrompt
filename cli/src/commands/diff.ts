/**
 * Diff command - show changes between local and remote blueprints
 * 
 * Compares local AI configuration files with a remote blueprint from LynxPrompt.
 * Useful for seeing what changes have been made locally or what would change
 * if you pulled a blueprint.
 * 
 * Usage:
 *   lynxp diff <blueprint-id>     - Compare local files with remote blueprint
 *   lynxp diff --local            - Show diff between .lynxprompt/rules/ and exported files
 */

import chalk from "chalk";
import ora from "ora";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { isAuthenticated } from "../config.js";
import { api, ApiRequestError } from "../api.js";

interface DiffOptions {
  local?: boolean;
}

/**
 * Simple line-by-line diff implementation
 * Returns added (+), removed (-), and unchanged lines
 */
function computeDiff(oldText: string, newText: string): Array<{ type: "add" | "remove" | "same"; line: string }> {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const result: Array<{ type: "add" | "remove" | "same"; line: string }> = [];

  // Simple LCS-based diff
  const lcs = longestCommonSubsequence(oldLines, newLines);
  
  let oldIndex = 0;
  let newIndex = 0;
  let lcsIndex = 0;

  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    if (lcsIndex < lcs.length && oldIndex < oldLines.length && oldLines[oldIndex] === lcs[lcsIndex]) {
      if (newIndex < newLines.length && newLines[newIndex] === lcs[lcsIndex]) {
        // Line is in both - unchanged
        result.push({ type: "same", line: oldLines[oldIndex] });
        oldIndex++;
        newIndex++;
        lcsIndex++;
      } else {
        // Line is in new but not in LCS position - added
        result.push({ type: "add", line: newLines[newIndex] });
        newIndex++;
      }
    } else if (oldIndex < oldLines.length && (lcsIndex >= lcs.length || oldLines[oldIndex] !== lcs[lcsIndex])) {
      // Line is in old but not in LCS - removed
      result.push({ type: "remove", line: oldLines[oldIndex] });
      oldIndex++;
    } else if (newIndex < newLines.length) {
      // Line is in new but not in old - added
      result.push({ type: "add", line: newLines[newIndex] });
      newIndex++;
    }
  }

  return result;
}

/**
 * Find the longest common subsequence of lines
 */
function longestCommonSubsequence(a: string[], b: string[]): string[] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find the LCS
  const lcs: string[] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcs.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}

/**
 * Format diff output with colors
 */
function formatDiff(diff: Array<{ type: "add" | "remove" | "same"; line: string }>, contextLines: number = 3): string {
  const output: string[] = [];
  let lastPrintedIndex = -1;
  
  // Find sections with changes
  const changeIndices = diff.map((d, i) => d.type !== "same" ? i : -1).filter(i => i !== -1);
  
  if (changeIndices.length === 0) {
    return chalk.gray("  (no changes)");
  }

  for (let i = 0; i < diff.length; i++) {
    const item = diff[i];
    const nearChange = changeIndices.some(ci => Math.abs(ci - i) <= contextLines);

    if (nearChange) {
      // Print separator if there's a gap
      if (lastPrintedIndex !== -1 && i - lastPrintedIndex > 1) {
        output.push(chalk.gray("  ..."));
      }

      // Format the line based on type
      if (item.type === "add") {
        output.push(chalk.green(`+ ${item.line}`));
      } else if (item.type === "remove") {
        output.push(chalk.red(`- ${item.line}`));
      } else {
        output.push(chalk.gray(`  ${item.line}`));
      }
      lastPrintedIndex = i;
    }
  }

  return output.join("\n");
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

export async function diffCommand(blueprintId?: string, options: DiffOptions = {}): Promise<void> {
  console.log();
  console.log(chalk.cyan("🐱 LynxPrompt Diff"));
  console.log();

  const cwd = process.cwd();

  // Local diff mode - compare .lynxprompt/rules/ with exported files
  if (options.local) {
    await diffLocal(cwd);
    return;
  }

  // Remote diff mode - compare local with remote blueprint
  if (!blueprintId) {
    console.log(chalk.red("✗ Please provide a blueprint ID to compare with."));
    console.log();
    console.log(chalk.gray("Usage:"));
    console.log(chalk.gray("  lynxp diff <blueprint-id>    Compare local with remote blueprint"));
    console.log(chalk.gray("  lynxp diff --local           Compare .lynxprompt/rules/ with exports"));
    return;
  }

  // Check if logged in
  if (!isAuthenticated()) {
    console.log(chalk.yellow("⚠ Not logged in. Some blueprints may not be accessible."));
    console.log(chalk.gray("Run 'lynxp login' to authenticate."));
    console.log();
  }

  const spinner = ora("Fetching blueprint...").start();

  try {
    const { blueprint } = await api.getBlueprint(blueprintId);
    spinner.stop();

    if (!blueprint || !blueprint.content) {
      console.log(chalk.red(`✗ Blueprint not found or has no content: ${blueprintId}`));
      return;
    }

    console.log(chalk.green(`✓ Blueprint: ${blueprint.name || blueprintId}`));
    if (blueprint.description) {
      console.log(chalk.gray(`  ${blueprint.description}`));
    }
    console.log();

    // Determine local file path based on blueprint type
    const localPaths = [
      "AGENTS.md",
      "CLAUDE.md",
      ".cursor/rules/project.mdc",
      ".github/copilot-instructions.md",
      ".windsurfrules",
    ];

    let localContent: string | null = null;
    let localPath: string | null = null;

    for (const path of localPaths) {
      const fullPath = join(cwd, path);
      if (existsSync(fullPath)) {
        try {
          localContent = await readFile(fullPath, "utf-8");
          localPath = path;
          break;
        } catch {
          // Continue to next path
        }
      }
    }

    if (!localContent) {
      console.log(chalk.yellow("⚠ No local AI configuration file found."));
      console.log(chalk.gray("Run 'lynxp wizard' to create one, or 'lynxp pull' to download the blueprint."));
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
    console.log(chalk.gray("Run 'lynxp init' to set up the advanced workflow, or 'lynxp wizard' for simple file generation."));
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
    console.log(chalk.gray("Run 'lynxp sync' to update exported files from .lynxprompt/rules/"));
  }
  console.log();
}

