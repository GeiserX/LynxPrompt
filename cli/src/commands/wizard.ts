import chalk from "chalk";
import prompts from "prompts";
import ora from "ora";
import { writeFile, mkdir, access } from "fs/promises";
import { join, dirname } from "path";
import { detectProject } from "../utils/detect.js";
import { generateConfig, GenerateOptions } from "../utils/generator.js";
import { isAuthenticated, getUser } from "../config.js";

interface WizardOptions {
  name?: string;
  description?: string;
  stack?: string;
  platforms?: string;
  format?: string;
  persona?: string;
  boundaries?: string;
  preset?: string;
  yes?: boolean;
}

// Output format options with emoji
const OUTPUT_FORMATS = [
  {
    title: "🌐 AGENTS.md",
    value: "agents",
    description: "Universal format - Claude, Copilot, Aider, & more",
    recommended: true,
  },
  {
    title: "🖱️  Cursor",
    value: "cursor",
    description: ".cursor/rules/ with MDC format",
  },
  {
    title: "🌊 Windsurf",
    value: "windsurf",
    description: ".windsurfrules configuration",
  },
  {
    title: "🤖 Claude Code",
    value: "claude",
    description: "CLAUDE.md for Claude AI",
  },
  {
    title: "📦 Multiple",
    value: "multiple",
    description: "Generate for multiple AI editors",
  },
];

// Tech stack options with icons
const TECH_STACKS = [
  { title: "🔷 TypeScript", value: "typescript" },
  { title: "🟡 JavaScript", value: "javascript" },
  { title: "🐍 Python", value: "python" },
  { title: "🔵 Go", value: "go" },
  { title: "🦀 Rust", value: "rust" },
  { title: "☕ Java", value: "java" },
  { title: "💜 C#/.NET", value: "csharp" },
  { title: "💎 Ruby", value: "ruby" },
  { title: "🐘 PHP", value: "php" },
  { title: "🍎 Swift", value: "swift" },
];

const FRAMEWORKS = [
  { title: "⚛️  React", value: "react" },
  { title: "▲  Next.js", value: "nextjs" },
  { title: "💚 Vue.js", value: "vue" },
  { title: "🅰️  Angular", value: "angular" },
  { title: "🔥 Svelte", value: "svelte" },
  { title: "🚂 Express", value: "express" },
  { title: "⚡ FastAPI", value: "fastapi" },
  { title: "🎸 Django", value: "django" },
  { title: "🧪 Flask", value: "flask" },
  { title: "🍃 Spring", value: "spring" },
  { title: "💎 Rails", value: "rails" },
  { title: "🔴 Laravel", value: "laravel" },
  { title: "🏗️  NestJS", value: "nestjs" },
  { title: "⚡ Vite", value: "vite" },
  { title: "📱 React Native", value: "react-native" },
];

// Platform options (for multiple format selection)
const PLATFORMS = [
  { title: "🌐 AGENTS.md (Universal)", value: "agents", filename: "AGENTS.md" },
  { title: "🖱️  Cursor", value: "cursor", filename: ".cursor/rules/project.mdc" },
  { title: "🤖 Claude Code", value: "claude", filename: "CLAUDE.md" },
  { title: "🐙 GitHub Copilot", value: "copilot", filename: ".github/copilot-instructions.md" },
  { title: "🌊 Windsurf", value: "windsurf", filename: ".windsurfrules" },
  { title: "⚡ Zed", value: "zed", filename: ".zed/instructions.md" },
  { title: "🤖 Cline", value: "cline", filename: ".clinerules" },
];

