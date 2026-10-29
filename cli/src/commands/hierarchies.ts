import chalk from "chalk";
import { createSpinner } from "../utils/spinner.js";
import { api, ApiRequestError } from "../api.js";
import { isAuthenticated } from "../config.js";
import { safeText } from "../utils/terminal.js";

interface HierarchiesOptions {
  limit?: number;
  json?: boolean;
}

export async function hierarchiesCommand(
  options: HierarchiesOptions
): Promise<void> {
  // Check authentication
  if (!isAuthenticated()) {
    console.log(chalk.yellow("You need to be logged in to view hierarchies."));
    console.log(chalk.gray("Run 'lynxp login' to authenticate."));
    process.exit(1);
  }

  const spinner = createSpinner("Fetching hierarchies...").start();

  try {
    const response = await api.listHierarchies({
      limit: options.limit || 50,
    });
    
    spinner.stop();

    // JSON output mode
    if (options.json) {
      console.log(JSON.stringify(response, null, 2));
      return;
    }

    const { hierarchies, total } = response;

    if (hierarchies.length === 0) {
      console.log();
      console.log(chalk.yellow("No hierarchies found."));
      console.log();
      console.log(chalk.gray("Hierarchies are created automatically when you push AGENTS.md files from a repository."));
      console.log(chalk.gray("Run 'lynxp push AGENTS.md' in a git repository to create a hierarchy."));
      console.log();
      return;
    }

    console.log();
    console.log(chalk.cyan(`📁 Your Hierarchies (${total} total)`));
    console.log();

    for (const hierarchy of hierarchies) {
      console.log(chalk.bold(`  ${safeText(hierarchy.name)}`));
      console.log(chalk.gray(`    ID: ${hierarchy.id}`));
      if (hierarchy.description) {
        console.log(chalk.gray(`    ${safeText(hierarchy.description)}`));
      }
      console.log(chalk.gray(`    Blueprints: ${hierarchy.blueprint_count || 0}`));
      console.log(chalk.gray(`    Repository: ${safeText(hierarchy.repository_root).slice(0, 16)}...`));
      console.log();
    }

    console.log(chalk.gray("─".repeat(50)));
    console.log();
    console.log(chalk.gray("Tips:"));
    console.log(chalk.gray(`  • Pull entire hierarchy: lynxp pull <hierarchy_id>`));
    console.log(chalk.gray(`  • Preview a hierarchy: lynxp pull <hierarchy_id> --preview`));
    console.log(chalk.gray(`  • Push local changes: lynxp push --all`));
    console.log();
  } catch (error) {
    spinner.fail("Failed to fetch hierarchies");
    handleError(error);
  }
}

function handleError(error: unknown): void {
  if (error instanceof ApiRequestError) {
    console.error(chalk.red(`Error: ${error.message}`));
    if (error.statusCode === 401) {
      console.error(chalk.gray("Your session may have expired. Run 'lynxp login' to re-authenticate."));
    } else if (error.statusCode === 403) {
      console.error(chalk.gray("You don't have permission to access hierarchies."));
    }
  } else {
    console.error(chalk.red("An unexpected error occurred."));
  }
  process.exit(1);
}



