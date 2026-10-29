import chalk from "chalk";
import { createSpinner } from "../utils/spinner.js";
import { api, ApiRequestError, Blueprint } from "../api.js";
import { getApiUrl, isAuthenticated } from "../config.js";
import { safeText } from "../utils/terminal.js";

interface ListOptions {
  limit: string;
  visibility?: string;
  json?: boolean;
}

export async function listCommand(options: ListOptions): Promise<void> {
  if (!isAuthenticated()) {
    console.log(chalk.yellow("Not logged in. Run 'lynxprompt login' to authenticate."));
    process.exit(1);
  }

  const spinner = createSpinner("Fetching your blueprints...").start();

  try {
    const limit = parseInt(options.limit, 10) || 20;
    const response = await api.listBlueprints({
      limit,
      visibility: options.visibility,
    });

    spinner.stop();

    if (options.json) {
      console.log(JSON.stringify(response, null, 2));
      return;
    }

    const { blueprints, total, has_more } = response;

    if (blueprints.length === 0) {
      console.log();
      console.log(chalk.yellow("No blueprints found."));
      console.log(chalk.gray(`Create your first blueprint at ${getApiUrl().replace(/\/+$/, "")}/blueprints/create`));
      console.log(chalk.gray("Or run 'lynxp wizard' to generate one from the CLI!"));
      return;
    }

    console.log();
    console.log(chalk.cyan(`🐱 Your Blueprints (${total} total)`));
    console.log();

    for (const bp of blueprints) {
      printBlueprint(bp);
    }

    if (has_more) {
      console.log(chalk.gray(`Showing ${blueprints.length} of ${total}. Use --limit to see more.`));
    }
  } catch (error) {
    spinner.fail("Failed to fetch blueprints");
    handleApiError(error);
  }
}

function printBlueprint(bp: Blueprint): void {
  const visibilityIcon = {
    PRIVATE: "🔒",
    TEAM: "👥",
    PUBLIC: "🌐",
  }[bp.visibility] || "📄";

  const tierBadge = {
    SHORT: chalk.gray("[Short]"),
    INTERMEDIATE: chalk.blue("[Intermediate]"),
    LONG: chalk.cyan("[Long]"),
    SUPERLONG: chalk.magenta("[Super Long]"),
  }[bp.tier] || "";

  console.log(`  ${visibilityIcon} ${chalk.bold(safeText(bp.name))} ${tierBadge}`);
  console.log(`     ${chalk.cyan(bp.id)}`);
  if (bp.description) {
    console.log(`     ${chalk.gray(truncate(safeText(bp.description), 60))}`);
  }
  console.log(`     ${chalk.gray(`↓${bp.downloads}`)} ${chalk.gray(`♥${bp.favorites}`)} ${formatTags(bp.tags)}`);
  console.log();
}

function formatTags(tags: string[]): string {
  if (!tags || tags.length === 0) return "";
  return tags.slice(0, 3).map((t) => chalk.gray(`#${safeText(t)}`)).join(" ");
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

function handleApiError(error: unknown): void {
  if (error instanceof ApiRequestError) {
    if (error.statusCode === 401) {
      console.error(chalk.red("Your session has expired. Please run 'lynxprompt login' again."));
    } else if (error.statusCode === 403) {
      console.error(chalk.red("API access error. Please check your account."));
    } else {
      console.error(chalk.red(`Error: ${error.message}`));
    }
  } else {
    console.error(chalk.red("An unexpected error occurred."));
  }
  process.exit(1);
}







