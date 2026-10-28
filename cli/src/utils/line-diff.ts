/**
 * Line diff used by `lynxp diff`. Kept apart from the command so it can be
 * tested without the command's spinner, config and API client.
 */

import chalk from "chalk";
import { safeText } from "./terminal.js";

/**
 * Simple line-by-line diff implementation
 * Returns added (+), removed (-), and unchanged lines
 */
export function computeDiff(oldText: string, newText: string): Array<{ type: "add" | "remove" | "same"; line: string }> {
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
 * Format diff output with colors.
 *
 * Lines are compared raw, so the diff stays true to the files, and cleaned only
 * when printed: remote blueprint content is written by other users.
 */
export function formatDiff(diff: Array<{ type: "add" | "remove" | "same"; line: string }>, contextLines: number = 3): string {
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
        output.push(chalk.green(`+ ${safeText(item.line)}`));
      } else if (item.type === "remove") {
        output.push(chalk.red(`- ${safeText(item.line)}`));
      } else {
        output.push(chalk.gray(`  ${safeText(item.line)}`));
      }
      lastPrintedIndex = i;
    }
  }

  return output.join("\n");
}
