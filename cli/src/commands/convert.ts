#!/usr/bin/env node
/**
 * LynxPrompt CLI - Convert Command
 * 
 * Convert AI IDE configuration files between different formats.
 * E.g., AGENTS.md → .cursorrules, CLAUDE.md → copilot-instructions.md
 */

import chalk from "chalk";
import { readFile, writeFile, access } from "fs/promises";
import { join, basename, resolve, dirname } from "path";
import ora from "ora";
import { parseMarkdownConfig, generateTargetContent, isCommandTarget } from "../utils/convert-format.js";

interface ConvertOptions {
  output?: string;
  force?: boolean;
}

// Supported source file patterns and their platforms
const SOURCE_FILES: Record<string, string> = {
  "agents.md": "agents",
  "claude.md": "claude",
  ".cursorrules": "cursor_legacy",
  ".cursor/rules/project.mdc": "cursor",
  "cursor.rules/project.mdc": "cursor",
  "project.mdc": "cursor",
  ".github/copilot-instructions.md": "copilot",
  "copilot-instructions.md": "copilot",
  ".windsurfrules": "windsurf",
  ".clinerules": "cline",
  ".aider.conf.yml": "aider",
};

// Target format to output filename (30+ platforms)
const TARGET_FILES: Record<string, string> = {
  // Popular platforms
  universal: "AGENTS.md",
  agents: "AGENTS.md",
  cursor: ".cursor/rules/project.mdc",
  cursor_legacy: ".cursorrules",
  claude: "CLAUDE.md",
  copilot: ".github/copilot-instructions.md",
  windsurf: ".windsurfrules",
  // AI-powered IDEs
  antigravity: "GEMINI.md",
  zed: ".zed/instructions.md",
  void: ".void/config.json",
  trae: ".trae/rules/project_rules.md",
  firebase: ".idx/rules/project.mdc",
  // Editor extensions
  cline: ".clinerules",
  roocode: ".roo/rules/project.mdc",
  continue: ".continue/config.json",
  cody: ".cody/config.json",
  tabnine: ".tabnine.yaml",
  supermaven: ".supermaven/config.json",
  codegpt: ".codegpt/config.json",
  amazonq: ".amazonq/rules/project.md",
  augment: ".augment/rules/project.md",
  kilocode: ".kilocode/rules/project.mdc",
  junie: ".junie/guidelines.md",
  kiro: ".kiro/steering/project.md",
  // CLI tools
  aider: ".aider.conf.yml",
  goose: ".goosehints",
  warp: "WARP.md",
  "gemini-cli": "GEMINI.md",
  opencode: "opencode.json",
  codex: "codex.md",
  // Other emerging tools
  openhands: ".openhands/microagents/repo.md",
  crush: "CRUSH.md",
  firebender: "firebender.json",
  // Command targets
  "cursor-command": ".cursor/commands/command.md",
  "claude-command": ".claude/commands/command.md",
  "windsurf-workflow": ".windsurf/workflows/workflow.md",
  "copilot-prompt": ".copilot/prompts/prompt.md",
  "continue-prompt": ".continue/prompts/prompt.md",
  "opencode-command": ".opencode/commands/command.md",
};

// Platform display names
const PLATFORM_NAMES: Record<string, string> = {
  universal: "AGENTS.md (Universal)",
  agents: "AGENTS.md (Universal)",
  cursor: "Cursor Rules (.mdc)",
  cursor_legacy: "Cursor Rules (legacy)",
  claude: "CLAUDE.md",
  copilot: "GitHub Copilot",
  windsurf: "Windsurf",
  antigravity: "Antigravity (Gemini IDE)",
  zed: "Zed",
  void: "Void",
  trae: "Trae AI",
  firebase: "Firebase Studio",
  cline: "Cline",
  roocode: "Roo Code",
  continue: "Continue",
  cody: "Sourcegraph Cody",
  tabnine: "Tabnine",
  supermaven: "Supermaven",
  codegpt: "CodeGPT",
  amazonq: "Amazon Q",
  augment: "Augment Code",
  kilocode: "Kilo Code",
  junie: "Junie",
  kiro: "Kiro",
  aider: "Aider",
  goose: "Goose",
  warp: "Warp AI",
  "gemini-cli": "Gemini CLI",
  opencode: "OpenCode",
  codex: "Codex",
  openhands: "OpenHands",
  crush: "Crush",
  firebender: "Firebender",
  "cursor-command": "Cursor Command",
  "claude-command": "Claude Code Command",
  "windsurf-workflow": "Windsurf Workflow",
  "copilot-prompt": "Copilot Prompt",
  "continue-prompt": "Continue Prompt",
  "opencode-command": "OpenCode Command",
};

// Command directory patterns for detection
const COMMAND_DIRS: Record<string, string> = {
  ".cursor/commands": "cursor-command",
  ".claude/commands": "claude-command",
  ".windsurf/workflows": "windsurf-workflow",
  ".copilot/prompts": "copilot-prompt",
  ".continue/prompts": "continue-prompt",
  ".opencode/commands": "opencode-command",
};


async function detectSourceFile(cwd: string): Promise<{ path: string; platform: string } | null> {
  // Try to find a source file in common locations
  for (const [pattern, platform] of Object.entries(SOURCE_FILES)) {
    try {
      const fullPath = join(cwd, pattern);
      await access(fullPath);
      return { path: fullPath, platform };
    } catch {
      // File doesn't exist, try next
    }
  }
  
  // Try uppercase variants
  const uppercaseVariants = ["AGENTS.md", "CLAUDE.md"];
  for (const variant of uppercaseVariants) {
    try {
      const fullPath = join(cwd, variant);
      await access(fullPath);
      const platform = variant.toLowerCase().replace(".md", "");
      return { path: fullPath, platform };
    } catch {
      // File doesn't exist
    }
  }
  
  return null;
}

