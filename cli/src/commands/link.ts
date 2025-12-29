/**
 * Link command - connect a local file to a cloud blueprint
 * 
 * This is for when a user has a local file that matches a cloud blueprint
 * and wants to start tracking it without overwriting the local version.
 * 
 * Usage:
 *   lynxp link                          - Interactive mode (recommended)
 *   lynxp link <file> <blueprint-id>    - Link local file to cloud blueprint
 *   lynxp link --list                   - List all tracked blueprints
 *   lynxp unlink                        - Interactive mode (recommended)
 *   lynxp unlink <file>                 - Disconnect a file from its blueprint
 */

import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";
import { api, ApiRequestError, Blueprint } from "../api.js";
import { isAuthenticated } from "../config.js";
import { join } from "path";
import { existsSync } from "fs";
import {
  linkBlueprint,
  untrackBlueprint,
  findBlueprintByFile,
  checkSyncStatus,
  type BlueprintSource,
} from "../utils/blueprint-tracker.js";

interface LinkOptions {
  list?: boolean;
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

export async function linkCommand(
  fileArg?: string,
  blueprintIdArg?: string,
  options: LinkOptions = {}
): Promise<void> {
  const cwd = process.cwd();

  // List tracked blueprints
  if (options.list) {
    await listTrackedBlueprints(cwd);
    return;
  }

  console.log();
  console.log(chalk.cyan("🐱 Link File to Blueprint"));
  console.log();

  let file: string;
  let blueprintId: string | undefined = blueprintIdArg;

  // Interactive mode - guide the user through linking
  if (!fileArg) {
    // Find AI config files in the project
    const configFiles = [
      "AGENTS.md",
      "CLAUDE.md",
      ".cursor/rules/project.mdc",
      ".github/copilot-instructions.md",
      ".windsurfrules",
      ".zed/instructions.md",
      ".clinerules",
    ];

    const foundFiles = configFiles.filter(f => existsSync(join(cwd, f)));

    if (foundFiles.length === 0) {
      console.log(chalk.yellow("No AI configuration files found in this directory."));
      console.log();
      console.log(chalk.gray("Create one first:"));
      console.log(chalk.gray("  lynxp wizard    Generate a new config file"));
      console.log(chalk.gray("  lynxp pull <id> Download from marketplace"));
      return;
    }

    // Let user select which file to link
    const { selectedFile } = await prompts({
      type: "select",
      name: "selectedFile",
      message: "Which file do you want to link to a cloud blueprint?",
      choices: foundFiles.map(f => ({
        title: f,
        value: f,
        description: "Local file exists",
      })),
    });

    if (!selectedFile) {
      console.log(chalk.gray("Cancelled."));
      return;
    }

    file = selectedFile;
  } else {
    file = fileArg;
  }

  // Check if file exists
  const filePath = join(cwd, file);
  if (!existsSync(filePath)) {
    console.log(chalk.red(`✗ File not found: ${file}`));
    return;
  }

  // Check if already linked
  const existing = await findBlueprintByFile(cwd, file);
  if (existing) {
    console.log(chalk.yellow(`This file is already linked to: ${existing.name}`));
    console.log(chalk.gray(`   ID: ${existing.id}`));
    console.log();
    const { proceed } = await prompts({
      type: "confirm",
      name: "proceed",
      message: "Replace the existing link?",
      initial: false,
    });
    if (!proceed) {
      console.log(chalk.gray("Cancelled."));
      return;
    }
  }

  // Interactive mode - help find the blueprint
  if (!blueprintId) {
    // Check authentication
    if (!isAuthenticated()) {
      console.log(chalk.yellow("You need to login to access your blueprints."));
      const { doLogin } = await prompts({
        type: "confirm",
        name: "doLogin",
        message: "Login now?",
        initial: true,
      });
      if (doLogin) {
        console.log(chalk.gray("Run 'lynxp login' in another terminal, then come back here."));
        return;
      }
      console.log(chalk.gray("Cancelled."));
      return;
    }

    // Let user choose how to find the blueprint
    const { searchMethod } = await prompts({
      type: "select",
      name: "searchMethod",
      message: "How do you want to find the blueprint?",
      choices: [
        { title: "📋 From my blueprints", value: "list" },
        { title: "🔍 Search marketplace", value: "search" },
        { title: "🔢 Enter ID directly", value: "manual" },
      ],
    });

    if (!searchMethod) {
      console.log(chalk.gray("Cancelled."));
      return;
    }

    if (searchMethod === "list") {
      // Fetch user's blueprints
      const spinner = ora("Fetching your blueprints...").start();
      try {
        const { blueprints } = await api.listBlueprints();
        spinner.stop();

        if (!blueprints || blueprints.length === 0) {
          console.log(chalk.yellow("You don't have any blueprints yet."));
          console.log(chalk.gray("Create one with 'lynxp push' or search the marketplace."));
          return;
        }

        const { selected } = await prompts({
          type: "select",
          name: "selected",
          message: "Select a blueprint:",
          choices: blueprints.map(b => ({
            title: b.name,
            value: b.id,
            description: b.description?.substring(0, 50) || "",
          })),
        });

        if (!selected) {
          console.log(chalk.gray("Cancelled."));
          return;
        }
        blueprintId = selected;
      } catch {
        spinner.stop();
        console.log(chalk.red("✗ Could not fetch blueprints"));
        return;
      }
    } else if (searchMethod === "search") {
      const { query } = await prompts({
        type: "text",
        name: "query",
        message: "Search for:",
      });

      if (!query) {
        console.log(chalk.gray("Cancelled."));
        return;
      }

      const spinner = ora(`Searching for "${query}"...`).start();
      try {
        const results = await api.searchBlueprints(query, 10);
        spinner.stop();

        if (!results.templates || results.templates.length === 0) {
          console.log(chalk.yellow(`No blueprints found for "${query}"`));
          return;
        }

        const { selected } = await prompts({
          type: "select",
          name: "selected",
          message: "Select a blueprint:",
          choices: results.templates.map(b => ({
            title: `${b.name} (★ ${b.likes})`,
            value: b.id,
            description: b.author ? `by ${b.author}` : "",
          })),
        });

        if (!selected) {
          console.log(chalk.gray("Cancelled."));
          return;
        }
        blueprintId = selected;
      } catch {
        spinner.stop();
        console.log(chalk.red("✗ Search failed"));
        return;
      }
    } else {
      const { manualId } = await prompts({
        type: "text",
        name: "manualId",
        message: "Enter blueprint ID:",
      });

      if (!manualId) {
        console.log(chalk.gray("Cancelled."));
        return;
      }
      blueprintId = manualId;
    }
  }

  // At this point we must have both file and blueprintId
  if (!blueprintId) {
    console.log(chalk.red("✗ No blueprint ID provided."));
    return;
  }

  // Fetch blueprint info and link
  const spinner = ora(`Fetching blueprint ${chalk.cyan(blueprintId)}...`).start();

  try {
    const { blueprint } = await api.getBlueprint(blueprintId);
    spinner.stop();

    const source = getSourceFromVisibility(blueprint.visibility);
    const isMarketplace = source === "marketplace";

    console.log();
    console.log(chalk.cyan(`🐱 Blueprint: ${chalk.bold(blueprint.name)}`));
    if (blueprint.description) {
      console.log(chalk.gray(`   ${blueprint.description}`));
    }
    console.log(chalk.gray(`   Visibility: ${blueprint.visibility}`));
    console.log();

    // Show warning for marketplace blueprints
    if (isMarketplace) {
      console.log(chalk.yellow("⚠ This is a marketplace blueprint."));
      console.log(chalk.gray("  Your local changes will NOT sync back to the cloud."));
      console.log(chalk.gray("  To make changes, you'll need to create your own copy."));
      console.log();
    }

    // Confirm linking
    const { confirm } = await prompts({
      type: "confirm",
      name: "confirm",
      message: `Link ${chalk.cyan(file)} to ${chalk.cyan(blueprint.name)}?`,
      initial: true,
    });

    if (!confirm) {
      console.log(chalk.gray("Cancelled."));
      return;
    }

    // Link the file
    await linkBlueprint(cwd, file, blueprint.id, blueprint.name, source);

    console.log();
    console.log(chalk.green(`✅ Linked: ${file} → ${blueprint.id}`));
    console.log();

    // Show next steps
    console.log(chalk.gray("Next steps:"));
    console.log(chalk.gray(`  • Run 'lynxp diff' to see differences`));
    console.log(chalk.gray(`  • Run 'lynxp status' to see all tracked blueprints`));
    if (!isMarketplace) {
      console.log(chalk.gray(`  • Run 'lynxp push' to push local changes to cloud`));
    }
    console.log();

  } catch (error) {
    spinner.stop();
    if (error instanceof ApiRequestError) {
      if (error.statusCode === 404) {
        console.log(chalk.red(`✗ Blueprint not found: ${blueprintId}`));
        console.log(chalk.gray("  Make sure the ID is correct. Use 'lynxp list' or 'lynxp search' to find blueprints."));
      } else if (error.statusCode === 403) {
        console.log(chalk.red("✗ You don't have access to this blueprint."));
      } else {
        console.log(chalk.red(`✗ Error: ${error.message}`));
      }
    } else {
      console.log(chalk.red("✗ An unexpected error occurred."));
    }
  }
}

export async function unlinkCommand(fileArg?: string): Promise<void> {
  const cwd = process.cwd();

  console.log();
  console.log(chalk.cyan("🐱 Unlink File from Blueprint"));
  console.log();

  let file: string;

  // Interactive mode - show tracked files and let user select
  if (!fileArg) {
    const status = await checkSyncStatus(cwd);
    
    if (status.length === 0) {
      console.log(chalk.yellow("No files are currently linked to blueprints."));
      return;
    }

    const { selectedFile } = await prompts({
      type: "select",
      name: "selectedFile",
      message: "Which file do you want to unlink?",
      choices: status.map(({ blueprint }) => ({
        title: blueprint.file,
        value: blueprint.file,
        description: `${blueprint.name} (${blueprint.source})`,
      })),
    });

    if (!selectedFile) {
      console.log(chalk.gray("Cancelled."));
      return;
    }
    file = selectedFile;
  } else {
    file = fileArg;
  }

  // Check if file is tracked
  const tracked = await findBlueprintByFile(cwd, file);
  if (!tracked) {
    console.log(chalk.yellow(`File is not linked to any blueprint: ${file}`));
    return;
  }

  console.log(chalk.gray(`Currently linked to: ${tracked.name}`));
  console.log(chalk.gray(`   ID: ${tracked.id}`));
  console.log(chalk.gray(`   Source: ${tracked.source}`));
  console.log();

  const { confirm } = await prompts({
    type: "confirm",
    name: "confirm",
    message: `Unlink ${chalk.cyan(file)} from ${chalk.cyan(tracked.name)}?`,
    initial: true,
  });

  if (!confirm) {
    console.log(chalk.gray("Cancelled."));
    return;
  }

  const success = await untrackBlueprint(cwd, file);
  
  if (success) {
    console.log();
    console.log(chalk.green(`✅ Unlinked: ${file}`));
    console.log(chalk.gray("  The file is now standalone. Changes won't sync with the cloud."));
    console.log();
  } else {
    console.log(chalk.red("✗ Failed to unlink file."));
  }
}

async function listTrackedBlueprints(cwd: string): Promise<void> {
  console.log();
  console.log(chalk.cyan("🐱 Tracked Blueprints"));
  console.log();

  const status = await checkSyncStatus(cwd);

  if (status.length === 0) {
    console.log(chalk.gray("No blueprints are currently tracked."));
    console.log();
    console.log(chalk.gray("To track a blueprint:"));
    console.log(chalk.gray("  lynxp pull <blueprint-id>     Download and track a blueprint"));
    console.log(chalk.gray("  lynxp link                    Link an existing file to a blueprint"));
    return;
  }

  for (const { blueprint, localModified, fileExists } of status) {
    const statusIcon = !fileExists
      ? chalk.red("✗")
      : localModified
      ? chalk.yellow("●")
      : chalk.green("✓");
    
    const sourceLabel = {
      marketplace: chalk.gray("[marketplace]"),
      team: chalk.blue("[team]"),
      private: chalk.green("[private]"),
      local: chalk.gray("[local]"),
    }[blueprint.source];

    console.log(`${statusIcon} ${chalk.cyan(blueprint.file)}`);
    console.log(`  ${sourceLabel} ${blueprint.name}`);
    console.log(`  ${chalk.gray(`ID: ${blueprint.id}`)}`);
    
    if (!fileExists) {
      console.log(chalk.red(`  ⚠ File not found`));
    } else if (localModified) {
      console.log(chalk.yellow(`  ⚠ Local changes detected`));
    }
    
    console.log();
  }

  console.log(chalk.gray("Legend:"));
  console.log(chalk.gray(`  ${chalk.green("✓")} In sync  ${chalk.yellow("●")} Modified locally  ${chalk.red("✗")} Missing`));
  console.log();
}
