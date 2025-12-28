/**
 * Sync command - export rules to all configured agents
 * 
 * This is the core of LynxPrompt CLI: one command to sync your rules
 * to all AI coding agents you use.
 * 
 * Usage:
 *   lynxp sync           - Sync rules to configured agents
 *   lynxp sync --dry-run - Preview changes without writing
 *   lynxp sync --force   - Skip prompts (for CI)
 */

import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";
import { readFile, writeFile, mkdir, access, readdir } from "fs/promises";
import { join, dirname, basename } from "path";
import { existsSync } from "fs";
import * as yaml from "yaml";
import { AGENTS, getAgent, type AgentDefinition } from "../utils/agents.js";

interface SyncOptions {
  dryRun?: boolean;
  force?: boolean;
}

interface LynxPromptConfig {
  version: string;
  exporters: string[];
  sources: Array<{
    type: string;
    path: string;
  }>;
}

interface SyncResult {
  written: string[];
  skipped: string[];
  errors: string[];
}

// Paths
const LYNXPROMPT_DIR = ".lynxprompt";
const CONFIG_FILE = ".lynxprompt/conf.yml";
const RULES_DIR = ".lynxprompt/rules";

export async function syncCommand(options: SyncOptions = {}): Promise<void> {
  console.log();
  console.log(chalk.cyan("🐱 LynxPrompt Sync"));
  console.log();

  const cwd = process.cwd();

  // Check if initialized
  const configPath = join(cwd, CONFIG_FILE);
  if (!existsSync(configPath)) {
    console.log(chalk.yellow("LynxPrompt is not initialized in this project."));
    console.log();
    console.log(chalk.gray("Run 'lynxp init' first to set up LynxPrompt."));
    return;
  }

  // Load config
  const spinner = ora("Loading configuration...").start();
  let config: LynxPromptConfig;
  
  try {
    const configContent = await readFile(configPath, "utf-8");
    config = yaml.parse(configContent) as LynxPromptConfig;
    spinner.succeed("Configuration loaded");
  } catch (error) {
    spinner.fail("Failed to load configuration");
    console.log(chalk.red("Could not parse .lynxprompt/conf.yml"));
    return;
  }

  // Check exporters
  if (!config.exporters || config.exporters.length === 0) {
    console.log(chalk.yellow("No exporters configured."));
    console.log();
    console.log(chalk.gray("Add exporters to .lynxprompt/conf.yml or run 'lynxp agents enable <agent>'"));
    return;
  }

  // Validate exporters
  const validExporters: AgentDefinition[] = [];
  const invalidExporters: string[] = [];

  for (const exporterId of config.exporters) {
    const agent = getAgent(exporterId);
    if (agent) {
      validExporters.push(agent);
    } else {
      invalidExporters.push(exporterId);
    }
  }

  if (invalidExporters.length > 0) {
    console.log(chalk.yellow(`Unknown exporters: ${invalidExporters.join(", ")}`));
  }

  if (validExporters.length === 0) {
    console.log(chalk.red("No valid exporters configured."));
    return;
  }

  console.log(chalk.gray(`Exporters: ${validExporters.map((e) => e.name).join(", ")}`));
  console.log();

  // Load rules
  const rulesPath = join(cwd, RULES_DIR);
  if (!existsSync(rulesPath)) {
    console.log(chalk.yellow("No rules found."));
    console.log(chalk.gray(`Create rules in ${RULES_DIR}/ to sync them.`));
    return;
  }

  const rulesContent = await loadRules(rulesPath);
  if (!rulesContent) {
    console.log(chalk.yellow("No rule files found in .lynxprompt/rules/"));
    return;
  }

  console.log(chalk.gray(`Loaded ${rulesContent.fileCount} rule file${rulesContent.fileCount === 1 ? "" : "s"}`));
  console.log();

  // Dry run mode
  if (options.dryRun) {
    console.log(chalk.cyan("Dry run - no files will be written"));
    console.log();
    console.log("Would write:");
    for (const exporter of validExporters) {
      console.log(chalk.gray(`  ${exporter.output}`));
    }
    console.log();
    return;
  }

  // Confirm if not forced
  if (!options.force) {
    const { confirm } = await prompts({
      type: "confirm",
      name: "confirm",
      message: `Sync to ${validExporters.length} agent${validExporters.length === 1 ? "" : "s"}?`,
      initial: true,
    });

    if (!confirm) {
      console.log(chalk.gray("Cancelled."));
      return;
    }
  }

  // Sync to each exporter
  const result: SyncResult = { written: [], skipped: [], errors: [] };
  const syncSpinner = ora("Syncing rules...").start();

  for (const exporter of validExporters) {
    try {
      await syncToAgent(cwd, exporter, rulesContent.combined);
      result.written.push(exporter.output);
    } catch (error) {
      result.errors.push(`${exporter.id}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  syncSpinner.stop();

  // Show results
  if (result.written.length > 0) {
    console.log(chalk.green(`✓ Synced to ${result.written.length} agent${result.written.length === 1 ? "" : "s"}:`));
    for (const file of result.written) {
      console.log(chalk.gray(`  ${file}`));
    }
  }

  if (result.errors.length > 0) {
    console.log();
    console.log(chalk.red("Errors:"));
    for (const error of result.errors) {
      console.log(chalk.red(`  ${error}`));
    }
  }

  console.log();
}

interface RulesContent {
  combined: string;
  files: Array<{ name: string; content: string }>;
  fileCount: number;
}

/**
 * Load and combine all rules from the rules directory
 */
async function loadRules(rulesPath: string): Promise<RulesContent | null> {
  const files: Array<{ name: string; content: string }> = [];

  try {
    const entries = await readdir(rulesPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!entry.name.endsWith(".md")) continue;

      const filePath = join(rulesPath, entry.name);
      const content = await readFile(filePath, "utf-8");
      
      if (content.trim()) {
        files.push({ name: entry.name, content: content.trim() });
      }
    }
  } catch {
    return null;
  }

  if (files.length === 0) {
    return null;
  }

  // Combine all rules with separators
  const combined = files
    .map((f) => f.content)
    .join("\n\n---\n\n");

  return { combined, files, fileCount: files.length };
}

/**
 * Sync rules to a specific agent
 */
async function syncToAgent(
  cwd: string,
  agent: AgentDefinition,
  content: string
): Promise<void> {
  const outputPath = join(cwd, agent.output);

  // Handle directory-based agents
  if (agent.output.endsWith("/")) {
    await syncToDirectory(cwd, agent, content);
    return;
  }

  // Handle file-based agents
  const formatted = formatForAgent(agent, content);
  
  // Ensure directory exists
  const dir = dirname(outputPath);
  if (dir !== ".") {
    await mkdir(dir, { recursive: true });
  }

  await writeFile(outputPath, formatted, "utf-8");
}

/**
 * Sync to a directory-based agent (like Cursor's .cursor/rules/)
 */
async function syncToDirectory(
  cwd: string,
  agent: AgentDefinition,
  content: string
): Promise<void> {
  const outputDir = join(cwd, agent.output);
  await mkdir(outputDir, { recursive: true });

  // For directory-based agents, write a single combined file
  const extension = agent.format === "mdc" ? ".mdc" : ".md";
  const filename = `lynxprompt-rules${extension}`;
  const outputPath = join(outputDir, filename);

  const formatted = formatForAgent(agent, content);
  await writeFile(outputPath, formatted, "utf-8");
}

/**
 * Format content for a specific agent's format
 */
function formatForAgent(agent: AgentDefinition, content: string): string {
  switch (agent.format) {
    case "mdc":
      return formatAsMdc(content, agent);
    case "markdown":
      return formatAsMarkdown(content, agent);
    case "json":
      return formatAsJson(content, agent);
    case "text":
      return content;
    default:
      return content;
  }
}

/**
 * Format as MDC (Cursor's format with YAML frontmatter)
 */
function formatAsMdc(content: string, agent: AgentDefinition): string {
  const frontmatter = yaml.stringify({
    description: "LynxPrompt rules - AI coding guidelines",
    globs: ["**/*"],
    alwaysApply: true,
  });

  return `---\n${frontmatter}---\n\n${content}`;
}

/**
 * Format as Markdown with header
 */
function formatAsMarkdown(content: string, agent: AgentDefinition): string {
  const header = `# AI Coding Rules\n\n> Generated by [LynxPrompt](https://lynxprompt.com)\n\n`;
  return header + content;
}

/**
 * Format as JSON (for config-based agents)
 */
function formatAsJson(content: string, agent: AgentDefinition): string {
  return JSON.stringify(
    {
      $schema: "https://lynxprompt.com/schemas/rules.json",
      version: "1.0",
      rules: content,
      meta: {
        generator: "lynxprompt",
        url: "https://lynxprompt.com",
      },
    },
    null,
    2
  );
}

