import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";
import { api, ApiRequestError, Blueprint, Hierarchy } from "../api.js";
import { isAuthenticated } from "../config.js";
import { writeFile, mkdir, readFile } from "fs/promises";
import { join, dirname } from "path";
import { existsSync } from "fs";
import {
  trackBlueprint,
  findBlueprintByFile,
  type BlueprintSource,
} from "../utils/blueprint-tracker.js";

interface PullOptions {
  output: string;
  yes?: boolean;
  preview?: boolean;
  track?: boolean; // Track the blueprint for future syncs (default: true)
}

// Mapping of blueprint types to filenames
const TYPE_TO_FILENAME: Record<string, string> = {
  AGENTS_MD: "AGENTS.md",
  CURSOR_RULES: ".cursor/rules/project.mdc",
  COPILOT_INSTRUCTIONS: ".github/copilot-instructions.md",
  WINDSURF_RULES: ".windsurfrules",
  ZED_INSTRUCTIONS: ".zed/instructions.md",
  CLAUDE_MD: "CLAUDE.md",
  GENERIC: "ai-config.md",
};

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

export async function pullCommand(
  id: string,
  options: PullOptions
): Promise<void> {
  // Check authentication - require login for API access
  if (!isAuthenticated()) {
    console.log(
      chalk.yellow("Not logged in. Run 'lynxp login' to authenticate.")
    );
    process.exit(1);
  }

  // Check if pulling a hierarchy
  if (isHierarchyId(id)) {
    await pullHierarchy(id, options);
  } else {
    await pullBlueprint(id, options);
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
    const response = await api.getHierarchy(id);
    const { hierarchy, blueprints } = response;
    spinner.stop();

    console.log();
    console.log(chalk.cyan(`📁 Hierarchy: ${chalk.bold(hierarchy.name)}`));
    if (hierarchy.description) {
      console.log(chalk.gray(`   ${hierarchy.description}`));
    }
    console.log(chalk.gray(`   Repository: ${hierarchy.repository_root}`));
    console.log(chalk.gray(`   Blueprints: ${blueprints.length}`));
    console.log();

    // Preview mode - show hierarchy structure without downloading
    if (options.preview) {
      console.log(chalk.yellow("📋 Hierarchy structure:"));
      console.log();
      
      for (const bp of blueprints) {
        const indent = bp.parent_id ? "  ↳ " : "  ";
        const path = bp.repository_path || TYPE_TO_FILENAME[bp.type] || "unknown";
        console.log(chalk.gray(`${indent}${path}`));
        console.log(chalk.gray(`${indent}  └─ ${bp.name} (${bp.id})`));
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
      const filename = bp.repository_path || TYPE_TO_FILENAME[bp.type] || "ai-config.md";
      const outputPath = join(options.output, filename);

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

      // Fetch full blueprint content
      const { blueprint } = await api.getBlueprint(bp.id);
      
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
      await writeFile(outputPath, blueprint.content, "utf-8");

      // Track the blueprint with hierarchy info
      if (options.track !== false) {
        const source = getSourceFromVisibility(blueprint.visibility);
        await trackBlueprint(cwd, {
          id: blueprint.id,
          name: blueprint.name,
          file: filename,
          content: blueprint.content,
          source,
          hierarchyId: id,
          hierarchyName: hierarchy.name,
          repositoryPath: bp.repository_path || undefined,
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
    console.log(chalk.gray(`  • Run 'lynxp sync' to push local changes`));
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
    console.log(chalk.cyan(`🐱 Blueprint: ${chalk.bold(blueprint.name)}`));
    if (blueprint.description) {
      console.log(chalk.gray(`   ${blueprint.description}`));
    }
    console.log(chalk.gray(`   Type: ${blueprint.type} • Tier: ${blueprint.tier} • Visibility: ${blueprint.visibility}`));
    
    // Show hierarchy info if present
    if (blueprint.hierarchy_id) {
      console.log(chalk.blue(`   📁 Part of hierarchy: ${blueprint.hierarchy_id}`));
      if (blueprint.repository_path) {
        console.log(chalk.gray(`   Path in hierarchy: ${blueprint.repository_path}`));
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
    const filename = blueprint.repository_path || TYPE_TO_FILENAME[blueprint.type] || "ai-config.md";
    const outputPath = join(options.output, filename);

    // Check if file exists and show diff preview
    let localContent: string | null = null;
    if (existsSync(outputPath)) {
      try {
        localContent = await readFile(outputPath, "utf-8");
      } catch {
        // Can't read local file
      }
    }

    // Check if this file is already tracked
    const existingTracked = await findBlueprintByFile(cwd, filename);
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
        
        const lines = blueprint.content.split("\n").slice(0, 30);
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
    await writeFile(outputPath, blueprint.content, "utf-8");

    // Track the blueprint (default behavior unless --no-track)
    if (options.track !== false) {
      await trackBlueprint(cwd, {
        id: blueprint.id,
        name: blueprint.name,
        file: filename,
        content: blueprint.content,
        source,
        hierarchyId: blueprint.hierarchy_id || undefined,
        repositoryPath: blueprint.repository_path || undefined,
      });
    }

    console.log(chalk.green(`✅ Downloaded: ${chalk.bold(outputPath)}`));
    
    // Show tracking info
    if (options.track !== false) {
      console.log(chalk.gray(`   Linked to: ${blueprint.id}`));
      if (blueprint.content_checksum) {
        console.log(chalk.gray(`   Checksum: ${blueprint.content_checksum}`));
      }
      if (isMarketplace) {
        console.log(chalk.gray(`   Updates: Run 'lynxp pull ${id}' to sync updates`));
      } else {
        console.log(chalk.gray(`   Sync: Run 'lynxp push ${filename}' to push changes`));
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
      console.log(chalk.gray(`  • Run 'lynxp unlink ${filename}' to disconnect and make editable`));
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
          "  This might be a private resource or require a higher subscription tier."
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
