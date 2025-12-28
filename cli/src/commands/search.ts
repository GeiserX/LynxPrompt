import chalk from "chalk";
import ora from "ora";
import { api, ApiRequestError, SearchResult } from "../api.js";

interface SearchOptions {
  limit: string;
}

export async function searchCommand(
  query: string,
  options: SearchOptions
): Promise<void> {
  const spinner = ora(`Searching for "${query}"...`).start();

  try {
    const limit = parseInt(options.limit, 10) || 20;
    const { templates, total, hasMore } = await api.searchBlueprints(query, limit);
    spinner.stop();

    if (templates.length === 0) {
      console.log();
      console.log(chalk.yellow(`No blueprints found for "${query}".`));
      console.log(chalk.gray("Try different keywords or browse at https://lynxprompt.com/blueprints"));
      return;
    }

    console.log();
    console.log(chalk.cyan(`🔍 Search Results for "${query}" (${total} found)`));
    console.log();

    for (const result of templates) {
      printSearchResult(result);
    }

    if (hasMore) {
      console.log(chalk.gray(`Showing ${templates.length} of ${total}. Use --limit to see more.`));
    }

    console.log();
    console.log(chalk.gray("Use 'lynxprompt pull <id>' to download a blueprint."));
  } catch (error) {
    spinner.fail("Search failed");
    handleApiError(error);
  }
}

function printSearchResult(result: SearchResult): void {
  const priceInfo = result.price ? chalk.yellow(`€${(result.price / 100).toFixed(2)}`) : chalk.green("Free");
  const officialBadge = result.isOfficial ? chalk.magenta(" ★ Official") : "";
  
  console.log(`  ${chalk.bold(result.name)}${officialBadge}`);
  console.log(`     ${chalk.cyan(result.id)} • ${priceInfo}`);
  if (result.description) {
    console.log(`     ${chalk.gray(truncate(result.description, 60))}`);
  }
  console.log(`     ${chalk.gray(`by ${result.author}`)} • ${chalk.gray(`↓${result.downloads}`)} ${chalk.gray(`♥${result.likes}`)}`);
  if (result.tags && result.tags.length > 0) {
    console.log(`     ${formatTags(result.tags)}`);
  }
  console.log();
}

function formatTags(tags: string[]): string {
  return tags.slice(0, 4).map((t) => chalk.gray(`#${t}`)).join(" ");
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

function handleApiError(error: unknown): void {
  if (error instanceof ApiRequestError) {
    console.error(chalk.red(`Error: ${error.message}`));
  } else {
    console.error(chalk.red("An unexpected error occurred."));
  }
  process.exit(1);
}


