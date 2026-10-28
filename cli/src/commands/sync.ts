/**
 * Sync command - bring every tracked file and its cloud blueprint together.
 *
 * Three-way by checksum: the tracked checksum is the base (the cloud content at
 * the last pull or push), compared with the local file and the cloud now.
 *   only the cloud changed  -> the file is updated from the cloud
 *   only the file changed   -> the file is pushed (if the blueprint is editable)
 *   both changed            -> the cloud version is written to <file>.remote and
 *                              the file is left as it is; merge by hand, delete
 *                              <file>.remote, run sync again
 *
 * Usage:
 *   lynxp sync              - sync all tracked files
 *   lynxp sync <file>       - sync one tracked file
 *   lynxp sync --dry-run    - show what would happen, change nothing
 */

import chalk from "chalk";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { api, ApiRequestError } from "../api.js";
import { isAuthenticated } from "../config.js";
import { isAgentsMdPointer } from "../../../packages/shared/src/platforms.js";
import {
  calculateChecksum,
  conflictFilePath,
  loadBlueprints,
  toTrackedPath,
  trackBlueprint,
  updateChecksum,
  type TrackedBlueprint,
} from "../utils/blueprint-tracker.js";
import { fillBlueprintVariables } from "../utils/variables.js";
import { blueprintContentOf, fileTextFor, withFinalNewline, writeAssetCopies } from "../utils/blueprint-files.js";

interface SyncOptions {
  dryRun?: boolean;
}

type Outcome = "in-sync" | "pulled" | "pushed" | "kept" | "conflict" | "error";

export async function syncCommand(fileArg: string | undefined, options: SyncOptions = {}): Promise<void> {
  const cwd = process.cwd();

  if (!isAuthenticated()) {
    console.log(chalk.yellow("Not logged in. Run 'lynxp login' to authenticate."));
    process.exit(1);
  }

  const { blueprints } = await loadBlueprints(cwd);
  const targets = fileArg
    ? blueprints.filter((b) => toTrackedPath(cwd, b.file) === toTrackedPath(cwd, fileArg))
    : blueprints;

  if (targets.length === 0) {
    console.log(
      chalk.yellow(fileArg ? `${fileArg} is not tracked.` : "No tracked blueprints found.")
    );
    console.log(chalk.gray("Track a file with 'lynxp pull <id>' or 'lynxp link <file> <id>'."));
    if (fileArg) process.exit(1);
    return;
  }

  console.log();
  console.log(chalk.cyan(options.dryRun ? "🐱 LynxPrompt Sync (dry run)" : "🐱 LynxPrompt Sync"));
  console.log();

  const counts: Record<Outcome, number> = {
    "in-sync": 0, pulled: 0, pushed: 0, kept: 0, conflict: 0, error: 0,
  };
  for (const tracked of targets) {
    counts[await syncOne(cwd, tracked, options)]++;
  }

  console.log();
  const parts = [
    `${counts.pulled} pulled`,
    `${counts.pushed} pushed`,
    `${counts["in-sync"]} in sync`,
  ];
  if (counts.kept) parts.push(`${counts.kept} local only`);
  if (counts.conflict) parts.push(`${counts.conflict} conflict`);
  if (counts.error) parts.push(`${counts.error} failed`);
  console.log(chalk.gray(`${options.dryRun ? "Would be: " : ""}${parts.join(", ")}`));
  console.log();

  if (counts.conflict || counts.error) process.exitCode = 1;
}

