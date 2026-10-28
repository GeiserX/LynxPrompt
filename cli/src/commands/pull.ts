import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";
import { api, ApiRequestError, Blueprint } from "../api.js";
import { safeText } from "../utils/terminal.js";
import { isAuthenticated } from "../config.js";
import { writeFile, mkdir, readFile } from "fs/promises";
import { dirname, resolve } from "path";
import { existsSync } from "fs";
import {
  trackBlueprint,
  findBlueprintByFile,
  toTrackedPath,
  type BlueprintSource,
} from "../utils/blueprint-tracker.js";
import { blueprintFilename, rulesWritePath, safePath, withFinalNewline, writeAssetCopies } from "../utils/blueprint-files.js";
import { parseVariablesString } from "../utils/generator.js";
import { fillBlueprintVariables } from "../utils/variables.js";

interface PullOptions {
  output: string;
  yes?: boolean;
  preview?: boolean;
  track?: boolean; // Track the blueprint for future syncs (default: true)
  vars?: string; // Fill [[VARIABLES]]: "VAR1=value1,VAR2=value2"
}

/**
 * The text to write for a blueprint: with --vars, placeholders are filled from
 * the given values or their defaults. Variables with neither are reported.
 */
function contentToWrite(content: string, options: PullOptions, label: string): string {
  if (options.vars === undefined) return content;
  const { content: filled, missing } = fillBlueprintVariables(content, parseVariablesString(options.vars));
  if (missing.length > 0) {
    console.log(chalk.yellow(`  ⚠ ${label}: no value for ${missing.join(", ")} (left as [[...]])`));
  }
  return filled;
}

// Values to remember for sync, only when they changed what was written
function pulledVariables(options: PullOptions, written: string, content: string): Record<string, string> | undefined {
  return options.vars === undefined || written === content ? undefined : parseVariablesString(options.vars);
}

/**
 * A skill or subagent also goes to the other tools' folders (.agents and
 * .claude, plus Kiro, Firebender, Copilot or Codex when the project uses them).
 * The copies are not tracked: push and sync keep them in step with this file.
 * Like the main file, a copy that holds different work of the user's is
 * replaced only with --yes; one that is the copy of `previous` (the main
 * file before this pull) is just an older pull and is updated.
 */
async function writeCopies(
  options: PullOptions,
  filename: string,
  written: string,
  previous: string | null,
  indent: string
): Promise<void> {
  const { written: copies, kept } = await writeAssetCopies(resolve(options.output), filename, written, {
    overwrite: Boolean(options.yes),
    previous: previous ?? undefined,
  });
  for (const copy of copies) {
    console.log(chalk.gray(`${indent}↳ ${safeText(copy)}`));
  }
  for (const copy of kept) {
    console.log(chalk.yellow(`${indent}⚠ Kept your ${safeText(copy)}: it differs from this blueprint. Run with --yes to replace it.`));
  }
}

// Determine blueprint source from visibility
function getSourceFromVisibility(visibility: Blueprint["visibility"]): BlueprintSource {
  switch (visibility) {
    case "PUBLIC":
      return "marketplace";
    case "TEAM":
      return "team";
    case "PRIVATE":
      return "private";
    default:
      return "marketplace";
  }
}

/**
 * Check if an ID is a hierarchy ID
 */
function isHierarchyId(id: string): boolean {
  return id.startsWith("ha_");
}

/**
 * Pull one or more blueprints (bp_) and hierarchies (ha_), in the order given.
 * A failure stops the run; files already written stay written and tracked.
 */
export async function pullCommand(
  ids: string | string[],
  options: PullOptions
): Promise<void> {
  // Check authentication - require login for API access
  if (!isAuthenticated()) {
    console.log(
      chalk.yellow("Not logged in. Run 'lynxp login' to authenticate.")
    );
    process.exit(1);
  }

  for (const id of Array.isArray(ids) ? ids : [ids]) {
    if (isHierarchyId(id)) {
      await pullHierarchy(id, options);
    } else {
      await pullBlueprint(id, options);
    }
  }
}

/**
 * Pull an entire hierarchy with all its blueprints
 */
