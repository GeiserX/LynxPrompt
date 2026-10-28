#!/usr/bin/env node
/**
 * LynxPrompt CLI - Merge Command
 * 
 * Merge two or more AI IDE configuration files into one.
 * Useful for combining rules from different sources or team configs.
 */

import chalk from "chalk";
import { readFile, writeFile, access } from "fs/promises";
import { basename, resolve } from "path";
import ora from "ora";
import prompts from "prompts";
import { parseMarkdownSections, mergeSectionsByStrategy, type ConfigSection } from "../utils/markdown-sections.js";

interface MergeOptions {
  output?: string;
  strategy?: "concat" | "sections" | "smart";
  force?: boolean;
  interactive?: boolean;
}

export async function mergeCommand(
  files: string[],
  options: MergeOptions
): Promise<void> {
  console.log();
  console.log(chalk.cyan.bold("  🔀 LynxPrompt Merge"));
  console.log(chalk.gray("     Merge multiple AI IDE configuration files"));
  console.log();

  // Validate input
  if (files.length < 2) {
    console.log(chalk.red("  ✗ Please provide at least 2 files to merge"));
    console.log();
    console.log(chalk.gray("  Usage: lynxp merge <file1> <file2> [...files]"));
    console.log(chalk.gray("  Example: lynxp merge AGENTS.md team-rules.md --output merged.md"));
    console.log();
    console.log(chalk.gray("  Options:"));
    console.log(chalk.gray("    --output <file>     Output filename (default: merged.md)"));
    console.log(chalk.gray("    --strategy <type>   Merge strategy: concat, sections, smart (default: smart)"));
    console.log(chalk.gray("    --force             Overwrite existing output file"));
    console.log(chalk.gray("    --interactive       Review and select sections to include"));
    process.exit(1);
  }

  const cwd = process.cwd();
  const strategy = options.strategy || "smart";
  
  console.log(chalk.white(`  Files to merge: ${files.length}`));
  console.log(chalk.white(`  Strategy: ${strategy}`));
  console.log();

  // Read all files
  const allSections: ConfigSection[][] = [];
  
  for (const file of files) {
    const filePath = resolve(cwd, file);
    
    try {
      await access(filePath);
    } catch {
      console.log(chalk.red(`  ✗ File not found: ${file}`));
      process.exit(1);
    }
    
    try {
      const content = await readFile(filePath, "utf-8");
      const sections = parseMarkdownSections(content, basename(file));
      allSections.push(sections);
      console.log(chalk.gray(`  ✓ Read ${file} (${sections.length} sections)`));
    } catch (error) {
      console.log(chalk.red(`  ✗ Could not read ${file}: ${error instanceof Error ? error.message : "unknown"}`));
      process.exit(1);
    }
  }
  
  console.log();

  // Interactive mode: let user select sections
  if (options.interactive) {
    const flatSections = allSections.flatMap((sections, i) => 
      sections.map(s => ({ ...s, fileIndex: i }))
    );
    
    const choices = flatSections.map((section, i) => ({
      title: `[${section.source}] ${section.title}`,
      value: i,
      selected: true,
    }));
    
    const response = await prompts({
      type: "multiselect",
      name: "sections",
      message: "Select sections to include:",
      choices,
      instructions: false,
      hint: "- Space to toggle, Enter to confirm",
    });
    
    if (!response.sections || response.sections.length === 0) {
      console.log(chalk.yellow("  No sections selected, aborting."));
      process.exit(0);
    }
    
    // Filter to selected sections
    const selectedSections = response.sections.map((i: number) => flatSections[i]);
    allSections.length = 0;
    allSections.push(selectedSections);
  }

  // Merge
  const spinner = ora("Merging configurations...").start();
  const mergedContent = mergeSectionsByStrategy(allSections, strategy);
  spinner.stop();

  // Add header
  const finalContent = `# AI Assistant Configuration (Merged)

<!-- 
  Merged from: ${files.join(", ")}
  Strategy: ${strategy}
  Date: ${new Date().toISOString()}
-->

${mergedContent}
`;

  // Determine output path
  const outputFilename = options.output || "merged.md";
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
    await writeFile(outputPath, finalContent, "utf-8");
    
    console.log(chalk.green(`  ✓ Merged to ${outputFilename}`));
    console.log();
    console.log(chalk.gray(`  Sources: ${files.length} files`));
    console.log(chalk.gray(`  Lines: ${finalContent.split("\n").length}`));
    console.log(chalk.gray(`  Size: ${finalContent.length} bytes`));
    console.log();
  } catch (error) {
    console.log(chalk.red(`  ✗ Could not write output: ${error instanceof Error ? error.message : "unknown error"}`));
    process.exit(1);
  }
}

