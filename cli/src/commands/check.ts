/**
 * Check command - validate AI configuration files
 * 
 * Validates configuration files for CI/CD pipelines and pre-commit hooks.
 * 
 * Usage:
 *   lynxp check           - Interactive validation with detailed output
 *   lynxp check --ci      - CI mode with exit codes (0 = pass, 1 = fail)
 */

import chalk from "chalk";
import ora from "ora";
import { readFile, access, readdir, stat } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import * as yaml from "yaml";

interface CheckOptions {
  ci?: boolean;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  files: string[];
}

// Known AI config files
const CONFIG_FILES = [
  { path: "AGENTS.md", name: "AGENTS.md" },
  { path: "CLAUDE.md", name: "CLAUDE.md" },
  { path: ".github/copilot-instructions.md", name: "GitHub Copilot" },
  { path: ".windsurfrules", name: "Windsurf" },
  { path: ".clinerules", name: "Cline" },
  { path: ".goosehints", name: "Goose" },
  { path: ".zed/instructions.md", name: "Zed" },
];

const CONFIG_DIRS = [
  { path: ".cursor/rules", name: "Cursor" },
  { path: ".lynxprompt", name: "LynxPrompt" },
];

/**
 * Validate markdown content for common issues
 */
function validateMarkdown(content: string, filename: string): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for empty content
  if (!content.trim()) {
    errors.push(`${filename}: File is empty`);
    return { errors, warnings };
  }

  // Check for minimum content
  if (content.trim().length < 50) {
    warnings.push(`${filename}: Content seems too short (< 50 chars)`);
  }

  // Check for header
  if (!content.includes("#")) {
    warnings.push(`${filename}: No markdown headers found`);
  }

  // Check for common placeholder text
  const placeholders = [
    "TODO",
    "FIXME",
    "YOUR_",
    "REPLACE_",
    "[INSERT",
    "example.com",
  ];
  
  for (const placeholder of placeholders) {
    if (content.includes(placeholder)) {
      warnings.push(`${filename}: Contains placeholder text "${placeholder}"`);
    }
  }

  // Check for potential secrets (basic patterns)
  const secretPatterns = [
    /sk[_-][a-zA-Z0-9]{20,}/,  // Stripe-like keys
    /ghp_[a-zA-Z0-9]{36}/,     // GitHub tokens
    /api[_-]?key[_-]?=\s*[a-zA-Z0-9]{20,}/i,
  ];

  for (const pattern of secretPatterns) {
    if (pattern.test(content)) {
      errors.push(`${filename}: Potential secret/API key detected - DO NOT commit secrets!`);
      break;
    }
  }

  return { errors, warnings };
}

/**
 * Validate LynxPrompt configuration
 */
async function validateLynxPromptConfig(cwd: string): Promise<{ errors: string[]; warnings: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const configPath = join(cwd, ".lynxprompt/conf.yml");
  
  if (!existsSync(configPath)) {
    return { errors, warnings };
  }

  try {
    const content = await readFile(configPath, "utf-8");
    const config = yaml.parse(content);

    // Check version
    if (!config.version) {
      warnings.push(".lynxprompt/conf.yml: Missing 'version' field");
    }

    // Check exporters
    if (!config.exporters || !Array.isArray(config.exporters)) {
      errors.push(".lynxprompt/conf.yml: Missing or invalid 'exporters' field");
    } else if (config.exporters.length === 0) {
      warnings.push(".lynxprompt/conf.yml: No exporters configured");
    }

    // Check sources
    if (!config.sources || !Array.isArray(config.sources)) {
      errors.push(".lynxprompt/conf.yml: Missing or invalid 'sources' field");
    } else {
      for (const source of config.sources) {
        if (source.type === "local" && source.path) {
          const sourcePath = join(cwd, source.path);
          if (!existsSync(sourcePath)) {
            errors.push(`.lynxprompt/conf.yml: Source path not found: ${source.path}`);
          }
        }
      }
    }
  } catch (error) {
    errors.push(`.lynxprompt/conf.yml: Invalid YAML syntax - ${error instanceof Error ? error.message : "parse error"}`);
  }

  return { errors, warnings };
}

/**
 * Validate MDC files (Cursor format)
 */
