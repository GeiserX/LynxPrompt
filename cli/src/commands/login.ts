import chalk from "chalk";
import ora from "ora";
import { api, ApiRequestError } from "../api.js";
import { setToken, setUser, isAuthenticated, getApiUrl } from "../config.js";

export async function loginCommand(): Promise<void> {
  if (isAuthenticated()) {
    console.log(
      chalk.yellow(
        "You are already logged in. Use 'lynxprompt logout' first to switch accounts."
      )
    );
    return;
  }

  const spinner = ora("Initializing authentication...").start();

  try {
    // Initialize CLI session
    const session = await api.initCliSession();
    spinner.stop();

    console.log();
    console.log(chalk.cyan("🔐 Opening browser to authenticate..."));
    console.log(chalk.gray(`   ${session.auth_url}`));
    console.log();

    // Try to open the browser
    const openBrowser = await tryOpenBrowser(session.auth_url);
    if (!openBrowser) {
      console.log(
        chalk.yellow("Could not open browser automatically. Please open the URL above manually.")
      );
    }

    // Poll for completion
    const pollSpinner = ora("Waiting for authentication...").start();
    
    const maxWaitTime = 5 * 60 * 1000; // 5 minutes
    const pollInterval = 2000; // 2 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      await sleep(pollInterval);

      try {
        const result = await api.pollCliSession(session.session_id);

        if (result.status === "completed" && result.token && result.user) {
          pollSpinner.succeed("Authentication successful!");
          
          // Store credentials
          setToken(result.token);
          setUser(result.user);

          console.log();
          console.log(chalk.green(`✅ Logged in as ${chalk.bold(result.user.email)}`));
          console.log(chalk.gray(`   Plan: ${result.user.plan}`));
          console.log(chalk.gray(`   Token stored securely in config`));
          console.log();
          console.log(chalk.cyan("You're ready to use LynxPrompt CLI!"));
          return;
        }

        if (result.status === "expired") {
          pollSpinner.fail("Authentication session expired. Please try again.");
          return;
        }

        // status === "pending", continue polling
      } catch (error) {
        // Ignore polling errors, keep trying
      }
    }

    pollSpinner.fail("Authentication timed out. Please try again.");
  } catch (error) {
    spinner.fail("Failed to initialize authentication");
    
    if (error instanceof ApiRequestError) {
      console.error(chalk.red(`Error: ${error.message}`));
      if (error.statusCode === 503) {
        console.error(chalk.gray("The server may be temporarily unavailable. Please try again later."));
      }
    } else {
      console.error(chalk.red("An unexpected error occurred."));
      console.error(chalk.gray("Make sure you have internet connectivity and try again."));
    }
    process.exit(1);
  }
}

async function tryOpenBrowser(url: string): Promise<boolean> {
  try {
    // Dynamic import for open package
    const { default: open } = await import("open");
    await open(url);
    return true;
  } catch {
    // If open package is not available or fails, try native commands
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    const platform = process.platform;
    let command: string;

    if (platform === "darwin") {
      command = `open "${url}"`;
    } else if (platform === "win32") {
      command = `start "" "${url}"`;
    } else {
      command = `xdg-open "${url}"`;
    }

    try {
      await execAsync(command);
      return true;
    } catch {
      return false;
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


