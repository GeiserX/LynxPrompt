#!/usr/bin/env node
/**
 * LynxPrompt CLI - Convert Command
 * 
 * Convert AI IDE configuration files between different formats.
 * E.g., AGENTS.md → .cursorrules, CLAUDE.md → copilot-instructions.md
 */

import chalk from "chalk";
import { readFile, writeFile, access } from "fs/promises";
import { join, basename } from "path";
import ora from "ora";

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

// Target format to output filename
const TARGET_FILES: Record<string, string> = {
  agents: "AGENTS.md",
  claude: "CLAUDE.md",
  cursor: ".cursor/rules/project.mdc",
  cursor_legacy: ".cursorrules",
  copilot: ".github/copilot-instructions.md",
  windsurf: ".windsurfrules",
  cline: ".clinerules",
  aider: ".aider.conf.yml",
  codex: "codex.md",
  supermaven: "supermaven.md",
  goose: ".goose/rules.txt",
};

// Platform display names
const PLATFORM_NAMES: Record<string, string> = {
  agents: "AGENTS.md (Universal)",
  claude: "CLAUDE.md",
  cursor: "Cursor Rules (.mdc)",
  cursor_legacy: "Cursor Rules (legacy)",
  copilot: "GitHub Copilot",
  windsurf: "Windsurf Rules",
  cline: "Cline Rules",
  aider: "Aider Config",
  codex: "Codex",
  supermaven: "Supermaven",
  goose: "Goose Rules",
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

function parseMarkdownConfig(content: string): Record<string, string> {
  const config: Record<string, string> = {};
  
  // Extract sections from markdown
  const sections = content.split(/^##\s+/m);
  
  for (const section of sections) {
    const lines = section.trim().split("\n");
    if (lines.length === 0) continue;
    
    const title = lines[0].toLowerCase().trim();
    const body = lines.slice(1).join("\n").trim();
    
    config[title] = body;
  }
  
  // Try to extract key info
  config._raw = content;
  
  return config;
}

function generateTargetContent(config: Record<string, string>, targetPlatform: string): string {
  const rawContent = config._raw || "";
  
  // For simple conversions, adapt the content format
  switch (targetPlatform) {
    case "cursor":
      // MDC format with frontmatter
      return `---
description: "AI coding rules"
globs: ["**/*"]
alwaysApply: true
---

${rawContent.replace(/^#\s+.*$/m, "# AI Assistant Configuration")}
`;

    case "cursor_legacy":
      // Plain text format
      return rawContent
        .replace(/^#\s+/gm, "")
        .replace(/^##\s+/gm, "\n")
        .replace(/^###\s+/gm, "")
        .trim();

    case "windsurf":
    case "cline":
    case "goose":
      // Plain text format
      return rawContent
        .replace(/^#\s+/gm, "=== ")
        .replace(/^##\s+/gm, "--- ")
        .replace(/^###\s+/gm, "")
        .replace(/\*\*/g, "")
        .trim();

    case "aider":
      // YAML format (simplified)
      return `# Aider configuration
# Converted from AI IDE configuration

lint-cmd: []
auto-test: false
read: []
# AI rules converted below as conventions
conventions:
${rawContent
  .split("\n")
  .filter(line => line.trim() && !line.startsWith("#"))
  .map(line => `  - "${line.replace(/"/g, '\\"').trim()}"`)
  .slice(0, 20)
  .join("\n")}
`;

    case "copilot":
      // GitHub Copilot markdown format
      return `# GitHub Copilot Instructions

${rawContent}
`;

    case "agents":
    case "claude":
    case "codex":
    case "supermaven":
    default:
      // Standard markdown format
      return rawContent;
  }
}

export async function convertCommand(
  source: string | undefined,
  target: string,
  options: ConvertOptions
): Promise<void> {
  console.log();
  console.log(chalk.cyan.bold("  🔄 LynxPrompt Convert"));
  console.log(chalk.gray("     Convert AI IDE configuration between formats"));
  console.log();

  const cwd = process.cwd();
  
  // Find source file
  let sourcePath: string;
  let sourcePlatform: string;
  
  if (source) {
    sourcePath = join(cwd, source);
    // Detect platform from filename
    const sourceBasename = basename(source).toLowerCase();
    sourcePlatform = SOURCE_FILES[sourceBasename] || "unknown";
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
      console.log(chalk.gray("  Usage: lynxp convert <source> <target>"));
      console.log(chalk.gray("  Example: lynxp convert AGENTS.md cursor"));
      process.exit(1);
    }
    sourcePath = detected.path;
    sourcePlatform = detected.platform;
  }

  // Validate target format
  const normalizedTarget = target.toLowerCase().replace("-", "_");
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
  const outputFilename = options.output || TARGET_FILES[normalizedTarget];
  const outputPath = join(cwd, outputFilename);

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
    const outputDir = join(cwd, outputFilename.split("/").slice(0, -1).join("/"));
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








