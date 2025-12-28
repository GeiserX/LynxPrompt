import chalk from "chalk";
import prompts from "prompts";
import ora from "ora";
import { writeFile, mkdir, readFile, access, readdir } from "fs/promises";
import { join, dirname, basename } from "path";
import { existsSync } from "fs";
import * as yaml from "yaml";

interface InitOptions {
  yes?: boolean;
  force?: boolean;
}

// Agent file patterns to detect
const AGENT_FILES = [
  { name: "AGENTS.md", agent: "Claude Code, GitHub Copilot, and others" },
  { name: "CLAUDE.md", agent: "Claude Code" },
  { name: ".cursorrules", agent: "Cursor" },
  { name: ".windsurfrules", agent: "Windsurf" },
  { name: ".clinerules", agent: "Cline" },
  { name: ".goosehints", agent: "Goose" },
];

const AGENT_DIRS = [
  { path: ".cursor/rules", agent: "Cursor" },
  { path: ".github/copilot-instructions.md", agent: "GitHub Copilot" },
  { path: ".zed/instructions.md", agent: "Zed" },
  { path: ".windsurf/rules", agent: "Windsurf" },
];

// LynxPrompt paths
const LYNXPROMPT_DIR = ".lynxprompt";
const LYNXPROMPT_CONFIG = ".lynxprompt/conf.yml";
const LYNXPROMPT_RULES = ".lynxprompt/rules";

interface DetectedFile {
  path: string;
  agent: string;
  content?: string;
}

/**
 * Scan for existing AI agent configuration files
 */
async function scanForExistingFiles(cwd: string): Promise<DetectedFile[]> {
  const detected: DetectedFile[] = [];

  // Check single files
  for (const file of AGENT_FILES) {
    const filePath = join(cwd, file.name);
    if (existsSync(filePath)) {
      try {
        const content = await readFile(filePath, "utf-8");
        detected.push({ path: file.name, agent: file.agent, content });
      } catch {
        detected.push({ path: file.name, agent: file.agent });
      }
    }
  }

  // Check directories and specific paths
  for (const dir of AGENT_DIRS) {
    const dirPath = join(cwd, dir.path);
    if (existsSync(dirPath)) {
      detected.push({ path: dir.path, agent: dir.agent });
    }
  }

  return detected;
}

/**
 * Create starter AGENTS.md content
 */
function createStarterAgentsMd(projectName: string): string {
  return `# ${projectName} - AI Agent Instructions

> Edit this file to customize how AI agents work with your codebase.
> This is the source of truth for all AI assistants in this project.

## Project Overview

Describe your project here. What does it do? What are its main features?

## Tech Stack

List the technologies used in this project:

- Language: (e.g., TypeScript, Python, Go)
- Framework: (e.g., Next.js, FastAPI, Rails)
- Database: (e.g., PostgreSQL, MongoDB)
- Other tools: (e.g., Docker, Kubernetes)

## Code Style

Follow these conventions:

- Write clean, readable code
- Use descriptive variable and function names
- Keep functions focused and testable
- Add comments for complex logic only

## Commands

\`\`\`bash
# Build
npm run build

# Test
npm test

# Lint
npm run lint

# Dev server
npm run dev
\`\`\`

## Boundaries

### ✅ Always (do without asking)

- Read any file in the project
- Modify files in src/ or lib/
- Run build, test, and lint commands
- Create test files

### ⚠️ Ask First

- Add new dependencies
- Modify configuration files
- Create new modules or directories

### 🚫 Never

- Modify .env files or secrets
- Delete critical files without backup
- Force push to git
- Expose sensitive information

---

*Managed by [LynxPrompt](https://lynxprompt.com)*
`;
}

/**
 * Create default LynxPrompt configuration
 */
function createDefaultConfig(): string {
  const config = {
    version: "1",
    exporters: ["agents"],
    sources: [
      {
        type: "local",
        path: ".lynxprompt/rules",
      },
    ],
  };
  return yaml.stringify(config);
}

/**
 * Create README for .lynxprompt directory
 */
function createLynxpromptReadme(): string {
  return `# .lynxprompt

This directory contains your LynxPrompt configuration and rules.

## Directory structure

- **\`rules/\`** - Your AI rules. Edit files here, then sync to agents.
- **\`conf.yml\`** - Configuration file (exporters, sources, options)

## Editing rules

Add markdown files to \`rules/\`:

\`\`\`markdown
# My Rule

Description of what this rule does...
\`\`\`

## Syncing

After editing rules, run:

\`\`\`bash
lynxp sync
\`\`\`

This exports your rules to the configured agent formats (AGENTS.md, .cursorrules, etc.)

## More information

- Docs: https://lynxprompt.com/docs/cli
- Support: https://lynxprompt.com/support
`;
}