// Persona options with descriptions
const PERSONAS = [
  { title: "🧑‍💻 Full-Stack Developer", value: "fullstack", description: "Complete application development" },
  { title: "⚙️  Backend Developer", value: "backend", description: "APIs, databases, services" },
  { title: "🎨 Frontend Developer", value: "frontend", description: "UI, components, styling" },
  { title: "🚀 DevOps Engineer", value: "devops", description: "Infrastructure, CI/CD" },
  { title: "📊 Data Engineer", value: "data", description: "Pipelines, ETL, analytics" },
  { title: "🔒 Security Engineer", value: "security", description: "Secure code, auditing" },
  { title: "✏️  Custom...", value: "custom", description: "Define your own" },
];

// Boundary presets with visual indicators
const BOUNDARY_PRESETS = [
  {
    title: "🟢 Standard",
    value: "standard",
    description: "Balanced freedom & safety",
    always: ["Read any file", "Modify files in src/", "Run build/test/lint", "Create test files"],
    askFirst: ["Add new dependencies", "Modify config files", "Create new modules"],
    never: ["Delete production data", "Modify .env secrets", "Force push"],
  },
  {
    title: "🟡 Conservative",
    value: "conservative",
    description: "Ask before most changes",
    always: ["Read any file", "Run lint/format commands"],
    askFirst: ["Modify any file", "Add dependencies", "Create files", "Run tests"],
    never: ["Delete files", "Modify .env", "Push to git"],
  },
  {
    title: "🟠 Permissive",
    value: "permissive",
    description: "AI can modify freely",
    always: ["Modify any file in src/", "Run any script", "Add dependencies", "Create files"],
    askFirst: ["Modify root configs", "Delete directories"],
    never: ["Modify .env", "Access external APIs without confirmation"],
  },
];

// Step indicator
function showStep(current: number, total: number, title: string): void {
  const progress = "●".repeat(current) + "○".repeat(total - current);
  console.log();
  console.log(chalk.cyan(`  ${progress}  Step ${current}/${total}: ${title}`));
  console.log();
}

