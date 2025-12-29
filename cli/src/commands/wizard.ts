import chalk from "chalk";
import prompts from "prompts";
import ora from "ora";
import { writeFile, mkdir, access } from "fs/promises";
import { join, dirname } from "path";
import { detectProject } from "../utils/detect.js";
import { generateConfig, GenerateOptions } from "../utils/generator.js";

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

// Output format options - simplified for most users
const OUTPUT_FORMATS = [
  {
    title: "AGENTS.md (Universal)",
    value: "agents",
    description: "Works with Claude Code, GitHub Copilot, Aider, and most AI editors",
    recommended: true,
  },
  {
    title: "Cursor (.cursor/rules/)",
    value: "cursor",
    description: "Cursor IDE with MDC format",
  },
  {
    title: "Multiple formats",
    value: "multiple",
    description: "Select multiple AI editors to generate for",
  },
];

// Tech stack options
const TECH_STACKS = [
  { title: "TypeScript", value: "typescript" },
  { title: "JavaScript", value: "javascript" },
  { title: "Python", value: "python" },
  { title: "Go", value: "go" },
  { title: "Rust", value: "rust" },
  { title: "Java", value: "java" },
  { title: "C#/.NET", value: "csharp" },
  { title: "Ruby", value: "ruby" },
  { title: "PHP", value: "php" },
  { title: "Swift", value: "swift" },
];

const FRAMEWORKS = [
  { title: "React", value: "react" },
  { title: "Next.js", value: "nextjs" },
  { title: "Vue.js", value: "vue" },
  { title: "Angular", value: "angular" },
  { title: "Svelte", value: "svelte" },
  { title: "Express", value: "express" },
  { title: "FastAPI", value: "fastapi" },
  { title: "Django", value: "django" },
  { title: "Flask", value: "flask" },
  { title: "Spring Boot", value: "spring" },
  { title: "Rails", value: "rails" },
  { title: "Laravel", value: "laravel" },
];

// Platform options (for multiple format selection)
const PLATFORMS = [
  { title: "AGENTS.md (Universal)", value: "agents", filename: "AGENTS.md" },
  { title: "Cursor (.cursor/rules/)", value: "cursor", filename: ".cursor/rules/project.mdc" },
  { title: "Claude Code (CLAUDE.md)", value: "claude", filename: "CLAUDE.md" },
  { title: "GitHub Copilot", value: "copilot", filename: ".github/copilot-instructions.md" },
  { title: "Windsurf (.windsurfrules)", value: "windsurf", filename: ".windsurfrules" },
  { title: "Zed", value: "zed", filename: ".zed/instructions.md" },
];

// Persona options
const PERSONAS = [
  { title: "Full-Stack Developer - Complete application setups", value: "fullstack" },
  { title: "Backend Developer - APIs, databases, microservices", value: "backend" },
  { title: "Frontend Developer - UI, components, styling", value: "frontend" },
  { title: "DevOps Engineer - Infrastructure, CI/CD, containers", value: "devops" },
  { title: "Data Engineer - Pipelines, ETL, databases", value: "data" },
  { title: "Security Engineer - Secure code, vulnerabilities", value: "security" },
  { title: "Custom...", value: "custom" },
];

// Boundary presets
const BOUNDARY_PRESETS = [
  {
    title: "Standard - Balance of freedom and safety (recommended)",
    value: "standard",
    always: ["Read any file", "Modify files in src/", "Run build/test/lint", "Create test files"],
    askFirst: ["Add new dependencies", "Modify config files", "Create new modules"],
    never: ["Delete production data", "Modify .env secrets", "Force push"],
  },
  {
    title: "Conservative - Ask before most changes",
    value: "conservative",
    always: ["Read any file", "Run lint/format commands"],
    askFirst: ["Modify any file", "Add dependencies", "Create files", "Run tests"],
    never: ["Delete files", "Modify .env", "Push to git"],
  },
  {
    title: "Permissive - AI can modify freely within src/",
    value: "permissive",
    always: ["Modify any file in src/", "Run any script", "Add dependencies", "Create files"],
    askFirst: ["Modify root configs", "Delete directories"],
    never: ["Modify .env", "Access external APIs without confirmation"],
  },
];

