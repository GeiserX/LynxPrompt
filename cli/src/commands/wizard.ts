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

// User tier levels
type UserTier = "free" | "pro" | "max" | "teams";

// Step tier requirements (matching web wizard exactly)
type StepTier = "basic" | "intermediate" | "advanced";

interface WizardStep {
  id: string;
  title: string;
  icon: string;
  tier: StepTier;
}

// All 11 wizard steps matching the web UI exactly
const WIZARD_STEPS: WizardStep[] = [
  { id: "format", title: "Output Format", icon: "📤", tier: "basic" },
  { id: "project", title: "Project Basics", icon: "✨", tier: "basic" },
  { id: "tech", title: "Tech Stack", icon: "💻", tier: "basic" },
  { id: "repo", title: "Repository Setup", icon: "🔀", tier: "basic" },
  { id: "commands", title: "Commands", icon: "📋", tier: "intermediate" },
  { id: "code_style", title: "Code Style", icon: "🪄", tier: "intermediate" },
  { id: "ai", title: "AI Behavior", icon: "🧠", tier: "basic" },
  { id: "boundaries", title: "Boundaries", icon: "🛡️", tier: "advanced" },
  { id: "testing", title: "Testing Strategy", icon: "🧪", tier: "advanced" },
  { id: "static", title: "Static Files", icon: "📄", tier: "advanced" },
  { id: "extra", title: "Final Details", icon: "💬", tier: "basic" },
];

// All supported platforms (matches web wizard - 16 total)
const ALL_PLATFORMS = [
  { id: "agents", name: "Universal (AGENTS.md)", file: "AGENTS.md", icon: "🌐", note: "Works with all AI-enabled IDEs" },
  { id: "cursor", name: "Cursor", file: ".cursor/rules/", icon: "⚡", note: "Native project rules format" },
  { id: "claude", name: "Claude Code", file: "CLAUDE.md", icon: "🧠", note: "Also works with Cursor" },
  { id: "copilot", name: "GitHub Copilot", file: ".github/copilot-instructions.md", icon: "🐙", note: "VS Code & JetBrains" },
  { id: "windsurf", name: "Windsurf", file: ".windsurfrules", icon: "🏄", note: "Codeium IDE" },
  { id: "zed", name: "Zed", file: ".zed/instructions.md", icon: "⚡", note: "Zed editor" },
  { id: "aider", name: "Aider", file: ".aider.conf.yml", icon: "🤖", note: "CLI AI pair programming" },
  { id: "cline", name: "Cline", file: ".clinerules", icon: "🔧", note: "VS Code extension" },
  { id: "continue", name: "Continue", file: ".continue/config.json", icon: "➡️", note: "Open-source autopilot" },
  { id: "cody", name: "Sourcegraph Cody", file: ".cody/config.json", icon: "🔍", note: "Context-aware AI" },
  { id: "amazonq", name: "Amazon Q", file: ".amazonq/rules/", icon: "📦", note: "AWS AI assistant" },
  { id: "tabnine", name: "Tabnine", file: ".tabnine.yaml", icon: "📝", note: "AI code completion" },
  { id: "supermaven", name: "Supermaven", file: ".supermaven/config.json", icon: "🦸", note: "Fast AI completions" },
  { id: "codegpt", name: "CodeGPT", file: ".codegpt/config.json", icon: "💬", note: "VS Code AI assistant" },
  { id: "void", name: "Void", file: ".void/config.json", icon: "🕳️", note: "Open-source Cursor alt" },
  { id: "goose", name: "Goose", file: ".goosehints", icon: "🪿", note: "Block AI agent" },
];

// Quick output format selection (single choice)
const OUTPUT_FORMATS = [
  { title: "🌐 AGENTS.md (Universal)", value: "agents", description: "Works with Claude, Copilot, Aider, Devin & more", recommended: true },
  { title: "⚡ Cursor", value: "cursor", description: ".cursor/rules/ native format" },
  { title: "🧠 Claude Code", value: "claude", description: "CLAUDE.md format" },
  { title: "🐙 GitHub Copilot", value: "copilot", description: ".github/copilot-instructions.md" },
  { title: "🏄 Windsurf", value: "windsurf", description: ".windsurfrules configuration" },
  { title: "📦 Multiple platforms...", value: "multiple", description: "Select from 16+ supported AI editors" },
];

// Languages
const LANGUAGES = [
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
  { title: "🔶 Kotlin", value: "kotlin" },
  { title: "⬛ C/C++", value: "cpp" },
];

// Frameworks
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