// Box drawing helper
function printBox(lines: string[], color: typeof chalk.cyan = chalk.gray): void {
  const maxLen = Math.max(...lines.map(l => l.replace(/\x1b\[[0-9;]*m/g, "").length));
  const top = "┌" + "─".repeat(maxLen + 2) + "┐";
  const bottom = "└" + "─".repeat(maxLen + 2) + "┘";
  
  console.log(color(top));
  for (const line of lines) {
    const stripped = line.replace(/\x1b\[[0-9;]*m/g, "");
    const padding = " ".repeat(maxLen - stripped.length);
    console.log(color("│ ") + line + padding + color(" │"));
  }
  console.log(color(bottom));
}

export async function wizardCommand(options: WizardOptions): Promise<void> {
  console.log();
  console.log(chalk.cyan.bold("  🐱 LynxPrompt Wizard"));
  console.log(chalk.gray("     Generate AI IDE configuration in seconds"));
  console.log();

  // Check authentication and show notice
  const authenticated = isAuthenticated();
  const user = getUser();
  const userPlan = user?.plan?.toUpperCase() || "FREE";
  
  if (!authenticated) {
    // Show login notice for guests
    console.log(chalk.yellow("┌─────────────────────────────────────────────────────┐"));
    console.log(chalk.yellow("│") + chalk.white(" 💡 ") + chalk.gray("Log in for full wizard features:") + "              " + chalk.yellow("│"));
    console.log(chalk.yellow("│") + "                                                     " + chalk.yellow("│"));
    console.log(chalk.yellow("│") + chalk.gray("   • ") + chalk.white("Push configs to cloud") + chalk.gray(" (lynxp push)") + "          " + chalk.yellow("│"));
    console.log(chalk.yellow("│") + chalk.gray("   • ") + chalk.white("Sync across devices") + chalk.gray(" (lynxp sync)") + "            " + chalk.yellow("│"));
    console.log(chalk.yellow("│") + chalk.gray("   • ") + chalk.white("Access marketplace blueprints") + "                " + chalk.yellow("│"));
    console.log(chalk.yellow("│") + "                                                     " + chalk.yellow("│"));
    console.log(chalk.yellow("│") + chalk.cyan("   Run: lynxp login") + "                                " + chalk.yellow("│"));
    console.log(chalk.yellow("└─────────────────────────────────────────────────────┘"));
    console.log();
  } else {
    // Show logged-in status with plan
    const planEmoji = userPlan === "TEAMS" ? "👥" : userPlan === "MAX" ? "🚀" : userPlan === "PRO" ? "⚡" : "🆓";
    console.log(chalk.green(`  ✓ Logged in as ${chalk.bold(user?.name || user?.email)} ${planEmoji} ${chalk.gray(userPlan)}`));
    
    // Show plan-specific features
    if (userPlan === "FREE") {
      console.log(chalk.gray("    Upgrade to PRO for API sync & advanced features"));
    } else if (userPlan === "PRO") {
      console.log(chalk.cyan("    ⚡ PRO features enabled: API sync, sell blueprints"));
    } else if (userPlan === "MAX") {
      console.log(chalk.magenta("    🚀 MAX features enabled: API sync, AI assist, premium blueprints"));
    } else if (userPlan === "TEAMS") {
      console.log(chalk.yellow("    👥 TEAMS features enabled: Team sync, SSO, shared blueprints"));
    }
    console.log();
  }

  // Try to detect project info
  const detected = await detectProject(process.cwd());
  
  if (detected) {
    const detectedInfo = [
      chalk.green("✓ Project detected"),
    ];
    if (detected.name) detectedInfo.push(chalk.gray(`  Name: ${detected.name}`));
    if (detected.stack.length > 0) detectedInfo.push(chalk.gray(`  Stack: ${detected.stack.join(", ")}`));
    if (detected.packageManager) detectedInfo.push(chalk.gray(`  Package manager: ${detected.packageManager}`));
    
    printBox(detectedInfo, chalk.gray);
    console.log();
  }

  let config: GenerateOptions;

  // Non-interactive mode with --yes flag
  if (options.yes) {
    // Determine platforms from format flag or defaults
    let platforms: string[];
    if (options.format) {
      platforms = options.format.split(",").map(f => f.trim());
    } else if (options.platforms) {
      platforms = options.platforms.split(",").map(p => p.trim());
    } else {
      platforms = ["agents"]; // Default to AGENTS.md
    }

    config = {
      name: options.name || detected?.name || "my-project",
      description: options.description || "",
      stack: options.stack?.split(",").map(s => s.trim()) || detected?.stack || [],
      platforms,
      persona: options.persona || "fullstack",
      boundaries: options.boundaries as "conservative" | "standard" | "permissive" || "standard",
      commands: detected?.commands || {},
    };
  } else {
    // Interactive mode
    config = await runInteractiveWizard(options, detected);
  }

  // Generate and write files
  const spinner = ora("Generating configuration...").start();
  
  try {
    const files = generateConfig(config);
    spinner.stop();

    console.log();
    console.log(chalk.green.bold("  ✅ Generated:"));
    console.log();
    
    for (const [filename, content] of Object.entries(files)) {
      const outputPath = join(process.cwd(), filename);
      
      // Check if file exists
      let exists = false;
      try {
        await access(outputPath);
        exists = true;
      } catch {
        // File doesn't exist
      }

      // Ask to overwrite if exists and not in --yes mode
      if (exists && !options.yes) {
        const response = await prompts({
          type: "confirm",
          name: "overwrite",
          message: `${filename} already exists. Overwrite?`,
          initial: false,
        });
        
        if (!response.overwrite) {
          console.log(chalk.yellow(`     ⏭️  Skipped: ${filename}`));
          continue;
        }
      }

      // Create directory if needed
      const dir = dirname(outputPath);
      if (dir !== ".") {
        await mkdir(dir, { recursive: true });
      }

      await writeFile(outputPath, content, "utf-8");
      console.log(`     ${chalk.cyan("→")} ${chalk.bold(filename)}`);
    }

    console.log();
    
    // Build next steps based on auth status
    const nextStepsLines = [
      chalk.gray("Your AI assistant will now follow these instructions."),
      "",
      chalk.gray("Next steps:"),
      chalk.cyan("  lynxp check    ") + chalk.gray("Validate configuration"),
    ];
    
    if (authenticated) {
      nextStepsLines.push(chalk.cyan("  lynxp push     ") + chalk.gray("Upload to cloud"));
      nextStepsLines.push(chalk.cyan("  lynxp link     ") + chalk.gray("Link to a blueprint"));
      nextStepsLines.push(chalk.cyan("  lynxp sync     ") + chalk.gray("Sync with linked blueprint"));
    } else {
      nextStepsLines.push(chalk.gray("  lynxp login    ") + chalk.yellow("Log in to push & sync"));
    }
    
    nextStepsLines.push(chalk.cyan("  lynxp status   ") + chalk.gray("View current setup"));
    
    printBox(nextStepsLines, chalk.gray);
    console.log();
    
  } catch (error) {
    spinner.fail("Failed to generate files");
    console.error(chalk.red("\n✗ An error occurred while generating configuration files."));
    if (error instanceof Error) {
      console.error(chalk.gray(`  ${error.message}`));
    }
    console.error(chalk.gray("\nTry running with --yes flag for default settings."));
    process.exit(1);
  }
}

async function runInteractiveWizard(
  options: WizardOptions,
  detected: Awaited<ReturnType<typeof detectProject>> | null
): Promise<GenerateOptions> {
  const answers: Record<string, unknown> = {};
  const totalSteps = 5;

  // Configure prompts to look better
  const promptConfig = {
    onCancel: () => {
      console.log(chalk.yellow("\n  Cancelled. Run 'lynxp wizard' anytime to restart.\n"));
      process.exit(0);
    },
  };

  // ═══════════════════════════════════════════════════════════════
  // STEP 1: Output Format
  // ═══════════════════════════════════════════════════════════════
  showStep(1, totalSteps, "Output Format");
  
  let platforms: string[];
  
  if (options.format) {
    platforms = options.format.split(",").map(f => f.trim());
    console.log(chalk.gray(`  Using format from flag: ${platforms.join(", ")}`));
  } else {
    const formatResponse = await prompts({
      type: "select",
      name: "format",
      message: chalk.white("Where will you use this?"),
      choices: OUTPUT_FORMATS.map(f => ({
        title: f.recommended 
          ? `${f.title} ${chalk.green.bold("★ recommended")}`
          : f.title,
        value: f.value,
        description: chalk.gray(f.description),
      })),
      initial: 0,
      hint: chalk.gray("↑↓ navigate • enter select"),
    }, promptConfig);

    if (formatResponse.format === "multiple") {
      console.log();
      const platformResponse = await prompts({
        type: "multiselect",
        name: "platforms",
        message: chalk.white("Select AI editors:"),
        choices: PLATFORMS.map(p => ({ 
          title: p.title, 
          value: p.value,
        })),
        hint: chalk.gray("space select • a toggle all • enter confirm"),
        min: 1,
        instructions: false,
      }, promptConfig);
      platforms = platformResponse.platforms || ["agents"];
    } else {
      platforms = [formatResponse.format || "agents"];
    }
  }
  answers.platforms = platforms;

  // ═══════════════════════════════════════════════════════════════
  // STEP 2: Project Info
  // ═══════════════════════════════════════════════════════════════
  showStep(2, totalSteps, "Project Info");

  const nameResponse = await prompts({
    type: "text",
    name: "name",
    message: chalk.white("Project name:"),
    initial: options.name || detected?.name || "my-project",
    hint: chalk.gray("Used in the generated config header"),
  }, promptConfig);
  answers.name = nameResponse.name || "my-project";

  const descResponse = await prompts({
    type: "text",
    name: "description",
    message: chalk.white("Brief description:"),
    initial: options.description || "",
    hint: chalk.gray("optional - helps AI understand context"),
  }, promptConfig);
  answers.description = descResponse.description || "";

  // ═══════════════════════════════════════════════════════════════
  // STEP 3: Tech Stack
  // ═══════════════════════════════════════════════════════════════
  showStep(3, totalSteps, "Tech Stack");

  const allStackOptions = [...TECH_STACKS, ...FRAMEWORKS];
  const detectedStackSet = new Set(detected?.stack || []);
  
  // Pre-select detected technologies
  const preselected = allStackOptions
    .map((s, i) => detectedStackSet.has(s.value) ? i : -1)
    .filter(i => i !== -1);

  if (preselected.length > 0) {
    console.log(chalk.gray(`  Auto-selected: ${detected?.stack?.join(", ")}`));
    console.log();
  }

  const stackResponse = await prompts({
    type: "multiselect",
    name: "stack",
    message: chalk.white("Tech stack:"),
    choices: allStackOptions.map(s => ({
      title: s.title,
      value: s.value,
      selected: detectedStackSet.has(s.value),
    })),
    hint: chalk.gray("space select • a toggle all • enter confirm"),
    instructions: false,
  }, promptConfig);
  answers.stack = stackResponse.stack || [];

  // ═══════════════════════════════════════════════════════════════
  // STEP 4: AI Persona
  // ═══════════════════════════════════════════════════════════════
  showStep(4, totalSteps, "AI Persona");

  const personaResponse = await prompts({
    type: "select",
    name: "persona",
    message: chalk.white("What role should the AI take?"),
    choices: PERSONAS.map(p => ({
      title: p.title,
      value: p.value,
      description: chalk.gray(p.description),
    })),
    initial: 0,
    hint: chalk.gray("↑↓ navigate • enter select"),
  }, promptConfig);
  
  if (personaResponse.persona === "custom") {
    const customPersona = await prompts({
      type: "text",
      name: "value",
      message: chalk.white("Describe the custom persona:"),
      hint: chalk.gray("e.g., 'ML engineer focused on PyTorch and data pipelines'"),
    }, promptConfig);
    answers.persona = customPersona.value || "fullstack";
  } else {
    answers.persona = personaResponse.persona || "fullstack";
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 5: Boundaries
  // ═══════════════════════════════════════════════════════════════
  showStep(5, totalSteps, "AI Boundaries");

  const boundaryResponse = await prompts({
    type: "select",
    name: "boundaries",
    message: chalk.white("How much freedom should the AI have?"),
    choices: BOUNDARY_PRESETS.map(b => ({ 
      title: b.title, 
      value: b.value,
      description: chalk.gray(b.description),
    })),
    initial: 0,
    hint: chalk.gray("↑↓ navigate • enter select"),
  }, promptConfig);
  answers.boundaries = boundaryResponse.boundaries || "standard";

  // Show boundary details
  const selectedBoundary = BOUNDARY_PRESETS.find(b => b.value === answers.boundaries);
  if (selectedBoundary) {
    console.log();
    console.log(chalk.gray("  Always allowed: ") + chalk.green(selectedBoundary.always.slice(0, 2).join(", ")));
    console.log(chalk.gray("  Ask first:      ") + chalk.yellow(selectedBoundary.askFirst.slice(0, 2).join(", ")));
    console.log(chalk.gray("  Never:          ") + chalk.red(selectedBoundary.never.slice(0, 2).join(", ")));
  }

  // Commands from detection
  answers.commands = detected?.commands || {};

  return {
    name: answers.name as string,
    description: answers.description as string,
    stack: answers.stack as string[],
    platforms: answers.platforms as string[],
    persona: answers.persona as string,
    boundaries: answers.boundaries as "conservative" | "standard" | "permissive",
    commands: answers.commands as Record<string, string>,
  };
}
