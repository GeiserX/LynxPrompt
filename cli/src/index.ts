import { Command } from "commander";
import chalk from "chalk";
import { loginCommand } from "./commands/login.js";
import { logoutCommand } from "./commands/logout.js";
import { whoamiCommand } from "./commands/whoami.js";
import { listCommand } from "./commands/list.js";
import { pullCommand } from "./commands/pull.js";
import { initCommand } from "./commands/init.js";
import { wizardCommand } from "./commands/wizard.js";
import { searchCommand } from "./commands/search.js";
import { statusCommand } from "./commands/status.js";

const program = new Command();

program
  .name("lynxprompt")
  .description("CLI for LynxPrompt - Generate AI IDE configuration files")
  .version("0.1.0");

// Auth commands
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

// Init command - simple initialization
program
  .command("init")
  .description("Initialize LynxPrompt in this directory (auto-detects existing files)")
  .option("-y, --yes", "Skip prompts and use defaults")
  .option("-f, --force", "Re-initialize even if already initialized")
  .action(initCommand);

// Wizard command - full interactive wizard
program
  .command("wizard")
  .description("Interactive wizard to generate AI IDE configuration")
  .option("-n, --name <name>", "Project name")
  .option("-d, --description <description>", "Project description")
  .option("-s, --stack <stack>", "Tech stack (comma-separated)")
  .option("-p, --platforms <platforms>", "Target platforms (comma-separated)")
  .option("--persona <persona>", "AI persona/role")
  .option("--boundaries <level>", "Boundary preset (conservative, standard, permissive)")
  .option("--preset <preset>", "Use an agent preset (test-agent, docs-agent, etc.)")
  .option("-y, --yes", "Skip prompts and use defaults")
  .action(wizardCommand);

// Blueprint commands
program
  .command("list")
  .description("List your blueprints")
  .option("-l, --limit <number>", "Number of results", "20")
  .option("-v, --visibility <visibility>", "Filter by visibility (PRIVATE, TEAM, PUBLIC, all)")
  .action(listCommand);

program
  .command("pull <id>")
  .description("Download a blueprint to the current directory")
  .option("-o, --output <path>", "Output directory", ".")
  .option("-y, --yes", "Overwrite existing files without prompting")
  .action(pullCommand);

program
  .command("search <query>")
  .description("Search public blueprints")
  .option("-l, --limit <number>", "Number of results", "20")
  .action(searchCommand);

program
  .command("status")
  .description("Show current AI config status in this directory")
  .action(statusCommand);

// Add some styling to help
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
${chalk.gray("Examples:")}
  ${chalk.cyan("$ lynxp init")}                   ${chalk.gray("Initialize LynxPrompt in this directory")}
  ${chalk.cyan("$ lynxp wizard")}                 ${chalk.gray("Start interactive configuration wizard")}
  ${chalk.cyan("$ lynxp pull bp_abc123")}         ${chalk.gray("Download a blueprint")}
  ${chalk.cyan("$ lynxp list")}                   ${chalk.gray("List your blueprints")}
  ${chalk.cyan("$ lynxp search nextjs")}          ${chalk.gray("Search public blueprints")}

${chalk.gray("Documentation: https://lynxprompt.com/docs/cli")}
`
);

program.parse();