function validateMdc(content: string, filename: string): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for frontmatter
  if (!content.startsWith("---")) {
    warnings.push(`${filename}: Missing YAML frontmatter`);
  } else {
    // Try to parse frontmatter
    const frontmatterEnd = content.indexOf("---", 3);
    if (frontmatterEnd === -1) {
      errors.push(`${filename}: Unclosed YAML frontmatter`);
    } else {
      const frontmatter = content.substring(3, frontmatterEnd).trim();
      try {
        yaml.parse(frontmatter);
      } catch {
        errors.push(`${filename}: Invalid YAML frontmatter`);
      }
    }
  }

  // Also run standard markdown validation on content after frontmatter
  const bodyStart = content.indexOf("---", 3);
  if (bodyStart !== -1) {
    const body = content.substring(bodyStart + 3).trim();
    const mdResult = validateMarkdown(body, filename);
    // Only add body-related warnings, not errors (frontmatter is the critical part for MDC)
    warnings.push(...mdResult.warnings);
  }

  return { errors, warnings };
}

export async function checkCommand(options: CheckOptions = {}): Promise<void> {
  const isCi = options.ci;
  const cwd = process.cwd();

  if (!isCi) {
    console.log();
    console.log(chalk.cyan("🐱 LynxPrompt Check"));
    console.log();
  }

  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    files: [],
  };

  const spinner = !isCi ? ora("Scanning for configuration files...").start() : null;

  // Check for config files
  for (const file of CONFIG_FILES) {
    const filePath = join(cwd, file.path);
    if (existsSync(filePath)) {
      result.files.push(file.path);
      try {
        const content = await readFile(filePath, "utf-8");
        const validation = validateMarkdown(content, file.path);
        result.errors.push(...validation.errors);
        result.warnings.push(...validation.warnings);
      } catch (error) {
        result.errors.push(`${file.path}: Could not read file`);
      }
    }
  }

  // Check for config directories
  for (const dir of CONFIG_DIRS) {
    const dirPath = join(cwd, dir.path);
    if (existsSync(dirPath)) {
      try {
        const files = await readdir(dirPath);
        for (const file of files) {
          const filePath = join(dirPath, file);
          const fileStat = await stat(filePath);
          
          if (fileStat.isFile()) {
            result.files.push(`${dir.path}/${file}`);
            const content = await readFile(filePath, "utf-8");
            
            // Use MDC validation for .mdc files
            if (file.endsWith(".mdc")) {
              const validation = validateMdc(content, `${dir.path}/${file}`);
              result.errors.push(...validation.errors);
              result.warnings.push(...validation.warnings);
            } else if (file.endsWith(".md")) {
              const validation = validateMarkdown(content, `${dir.path}/${file}`);
              result.errors.push(...validation.errors);
              result.warnings.push(...validation.warnings);
            }
          }
        }
      } catch {
        // Directory exists but can't be read
      }
    }
  }

  // Check LynxPrompt config
  const lynxpromptValidation = await validateLynxPromptConfig(cwd);
  result.errors.push(...lynxpromptValidation.errors);
  result.warnings.push(...lynxpromptValidation.warnings);

  spinner?.stop();

  // Determine overall result
  result.valid = result.errors.length === 0;

  // Output results
  if (isCi) {
    // CI mode - minimal output, use exit codes
    if (!result.valid) {
      console.error("✗ Validation failed");
      for (const error of result.errors) {
        console.error(`  ${error}`);
      }
      process.exit(1);
    } else if (result.files.length === 0) {
      console.error("✗ No configuration files found");
      process.exit(1);
    } else {
      console.log("✓ Validation passed");
      if (result.warnings.length > 0) {
        console.log(`  (${result.warnings.length} warning${result.warnings.length === 1 ? "" : "s"})`);
      }
      process.exit(0);
    }
  } else {
    // Interactive mode - detailed output
    if (result.files.length === 0) {
      console.log(chalk.yellow("⚠ No AI configuration files found."));
      console.log();
      console.log(chalk.gray("Run 'lynxp wizard' to create a configuration."));
      return;
    }

    console.log(chalk.green(`✓ Found ${result.files.length} configuration file${result.files.length === 1 ? "" : "s"}:`));
    for (const file of result.files) {
      console.log(chalk.gray(`  ${file}`));
    }
    console.log();

    if (result.errors.length > 0) {
      console.log(chalk.red(`✗ ${result.errors.length} error${result.errors.length === 1 ? "" : "s"}:`));
      for (const error of result.errors) {
        console.log(chalk.red(`  ${error}`));
      }
      console.log();
    }

    if (result.warnings.length > 0) {
      console.log(chalk.yellow(`⚠ ${result.warnings.length} warning${result.warnings.length === 1 ? "" : "s"}:`));
      for (const warning of result.warnings) {
        console.log(chalk.yellow(`  ${warning}`));
      }
      console.log();
    }

    if (result.valid) {
      console.log(chalk.green("✅ Validation passed!"));
    } else {
      console.log(chalk.red("❌ Validation failed. Fix the errors above."));
    }
    console.log();
  }
}