async function pullHierarchy(
  id: string,
  options: PullOptions
): Promise<void> {
  const cwd = process.cwd();
  const spinner = ora(`Fetching hierarchy ${chalk.cyan(id)}...`).start();

  try {
    // One request for the whole tree; older servers return no content and
    // each blueprint is then fetched on its own below
    const response = await api.getHierarchy(id, { includeContent: !options.preview });
    const { hierarchy, blueprints } = response;
    spinner.stop();

    console.log();
    console.log(chalk.cyan(`📁 Hierarchy: ${chalk.bold(safeText(hierarchy.name))}`));
    if (hierarchy.description) {
      console.log(chalk.gray(`   ${safeText(hierarchy.description)}`));
    }
    console.log(chalk.gray(`   Repository: ${safeText(hierarchy.repository_root)}`));
    console.log(chalk.gray(`   Blueprints: ${blueprints.length}`));
    console.log();

    // Preview mode - show hierarchy structure without downloading
    if (options.preview) {
      console.log(chalk.yellow("📋 Hierarchy structure:"));
      console.log();
      
      for (const bp of blueprints) {
        const indent = bp.parent_id ? "  ↳ " : "  ";
        const path = blueprintFilename(bp);
        console.log(chalk.gray(`${indent}${safeText(path)}`));
        console.log(chalk.gray(`${indent}  └─ ${safeText(bp.name)} (${safeText(bp.id)})`));
      }
      
      console.log();
      console.log(chalk.gray("Run without --preview to download this hierarchy."));
      return;
    }

    // Confirm before downloading
    if (!options.yes && blueprints.length > 1) {
      const { proceed } = await prompts({
        type: "confirm",
        name: "proceed",
        message: `Download ${blueprints.length} blueprints to ${options.output}?`,
        initial: true,
      });
      if (!proceed) {
        console.log(chalk.gray("Cancelled."));
        return;
      }
    }

    console.log(chalk.cyan("📥 Downloading blueprints..."));
    console.log();

    let downloaded = 0;
    let skipped = 0;

    for (const bp of blueprints) {
      // Determine output path - use repository_path if available
      const filename = rulesWritePath(resolve(options.output), blueprintFilename(bp));
      let outputPath: string;
      try {
        outputPath = safePath(resolve(options.output), filename);
      } catch {
        console.log(chalk.red(`  ✗ Skipped (invalid path): ${filename}`));
        skipped++;
        continue;
      }

      // Check if file exists
      if (existsSync(outputPath) && !options.yes) {
        const { overwrite } = await prompts({
          type: "confirm",
          name: "overwrite",
          message: `File exists: ${filename}. Overwrite?`,
          initial: false,
        });
        if (!overwrite) {
          console.log(chalk.gray(`  ⏭ Skipped: ${filename}`));
          skipped++;
          continue;
        }
      }

      const blueprint = typeof bp.content === "string" ? bp : (await api.getBlueprint(bp.id)).blueprint;

      if (!blueprint.content) {
        console.log(chalk.yellow(`  ⚠ No content: ${filename}`));
        skipped++;
        continue;
      }

      // Create directory if needed
      const dir = dirname(outputPath);
      if (dir !== "." && dir !== options.output) {
        await mkdir(dir, { recursive: true });
      }

      // Write the file
      const written = contentToWrite(blueprint.content, options, filename);
      const previous = existsSync(outputPath) ? await readFile(outputPath, "utf-8") : null;
      await writeFile(outputPath, withFinalNewline(written), "utf-8");
      await writeCopies(options, filename, written, previous, "    ");

      // Track the blueprint with hierarchy info
      if (options.track !== false) {
        const source = getSourceFromVisibility(blueprint.visibility);
        await trackBlueprint(cwd, {
          id: blueprint.id,
          name: blueprint.name,
          // The path actually written (under -o), so status, diff and push find it
          file: toTrackedPath(cwd, outputPath),
          content: blueprint.content,
          source,
          hierarchyId: id,
          hierarchyName: hierarchy.name,
          repositoryPath: bp.repository_path || undefined,
          localContent: written,
          variables: pulledVariables(options, written, blueprint.content),
        });
      }

      console.log(chalk.green(`  ✓ ${filename}`));
      downloaded++;
    }

    console.log();
    console.log(chalk.green(`✅ Downloaded ${downloaded} blueprint(s)`));
    if (skipped > 0) {
      console.log(chalk.gray(`   Skipped: ${skipped}`));
    }
    console.log();
    console.log(chalk.gray("Tips:"));
    console.log(chalk.gray(`  • Run 'lynxp status' to see tracked blueprints`));
    console.log(chalk.gray(`  • Run 'lynxp push --all' to push local changes`));
    console.log(chalk.gray(`  • Run 'lynxp pull ${id}' again to refresh all files`));
    console.log();
  } catch (error) {
    spinner.fail("Failed to pull hierarchy");
    handleApiError(error);
  }
}

/**
 * Pull a single blueprint
 */