// Databases
const DATABASES = [
  { title: "🐘 PostgreSQL", value: "postgresql" },
  { title: "🐬 MySQL", value: "mysql" },
  { title: "🍃 MongoDB", value: "mongodb" },
  { title: "🔴 Redis", value: "redis" },
  { title: "📊 SQLite", value: "sqlite" },
  { title: "☁️  Supabase", value: "supabase" },
  { title: "🔥 Firebase", value: "firebase" },
  { title: "📂 Prisma", value: "prisma" },
];

// Repository hosts
const REPO_HOSTS = [
  { id: "github", label: "GitHub", icon: "🐙" },
  { id: "gitlab", label: "GitLab", icon: "🦊" },
  { id: "bitbucket", label: "Bitbucket", icon: "🪣" },
  { id: "gitea", label: "Gitea", icon: "🍵" },
  { id: "azure", label: "Azure DevOps", icon: "☁️" },
  { id: "other", label: "Other", icon: "📦" },
];

// Licenses
const LICENSES = [
  { id: "mit", label: "MIT" },
  { id: "apache-2.0", label: "Apache 2.0" },
  { id: "gpl-3.0", label: "GPL 3.0" },
  { id: "lgpl-3.0", label: "LGPL 3.0" },
  { id: "agpl-3.0", label: "AGPL 3.0" },
  { id: "bsd-3", label: "BSD 3-Clause" },
  { id: "mpl-2.0", label: "MPL 2.0" },
  { id: "unlicense", label: "Unlicense" },
  { id: "none", label: "None / Proprietary" },
];

// Common commands by category
const COMMON_COMMANDS = {
  build: [
    "npm run build", "pnpm build", "yarn build", "bun run build",
    "next build", "vite build", "tsc", "tsc --noEmit",
    "go build", "cargo build", "cargo build --release",
    "mvn package", "gradle build", "dotnet build",
    "docker build -t app .", "docker compose build",
  ],
  test: [
    "npm test", "pnpm test", "yarn test", "bun test",
    "vitest", "vitest run", "jest", "jest --coverage",
    "pytest", "pytest --cov", "go test ./...",
    "cargo test", "mvn test", "gradle test",
    "playwright test", "cypress run",
  ],
  lint: [
    "npm run lint", "pnpm lint", "eslint .", "eslint . --fix",
    "prettier --check .", "prettier --write .",
    "ruff check", "ruff format", "black .", "flake8",
    "golangci-lint run", "cargo clippy", "rubocop",
  ],
  dev: [
    "npm run dev", "pnpm dev", "yarn dev", "bun run dev",
    "next dev", "vite", "vite dev",
    "uvicorn main:app --reload", "flask run", "rails server",
    "go run .", "cargo run", "dotnet run",
  ],
};

// Naming conventions
const NAMING_CONVENTIONS = [
  { id: "language_default", label: "Follow language conventions", desc: "Use idiomatic style" },
  { id: "camelCase", label: "camelCase", desc: "JavaScript, TypeScript, Java" },
  { id: "snake_case", label: "snake_case", desc: "Python, Ruby, Rust, Go" },
  { id: "PascalCase", label: "PascalCase", desc: "C#, .NET classes" },
  { id: "kebab-case", label: "kebab-case", desc: "CSS, HTML, URLs" },
];

// Error handling patterns
const ERROR_PATTERNS = [
  { id: "try_catch", label: "try/catch blocks" },
  { id: "result_types", label: "Result/Either types" },
  { id: "error_codes", label: "Error codes" },
  { id: "exceptions", label: "Custom exceptions" },
  { id: "other", label: "Other" },
];

// AI Behavior rules
const AI_BEHAVIOR_RULES = [
  { id: "explain_changes", label: "Explain changes before making them", recommended: true },
  { id: "preserve_style", label: "Preserve existing code style", recommended: true },
  { id: "minimal_changes", label: "Make minimal, focused changes", recommended: true },
  { id: "no_comments", label: "Avoid adding unnecessary comments", recommended: false },
  { id: "prefer_simple", label: "Prefer simpler solutions", recommended: true },
  { id: "test_first", label: "Write tests before implementation", recommended: false },
  { id: "no_console", label: "Remove console.log/print before committing", recommended: false },
  { id: "type_strict", label: "Be strict with types (no any/Any)", recommended: false },
];

// Important files to read
const IMPORTANT_FILES = [
  { id: "readme", label: "README.md", icon: "📖" },
  { id: "package", label: "package.json / pyproject.toml", icon: "📦" },
  { id: "tsconfig", label: "tsconfig.json / config files", icon: "⚙️" },
  { id: "architecture", label: "ARCHITECTURE.md", icon: "🏗️" },
  { id: "contributing", label: "CONTRIBUTING.md", icon: "🤝" },
];

