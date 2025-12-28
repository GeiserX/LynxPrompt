/**
 * Link command - connect a local file to a cloud blueprint
 * 
 * This is for when a user has a local file that matches a cloud blueprint
 * and wants to start tracking it without overwriting the local version.
 * 
 * Usage:
 *   lynxp link <file> <blueprint-id>   - Link local file to cloud blueprint
 *   lynxp link --list                   - List all tracked blueprints
 *   lynxp unlink <file>                 - Disconnect a file from its blueprint
 */

import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";
import { api, ApiRequestError, Blueprint } from "../api.js";
import { isAuthenticated } from "../config.js";
import { readFile, access } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import {
  linkBlueprint,
  untrackBlueprint,
  findBlueprintByFile,
  getAllTrackedBlueprints,
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
  file?: string,
  blueprintId?: string,
  options: LinkOptions = {}
): Promise<void> {
  const cwd = process.cwd();

  // List tracked blueprints
  if (options.list) {
    await listTrackedBlueprints(cwd);
    return;
  }

  if (!file) {
    console.log(chalk.red("✗ Please provide a file path to link."));
    console.log();
    console.log(chalk.gray("Usage:"));
    console.log(chalk.gray("  lynxp link <file> <blueprint-id>   Link a local file to a cloud blueprint"));
    console.log(chalk.gray("  lynxp link --list                  List all tracked blueprints"));
    console.log();
    console.log(chalk.gray("Example:"));
    console.log(chalk.gray("  lynxp link AGENTS.md bp_abc123"));
    return;
  }

  if (!blueprintId) {
    console.log(chalk.red("✗ Please provide a blueprint ID to link to."));
    console.log();
    console.log(chalk.gray("Usage: lynxp link <file> <blueprint-id>"));
    console.log(chalk.gray("Example: lynxp link AGENTS.md bp_abc123"));
    console.log();
    console.log(chalk.gray("To find blueprint IDs:"));
    console.log(chalk.gray("  lynxp list      - Show your blueprints"));
    console.log(chalk.gray("  lynxp search <query>  - Search marketplace"));
    return;
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
    console.log(chalk.yellow(`⚠ This file is already linked to: ${existing.id}`));
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

  // Check authentication
  if (!isAuthenticated()) {
    console.log(
      chalk.yellow("Not logged in. Run 'lynxp login' to authenticate.")
    );
    process.exit(1);
  }

  // Fetch blueprint info
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
    console.log(chalk.gray(`  • Run 'lynxp pull ${blueprintId}' to update local file from cloud`));
    console.log(chalk.gray(`  • Run 'lynxp diff ${blueprintId}' to see differences`));
    console.log(chalk.gray(`  • Run 'lynxp status' to see all tracked blueprints`));
    if (!isMarketplace) {
      console.log(chalk.gray(`  • Run 'lynxp push ${file}' to push local changes to cloud`));
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

export async function unlinkCommand(file?: string): Promise<void> {
  const cwd = process.cwd();

  if (!file) {
    console.log(chalk.red("✗ Please provide a file path to unlink."));
    console.log();
    console.log(chalk.gray("Usage: lynxp unlink <file>"));
    console.log(chalk.gray("Example: lynxp unlink AGENTS.md"));
    return;
  }

  // Check if file is tracked
  const tracked = await findBlueprintByFile(cwd, file);
  if (!tracked) {
    console.log(chalk.yellow(`⚠ File is not linked to any blueprint: ${file}`));
    return;
  }

  console.log();
  console.log(chalk.cyan(`Currently linked to: ${tracked.id}`));
  console.log(chalk.gray(`   Name: ${tracked.name}`));
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
    console.log(chalk.gray("  The file is now a standalone local file."));
    console.log(chalk.gray("  It will no longer receive updates from the cloud blueprint."));
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
    console.log(chalk.gray("  lynxp link <file> <id>        Link an existing file to a blueprint"));
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

