#!/usr/bin/env node
/**
 * LynxPrompt CLI - Analyze Command
 * 
 * Standalone project analyzer that detects project configuration
 * without generating any files.
 */

import chalk from "chalk";
import ora from "ora";
import { detectProject, detectFromRemoteUrl, isGitUrl, detectRepoHost } from "../utils/detect.js";

interface AnalyzeOptions {
  json?: boolean;
  remote?: string;
}

export async function analyzeCommand(options: AnalyzeOptions): Promise<void> {
  console.log();
  
  if (!options.json) {
    console.log(chalk.cyan.bold("  🔍 LynxPrompt Analyzer"));
    console.log(chalk.gray("     Detect project configuration and tech stack"));
    console.log();
  }

  let detected;
  let source = "local";

  // Check for remote URL option
  if (options.remote) {
    if (!isGitUrl(options.remote)) {
      if (!options.json) {
        console.log(chalk.red("  ✗ Invalid Git URL provided"));
      }
      process.exit(1);
    }

    const host = detectRepoHost(options.remote);
    const method = host === "github" ? "GitHub API" : host === "gitlab" ? "GitLab API" : "shallow clone";

    if (!options.json) {
      const spinner = ora(`Analyzing remote repository via ${method}...`).start();
      detected = await detectFromRemoteUrl(options.remote);
      
      if (detected) {
        spinner.succeed("Remote repository analyzed");
      } else {
        spinner.fail("Could not analyze repository");
        console.log(chalk.gray("  The repository may be private or inaccessible."));
        process.exit(1);
      }
    } else {
      detected = await detectFromRemoteUrl(options.remote);
      if (!detected) {
        console.log(JSON.stringify({ error: "Could not analyze repository" }));
        process.exit(1);
      }
    }
    
    source = options.remote;
  } else {
    // Analyze current directory
    if (!options.json) {
      const spinner = ora("Analyzing current directory...").start();
      detected = await detectProject(process.cwd());
      
      if (detected) {
        spinner.succeed("Project analyzed");
      } else {
        spinner.info("No project detected");
      }
    } else {
      detected = await detectProject(process.cwd());
    }
  }

  // Output results
  if (options.json) {
    console.log(JSON.stringify({
      source,
      detected: detected || null,
    }, null, 2));
    return;
  }

  console.log();

  if (!detected) {
    console.log(chalk.yellow("  No project configuration detected."));
    console.log();
    console.log(chalk.gray("  Tips:"));
    console.log(chalk.gray("  • Make sure you're in a project directory with a package.json, pyproject.toml, etc."));
    console.log(chalk.gray("  • Use --remote <url> to analyze a remote repository"));
    console.log();
    return;
  }

  // Display analysis results
  console.log(chalk.green.bold("  📊 Project Analysis"));
  console.log();
  
  // Basic info
  console.log(chalk.white("  Basic Info"));
  console.log(chalk.gray("  ─────────────────────────────────────────"));
  console.log(`  ${chalk.dim("Name:")}          ${chalk.white(detected.name || "unknown")}`);
  if (detected.description) {
    console.log(`  ${chalk.dim("Description:")}   ${chalk.gray(detected.description)}`);
  }
  console.log(`  ${chalk.dim("Type:")}          ${chalk.white(detected.type || "application")}`);
  if (detected.license) {
    console.log(`  ${chalk.dim("License:")}       ${chalk.white(detected.license.toUpperCase())}`);
  }
  console.log();

  // Tech Stack
  console.log(chalk.white("  Tech Stack"));
  console.log(chalk.gray("  ─────────────────────────────────────────"));
  if (detected.stack.length > 0) {
    for (const tech of detected.stack) {
      console.log(`  ${chalk.cyan("•")} ${tech}`);
    }
  } else {
    console.log(chalk.gray("  No tech stack detected"));
  }
  console.log();

  // Infrastructure
  console.log(chalk.white("  Infrastructure"));
  console.log(chalk.gray("  ─────────────────────────────────────────"));
  console.log(`  ${chalk.dim("Package Manager:")} ${detected.packageManager || chalk.gray("none detected")}`);
  console.log(`  ${chalk.dim("Repo Host:")}       ${detected.repoHost || chalk.gray("none detected")}`);
  console.log(`  ${chalk.dim("CI/CD:")}           ${detected.cicd || chalk.gray("none detected")}`);
  console.log(`  ${chalk.dim("Docker:")}          ${detected.hasDocker ? chalk.green("yes") : chalk.gray("no")}`);
  console.log();

  // Commands
  if (detected.commands && Object.keys(detected.commands).length > 0) {
    console.log(chalk.white("  Commands"));
    console.log(chalk.gray("  ─────────────────────────────────────────"));
    for (const [key, value] of Object.entries(detected.commands)) {
      if (value) {
        const cmdValue = Array.isArray(value) ? value.join(", ") : value;
        console.log(`  ${chalk.dim(key.padEnd(10))}  ${chalk.yellow(cmdValue)}`);
      }
    }
    console.log();
  }

  // Recommendations
  console.log(chalk.white("  💡 Recommendations"));
  console.log(chalk.gray("  ─────────────────────────────────────────"));
  
  const recommendations: string[] = [];
  
  // Check for missing common configs
  if (!detected.cicd) {
    recommendations.push("Add CI/CD configuration (GitHub Actions, GitLab CI, etc.)");
  }
  if (!detected.hasDocker && detected.type === "application") {
    recommendations.push("Consider adding Docker for containerization");
  }
  if (!detected.stack.some(s => ["vitest", "jest", "pytest", "mocha"].includes(s))) {
    recommendations.push("Add a test framework (vitest, jest, pytest, etc.)");
  }
  if (!detected.commands?.lint) {
    recommendations.push("Add a linting command (eslint, ruff, clippy, etc.)");
  }
  if (!detected.license) {
    recommendations.push("Add a LICENSE file for open source projects");
  }

  if (recommendations.length > 0) {
    for (const rec of recommendations) {
      console.log(`  ${chalk.yellow("•")} ${rec}`);
    }
  } else {
    console.log(chalk.green("  ✓ Project looks well-configured!"));
  }
  
  console.log();
  console.log(chalk.gray("  Run 'lynxp wizard' to generate AI IDE configuration"));
  console.log();
}

