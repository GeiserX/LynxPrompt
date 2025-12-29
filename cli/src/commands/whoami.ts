import chalk from "chalk";
import ora from "ora";
import { api, ApiRequestError } from "../api.js";
import { isAuthenticated, setUser } from "../config.js";

export async function whoamiCommand(): Promise<void> {
  if (!isAuthenticated()) {
    console.log(chalk.yellow("Not logged in. Run 'lynxprompt login' to authenticate."));
    process.exit(1);
  }

  const spinner = ora("Fetching user info...").start();

  try {
    const { user } = await api.getUser();
    spinner.stop();

    // Update cached user info
    setUser({
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.subscription.plan,
    });

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
    console.log(`  ${chalk.gray("Plan:")}        ${formatPlan(user.subscription.plan)}`);
    if (user.subscription.status) {
      console.log(`  ${chalk.gray("Status:")}      ${user.subscription.status}`);
    }
    if (user.subscription.current_period_end) {
      const endDate = new Date(user.subscription.current_period_end);
      console.log(`  ${chalk.gray("Renews:")}      ${endDate.toLocaleDateString()}`);
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
        console.error(chalk.red("API access requires Pro, Max, or Teams subscription."));
        console.error(chalk.gray("Upgrade at https://lynxprompt.com/pricing"));
      } else {
        console.error(chalk.red(`Error: ${error.message}`));
      }
    } else {
      console.error(chalk.red("An unexpected error occurred."));
    }
    process.exit(1);
  }
}

function formatPlan(plan: string): string {
  const planColors: Record<string, (s: string) => string> = {
    FREE: chalk.gray,
    PRO: chalk.blue,
    MAX: chalk.magenta,
    TEAMS: chalk.cyan,
  };
  
  const colorFn = planColors[plan] || chalk.white;
  return colorFn(plan);
}




