import chalk from "chalk";
import prompts from "prompts";
import ora from "ora";
import { writeFile, mkdir, readFile, access } from "fs/promises";
import { join, dirname } from "path";
import { detectProject } from "../utils/detect.js";
import { generateConfig, GenerateOptions } from "../utils/generator.js";

interface InitOptions {
  name?: string;
  description?: string;
  stack?: string;
  platforms?: string;
  persona?: string;
  boundaries?: string;
  preset?: string;
  yes?: boolean;
}

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

// Platform options
const PLATFORMS = [
  { title: "Cursor (.cursorrules)", value: "cursor", filename: ".cursorrules" },
  { title: "Claude Code (AGENTS.md)", value: "claude", filename: "AGENTS.md" },
  { title: "GitHub Copilot", value: "copilot", filename: ".github/copilot-instructions.md" },
  { title: "Windsurf (.windsurfrules)", value: "windsurf", filename: ".windsurfrules" },
  { title: "Zed", value: "zed", filename: ".zed/instructions.md" },
];

// Persona options
const PERSONAS = [
  { title: "Backend Developer - APIs, databases, microservices", value: "backend" },
  { title: "Frontend Developer - UI, components, styling", value: "frontend" },
  { title: "Full-Stack Developer - Complete application setups", value: "fullstack" },
  { title: "DevOps Engineer - Infrastructure, CI/CD, containers", value: "devops" },
  { title: "Data Engineer - Pipelines, ETL, databases", value: "data" },
  { title: "Security Engineer - Secure code, vulnerabilities", value: "security" },
  { title: "Custom...", value: "custom" },
];

// Boundary presets
const BOUNDARY_PRESETS = [
  {
    title: "Conservative - Ask before most changes",
    value: "conservative",
    always: ["Read any file", "Run lint/format commands"],
    askFirst: ["Modify any file", "Add dependencies", "Create files", "Run tests"],
    never: ["Delete files", "Modify .env", "Push to git"],
  },
  {
    title: "Standard - Balance of freedom and safety",
    value: "standard",
    always: ["Read any file", "Modify files in src/", "Run build/test/lint", "Create test files"],
    askFirst: ["Add new dependencies", "Modify config files", "Create new modules"],
    never: ["Delete production data", "Modify .env secrets", "Force push"],
  },
  {
    title: "Permissive - AI can modify freely within src/",
    value: "permissive",
    always: ["Modify any file in src/", "Run any script", "Add dependencies", "Create files"],
    askFirst: ["Modify root configs", "Delete directories"],
    never: ["Modify .env", "Access external APIs without confirmation"],
  },
];

export async function initCommand(options: InitOptions): Promise<void> {
  console.log();
  console.log(chalk.cyan("🐱 Welcome to LynxPrompt!"));
  console.log();

  // Try to detect project info
  const detected = await detectProject(process.cwd());
  
  if (detected) {
    console.log(chalk.gray("Detected project configuration:"));
    if (detected.name) console.log(chalk.gray(`  Name: ${detected.name}`));
    if (detected.stack.length > 0) console.log(chalk.gray(`  Stack: ${detected.stack.join(", ")}`));
    if (detected.commands.build) console.log(chalk.gray(`  Build: ${detected.commands.build}`));
    if (detected.commands.test) console.log(chalk.gray(`  Test: ${detected.commands.test}`));
    console.log();
  }

  let config: GenerateOptions;

  // Non-interactive mode
  if (options.yes) {
    config = {
      name: options.name || detected?.name || "my-project",
      description: options.description || "",
      stack: options.stack?.split(",").map(s => s.trim()) || detected?.stack || [],
      platforms: options.platforms?.split(",").map(s => s.trim()) || ["cursor", "claude"],
      persona: options.persona || "fullstack",
      boundaries: options.boundaries as "conservative" | "standard" | "permissive" || "standard",
      commands: detected?.commands || {},
    };
  } else {
    // Interactive mode
    config = await runInteractiveWizard(options, detected);
  }

  // Generate and write files
  const spinner = ora("Generating configuration files...").start();
  
  try {
    const files = generateConfig(config);
    spinner.stop();

    console.log();
    console.log(chalk.green("✅ Generated files:"));
    
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
    console.log(chalk.gray("Your AI IDE configuration is ready!"));
    console.log(chalk.gray("The AI assistant in your IDE will now follow these instructions."));
    console.log();
  } catch (error) {
    spinner.fail("Failed to generate files");
    console.error(chalk.red("An error occurred while generating configuration files."));
    if (error instanceof Error) {
      console.error(chalk.gray(error.message));
    }
    process.exit(1);
  }
}

async function runInteractiveWizard(
  options: InitOptions,
  detected: Awaited<ReturnType<typeof detectProject>> | null
): Promise<GenerateOptions> {
  const answers: Record<string, unknown> = {};

  // Project name
  const nameResponse = await prompts({
    type: "text",
    name: "name",
    message: "What's your project name?",
    initial: options.name || detected?.name || "my-project",
  });
  answers.name = nameResponse.name;

  // Description
  const descResponse = await prompts({
    type: "text",
    name: "description",
    message: "Describe your project in one sentence:",
    initial: options.description || "",
  });
  answers.description = descResponse.description;

  // Tech stack
  const allStackOptions = [...TECH_STACKS, ...FRAMEWORKS];
  const stackResponse = await prompts({
    type: "multiselect",
    name: "stack",
    message: "Select your tech stack:",
    choices: allStackOptions,
    hint: "- Space to select, Enter to confirm",
  });
  answers.stack = stackResponse.stack || [];

  // Platforms
  const platformResponse = await prompts({
    type: "multiselect",
    name: "platforms",
    message: "Which AI IDEs do you use?",
    choices: PLATFORMS,
    hint: "- Space to select, Enter to confirm",
    min: 1,
  });
  answers.platforms = platformResponse.platforms || ["cursor"];

  // Persona
  const personaResponse = await prompts({
    type: "select",
    name: "persona",
    message: "What's the AI's persona/role?",
    choices: PERSONAS,
    initial: 2, // Full-stack by default
  });
  
  if (personaResponse.persona === "custom") {
    const customPersona = await prompts({
      type: "text",
      name: "value",
      message: "Describe the custom persona:",
    });
    answers.persona = customPersona.value || "fullstack";
  } else {
    answers.persona = personaResponse.persona;
  }

  // Show detected commands if available
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
      message: "Edit these commands?",
      initial: false,
    });

    if (editCommands.edit) {
      const commandsResponse = await prompts([
        { type: "text", name: "build", message: "Build command:", initial: detected.commands.build },
        { type: "text", name: "test", message: "Test command:", initial: detected.commands.test },
        { type: "text", name: "lint", message: "Lint command:", initial: detected.commands.lint },
        { type: "text", name: "dev", message: "Dev command:", initial: detected.commands.dev },
      ]);
      answers.commands = commandsResponse;
    } else {
      answers.commands = detected.commands;
    }
  } else {
    answers.commands = {};
  }

  // Boundaries
  const boundaryResponse = await prompts({
    type: "select",
    name: "boundaries",
    message: "Select boundary preset:",
    choices: BOUNDARY_PRESETS.map(b => ({ title: b.title, value: b.value })),
    initial: 1, // Standard by default
  });
  answers.boundaries = boundaryResponse.boundaries || "standard";

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