async function pullBlueprint(
  id: string,
  options: PullOptions
): Promise<void> {
  const cwd = process.cwd();
  const spinner = ora(`Fetching blueprint ${chalk.cyan(id)}...`).start();

  try {
    const { blueprint } = await api.getBlueprint(id);
    spinner.stop();

    if (!blueprint.content) {
      console.error(chalk.red("✗ Blueprint has no content."));
      process.exit(1);
    }

    const source = getSourceFromVisibility(blueprint.visibility);
    const isMarketplace = source === "marketplace";

    console.log();
    console.log(chalk.cyan(`🐱 Blueprint: ${chalk.bold(safeText(blueprint.name))}`));
    if (blueprint.description) {
      console.log(chalk.gray(`   ${safeText(blueprint.description)}`));
    }
    console.log(chalk.gray(`   Type: ${blueprint.type} • Tier: ${blueprint.tier} • Visibility: ${blueprint.visibility}`));
    
    // Show hierarchy info if present
    if (blueprint.hierarchy_id) {
      console.log(chalk.blue(`   📁 Part of hierarchy: ${blueprint.hierarchy_id}`));
      if (blueprint.repository_path) {
        console.log(chalk.gray(`   Path in hierarchy: ${safeText(blueprint.repository_path)}`));
      }
    }
    
    // Show source type info
    if (isMarketplace) {
      console.log(chalk.yellow(`   📦 Marketplace blueprint (read-only - changes won't sync back)`));
    } else if (source === "team") {
      console.log(chalk.blue(`   👥 Team blueprint (can sync changes)`));
    } else if (source === "private") {
      console.log(chalk.green(`   🔒 Private blueprint (can sync changes)`));
    }
    console.log();

    // Preview mode - show content without writing
    if (options.preview) {
      console.log(chalk.gray("─".repeat(60)));
      console.log();
      
      // Show first 50 lines with syntax highlighting hints
      const lines = blueprint.content.split("\n");
      const previewLines = lines.slice(0, 50);
      
      for (const line of previewLines) {
        if (line.startsWith("#")) {
          console.log(chalk.cyan(line));
        } else if (line.startsWith(">")) {
          console.log(chalk.gray(line));
        } else if (line.startsWith("- ") || line.startsWith("* ")) {
          console.log(chalk.white(line));
        } else if (line.startsWith("```")) {
          console.log(chalk.yellow(line));
        } else {
          console.log(line);
        }
      }
      
      if (lines.length > 50) {
        console.log();
        console.log(chalk.gray(`... ${lines.length - 50} more lines`));
      }
      
      console.log();
      console.log(chalk.gray("─".repeat(60)));
      console.log();
      console.log(chalk.gray("Run without --preview to download this blueprint."));
      return;
    }

    // Determine output filename - use repository_path if available for hierarchy blueprints
    const filename = rulesWritePath(resolve(options.output), blueprintFilename(blueprint));
    let outputPath: string;
    try {
      outputPath = safePath(resolve(options.output), filename);
    } catch {
      console.error(chalk.red(`✗ Invalid file path: ${filename}`));
      process.exit(1);
    }

    // Check if file exists and show diff preview
    let localContent: string | null = null;
    if (existsSync(outputPath)) {
      try {
        localContent = await readFile(outputPath, "utf-8");
      } catch {
        // Can't read local file
      }
    }

    // Tracked by the path actually written (under -o), relative to the project root
    const trackedFile = toTrackedPath(cwd, outputPath);

    // Check if this file is already tracked
    const existingTracked = await findBlueprintByFile(cwd, trackedFile);
    if (existingTracked && existingTracked.id !== id) {
      console.log(chalk.yellow(`⚠ This file is already linked to a different blueprint: ${existingTracked.id}`));
      if (!options.yes) {
        const { proceed } = await prompts({
          type: "confirm",
          name: "proceed",
          message: "Replace the link with the new blueprint?",
          initial: false,
        });
        if (!proceed) {
          console.log(chalk.gray("Cancelled."));
          return;
        }
      }
    }

    if (localContent && !options.yes) {
      // Show what will change
      const localLines = localContent.split("\n").length;
      const remoteLines = blueprint.content.split("\n").length;
      
      console.log(chalk.yellow(`⚠ File exists: ${outputPath}`));
      console.log(chalk.gray(`   Local:  ${localLines} lines`));
      console.log(chalk.gray(`   Remote: ${remoteLines} lines`));
      console.log();

      const response = await prompts({
        type: "select",
        name: "action",
        message: "What would you like to do?",
        choices: [
          { title: "Overwrite with remote version", value: "overwrite" },
          { title: "Preview remote content first", value: "preview" },
          { title: "Cancel", value: "cancel" },
        ],
      });

      if (response.action === "cancel" || !response.action) {
        console.log(chalk.gray("Cancelled."));
        return;
      }

      if (response.action === "preview") {
        // Show preview
        console.log();
        console.log(chalk.gray("─".repeat(60)));
        console.log();
        
        const lines = safeText(blueprint.content).split("\n").slice(0, 30);
        for (const line of lines) {
          if (line.startsWith("#")) {
            console.log(chalk.cyan(line));
          } else {
            console.log(line);
          }
        }
        
        if (blueprint.content.split("\n").length > 30) {
          console.log(chalk.gray(`... ${blueprint.content.split("\n").length - 30} more lines`));
        }
        
        console.log();
        console.log(chalk.gray("─".repeat(60)));
        console.log();

        const confirmResponse = await prompts({
          type: "confirm",
          name: "confirm",
          message: "Download and overwrite local file?",
          initial: false,
        });

        if (!confirmResponse.confirm) {
          console.log(chalk.gray("Cancelled."));
          return;
        }
      }
    }

    // Create directory if needed
    const dir = dirname(outputPath);
    if (dir !== ".") {
      await mkdir(dir, { recursive: true });
    }

    // Write the file
    const written = contentToWrite(blueprint.content, options, filename);
    await writeFile(outputPath, withFinalNewline(written), "utf-8");
    await writeCopies(options, filename, written, localContent, "   ");

    // Track the blueprint (default behavior unless --no-track)
    if (options.track !== false) {
      await trackBlueprint(cwd, {
        id: blueprint.id,
        name: blueprint.name,
        file: trackedFile,
        content: blueprint.content,
        source,
        hierarchyId: blueprint.hierarchy_id || undefined,
        repositoryPath: blueprint.repository_path || undefined,
        localContent: written,
        variables: pulledVariables(options, written, blueprint.content),
      });
    }

    console.log(chalk.green(`✅ Downloaded: ${chalk.bold(outputPath)}`));
    
    // Show tracking info
    if (options.track !== false) {
      console.log(chalk.gray(`   Linked to: ${blueprint.id}`));
      if (blueprint.content_checksum) {
        console.log(chalk.gray(`   Checksum: ${blueprint.content_checksum}`));
      }
      if (isMarketplace || options.vars !== undefined) {
        console.log(chalk.gray(`   Updates: Run 'lynxp sync ${trackedFile}' to get cloud updates`));
      } else {
        console.log(chalk.gray(`   Sync: Run 'lynxp push ${trackedFile}' to push changes`));
      }
    }
    console.log();

    // Show helpful next steps
    const editorHint = getEditorHint(blueprint.type);
    if (editorHint) {
      console.log(chalk.gray(`💡 ${editorHint}`));
      console.log();
    }

    // Additional tips
    console.log(chalk.gray("Tips:"));
    console.log(chalk.gray(`  • Run 'lynxp status' to see tracked blueprints`));
    console.log(chalk.gray(`  • Run 'lynxp diff ${id}' to see changes between local and remote`));
    if (isMarketplace) {
      console.log(chalk.gray(`  • Run 'lynxp unlink ${trackedFile}' to disconnect and make editable`));
    }
    console.log();
  } catch (error) {
    spinner.fail("Failed to pull blueprint");
    handleApiError(error);
  }
}

