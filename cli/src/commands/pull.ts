import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";
import { api, ApiRequestError } from "../api.js";
import { isAuthenticated } from "../config.js";
import { writeFile, access, mkdir } from "fs/promises";
import { join, dirname } from "path";

interface PullOptions {
  output: string;
  yes?: boolean;
}

// Mapping of blueprint types to filenames
const TYPE_TO_FILENAME: Record<string, string> = {
  AGENTS_MD: "AGENTS.md",
  CURSOR_RULES: ".cursorrules",
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
      chalk.yellow("Not logged in. Run 'lynxprompt login' to authenticate.")
    );
    process.exit(1);
  }

  const spinner = ora(`Fetching blueprint ${chalk.cyan(id)}...`).start();

  try {
    const { blueprint } = await api.getBlueprint(id);
    spinner.stop();

    if (!blueprint.content) {
      console.error(chalk.red("Blueprint has no content."));
      process.exit(1);
    }

    // Determine output filename
    const filename = TYPE_TO_FILENAME[blueprint.type] || "ai-config.md";
    const outputPath = join(options.output, filename);

    // Check if file exists
    let fileExists = false;
    try {
      await access(outputPath);
      fileExists = true;
    } catch {
      // File doesn't exist, that's fine
    }

    // Confirm overwrite if file exists and not using --yes
    if (fileExists && !options.yes) {
      const response = await prompts({
        type: "confirm",
        name: "overwrite",
        message: `File ${chalk.cyan(outputPath)} already exists. Overwrite?`,
        initial: false,
      });

      if (!response.overwrite) {
        console.log(chalk.yellow("Aborted."));
        return;
      }
    }

    // Create directory if needed
    const dir = dirname(outputPath);
    if (dir !== ".") {
      await mkdir(dir, { recursive: true });
    }

    // Write the file
    await writeFile(outputPath, blueprint.content, "utf-8");

    console.log();
    console.log(chalk.green(`✅ Downloaded ${chalk.bold(blueprint.name)}`));
    console.log(`   ${chalk.gray("File:")} ${chalk.cyan(outputPath)}`);
    console.log(`   ${chalk.gray("Type:")} ${blueprint.type}`);
    console.log(`   ${chalk.gray("Tier:")} ${blueprint.tier}`);
    console.log();

    // Show helpful next steps
    const editorHint = getEditorHint(blueprint.type);
    if (editorHint) {
      console.log(chalk.gray(`💡 ${editorHint}`));
    }
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
        chalk.red("Your session has expired. Please run 'lynxprompt login' again.")
      );
    } else if (error.statusCode === 403) {
      console.error(
        chalk.red("You don't have access to this blueprint.")
      );
      console.error(
        chalk.gray(
          "This might be a private blueprint or require a higher subscription tier."
        )
      );
    } else if (error.statusCode === 404) {
      console.error(chalk.red("Blueprint not found."));
      console.error(
        chalk.gray(
          "Make sure you have the correct blueprint ID. Use 'lynxprompt list' to see your blueprints."
        )
      );
    } else {
      console.error(chalk.red(`Error: ${error.message}`));
    }
  } else {
    console.error(chalk.red("An unexpected error occurred."));
  }
  process.exit(1);
}