async function syncOne(cwd: string, tracked: TrackedBlueprint, options: SyncOptions): Promise<Outcome> {
  const file = tracked.file;
  const filePath = join(cwd, file);
  const remoteFile = conflictFilePath(cwd, file);
  const dry = options.dryRun === true;

  if (existsSync(remoteFile)) {
    console.log(chalk.red(`✗ ${file}: unresolved conflict`));
    console.log(chalk.gray(`   Merge ${file}.remote into ${file}, delete ${file}.remote, then run 'lynxp sync' again.`));
    return "conflict";
  }

  if (!existsSync(filePath)) {
    console.log(chalk.red(`✗ ${file}: file not found`));
    console.log(chalk.gray(`   Run 'lynxp pull ${tracked.id}' to restore it or 'lynxp unlink ${file}' to stop tracking it.`));
    return "error";
  }

  let remote: string;
  try {
    const { blueprint } = await api.getBlueprint(tracked.id);
    if (!blueprint?.content) {
      console.log(chalk.red(`✗ ${file}: the cloud blueprint ${tracked.id} has no content`));
      return "error";
    }
    remote = blueprint.content;
  } catch (error) {
    console.log(chalk.red(`✗ ${file}: could not fetch ${tracked.id}: ${errorText(error)}`));
    return "error";
  }

  // Of a settings file only its MCP servers are the blueprint
  const localFile = await readFile(filePath, "utf-8");
  const local = blueprintContentOf(file, localFile) ?? "";
  // What the file should hold for the current cloud content
  const rendered = tracked.variables ? fillBlueprintVariables(remote, tracked.variables).content : remote;
  // The file for it, and what reading that file back gives: an MCP file holds
  // the cloud servers in its own tool's format and layout, not the cloud text
  let fileText: string | null = null;
  let mergeError: unknown;
  try {
    fileText = fileTextFor(file, localFile, rendered);
  } catch (error) {
    mergeError = error;
  }
  const wanted = (fileText !== null && blueprintContentOf(file, fileText)) || rendered;
  const localChanged = calculateChecksum(local) !== (tracked.localChecksum ?? tracked.checksum);
  const remoteChanged = calculateChecksum(remote) !== tracked.checksum;

  if (calculateChecksum(local) === calculateChecksum(wanted)) {
    // Nothing to move; both sides may have made the same edit
    if (!dry && (localChanged || remoteChanged)) await record(cwd, tracked, remote, local);
    console.log(chalk.green(`✓ ${file}: in sync`));
    return "in-sync";
  }

  if (!localChanged) {
    if (fileText === null) {
      console.log(chalk.red(`✗ ${file}: the cloud content cannot be written to it: ${errorText(mergeError)}`));
      return "error";
    }
    if (!dry) {
      await writeFile(filePath, withFinalNewline(fileText), "utf-8");
      await record(cwd, tracked, remote, wanted);
      await writeAssetCopies(cwd, file, fileText, { onlyExisting: true });
    }
    console.log(chalk.cyan(`↓ ${file}: ${dry ? "would update from the cloud" : "updated from the cloud"}`));
    return "pulled";
  }

  if (!remoteChanged) {
    const reason = tracked.variables
      ? "it was pulled with --vars, so pushing it would replace the blueprint's variables with your values"
      : !tracked.editable
        ? "marketplace blueprints are read-only"
        : null;
    const pointerReason = isAgentsMdPointer(local)
      ? "it only imports AGENTS.md (@AGENTS.md); push AGENTS.md instead"
      : null;
    if (reason || pointerReason) {
      console.log(chalk.yellow(`● ${file}: local changes kept, not pushed (${reason ?? pointerReason})`));
      return "kept";
    }
    if (dry) {
      console.log(chalk.cyan(`↑ ${file}: would push local changes`));
      return "pushed";
    }
    try {
      await api.updateBlueprint(tracked.id, { content: local, expected_checksum: tracked.checksum });
      await updateChecksum(cwd, file, local);
      await writeAssetCopies(cwd, file, local, { onlyExisting: true });
      console.log(chalk.cyan(`↑ ${file}: pushed local changes`));
      return "pushed";
    } catch (error) {
      if (error instanceof ApiRequestError && error.statusCode === 409) {
        console.log(chalk.red(`✗ ${file}: the cloud changed while syncing; run 'lynxp sync' again`));
      } else {
        console.log(chalk.red(`✗ ${file}: push failed: ${errorText(error)}`));
        console.log(chalk.gray(`   Try 'lynxp push ${file}' for the full prompts.`));
      }
      return "error";
    }
  }

  // Both sides changed, differently. Keep the local file, put the cloud copy
  // beside it, and take the cloud content as the new base so a push after the
  // merge is checked against the version the user actually merged.
  if (!dry) {
    await mkdir(dirname(remoteFile), { recursive: true });
    await writeFile(remoteFile, withFinalNewline(rendered), "utf-8");
    await record(cwd, tracked, remote, wanted);
  }
  console.log(chalk.red(`✗ ${file}: changed both locally and in the cloud`));
  console.log(
    chalk.gray(
      dry
        ? `   Sync would write the cloud version to ${file}.remote and leave ${file} as it is.`
        : `   Cloud version written to ${file}.remote; ${file} was not touched.\n` +
          `   Merge what you need into ${file}, delete ${file}.remote, then run 'lynxp sync' again.`
    )
  );
  return "conflict";
}

/**
 * Store the cloud content as the new base for this file, and what the file
 * holds for it when that differs (filled variables, an MCP file's own format).
 */
async function record(cwd: string, t: TrackedBlueprint, remote: string, written: string): Promise<void> {
  await trackBlueprint(cwd, {
    id: t.id,
    name: t.name,
    file: t.file,
    content: remote,
    source: t.source,
    version: t.version,
    hierarchyId: t.hierarchyId,
    hierarchyName: t.hierarchyName,
    repositoryPath: t.repositoryPath,
    variables: t.variables,
    localContent: written,
  });
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
