#!/usr/bin/env node
/**
 * LynxPrompt CLI - Convert Command
 * 
 * Convert AI IDE configuration files between different formats.
 * E.g., AGENTS.md → .cursorrules, CLAUDE.md → copilot-instructions.md
 */

import chalk from "chalk";
import { readFile, writeFile, access } from "fs/promises";
import { basename, resolve, dirname } from "path";
import { createSpinner } from "../utils/spinner.js";
import {
  SOURCE_FILES,
  convertContent,
  detectSourceFile,
  isStructuredPlatform,
  platformForPath,
  sourceFilePlatform,
} from "../utils/convert-format.js";
import { PLATFORM_FILES } from "../utils/generator.js";
import {
  COMMANDS,
  MCP_CONFIGS,
  PLATFORMS,
  convertMcpConfig,
  extractMcpConfig,
  mergeMcpConfig,
  resolvePlatformId,
  type McpConfigTarget,
} from "../../../packages/shared/src/platforms.js";
import {
  SKILL_TARGETS,
  SUBAGENT_TARGETS,
  skillFiles,
  subagentFiles,
  type AgentAssetTarget,
} from "../../../packages/shared/src/agent-assets.js";
import { matchConfigFile, rulesWritePath, assetLocation, withFinalNewline } from "../utils/blueprint-files.js";

interface ConvertOptions {
  output?: string;
  force?: boolean;
}

// Target format to output filename: every platform of the shared table (the
// file the wizard and the web download write), plus the legacy .cursorrules
// and one example file per command folder.
const TARGET_FILES: Record<string, string> = {
  ...PLATFORM_FILES,
  cursor_legacy: ".cursorrules",
  ...Object.fromEntries(COMMANDS.map((c) => [c.id, `${c.directory}/command${c.extension}`])),
};

// Display names, from the same table
const PLATFORM_NAMES: Record<string, string> = {
  ...Object.fromEntries(PLATFORMS.map((p) => [p.id, p.name])),
  ...Object.fromEntries(COMMANDS.map((c) => [c.id, c.name])),
  universal: "AGENTS.md (Universal)",
  agents: "AGENTS.md (Universal)",
  cursor_legacy: "Cursor Rules (legacy)",
};

// Skill and subagent targets: "<tool>-skill" and "<tool>-agent"
const ASSET_TARGETS: { id: string; kind: "skill" | "agent"; target: AgentAssetTarget }[] = [
  ...SKILL_TARGETS.map((t) => ({ id: `${t.id}-skill`, kind: "skill" as const, target: t })),
  ...SUBAGENT_TARGETS.map((t) => ({ id: `${t.id}-agent`, kind: "agent" as const, target: t })),
];