function getEditorHint(type: string): string | null {
  switch (type) {
    case "CURSOR_RULES":
      return "This file will be automatically read by Cursor.";
    case "COPILOT_INSTRUCTIONS":
      return "This file will be read by GitHub Copilot in VS Code.";
    case "AGENTS_MD":
      return "This AGENTS.md file works with Claude Code, Cursor, and other AI agents.";
    case "WINDSURF_RULES":
      return "This file will be automatically read by Windsurf.";
    case "ZED_INSTRUCTIONS":
      return "This file will be read by Zed's AI assistant.";
    case "CLAUDE_MD":
      return "This CLAUDE.md file will be read by Claude Code.";
    default:
      return null;
  }
}

function handleApiError(error: unknown): void {
  if (error instanceof ApiRequestError) {
    if (error.statusCode === 401) {
      console.error(
        chalk.red("✗ Your session has expired. Please run 'lynxp login' again.")
      );
    } else if (error.statusCode === 403) {
      console.error(
        chalk.red("✗ You don't have access to this blueprint or hierarchy.")
      );
      console.error(
        chalk.gray(
          "  This might be a private resource or you may not have access."
        )
      );
    } else if (error.statusCode === 404) {
      console.error(chalk.red("✗ Blueprint or hierarchy not found."));
      console.error(
        chalk.gray(
          "  Make sure you have the correct ID. Use 'lynxp list' or 'lynxp hierarchies' to see your resources."
        )
      );
    } else {
      console.error(chalk.red(`✗ Error: ${error.message}`));
    }
  } else {
    console.error(chalk.red("✗ An unexpected error occurred."));
  }
  process.exit(1);
}
