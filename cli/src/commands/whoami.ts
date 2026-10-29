import chalk from "chalk";
import { createSpinner } from "../utils/spinner.js";
import { api, ApiRequestError } from "../api.js";
import { isAuthenticated, setUser } from "../config.js";

interface WhoamiOptions {
  json?: boolean;
}

export async function whoamiCommand(options: WhoamiOptions = {}): Promise<void> {
  if (!isAuthenticated()) {
    console.log(chalk.yellow("Not logged in. Run 'lynxprompt login' to authenticate."));
    process.exit(1);
  }

  const spinner = createSpinner("Fetching user info...").start();

  try {
    const { user } = await api.getUser();
    spinner.stop();

    // Update cached user info
    setUser({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    if (options.json) {
      console.log(JSON.stringify({ user }, null, 2));
      return;
    }

    console.log();
    console.log(chalk.cyan("🐱 LynxPrompt Account"));
    console.log();
    console.log(`  ${chalk.gray("Email:")}       ${chalk.bold(user.email)}`);
    if (user.name) {
      console.log(`  ${chalk.gray("Name:")}        ${user.name}`);
    }
    if (user.display_name) {
      console.log(`  ${chalk.gray("Display:")}     ${user.display_name}`);
    }
    console.log();
    console.log(`  ${chalk.gray("Blueprints:")}  ${user.stats.blueprints_count}`);
    console.log(`  ${chalk.gray("Member since:")} ${new Date(user.created_at).toLocaleDateString()}`);
    console.log();
  } catch (error) {
    spinner.fail("Failed to fetch user info");

    if (error instanceof ApiRequestError) {
      if (error.statusCode === 401) {
        console.error(chalk.red("Your session has expired. Please run 'lynxprompt login' again."));
      } else if (error.statusCode === 403) {
        console.error(chalk.red("API access error."));
      } else {
        console.error(chalk.red(`Error: ${error.message}`));
      }
    } else {
      console.error(chalk.red("An unexpected error occurred."));
    }
    process.exit(1);
  }
}