// Boundary presets
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

// Detailed boundary options
const BOUNDARY_OPTIONS = [
  "Delete files",
  "Create new files",
  "Rename/move files",
  "Rewrite large sections",
  "Refactor architecture",
  "Change dependencies",
  "Modify database schema",
  "Update API contracts",
  "Touch CI pipelines",
  "Modify Docker config",
  "Change environment vars",
  "Update docs automatically",
  "Edit README",
  "Handle secrets/credentials",
  "Modify auth logic",
  "Delete failing tests",
  "Skip tests temporarily",
];

// Testing frameworks
const TEST_FRAMEWORKS = [
  "jest", "vitest", "mocha", "ava", "tap",
  "pytest", "unittest", "nose2",
  "go test", "testify",
  "cargo test", "rstest",
  "junit", "testng", "spock",
  "rspec", "minitest",
  "phpunit", "pest",
  "playwright", "cypress", "puppeteer", "selenium",
];

// Test levels
const TEST_LEVELS = [
  { id: "smoke", label: "Smoke", desc: "Quick sanity checks" },
  { id: "unit", label: "Unit", desc: "Individual functions/components" },
  { id: "integration", label: "Integration", desc: "Component interactions" },
  { id: "e2e", label: "E2E", desc: "Full user flows" },
];

// Project types
const PROJECT_TYPES = [
  { id: "work", label: "Work", icon: "💼", description: "Professional/enterprise project" },
  { id: "leisure", label: "Leisure", icon: "🎮", description: "Personal/hobby project" },
  { id: "opensource", label: "Open Source", icon: "🌍", description: "Community-driven project" },
  { id: "learning", label: "Learning", icon: "📚", description: "Educational/experimental" },
];

// Check if user tier can access a step
function canAccessTier(userTier: UserTier, requiredTier: StepTier): boolean {
  const tierLevels = { free: 0, pro: 1, max: 2, teams: 2 };
  const requiredLevels = { basic: 0, intermediate: 1, advanced: 2 };
  return tierLevels[userTier] >= requiredLevels[requiredTier];
}

// Get tier badge
function getTierBadge(tier: StepTier): { label: string; color: typeof chalk.cyan } | null {
  switch (tier) {
    case "intermediate":
      return { label: "PRO", color: chalk.cyan };
    case "advanced":
      return { label: "MAX", color: chalk.magenta };
    default:
      return null;
  }
}