export async function initCommand(options: InitOptions): Promise<void> {
  console.log();
  console.log(chalk.cyan("🐱 LynxPrompt Init"));
  console.log();

  const cwd = process.cwd();
  const projectName = basename(cwd);
  const lynxpromptDir = join(cwd, LYNXPROMPT_DIR);
  const configPath = join(cwd, LYNXPROMPT_CONFIG);
  const rulesDir = join(cwd, LYNXPROMPT_RULES);

  // Check if already initialized
  if (existsSync(configPath) && !options.force) {
    console.log(chalk.yellow("LynxPrompt is already initialized in this project."));
    console.log(chalk.gray(`Config: ${LYNXPROMPT_CONFIG}`));
    console.log(chalk.gray(`Rules:  ${LYNXPROMPT_RULES}/`));
    console.log();
    console.log(chalk.gray("Run 'lynxp sync' to export rules to your agents."));
    console.log(chalk.gray("Run 'lynxp wizard' to generate new configurations."));
    return;
  }

  // Scan for existing files
  const spinner = ora("Scanning for existing AI config files...").start();
  const existingFiles = await scanForExistingFiles(cwd);
  spinner.stop();

  if (existingFiles.length > 0) {
    console.log(chalk.green("Found existing AI configuration files:"));
    console.log();
    for (const file of existingFiles) {
      console.log(`  ${chalk.cyan(file.path)} ${chalk.gray(`(${file.agent})`)}`);
    }
    console.log();

    if (!options.yes) {
      const { action } = await prompts({
        type: "select",
        name: "action",
        message: "What would you like to do?",
        choices: [
          { title: "Import existing files to .lynxprompt/rules/", value: "import" },
          { title: "Start fresh (keep existing files, create new rules)", value: "fresh" },
          { title: "Cancel", value: "cancel" },
        ],
      });

      if (action === "cancel" || !action) {
        console.log(chalk.gray("Cancelled."));
        return;
      }

      if (action === "import") {
        // Import existing files
        await mkdir(rulesDir, { recursive: true });
        
        let importedCount = 0;
        for (const file of existingFiles) {
          if (file.content) {
            const ruleName = file.path.replace(/^\./, "").replace(/\//g, "-").replace(/\.md$/, "") + ".md";
            const rulePath = join(rulesDir, ruleName);
            await writeFile(rulePath, file.content, "utf-8");
            console.log(chalk.gray(`  Imported: ${file.path} → .lynxprompt/rules/${ruleName}`));
            importedCount++;
          }
        }
        
        if (importedCount === 0) {
          // Create starter if no files could be imported
          const starterPath = join(rulesDir, "agents.md");
          await writeFile(starterPath, createStarterAgentsMd(projectName), "utf-8");
          console.log(chalk.gray("  Created starter: .lynxprompt/rules/agents.md"));
        }
      } else {
        // Fresh start - create starter
        await mkdir(rulesDir, { recursive: true });
        const starterPath = join(rulesDir, "agents.md");
        await writeFile(starterPath, createStarterAgentsMd(projectName), "utf-8");
        console.log(chalk.gray("Created starter: .lynxprompt/rules/agents.md"));
      }
    } else {
      // Non-interactive: import existing files
      await mkdir(rulesDir, { recursive: true });
      for (const file of existingFiles) {
        if (file.content) {
          const ruleName = file.path.replace(/^\./, "").replace(/\//g, "-").replace(/\.md$/, "") + ".md";
          const rulePath = join(rulesDir, ruleName);
          await writeFile(rulePath, file.content, "utf-8");
        }
      }
    }
  } else {
    // No existing files found
    console.log(chalk.gray("No existing AI configuration files found."));
    console.log();

    if (!options.yes) {
      const { create } = await prompts({
        type: "confirm",
        name: "create",
        message: "Create a starter AGENTS.md template?",
        initial: true,
      });

      if (!create) {
        console.log(chalk.gray("Cancelled."));
        return;
      }
    }

    // Create rules directory and starter file
    await mkdir(rulesDir, { recursive: true });
    const starterPath = join(rulesDir, "agents.md");
    await writeFile(starterPath, createStarterAgentsMd(projectName), "utf-8");
    console.log(chalk.gray("Created: .lynxprompt/rules/agents.md"));
  }

  // Create config file
  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, createDefaultConfig(), "utf-8");

  // Create README
  const readmePath = join(lynxpromptDir, "README.md");
  await writeFile(readmePath, createLynxpromptReadme(), "utf-8");

  // Create .gitignore for local state
  const gitignorePath = join(lynxpromptDir, ".gitignore");
  const gitignoreContent = `# Local state files
.cache/
.backups/
`;
  await writeFile(gitignorePath, gitignoreContent, "utf-8");

  console.log();
  console.log(chalk.green("✅ LynxPrompt initialized!"));
  console.log();
  console.log(chalk.gray("Created:"));
  console.log(chalk.gray(`  ${LYNXPROMPT_CONFIG} - Configuration`));
  console.log(chalk.gray(`  ${LYNXPROMPT_RULES}/ - Your rules (edit here)`));
  console.log();
  console.log(chalk.cyan("Next steps:"));
  console.log(chalk.gray("  1. Edit your rules in .lynxprompt/rules/"));
  console.log(chalk.gray("  2. Run 'lynxp sync' to export to your AI agents"));
  console.log(chalk.gray("  3. Or run 'lynxp wizard' for a guided setup"));
  console.log();
}
