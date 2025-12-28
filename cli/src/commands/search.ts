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
    const { results, total } = await api.searchBlueprints(query, limit);
    spinner.stop();

    if (results.length === 0) {
      console.log();
      console.log(chalk.yellow(`No blueprints found for "${query}".`));
      console.log(chalk.gray("Try different keywords or browse at https://lynxprompt.com/blueprints"));
      return;
    }

    console.log();
    console.log(chalk.cyan(`🔍 Search Results for "${query}" (${total} found)`));
    console.log();

    for (const result of results) {
      printSearchResult(result);
    }

    if (results.length < total) {
      console.log(chalk.gray(`Showing ${results.length} of ${total}. Use --limit to see more.`));
    }

    console.log();
    console.log(chalk.gray("Use 'lynxprompt pull <id>' to download a blueprint."));
  } catch (error) {
    spinner.fail("Search failed");
    handleApiError(error);
  }
}

function printSearchResult(result: SearchResult): void {
  console.log(`  ${chalk.bold(result.name)}`);
  console.log(`     ${chalk.cyan(result.id)}`);
  if (result.description) {
    console.log(`     ${chalk.gray(truncate(result.description, 60))}`);
  }
  const authorName = result.author.name || "Anonymous";
  console.log(`     ${chalk.gray(`by ${authorName}`)} • ${chalk.gray(`↓${result.downloads}`)} ${chalk.gray(`♥${result.favorites}`)}`);
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