// Get available steps for user tier
function getAvailableSteps(userTier: UserTier): WizardStep[] {
  return WIZARD_STEPS.filter(step => canAccessTier(userTier, step.tier));
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

// Step indicator with tier info
function showStep(current: number, step: WizardStep, userTier: UserTier): void {
  const availableSteps = getAvailableSteps(userTier);
  const total = availableSteps.length;
  const progress = "●".repeat(current) + "○".repeat(total - current);
  const badge = getTierBadge(step.tier);
  
  console.log();
  let stepLine = chalk.cyan(`  ${progress}  Step ${current}/${total}: ${step.icon} ${step.title}`);
  if (badge) {
    stepLine += " " + badge.color(`[${badge.label}]`);
  }
  console.log(stepLine);
  console.log();
}

// Show wizard steps overview with tier indicators
function showWizardOverview(userTier: UserTier): void {
  console.log(chalk.bold("  📋 Wizard Steps Overview:"));
  console.log();
  
  let stepNum = 1;
  for (const step of WIZARD_STEPS) {
    const canAccess = canAccessTier(userTier, step.tier);
    const badge = getTierBadge(step.tier);
    
    if (canAccess) {
      let line = chalk.green(`    ${stepNum.toString().padStart(2)}. ✓ ${step.icon} ${step.title}`);
      if (badge) {
        line += " " + badge.color(`[${badge.label}]`);
      }
      console.log(line);
      stepNum++;
    } else {
      // Show locked steps with visual distinction
      let line = chalk.gray(`     ─  🔒 ${step.icon} ${step.title}`);
      if (badge) {
        line += " " + badge.color.dim(`[${badge.label}]`);
      }
      console.log(line);
    }
  }
  console.log();
}

// Configure prompts to handle cancellation
const promptConfig = {
  onCancel: () => {
    console.log(chalk.yellow("\n  Cancelled. Run 'lynxp wizard' anytime to restart.\n"));
    process.exit(0);
  },
};

export async function wizardCommand(options: WizardOptions): Promise<void> {
  console.log();
  console.log(chalk.cyan.bold("  🐱 LynxPrompt Wizard"));
  console.log(chalk.gray("     Generate AI IDE configuration in seconds"));
  console.log();

  // Check authentication and determine tier
  const authenticated = isAuthenticated();
  const user = getUser();
  const userPlanRaw = user?.plan?.toLowerCase() || "free";
  const userTier: UserTier = ["pro", "max", "teams"].includes(userPlanRaw) 
    ? (userPlanRaw as UserTier) 
    : "free";
  const userPlanDisplay = user?.plan?.toUpperCase() || "FREE";
  
  if (!authenticated) {
    // Show login notice for guests (box width: 55 inner chars)
    const W = 55;
    const y = chalk.yellow;
    const pad = (s: string, len: number) => s + " ".repeat(Math.max(0, len - s.length));
    
    console.log(y("┌" + "─".repeat(W) + "┐"));
    console.log(y("│") + pad(" 💡 Log in for full wizard features:", W - 1) + y("│"));
    console.log(y("│") + " ".repeat(W) + y("│"));
    console.log(y("│") + pad("    • Commands & Code Style [PRO]", W) + y("│"));
    console.log(y("│") + pad("    • Boundaries, Testing, Static Files [MAX]", W) + y("│"));
    console.log(y("│") + pad("    • Push configs to cloud (lynxp push)", W) + y("│"));
    console.log(y("│") + pad("    • Sync across devices (lynxp sync)", W) + y("│"));
    console.log(y("│") + " ".repeat(W) + y("│"));
    console.log(y("│") + pad("    Run: " + chalk.cyan("lynxp login"), W + 10) + y("│")); // +10 for chalk codes
    console.log(y("└" + "─".repeat(W) + "┘"));
    console.log();
  } else {
    // Show logged-in status with plan
    const planEmoji = userTier === "teams" ? "👥" : userTier === "max" ? "🚀" : userTier === "pro" ? "⚡" : "🆓";
    console.log(chalk.green(`  ✓ Logged in as ${chalk.bold(user?.name || user?.email)} ${planEmoji} ${chalk.gray(userPlanDisplay)}`));
    console.log();
  }

  // Show wizard steps overview
  showWizardOverview(userTier);
  
  // Count accessible steps
  const accessibleSteps = getAvailableSteps(userTier);
  const lockedSteps = WIZARD_STEPS.length - accessibleSteps.length;
  
  if (lockedSteps > 0) {
    console.log(chalk.gray(`  ${lockedSteps} step${lockedSteps > 1 ? 's' : ''} locked. Upgrade at ${chalk.cyan("https://lynxprompt.com/pricing")}`));
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
    let platforms: string[];
    if (options.format) {
      platforms = options.format.split(",").map(f => f.trim());
    } else if (options.platforms) {
      platforms = options.platforms.split(",").map(p => p.trim());
    } else {
      platforms = ["agents"];
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
    config = await runInteractiveWizard(options, detected, userTier);
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
  detected: Awaited<ReturnType<typeof detectProject>> | null,
  userTier: UserTier
): Promise<GenerateOptions> {
  const answers: Record<string, unknown> = {};
  const availableSteps = getAvailableSteps(userTier);
  let currentStepNum = 0;

  // Helper to get current step info and increment counter
  const getCurrentStep = (stepId: string) => {
    const step = availableSteps.find(s => s.id === stepId);
    if (step) {
      currentStepNum++;
      return step;
    }
    return null;
  };

  // ═══════════════════════════════════════════════════════════════
  // STEP 1: Output Format (basic - all users)
  // ═══════════════════════════════════════════════════════════════
  const formatStep = getCurrentStep("format")!;
  showStep(currentStepNum, formatStep, userTier);
  
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
      console.log(chalk.gray("  Select the AI editors you want to generate config for:"));
      console.log();
      const platformResponse = await prompts({
        type: "multiselect",
        name: "platforms",
        message: chalk.white("Select AI editors (16 supported):"),
        choices: ALL_PLATFORMS.map(p => ({ 
          title: `${p.icon} ${p.name}`,
          value: p.id,
          description: chalk.gray(p.note),
        })),
        hint: chalk.gray("space select • a toggle all • enter confirm"),
        min: 1,
        instructions: false,
      }, promptConfig);
      platforms = platformResponse.platforms || ["agents"];
      console.log(chalk.green(`  ✓ Selected ${platforms.length} platform${platforms.length === 1 ? "" : "s"}`));
    } else {
      platforms = [formatResponse.format || "agents"];
    }
  }
  answers.platforms = platforms;

  // ═══════════════════════════════════════════════════════════════
  // STEP 2: Project Basics (basic - all users)
  // ═══════════════════════════════════════════════════════════════
  const projectStep = getCurrentStep("project")!;
  showStep(currentStepNum, projectStep, userTier);

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

  // Project type
  const typeResponse = await prompts({
    type: "select",
    name: "projectType",
    message: chalk.white("Project type:"),
    choices: PROJECT_TYPES.map(t => ({
      title: `${t.icon} ${t.label}`,
      value: t.id,
      description: chalk.gray(t.description),
    })),
    initial: 0,
  }, promptConfig);
  answers.projectType = typeResponse.projectType || "work";

  // ═══════════════════════════════════════════════════════════════
  // STEP 3: Tech Stack (basic - all users)
  // ═══════════════════════════════════════════════════════════════
  const techStep = getCurrentStep("tech")!;
  showStep(currentStepNum, techStep, userTier);

  const allStackOptions = [...LANGUAGES, ...FRAMEWORKS, ...DATABASES];
  const detectedStackSet = new Set(detected?.stack || []);
  
  if (detectedStackSet.size > 0) {
    console.log(chalk.gray(`  Auto-selected: ${detected?.stack?.join(", ")}`));
    console.log();
  }

  const stackResponse = await prompts({
    type: "multiselect",
    name: "stack",
    message: chalk.white("Languages, frameworks & databases:"),
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
  // STEP 4: Repository Setup (basic - all users)
  // ═══════════════════════════════════════════════════════════════
  const repoStep = getCurrentStep("repo")!;
  showStep(currentStepNum, repoStep, userTier);

  const repoHostResponse = await prompts({
    type: "select",
    name: "repoHost",
    message: chalk.white("Repository host:"),
    choices: REPO_HOSTS.map(h => ({
      title: `${h.icon} ${h.label}`,
      value: h.id,
    })),
    initial: 0,
  }, promptConfig);
  answers.repoHost = repoHostResponse.repoHost || "github";

  const visibilityResponse = await prompts({
    type: "toggle",
    name: "isPublic",
    message: chalk.white("Public repository?"),
    initial: false,
    active: "Yes",
    inactive: "No",
  }, promptConfig);
  answers.isPublic = visibilityResponse.isPublic || false;

  const licenseResponse = await prompts({
    type: "select",
    name: "license",
    message: chalk.white("License:"),
    choices: LICENSES.map(l => ({
      title: l.label,
      value: l.id,
    })),
    initial: 0,
  }, promptConfig);
  answers.license = licenseResponse.license || "mit";

  const conventionalResponse = await prompts({
    type: "toggle",
    name: "conventionalCommits",
    message: chalk.white("Use Conventional Commits?"),
    initial: true,
    active: "Yes",
    inactive: "No",
  }, promptConfig);
  answers.conventionalCommits = conventionalResponse.conventionalCommits ?? true;

  // ═══════════════════════════════════════════════════════════════
  // STEP 5: Commands (intermediate - Pro+)
  // ═══════════════════════════════════════════════════════════════
  if (canAccessTier(userTier, "intermediate")) {
    const commandsStep = getCurrentStep("commands")!;
    showStep(currentStepNum, commandsStep, userTier);

    console.log(chalk.gray("  Select common commands for your project:"));
    console.log();

    // Build commands
    const buildResponse = await prompts({
      type: "multiselect",
      name: "build",
      message: chalk.white("Build commands:"),
      choices: COMMON_COMMANDS.build.slice(0, 12).map(c => ({
        title: chalk.cyan(c),
        value: c,
        selected: detected?.commands?.build === c,
      })),
      hint: chalk.gray("space select • enter confirm"),
      instructions: false,
    }, promptConfig);

    // Test commands
    const testResponse = await prompts({
      type: "multiselect",
      name: "test",
      message: chalk.white("Test commands:"),
      choices: COMMON_COMMANDS.test.slice(0, 12).map(c => ({
        title: chalk.yellow(c),
        value: c,
        selected: detected?.commands?.test === c,
      })),
      hint: chalk.gray("space select • enter confirm"),
      instructions: false,
    }, promptConfig);

    // Lint commands
    const lintResponse = await prompts({
      type: "multiselect",
      name: "lint",
      message: chalk.white("Lint/format commands:"),
      choices: COMMON_COMMANDS.lint.slice(0, 12).map(c => ({
        title: chalk.green(c),
        value: c,
        selected: detected?.commands?.lint === c,
      })),
      hint: chalk.gray("space select • enter confirm"),
      instructions: false,
    }, promptConfig);

    // Dev commands
    const devResponse = await prompts({
      type: "multiselect",
      name: "dev",
      message: chalk.white("Dev server commands:"),
      choices: COMMON_COMMANDS.dev.slice(0, 12).map(c => ({
        title: chalk.magenta(c),
        value: c,
        selected: detected?.commands?.dev === c,
      })),
      hint: chalk.gray("space select • enter confirm"),
      instructions: false,
    }, promptConfig);

    answers.commands = {
      build: buildResponse.build || [],
      test: testResponse.test || [],
      lint: lintResponse.lint || [],
      dev: devResponse.dev || [],
    };

    // Custom command
    const customCmdResponse = await prompts({
      type: "text",
      name: "custom",
      message: chalk.white("Additional custom command (optional):"),
      hint: chalk.gray("e.g., npm run migrate, make deploy"),
    }, promptConfig);
    if (customCmdResponse.custom) {
      (answers.commands as Record<string, unknown>).custom = customCmdResponse.custom;
    }
  } else {
    answers.commands = detected?.commands || {};
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 6: Code Style (intermediate - Pro+)
  // ═══════════════════════════════════════════════════════════════
  if (canAccessTier(userTier, "intermediate")) {
    const styleStep = getCurrentStep("code_style")!;
    showStep(currentStepNum, styleStep, userTier);

    const namingResponse = await prompts({
      type: "select",
      name: "naming",
      message: chalk.white("Naming convention:"),
      choices: NAMING_CONVENTIONS.map(n => ({
        title: n.label,
        value: n.id,
        description: chalk.gray(n.desc),
      })),
      initial: 0,
    }, promptConfig);
    answers.namingConvention = namingResponse.naming || "language_default";

    const errorResponse = await prompts({
      type: "select",
      name: "errorHandling",
      message: chalk.white("Error handling pattern:"),
      choices: ERROR_PATTERNS.map(e => ({
        title: e.label,
        value: e.id,
      })),
      initial: 0,
    }, promptConfig);
    answers.errorHandling = errorResponse.errorHandling || "try_catch";

    const styleNotesResponse = await prompts({
      type: "text",
      name: "styleNotes",
      message: chalk.white("Additional style notes (optional):"),
      hint: chalk.gray("e.g., prefer named exports, max line length 100"),
    }, promptConfig);
    answers.styleNotes = styleNotesResponse.styleNotes || "";
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 7: AI Behavior (basic - all users)
  // ═══════════════════════════════════════════════════════════════
  const aiStep = getCurrentStep("ai")!;
  showStep(currentStepNum, aiStep, userTier);

  const aiBehaviorResponse = await prompts({
    type: "multiselect",
    name: "aiBehavior",
    message: chalk.white("AI behavior rules:"),
    choices: AI_BEHAVIOR_RULES.map(r => ({
      title: r.recommended 
        ? `${r.label} ${chalk.green("★")}`
        : r.label,
      value: r.id,
      selected: r.recommended,
    })),
    hint: chalk.gray("space select • enter confirm"),
    instructions: false,
  }, promptConfig);
  answers.aiBehavior = aiBehaviorResponse.aiBehavior || [];

  const importantFilesResponse = await prompts({
    type: "multiselect",
    name: "importantFiles",
    message: chalk.white("Important files AI should read:"),
    choices: IMPORTANT_FILES.map(f => ({
      title: `${f.icon} ${f.label}`,
      value: f.id,
      selected: f.id === "readme" || f.id === "package",
    })),
    hint: chalk.gray("space select • enter confirm"),
    instructions: false,
  }, promptConfig);
  answers.importantFiles = importantFilesResponse.importantFiles || [];

  const selfImproveResponse = await prompts({
    type: "toggle",
    name: "selfImprove",
    message: chalk.white("Enable self-improving blueprint?"),
    initial: false,
    active: "Yes",
    inactive: "No",
  }, promptConfig);
  answers.selfImprove = selfImproveResponse.selfImprove || false;

  // ═══════════════════════════════════════════════════════════════
  // STEP 8: Boundaries (advanced - Max+)
  // ═══════════════════════════════════════════════════════════════
  if (canAccessTier(userTier, "advanced")) {
    const boundariesStep = getCurrentStep("boundaries")!;
    showStep(currentStepNum, boundariesStep, userTier);

    const presetResponse = await prompts({
      type: "select",
      name: "boundaryPreset",
      message: chalk.white("Boundary preset:"),
      choices: BOUNDARY_PRESETS.map(b => ({
        title: b.title,
        value: b.value,
        description: chalk.gray(b.description),
      })),
      initial: 0,
    }, promptConfig);
    answers.boundaries = presetResponse.boundaryPreset || "standard";

    const selectedPreset = BOUNDARY_PRESETS.find(b => b.value === answers.boundaries);
    if (selectedPreset) {
      console.log();
      console.log(chalk.gray("  Preset details:"));
      console.log(chalk.green(`    ✓ Always: ${selectedPreset.always.slice(0, 3).join(", ")}`));
      console.log(chalk.yellow(`    ? Ask: ${selectedPreset.askFirst.slice(0, 2).join(", ")}`));
      console.log(chalk.red(`    ✗ Never: ${selectedPreset.never.slice(0, 2).join(", ")}`));
    }

    // Customize boundaries?
    const customizeResponse = await prompts({
      type: "toggle",
      name: "customize",
      message: chalk.white("Customize specific boundaries?"),
      initial: false,
      active: "Yes",
      inactive: "No",
    }, promptConfig);

    if (customizeResponse.customize) {
      console.log();
      console.log(chalk.gray("  Select actions AI should NEVER do:"));
      const neverResponse = await prompts({
        type: "multiselect",
        name: "never",
        message: chalk.white("Never allow:"),
        choices: BOUNDARY_OPTIONS.map(o => ({
          title: chalk.red(o),
          value: o,
          selected: selectedPreset?.never.includes(o),
        })),
        instructions: false,
      }, promptConfig);
      answers.boundaryNever = neverResponse.never || [];

      console.log(chalk.gray("  Select actions AI should ASK before doing:"));
      const askResponse = await prompts({
        type: "multiselect",
        name: "ask",
        message: chalk.white("Ask first:"),
        choices: BOUNDARY_OPTIONS
          .filter(o => !(answers.boundaryNever as string[])?.includes(o))
          .map(o => ({
            title: chalk.yellow(o),
            value: o,
            selected: selectedPreset?.askFirst.includes(o),
          })),
        instructions: false,
      }, promptConfig);
      answers.boundaryAsk = askResponse.ask || [];
    }
  } else {
    answers.boundaries = options.boundaries || "standard";
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 9: Testing Strategy (advanced - Max+)
  // ═══════════════════════════════════════════════════════════════
  if (canAccessTier(userTier, "advanced")) {
    const testingStep = getCurrentStep("testing")!;
    showStep(currentStepNum, testingStep, userTier);

    const testLevelsResponse = await prompts({
      type: "multiselect",
      name: "testLevels",
      message: chalk.white("Test levels:"),
      choices: TEST_LEVELS.map(l => ({
        title: `${l.label} - ${chalk.gray(l.desc)}`,
        value: l.id,
        selected: l.id === "unit" || l.id === "integration",
      })),
      instructions: false,
    }, promptConfig);
    answers.testLevels = testLevelsResponse.testLevels || [];

    // Detect test framework from stack
    const detectedFrameworks = (answers.stack as string[])?.includes("typescript") || 
                               (answers.stack as string[])?.includes("javascript")
      ? ["jest", "vitest"]
      : (answers.stack as string[])?.includes("python")
        ? ["pytest"]
        : [];

    const testFrameworkResponse = await prompts({
      type: "multiselect",
      name: "testFrameworks",
      message: chalk.white("Testing frameworks:"),
      choices: TEST_FRAMEWORKS.slice(0, 16).map(f => ({
        title: f,
        value: f,
        selected: detectedFrameworks.includes(f),
      })),
      hint: chalk.gray("space select • enter confirm"),
      instructions: false,
    }, promptConfig);
    answers.testFrameworks = testFrameworkResponse.testFrameworks || [];

    const coverageResponse = await prompts({
      type: "number",
      name: "coverage",
      message: chalk.white("Target code coverage (%):"),
      initial: 80,
      min: 0,
      max: 100,
    }, promptConfig);
    answers.coverageTarget = coverageResponse.coverage ?? 80;

    const testNotesResponse = await prompts({
      type: "text",
      name: "testNotes",
      message: chalk.white("Testing notes (optional):"),
      hint: chalk.gray("e.g., run e2e on main only, use msw for mocking"),
    }, promptConfig);
    answers.testNotes = testNotesResponse.testNotes || "";
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 10: Static Files (advanced - Max+)
  // ═══════════════════════════════════════════════════════════════
  if (canAccessTier(userTier, "advanced")) {
    const staticStep = getCurrentStep("static")!;
    showStep(currentStepNum, staticStep, userTier);

    console.log(chalk.gray("  Generate additional project files:"));
    console.log();

    const staticFilesResponse = await prompts({
      type: "multiselect",
      name: "staticFiles",
      message: chalk.white("Include static files:"),
      choices: [
        { title: "📝 .editorconfig", value: "editorconfig", description: chalk.gray("Consistent code formatting") },
        { title: "🤝 CONTRIBUTING.md", value: "contributing", description: chalk.gray("Contributor guidelines") },
        { title: "📜 CODE_OF_CONDUCT.md", value: "codeOfConduct", description: chalk.gray("Community standards") },
        { title: "🔒 SECURITY.md", value: "security", description: chalk.gray("Vulnerability reporting") },
        { title: "🗺️  ROADMAP.md", value: "roadmap", description: chalk.gray("Project roadmap") },
        { title: "📋 .gitignore", value: "gitignore", description: chalk.gray("Git ignore patterns"), selected: true },
      ],
      hint: chalk.gray("space select • enter confirm"),
      instructions: false,
    }, promptConfig);
    answers.staticFiles = staticFilesResponse.staticFiles || [];

    // If GitHub + public, offer FUNDING.yml
    if (answers.repoHost === "github" && answers.isPublic) {
      const fundingResponse = await prompts({
        type: "toggle",
        name: "funding",
        message: chalk.white("Generate FUNDING.yml for GitHub Sponsors?"),
        initial: false,
        active: "Yes",
        inactive: "No",
      }, promptConfig);
      answers.includeFunding = fundingResponse.funding || false;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 11: Final Details / Extra (basic - all users)
  // ═══════════════════════════════════════════════════════════════
  const extraStep = getCurrentStep("extra")!;
  showStep(currentStepNum, extraStep, userTier);

  // AI persona
  const personaResponse = await prompts({
    type: "select",
    name: "persona",
    message: chalk.white("AI assistant persona:"),
    choices: [
      { title: "🧑‍💻 Full-Stack Developer", value: "fullstack", description: chalk.gray("Complete application development") },
      { title: "⚙️  Backend Developer", value: "backend", description: chalk.gray("APIs, databases, services") },
      { title: "🎨 Frontend Developer", value: "frontend", description: chalk.gray("UI, components, styling") },
      { title: "🚀 DevOps Engineer", value: "devops", description: chalk.gray("Infrastructure, CI/CD") },
      { title: "📊 Data Engineer", value: "data", description: chalk.gray("Pipelines, ETL, analytics") },
      { title: "🔒 Security Engineer", value: "security", description: chalk.gray("Secure code, auditing") },
      { title: "✏️  Custom...", value: "custom", description: chalk.gray("Define your own") },
    ],
    initial: 0,
  }, promptConfig);
  
  if (personaResponse.persona === "custom") {
    const customPersona = await prompts({
      type: "text",
      name: "value",
      message: chalk.white("Describe the custom persona:"),
      hint: chalk.gray("e.g., 'ML engineer focused on PyTorch'"),
    }, promptConfig);
    answers.persona = customPersona.value || "fullstack";
  } else {
    answers.persona = personaResponse.persona || "fullstack";
  }

  // Anything else
  const extraNotesResponse = await prompts({
    type: "text",
    name: "extraNotes",
    message: chalk.white("Anything else AI should know? (optional):"),
    hint: chalk.gray("Special requirements, gotchas, team conventions..."),
  }, promptConfig);
  answers.extraNotes = extraNotesResponse.extraNotes || "";

  // ═══════════════════════════════════════════════════════════════
  // BUILD FINAL CONFIG
  // ═══════════════════════════════════════════════════════════════
  console.log();
  console.log(chalk.green("  ✅ All steps completed!"));
  console.log();

  return {
    name: answers.name as string,
    description: answers.description as string,
    stack: answers.stack as string[],
    platforms: answers.platforms as string[],
    persona: answers.persona as string,
    boundaries: answers.boundaries as "conservative" | "standard" | "permissive",
    commands: typeof answers.commands === "object" ? answers.commands as Record<string, string> : (detected?.commands || {}),
    // Extended config for Pro/Max users
    projectType: answers.projectType as string,
    repoHost: answers.repoHost as string,
    isPublic: answers.isPublic as boolean,
    license: answers.license as string,
    conventionalCommits: answers.conventionalCommits as boolean,
    namingConvention: answers.namingConvention as string,
    errorHandling: answers.errorHandling as string,
    styleNotes: answers.styleNotes as string,
    aiBehavior: answers.aiBehavior as string[],
    importantFiles: answers.importantFiles as string[],
    selfImprove: answers.selfImprove as boolean,
    boundaryNever: answers.boundaryNever as string[],
    boundaryAsk: answers.boundaryAsk as string[],
    testLevels: answers.testLevels as string[],
    testFrameworks: answers.testFrameworks as string[],
    coverageTarget: answers.coverageTarget as number,
    testNotes: answers.testNotes as string,
    staticFiles: answers.staticFiles as string[],
    includeFunding: answers.includeFunding as boolean,
    extraNotes: answers.extraNotes as string,
  };
}
