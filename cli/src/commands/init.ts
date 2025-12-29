import chalk from "chalk";
import prompts from "prompts";
import ora from "ora";
import { writeFile, mkdir, readFile } from "fs/promises";
import { join, dirname, basename } from "path";
import { existsSync } from "fs";
import * as yaml from "yaml";
import { detectAgents } from "../utils/agent-detector.js";
import { detectProject } from "../utils/detect.js";
import { getPopularAgents } from "../utils/agents.js";

interface InitOptions {
  yes?: boolean;
  force?: boolean;
}

// LynxPrompt paths
const LYNXPROMPT_DIR = ".lynxprompt";
const LYNXPROMPT_CONFIG = ".lynxprompt/conf.yml";
const LYNXPROMPT_RULES = ".lynxprompt/rules";

// Common AI agent config files
const AGENT_FILES = [
  { name: "AGENTS.md", agent: "Universal (AGENTS.md)" },
  { name: "CLAUDE.md", agent: "Claude Code" },
  { name: ".windsurfrules", agent: "Windsurf" },
  { name: ".clinerules", agent: "Cline" },
  { name: ".goosehints", agent: "Goose" },
  { name: "AIDER.md", agent: "Aider" },
  { name: ".github/copilot-instructions.md", agent: "GitHub Copilot" },
  { name: ".zed/instructions.md", agent: "Zed" },
];

// Directory-based AI agent configs
const AGENT_DIRS = [
  { path: ".cursor/rules", agent: "Cursor" },
  { path: ".amazonq/rules", agent: "Amazon Q" },
  { path: ".augment/rules", agent: "Augment Code" },
];

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

  // Check directories
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
function createDefaultConfig(exporters: string[] = ["agents"]): string {
  const config = {
    version: "1",
    exporters,
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

> **Note**: This is an advanced setup for managing rules across multiple AI editors.
> Most users should use \`lynxp wizard\` instead for simple, direct file generation.

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

This exports your rules to the configured agent formats (AGENTS.md, .cursor/rules/, etc.)

## More information

- Docs: https://lynxprompt.com/docs/cli
- Support: https://lynxprompt.com/support
`;
}

export async function initCommand(options: InitOptions): Promise<void> {
  console.log();
  console.log(chalk.cyan("🐱 LynxPrompt Init"));
  console.log(chalk.gray("Advanced mode: Multi-editor rule management"));
  console.log();

  // Show suggestion for simple use case
  if (!options.yes && !options.force) {
    console.log(chalk.yellow("💡 Tip: Most users should use 'lynxp wizard' instead."));
    console.log(chalk.gray("   The wizard generates files directly without the .lynxprompt/ folder."));
    console.log();
    
    const { proceed } = await prompts({
      type: "confirm",
      name: "proceed",
      message: "Continue with advanced setup?",
      initial: false,
    });

    if (!proceed) {
      console.log();
      console.log(chalk.gray("Run 'lynxp wizard' for simple file generation."));
      return;
    }
    console.log();
  }

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

  // Detect project and agents
  const spinner = ora("Scanning project...").start();
  const [projectInfo, agentDetection] = await Promise.all([
    detectProject(cwd),
    Promise.resolve(detectAgents(cwd)),
  ]);
  const existingFiles = await scanForExistingFiles(cwd);
  spinner.stop();

  // Show detected project info
  if (projectInfo) {
    console.log(chalk.green("✓ Detected project:"));
    if (projectInfo.name) console.log(chalk.gray(`  Name: ${projectInfo.name}`));
    if (projectInfo.stack.length > 0) console.log(chalk.gray(`  Stack: ${projectInfo.stack.join(", ")}`));
    if (projectInfo.packageManager) console.log(chalk.gray(`  Package manager: ${projectInfo.packageManager}`));
    console.log();
  }

  // Show detected agents
  if (agentDetection.detected.length > 0) {
    console.log(chalk.green(`✓ Detected ${agentDetection.detected.length} AI agent${agentDetection.detected.length === 1 ? "" : "s"}:`));
    for (const detected of agentDetection.detected) {
      const rules = detected.ruleCount > 0 ? chalk.gray(` (${detected.ruleCount} sections)`) : "";
      console.log(`  ${chalk.cyan("•")} ${detected.agent.name}${rules}`);
    }
    console.log();
  }

  if (existingFiles.length > 0) {
    console.log(chalk.green("✓ Found existing AI configuration files:"));
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
        message: "Create a starter template?",
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

  // Determine which exporters to enable
  let exporters: string[] = [];
  
  if (agentDetection.detected.length > 0) {
    // Use detected agents
    exporters = agentDetection.detected.map((d) => d.agent.id);
    
    // If more than 3 detected, ask which to enable (unless --yes)
    if (agentDetection.detected.length > 3 && !options.yes) {
      const { selected } = await prompts({
        type: "multiselect",
        name: "selected",
        message: "Select agents to enable:",
        choices: agentDetection.detected.map((d) => ({
          title: d.agent.name,
          value: d.agent.id,
          selected: true,
        })),
        hint: "- Space to toggle, Enter to confirm",
      });
      
      if (selected && selected.length > 0) {
        exporters = selected;
      }
    }
  } else {
    // Default to AGENTS.md (universal format)
    exporters = ["agents"];
    
    // Offer to select popular agents if interactive
    if (!options.yes) {
      const popular = getPopularAgents();
      const { selected } = await prompts({
        type: "multiselect",
        name: "selected",
        message: "Select AI agents to sync to:",
        choices: popular.map((a) => ({
          title: `${a.name} - ${a.description}`,
          value: a.id,
          selected: a.id === "agents", // Default select AGENTS.md
        })),
        hint: "- Space to toggle, Enter to confirm",
      });
      
      if (selected && selected.length > 0) {
        exporters = selected;
      }
    }
  }

  console.log(chalk.gray(`Enabling ${exporters.length} exporter${exporters.length === 1 ? "" : "s"}: ${exporters.join(", ")}`));

  // Create config file
  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, createDefaultConfig(exporters), "utf-8");

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
  console.log(chalk.gray("  3. Or run 'lynxp agents' to manage which agents to sync to"));
  console.log();
}
