import chalk from "chalk";
import ora from "ora";
import { api, ApiRequestError } from "../api.js";
import { setToken, setUser, isAuthenticated } from "../config.js";

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

          // Show cool welcome message with plan info
          displayWelcome(result.user);
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

interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  plan: string;
}

function displayWelcome(user: UserInfo): void {
  const plan = user.plan?.toUpperCase() || "FREE";
  const name = user.name || user.email.split("@")[0];
  
  // Plan colors and emojis
  const planConfig: Record<string, { color: (s: string) => string; emoji: string; badge: string }> = {
    FREE: { color: chalk.gray, emoji: "🆓", badge: "Free" },
    PRO: { color: chalk.cyan, emoji: "⚡", badge: "Pro" },
    MAX: { color: chalk.magenta, emoji: "🚀", badge: "Max" },
    TEAMS: { color: chalk.yellow, emoji: "👥", badge: "Teams" },
  };
  
  const config = planConfig[plan] || planConfig.FREE;
  const W = 45; // inner width
  const b = chalk.bold;
  const pad = (s: string, len: number) => s + " ".repeat(Math.max(0, len - s.length));
  
  console.log();
  console.log(b("┌" + "─".repeat(W) + "┐"));
  console.log(b("│") + " ".repeat(W) + b("│"));
  console.log(b("│") + pad(`   ${config.emoji} Welcome to LynxPrompt CLI!`, W - 1) + b("│"));
  console.log(b("│") + " ".repeat(W) + b("│"));
  console.log(b("│") + pad(`   User: ${name}`, W) + b("│"));
  console.log(b("│") + pad(`   Plan: ${config.badge}`, W) + b("│"));
  console.log(b("│") + " ".repeat(W) + b("│"));
  console.log(b("└" + "─".repeat(W) + "┘"));
  console.log();
  
  // Show capabilities based on plan
  console.log(chalk.bold("📋 Your CLI Capabilities:"));
  console.log();
  
  // All users get these
  console.log(chalk.green("  ✓") + " " + chalk.white("lynxprompt init") + chalk.gray(" - Generate config files"));
  console.log(chalk.green("  ✓") + " " + chalk.white("lynxprompt wizard") + chalk.gray(" - Interactive wizard"));
  console.log(chalk.green("  ✓") + " " + chalk.white("lynxprompt list") + chalk.gray(" - List your blueprints"));
  console.log(chalk.green("  ✓") + " " + chalk.white("lynxprompt pull <id>") + chalk.gray(" - Download blueprints"));
  console.log(chalk.green("  ✓") + " " + chalk.white("lynxprompt push") + chalk.gray(" - Upload blueprints to marketplace"));
  console.log(chalk.green("  ✓") + " " + chalk.white("lynxprompt link") + chalk.gray(" - Link project to blueprint"));
  console.log(chalk.green("  ✓") + " " + chalk.white("lynxprompt sync") + chalk.gray(" - Sync linked blueprints"));
  console.log(chalk.green("  ✓") + " " + chalk.white("lynxprompt diff") + chalk.gray(" - Compare local vs remote"));
  
  // Plan-specific features - Teams users get extra features
  if (plan === "TEAMS") {
    console.log();
    console.log(chalk.cyan("  ⚡") + " " + chalk.white("AI-powered editing") + chalk.gray(" - AI assistant for configs"));
    console.log(chalk.yellow("  👥") + " " + chalk.white("Team blueprints") + chalk.gray(" - Share with your team"));
    console.log(chalk.yellow("  👥") + " " + chalk.white("SSO integration") + chalk.gray(" - Enterprise authentication"));
  }
  
  console.log();
  console.log(chalk.gray("Token stored securely. Run ") + chalk.cyan("lynxprompt --help") + chalk.gray(" to see all commands."));
  console.log();
}