export async function wizardCommand(options: WizardOptions): Promise<void> {
  console.log();
  console.log(chalk.cyan("🐱 LynxPrompt Wizard"));
  console.log(chalk.gray("Generate AI IDE configuration in seconds"));
  console.log();

  // Try to detect project info
  const detected = await detectProject(process.cwd());
  
  if (detected) {
    console.log(chalk.green("✓ Detected project:"));
    if (detected.name) console.log(chalk.gray(`  Name: ${detected.name}`));
    if (detected.stack.length > 0) console.log(chalk.gray(`  Stack: ${detected.stack.join(", ")}`));
    if (detected.packageManager) console.log(chalk.gray(`  Package manager: ${detected.packageManager}`));
    if (detected.commands.build) console.log(chalk.gray(`  Build: ${detected.commands.build}`));
    if (detected.commands.test) console.log(chalk.gray(`  Test: ${detected.commands.test}`));
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
    console.log(chalk.green("✅ Generated:"));
    
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
          console.log(chalk.yellow(`   Skipped: ${filename}`));
          continue;
        }
      }

      // Create directory if needed
      const dir = dirname(outputPath);
      if (dir !== ".") {
        await mkdir(dir, { recursive: true });
      }

      await writeFile(outputPath, content, "utf-8");
      console.log(`   ${chalk.cyan(filename)}`);
    }

    console.log();
    console.log(chalk.gray("Your AI assistant will now follow these instructions."));
    console.log();
    console.log(chalk.gray("Tips:"));
    console.log(chalk.gray("  • Edit the generated file anytime to customize rules"));
    console.log(chalk.gray("  • Run 'lynxp wizard' again to regenerate"));
    console.log(chalk.gray("  • Run 'lynxp check' to validate your configuration"));
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

  // Step 1: Output format (simplified - most important decision first)
  let platforms: string[];
  
  if (options.format) {
    // Format provided via flag
    platforms = options.format.split(",").map(f => f.trim());
  } else {
    const formatResponse = await prompts({
      type: "select",
      name: "format",
      message: "Select output format:",
      choices: OUTPUT_FORMATS.map(f => ({
        title: f.recommended ? `${f.title} ${chalk.green("(recommended)")}` : f.title,
        value: f.value,
        description: f.description,
      })),
      initial: 0, // AGENTS.md is default
    });

    if (formatResponse.format === "multiple") {
      // Show multi-select for platforms
      const platformResponse = await prompts({
        type: "multiselect",
        name: "platforms",
        message: "Select AI editors:",
        choices: PLATFORMS.map(p => ({ title: p.title, value: p.value })),
        hint: "- Space to select, Enter to confirm",
        min: 1,
      });
      platforms = platformResponse.platforms || ["agents"];
    } else {
      platforms = [formatResponse.format || "agents"];
    }
  }
  answers.platforms = platforms;

  // Step 2: Project name
  const nameResponse = await prompts({
    type: "text",
    name: "name",
    message: "Project name:",
    initial: options.name || detected?.name || "my-project",
  });
  answers.name = nameResponse.name || "my-project";

  // Step 3: Quick description (optional)
  const descResponse = await prompts({
    type: "text",
    name: "description",
    message: "Brief description (optional):",
    initial: options.description || "",
  });
  answers.description = descResponse.description || "";

  // Step 4: Tech stack (pre-select detected)
  const allStackOptions = [...TECH_STACKS, ...FRAMEWORKS];
  const detectedStackSet = new Set(detected?.stack || []);
  
  const stackResponse = await prompts({
    type: "multiselect",
    name: "stack",
    message: "Tech stack:",
    choices: allStackOptions.map(s => ({
      title: s.title,
      value: s.value,
      selected: detectedStackSet.has(s.value),
    })),
    hint: "- Space to select, Enter to confirm",
  });
  answers.stack = stackResponse.stack || [];

  // Step 5: Persona (simplified - fullstack is default)
  const personaResponse = await prompts({
    type: "select",
    name: "persona",
    message: "AI persona:",
    choices: PERSONAS,
    initial: 0, // Full-stack by default
  });
  
  if (personaResponse.persona === "custom") {
    const customPersona = await prompts({
      type: "text",
      name: "value",
      message: "Describe the custom persona:",
    });
    answers.persona = customPersona.value || "fullstack";
  } else {
    answers.persona = personaResponse.persona || "fullstack";
  }

  // Step 6: Boundaries (standard is default)
  const boundaryResponse = await prompts({
    type: "select",
    name: "boundaries",
    message: "AI boundaries:",
    choices: BOUNDARY_PRESETS.map(b => ({ title: b.title, value: b.value })),
    initial: 0, // Standard by default
  });
  answers.boundaries = boundaryResponse.boundaries || "standard";

  // Step 7: Commands (auto-detected, quick confirm)
  if (detected?.commands && Object.keys(detected.commands).length > 0) {
    console.log();
    console.log(chalk.gray("Auto-detected commands:"));
    if (detected.commands.build) console.log(chalk.gray(`  Build: ${detected.commands.build}`));
    if (detected.commands.test) console.log(chalk.gray(`  Test: ${detected.commands.test}`));
    if (detected.commands.lint) console.log(chalk.gray(`  Lint: ${detected.commands.lint}`));
    if (detected.commands.dev) console.log(chalk.gray(`  Dev: ${detected.commands.dev}`));
    
    const editCommands = await prompts({
      type: "confirm",
      name: "edit",
      message: "Edit commands?",
      initial: false,
    });

    if (editCommands.edit) {
      const commandsResponse = await prompts([
        { type: "text", name: "build", message: "Build:", initial: detected.commands.build },
        { type: "text", name: "test", message: "Test:", initial: detected.commands.test },
        { type: "text", name: "lint", message: "Lint:", initial: detected.commands.lint },
        { type: "text", name: "dev", message: "Dev:", initial: detected.commands.dev },
      ]);
      answers.commands = commandsResponse;
    } else {
      answers.commands = detected.commands;
    }
  } else {
    answers.commands = {};
  }

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
