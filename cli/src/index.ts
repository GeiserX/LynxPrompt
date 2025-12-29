import { Command } from "commander";
import chalk from "chalk";
import { loginCommand } from "./commands/login.js";
import { logoutCommand } from "./commands/logout.js";
import { whoamiCommand } from "./commands/whoami.js";
import { listCommand } from "./commands/list.js";
import { pullCommand } from "./commands/pull.js";
import { pushCommand } from "./commands/push.js";
import { initCommand } from "./commands/init.js";
import { wizardCommand } from "./commands/wizard.js";
import { searchCommand } from "./commands/search.js";
import { statusCommand } from "./commands/status.js";
import { syncCommand } from "./commands/sync.js";
import { agentsCommand } from "./commands/agents.js";
import { checkCommand } from "./commands/check.js";
import { diffCommand } from "./commands/diff.js";
import { linkCommand, unlinkCommand } from "./commands/link.js";

const program = new Command();

program
  .name("lynxprompt")
  .description("CLI for LynxPrompt - Generate AI IDE configuration files")
  .version("0.3.0");

// ============================================
// Primary Commands (most users need these)
// ============================================

// Wizard - the main command for most users
program
  .command("wizard")
  .description("Generate AI IDE configuration (recommended for most users)")
  .option("-n, --name <name>", "Project name")
  .option("-d, --description <description>", "Project description")
  .option("-s, --stack <stack>", "Tech stack (comma-separated)")
  .option("-f, --format <format>", "Output format: agents, cursor, or comma-separated for multiple")
  .option("-p, --platforms <platforms>", "Alias for --format (deprecated)")
  .option("--persona <persona>", "AI persona (fullstack, backend, frontend, devops, data, security)")
  .option("--boundaries <level>", "Boundary preset (conservative, standard, permissive)")
  .option("-y, --yes", "Skip prompts, use defaults (generates AGENTS.md)")
  .action(wizardCommand);

// Check - validation for CI/CD
program
  .command("check")
  .description("Validate AI configuration files (for CI/CD)")
  .option("--ci", "CI mode - exit codes only (0=pass, 1=fail)")
  .action(checkCommand);

// Status - show what's configured
program
  .command("status")
  .description("Show current AI configuration and tracked blueprints")
  .action(statusCommand);

// ============================================
// Blueprint Commands (marketplace integration)
// ============================================

program
  .command("pull <id>")
  .description("Download and track a blueprint from the marketplace")
  .option("-o, --output <path>", "Output directory", ".")
  .option("-y, --yes", "Overwrite existing files without prompting")
  .option("--preview", "Preview content without downloading")
  .option("--no-track", "Don't track the blueprint for future syncs")
  .action(pullCommand);

program
  .command("search <query>")
  .description("Search public blueprints in the marketplace")
  .option("-l, --limit <number>", "Number of results", "20")
  .action(searchCommand);

program
  .command("list")
  .description("List your blueprints")
  .option("-l, --limit <number>", "Number of results", "20")
  .option("-v, --visibility <visibility>", "Filter: PRIVATE, TEAM, PUBLIC, or all")
  .action(listCommand);

program
  .command("push [file]")
  .description("Push local file to LynxPrompt cloud as a blueprint")
  .option("-n, --name <name>", "Blueprint name")
  .option("-d, --description <desc>", "Blueprint description")
  .option("-v, --visibility <vis>", "Visibility: PRIVATE, TEAM, or PUBLIC", "PRIVATE")
  .option("-t, --tags <tags>", "Tags (comma-separated)")
  .option("-y, --yes", "Skip prompts")
  .action(pushCommand);

// Link/Unlink - connect local files to cloud blueprints
program
  .command("link [file] [blueprint-id]")
  .description("Link a local file to a cloud blueprint for tracking")
  .option("--list", "List all tracked blueprints")
  .action(linkCommand);

program
  .command("unlink [file]")
  .description("Disconnect a local file from its cloud blueprint")
  .action(unlinkCommand);

// Diff - compare local with remote
program
  .command("diff [file-or-id]")
  .description("Compare tracked files with their cloud blueprints")
  .option("--local", "Compare .lynxprompt/rules/ with exported files")
  .action(diffCommand);

// ============================================
// Advanced Commands (power users)
// ============================================

// Init - advanced multi-editor setup
program
  .command("init")
  .description("Initialize .lynxprompt/ for multi-editor sync (advanced)")
  .option("-y, --yes", "Skip prompts and use defaults")
  .option("-f, --force", "Re-initialize even if already initialized")
  .action(initCommand);

// Sync - export rules to all agents
program
  .command("sync")
  .description("Sync .lynxprompt/rules/ to all configured agents")
  .option("--dry-run", "Preview changes without writing files")
  .option("-f, --force", "Skip prompts (for CI/automation)")
  .action(syncCommand);

// Agents - manage which agents to sync to
program
  .command("agents [action] [agent]")
  .description("Manage AI agents (list, enable, disable, detect)")
  .option("-i, --interactive", "Interactive agent selection")
  .action(agentsCommand);

// ============================================
// Auth Commands
// ============================================

program
  .command("login")
  .description("Authenticate with LynxPrompt (opens browser)")
  .action(loginCommand);

program
  .command("logout")
  .description("Log out and remove stored credentials")
  .action(logoutCommand);

program
  .command("whoami")
  .description("Show current authenticated user")
  .action(whoamiCommand);

// ============================================
// Help formatting
// ============================================

program.addHelpText(
  "beforeAll",
  `
${chalk.cyan("🐱 LynxPrompt CLI")} ${chalk.gray("(also available as: lynxp)")}
${chalk.gray("Generate AI IDE configuration files from your terminal")}
`
);

program.addHelpText(
  "after",
  `
${chalk.cyan("Quick Start:")}
  ${chalk.white("$ lynxp wizard")}                ${chalk.gray("Generate config interactively")}
  ${chalk.white("$ lynxp wizard -y")}             ${chalk.gray("Generate AGENTS.md with defaults")}
  ${chalk.white("$ lynxp wizard -f cursor")}      ${chalk.gray("Generate .cursor/rules/")}

${chalk.cyan("Marketplace:")}
  ${chalk.white("$ lynxp search nextjs")}         ${chalk.gray("Search blueprints")}
  ${chalk.white("$ lynxp pull bp_abc123")}        ${chalk.gray("Download and track a blueprint")}
  ${chalk.white("$ lynxp push")}                  ${chalk.gray("Push local file to cloud")}
  ${chalk.white("$ lynxp link --list")}           ${chalk.gray("Show tracked blueprints")}

${chalk.cyan("Blueprint Tracking:")}
  ${chalk.white("$ lynxp link AGENTS.md bp_xyz")} ${chalk.gray("Link existing file to blueprint")}
  ${chalk.white("$ lynxp unlink AGENTS.md")}      ${chalk.gray("Disconnect from cloud")}
  ${chalk.white("$ lynxp diff bp_abc123")}        ${chalk.gray("Show changes vs cloud version")}

${chalk.cyan("CI/CD:")}
  ${chalk.white("$ lynxp check --ci")}            ${chalk.gray("Validate config (exit code)")}

${chalk.gray("Docs: https://lynxprompt.com/docs/cli")}
`
);

program.parse();
