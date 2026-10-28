import chalk from "chalk";
import {
  getApiUrl,
  setApiUrl,
  resetApiUrl,
  getConfigPath,
  getUser,
  isAuthenticated,
} from "../config.js";

// Each server keeps its own saved login, so switching URL never sends one
// server's token to another.
function printLoginState(): void {
  if (isAuthenticated()) {
    const email = getUser()?.email;
    console.log(chalk.gray(`  Logged in${email ? ` as ${email}` : ""} on this instance.`));
  } else {
    console.log(chalk.gray("  Run 'lynxp login' to authenticate with this instance."));
  }
}

export async function configCommand(
  action?: string,
  valueArg?: string,
): Promise<void> {
  if (!action || action === "show") {
    console.log();
    console.log(chalk.cyan("⚙️  LynxPrompt CLI Configuration"));
    console.log();
    console.log(
      chalk.white("  API URL: ") + chalk.green(getApiUrl()),
    );
    const loggedIn = isAuthenticated();
    console.log(
      chalk.white("  Login:   ") +
        (loggedIn ? chalk.green(getUser()?.email ?? "token set") : chalk.gray("not logged in")),
    );
    console.log(
      chalk.white("  Config:  ") + chalk.gray(getConfigPath()),
    );
    if (process.env.LYNXPROMPT_API_URL) {
      console.log(
        chalk.gray(
          "  (API URL overridden by LYNXPROMPT_API_URL env var)",
        ),
      );
    }
    console.log();
    return;
  }

  if (action === "set-url") {
    if (!valueArg) {
      console.error(
        chalk.red("Usage: lynxp config set-url <url>"),
      );
      process.exit(1);
    }
    try {
      new URL(valueArg);
    } catch {
      console.error(chalk.red(`Invalid URL: ${valueArg}`));
      process.exit(1);
    }
    const clean = valueArg.replace(/\/+$/, "");
    setApiUrl(clean);
    console.log(
      chalk.green("✓") +
        ` API URL set to ${chalk.cyan(clean)}`,
    );
    printLoginState();
    return;
  }

  if (action === "reset-url") {
    const url = resetApiUrl();
    console.log(
      chalk.green("✓") + " API URL reset to " + chalk.cyan(url),
    );
    printLoginState();
    return;
  }

  if (action === "path") {
    console.log(getConfigPath());
    return;
  }

  console.error(chalk.red(`Unknown config action: ${action}`));
  console.error(chalk.gray("Available: show, set-url <url>, reset-url, path"));
  process.exit(1);
}