/**
 * Detect if a source path is a command file
 */
function detectCommandPlatform(sourcePath: string): string | null {
  const normalized = sourcePath.replace(/\\/g, "/").toLowerCase();
  for (const [dir, platform] of Object.entries(COMMAND_DIRS)) {
    if (normalized.includes(dir)) {
      return platform;
    }
  }
  return null;
}

/**
 * Usage: convert <target> (source auto-detected) or convert <source> <target>.
 * Commander gives the first argument first, so a lone argument is the target.
 */
export async function convertCommand(
  first: string,
  second: string | undefined,
  options: ConvertOptions
): Promise<void> {
  const [source, target] = second === undefined ? [undefined, first] : [first, second];
  console.log();
  console.log(chalk.cyan.bold("  🔄 LynxPrompt Convert"));
  console.log(chalk.gray("     Convert AI IDE configuration between formats"));
  console.log();

  const cwd = process.cwd();
  
  // Find source file
  let sourcePath: string;
  let sourcePlatform: string;
  
  if (source) {
    sourcePath = resolve(cwd, source);
    // Check if it's a command file first
    const cmdPlatform = detectCommandPlatform(source);
    if (cmdPlatform) {
      sourcePlatform = cmdPlatform;
    } else {
      // Detect platform from filename
      const sourceBasename = basename(source).toLowerCase();
      sourcePlatform = SOURCE_FILES[sourceBasename] || "unknown";
    }
  } else {
    const detected = await detectSourceFile(cwd);
    if (!detected) {
      console.log(chalk.red("  ✗ No AI configuration file found in current directory"));
      console.log();
      console.log(chalk.gray("  Supported source files:"));
      for (const file of Object.keys(SOURCE_FILES)) {
        console.log(chalk.gray(`    • ${file}`));
      }
      console.log();
      console.log(chalk.gray("  Command directories (for slash commands):"));
      for (const dir of Object.keys(COMMAND_DIRS)) {
        console.log(chalk.gray(`    • ${dir}/*.md`));
      }
      console.log();
      console.log(chalk.gray("  Usage: lynxp convert <source> <target>"));
      console.log(chalk.gray("  Example: lynxp convert AGENTS.md cursor"));
      console.log(chalk.gray("  Example: lynxp convert .cursor/commands/deploy.md claude-command"));
      process.exit(1);
    }
    sourcePath = detected.path;
    sourcePlatform = detected.platform;
  }

  // Validate target format — try exact match, then underscore variant
  const targetLower = target.toLowerCase();
  const normalizedTarget = TARGET_FILES[targetLower] ? targetLower : targetLower.replace(/-/g, "_");
  if (!TARGET_FILES[normalizedTarget]) {
    console.log(chalk.red(`  ✗ Unknown target format: ${target}`));
    console.log();
    console.log(chalk.gray("  Supported target formats:"));
    for (const [key, name] of Object.entries(PLATFORM_NAMES)) {
      console.log(chalk.gray(`    • ${key.padEnd(15)} → ${name}`));
    }
    process.exit(1);
  }

  // Read source file
  let sourceContent: string;
  try {
    sourceContent = await readFile(sourcePath, "utf-8");
  } catch {
    console.log(chalk.red(`  ✗ Could not read source file: ${sourcePath}`));
    process.exit(1);
  }

  console.log(chalk.white(`  Source: ${basename(sourcePath)} (${PLATFORM_NAMES[sourcePlatform] || sourcePlatform})`));
  console.log(chalk.white(`  Target: ${PLATFORM_NAMES[normalizedTarget]}`));
  console.log();

  // Parse and convert
  const spinner = ora("Converting configuration...").start();
  
  const config = parseMarkdownConfig(sourceContent);
  const targetContent = generateTargetContent(config, normalizedTarget);
  
  spinner.stop();

  // Determine output path
  let outputFilename = options.output || TARGET_FILES[normalizedTarget];
  
  // For commands, preserve original filename but change directory
  if (isCommandTarget(normalizedTarget) && !options.output) {
    const originalFilename = basename(sourcePath);
    const targetDir = TARGET_FILES[normalizedTarget].split("/").slice(0, -1).join("/");
    outputFilename = `${targetDir}/${originalFilename}`;
  }
  
  const outputPath = resolve(cwd, outputFilename);

  // Check if output exists
  try {
    await access(outputPath);
    if (!options.force) {
      console.log(chalk.yellow(`  ⚠️ File already exists: ${outputFilename}`));
      console.log(chalk.gray("     Use --force to overwrite"));
      process.exit(1);
    }
  } catch {
    // File doesn't exist, good to write
  }

  // Write output
  try {
    // Create directory if needed
    const { mkdir } = await import("fs/promises");
    const outputDir = dirname(outputPath);
    if (outputDir !== cwd) {
      await mkdir(outputDir, { recursive: true });
    }
    
    await writeFile(outputPath, targetContent, "utf-8");
    
    console.log(chalk.green(`  ✓ Converted to ${outputFilename}`));
    console.log();
    console.log(chalk.gray(`  Lines: ${targetContent.split("\n").length}`));
    console.log(chalk.gray(`  Size: ${targetContent.length} bytes`));
    console.log();
  } catch (error) {
    console.log(chalk.red(`  ✗ Could not write output: ${error instanceof Error ? error.message : "unknown error"}`));
    process.exit(1);
  }
}