// Command directory patterns for detection (.copilot/prompts is where older
// versions put Copilot prompts)
const COMMAND_DIRS: Record<string, string> = {
  ...Object.fromEntries(COMMANDS.map((c) => [c.directory, c.id])),
  ".copilot/prompts": "copilot-prompt",
};

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

  // Skills and subagents convert to another tool's folder, never to or from a rules file
  const assetTarget = ASSET_TARGETS.find((t) => t.id === target.toLowerCase());
  const assetSource = source !== undefined ? assetLocation(source) : null;
  if (assetTarget || assetSource) {
    await convertAsset(cwd, source, assetTarget, options);
    return;
  }

  // MCP server configs convert to each other, never to or from a rules file
  const mcpTarget = MCP_CONFIGS.find((c) => c.id === target.toLowerCase());
  const mcpSource = source !== undefined && matchConfigFile(source)?.type === "MCP_CONFIG";
  if (mcpTarget || mcpSource) {
    if (!mcpTarget) {
      console.log(chalk.red(`  ✗ An MCP config converts only to another tool's MCP config: ${MCP_CONFIGS.map((c) => c.id).join(", ")}`));
      process.exit(1);
    }
    await convertMcp(cwd, source, mcpTarget, options);
    return;
  }
  
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
      // Detect platform from the path (a tool's rules folder or own file), then the filename
      sourcePlatform = platformForPath(source) || sourceFilePlatform(basename(source)) || "unknown";
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
  // A retired name (devin, continue...) means the platform that covers it now
  const targetLower = resolvePlatformId(target.toLowerCase());
  const normalizedTarget = TARGET_FILES[targetLower] ? targetLower : targetLower.replace(/-/g, "_");
  if (!TARGET_FILES[normalizedTarget]) {
    console.log(chalk.red(`  ✗ Unknown target format: ${target}`));
    console.log();
    console.log(chalk.gray("  Supported target formats:"));
    for (const [key, name] of Object.entries(PLATFORM_NAMES)) {
      if (isStructuredPlatform(key)) continue;
      console.log(chalk.gray(`    • ${key.padEnd(15)} → ${name}`));
    }
    for (const c of MCP_CONFIGS) {
      console.log(chalk.gray(`    • ${c.id.padEnd(15)} → MCP servers for ${c.name} (${c.file})`));
    }
    process.exit(1);
  }

  // A JSON or YAML config is not a rules file: wrapping rules in one gives a
  // file the tool ignores, and its settings are not rules to copy elsewhere
  const structured = [sourcePlatform, normalizedTarget].find(isStructuredPlatform);
  if (structured) {
    console.log(chalk.red(`  ✗ ${PLATFORM_NAMES[structured] || structured} uses a JSON/YAML config, not a rules file, so it cannot be converted`));
    console.log(chalk.gray(structured === "aider"
      ? "     Aider reads AGENTS.md when .aider.conf.yml lists it: run 'lynxp wizard -f aider' to add it"
      : `     Run 'lynxp wizard' and pick ${PLATFORM_NAMES[structured] || structured} to generate one`));
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
  const spinner = createSpinner("Converting configuration...").start();
  
  const targetContent = convertContent(sourceContent, sourcePlatform, normalizedTarget);
  
  spinner.stop();

  // Determine output path
  let outputFilename = options.output || rulesWritePath(cwd, TARGET_FILES[normalizedTarget]);
  
  // For commands, keep the command's name but use the target's folder and extension
  const targetCommand = COMMANDS.find((c) => c.id === normalizedTarget);
  if (targetCommand && !options.output) {
    const commandName = basename(sourcePath).replace(/(\.prompt)?\.(md|mdc|toml)$/, "");
    outputFilename = `${targetCommand.directory}/${commandName}${targetCommand.extension}`;
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

/** The MCP part of a file, or null when it has none or cannot be read. */
async function readMcpPart(path: string, target: McpConfigTarget): Promise<string | null> {
  try {
    return extractMcpConfig(await readFile(path, "utf-8"), target.id);
  } catch {
    return null;
  }
}

/**
 * Write the servers of one tool's MCP config in another tool's file. Without a
 * source, the first MCP config found in the project (other than the target) is
 * used. A settings or TOML target keeps its other settings; --force is needed
 * only to replace servers (or a whole file) already there.
 */
async function convertMcp(
  cwd: string,
  source: string | undefined,
  target: McpConfigTarget,
  options: ConvertOptions
): Promise<void> {
  let sourceFile = source;
  if (sourceFile === undefined) {
    for (const c of MCP_CONFIGS) {
      if (c.id !== target.id && (await readMcpPart(resolve(cwd, c.file), c)) !== null) {
        sourceFile = c.file;
        break;
      }
    }
  }
  if (sourceFile === undefined) {
    console.log(chalk.red("  ✗ No MCP config found. Looked for:"));
    for (const c of MCP_CONFIGS) console.log(chalk.gray(`    • ${c.file}`));
    process.exit(1);
  }

  const outputFile = options.output || target.file;
  const outputPath = resolve(cwd, outputFile);
  const existing = await readFile(outputPath, "utf-8").catch(() => null);

  let written: string;
  try {
    const converted = convertMcpConfig(await readFile(resolve(cwd, sourceFile), "utf-8"), target.id, sourceFile);
    written = existing === null ? converted : mergeMcpConfig(existing, converted, target.id, target.file);
  } catch (error) {
    console.log(chalk.red(`  ✗ Could not convert ${sourceFile}: ${error instanceof Error ? error.message : "unreadable"}`));
    process.exit(1);
  }

  const replaces = existing !== null && (target.kind === "whole" || (await readMcpPart(outputPath, target)) !== null);
  if (replaces && !options.force) {
    console.log(chalk.yellow(`  ⚠️ ${target.kind === "whole" ? "File already exists" : "MCP servers already set in"}: ${outputFile}`));
    console.log(chalk.gray("     Use --force to overwrite"));
    process.exit(1);
  }
  const { mkdir } = await import("fs/promises");
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, written, "utf-8");
  const kept = existing !== null && target.kind !== "whole" ? ", other settings kept" : "";
  console.log(chalk.green(`  ✓ Converted ${sourceFile} to ${outputFile} (MCP servers for ${target.name}${kept})`));
  console.log();
}

/**
 * Write a skill or subagent in another tool's folder: a skill's SKILL.md with
 * only the spec fields (all of them for .claude/skills), a subagent as
 * Markdown or, for Codex, as TOML.
 */
async function convertAsset(
  cwd: string,
  source: string | undefined,
  asset: (typeof ASSET_TARGETS)[number] | undefined,
  options: ConvertOptions
): Promise<void> {
  const loc = source !== undefined ? assetLocation(source) : null;
  const targets = ASSET_TARGETS.map((t) => t.id).join(", ");
  if (!loc || !asset || loc.kind !== asset.kind) {
    console.log(chalk.red("  ✗ A skill converts only to another skills folder, and a subagent to another agents folder."));
    console.log(chalk.gray(`     Usage: lynxp convert <SKILL.md or agent file> <target>, target one of: ${targets}`));
    process.exit(1);
  }
  if (loc.kind === "agent" && !source!.toLowerCase().endsWith(".md")) {
    console.log(chalk.red("  ✗ Only a Markdown subagent can be converted"));
    process.exit(1);
  }

  let content: string;
  try {
    content = await readFile(resolve(cwd, source!), "utf-8");
  } catch {
    console.log(chalk.red(`  ✗ Could not read source file: ${source}`));
    process.exit(1);
  }
  const files =
    loc.kind === "skill" ? skillFiles({ content }, [asset.target.id], loc.name) : subagentFiles({ content }, [asset.target.id], loc.name);
  const file = files.find((f) => f.path.startsWith(`${asset.target.directory}/`))!;

  const outputFile = options.output || `${loc.base}${file.path}`;
  const outputPath = resolve(cwd, outputFile);
  if (outputPath === resolve(cwd, source!)) {
    console.log(chalk.yellow(`  ⚠️ ${source} is already in ${asset.target.directory}`));
    process.exit(1);
  }
  const exists = await access(outputPath).then(() => true, () => false);
  if (exists && !options.force) {
    console.log(chalk.yellow(`  ⚠️ File already exists: ${outputFile}`));
    console.log(chalk.gray("     Use --force to overwrite"));
    process.exit(1);
  }
  const { mkdir } = await import("fs/promises");
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, withFinalNewline(file.content), "utf-8");
  console.log(chalk.green(`  ✓ Converted ${source} to ${outputFile} (${asset.target.name})`));
  console.log();
}
