import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";
import { api, ApiRequestError } from "../api.js";
import { isAuthenticated } from "../config.js";
import { writeFile, access, mkdir, readFile } from "fs/promises";
import { join, dirname } from "path";
import { existsSync } from "fs";

interface PullOptions {
  output: string;
  yes?: boolean;
  preview?: boolean;
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

export async function pullCommand(
  id: string,
  options: PullOptions
): Promise<void> {
  if (!isAuthenticated()) {
    console.log(
      chalk.yellow("Not logged in. Run 'lynxp login' to authenticate.")
    );
    process.exit(1);
  }

  const spinner = ora(`Fetching blueprint ${chalk.cyan(id)}...`).start();

  try {
    const { blueprint } = await api.getBlueprint(id);
    spinner.stop();

    if (!blueprint.content) {
      console.error(chalk.red("✗ Blueprint has no content."));
      process.exit(1);
    }

    console.log();
    console.log(chalk.cyan(`🐱 Blueprint: ${chalk.bold(blueprint.name)}`));
    if (blueprint.description) {
      console.log(chalk.gray(`   ${blueprint.description}`));
    }
    console.log(chalk.gray(`   Type: ${blueprint.type} • Tier: ${blueprint.tier}`));
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

    // Determine output filename
    const filename = TYPE_TO_FILENAME[blueprint.type] || "ai-config.md";
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

    console.log(chalk.green(`✅ Downloaded: ${chalk.bold(outputPath)}`));
    console.log();

    // Show helpful next steps
    const editorHint = getEditorHint(blueprint.type);
    if (editorHint) {
      console.log(chalk.gray(`💡 ${editorHint}`));
      console.log();
    }

    // Suggest diff command
    console.log(chalk.gray("Tip: Run 'lynxp diff " + id + "' later to see changes between local and remote."));
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
        chalk.red("✗ You don't have access to this blueprint.")
      );
      console.error(
        chalk.gray(
          "  This might be a private blueprint or require a higher subscription tier."
        )
      );
    } else if (error.statusCode === 404) {
      console.error(chalk.red("✗ Blueprint not found."));
      console.error(
        chalk.gray(
          "  Make sure you have the correct blueprint ID. Use 'lynxp list' to see your blueprints."
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
