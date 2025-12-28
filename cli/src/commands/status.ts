import chalk from "chalk";
import { access, readFile, readdir, stat } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { checkSyncStatus, loadBlueprints } from "../utils/blueprint-tracker.js";

// AI config files to look for
const CONFIG_FILES = [
  { path: "AGENTS.md", name: "AGENTS.md", platform: "Claude Code, Cursor, AI Agents" },
  { path: "CLAUDE.md", name: "CLAUDE.md", platform: "Claude Code" },
  { path: ".github/copilot-instructions.md", name: "Copilot Instructions", platform: "GitHub Copilot" },
  { path: ".windsurfrules", name: ".windsurfrules", platform: "Windsurf" },
  { path: ".zed/instructions.md", name: "Zed Instructions", platform: "Zed" },
  { path: ".clinerules", name: ".clinerules", platform: "Cline" },
  { path: ".goosehints", name: ".goosehints", platform: "Goose" },
  { path: "AIDER.md", name: "AIDER.md", platform: "Aider" },
];

// Directory-based configs
const CONFIG_DIRS = [
  { path: ".cursor/rules", name: ".cursor/rules/", platform: "Cursor" },
  { path: ".amazonq/rules", name: ".amazonq/rules/", platform: "Amazon Q" },
  { path: ".augment/rules", name: ".augment/rules/", platform: "Augment Code" },
];

export async function statusCommand(): Promise<void> {
  const cwd = process.cwd();
  
  console.log();
  console.log(chalk.cyan("🐱 LynxPrompt Status"));
  console.log(chalk.gray(`   Directory: ${cwd}`));
  console.log();

  // Check for .lynxprompt folder
  const lynxpromptExists = existsSync(join(cwd, ".lynxprompt"));
  if (lynxpromptExists) {
    console.log(chalk.green("✓ LynxPrompt initialized"));
    
    // Show config summary
    const configPath = join(cwd, ".lynxprompt/conf.yml");
    if (existsSync(configPath)) {
      try {
        const content = await readFile(configPath, "utf-8");
        const { parse } = await import("yaml");
        const config = parse(content);
        if (config?.exporters?.length > 0) {
          console.log(chalk.gray(`   Exporters: ${config.exporters.join(", ")}`));
        }
      } catch {
        // Ignore parse errors
      }
    }
    console.log();
  }

  // Show tracked blueprints
  const trackedStatus = await checkSyncStatus(cwd);
  if (trackedStatus.length > 0) {
    console.log(chalk.cyan("📦 Tracked Blueprints"));
    console.log();
    
    for (const { blueprint, localModified, fileExists } of trackedStatus) {
      const statusIcon = !fileExists
        ? chalk.red("✗")
        : localModified
        ? chalk.yellow("●")
        : chalk.green("✓");
      
      const sourceLabel = {
        marketplace: chalk.gray("[marketplace]"),
        team: chalk.blue("[team]"),
        private: chalk.green("[private]"),
        local: chalk.gray("[local]"),
      }[blueprint.source];

      console.log(`  ${statusIcon} ${chalk.bold(blueprint.file)} ${sourceLabel}`);
      console.log(`     ${chalk.gray(`ID: ${blueprint.id} • ${blueprint.name}`)}`);
      
      if (!fileExists) {
        console.log(chalk.red(`     ⚠ File missing - run 'lynxp pull ${blueprint.id}' to restore`));
      } else if (localModified) {
        if (blueprint.source === "marketplace") {
          console.log(chalk.yellow(`     ⚠ Local changes (marketplace = read-only, won't sync back)`));
        } else {
          console.log(chalk.yellow(`     ⚠ Local changes - run 'lynxp push ${blueprint.file}' to sync`));
        }
      }
      console.log();
    }
  }

  // Show AI config files
  console.log(chalk.cyan("📄 AI Config Files"));
  console.log();

  let foundAny = false;

  // Check single files
  for (const config of CONFIG_FILES) {
    const filePath = join(cwd, config.path);
    try {
      await access(filePath);
      const content = await readFile(filePath, "utf-8");
      const lines = content.split("\n").length;
      const size = formatBytes(content.length);

      foundAny = true;
      
      // Check if this file is tracked
      const tracked = trackedStatus.find(t => t.blueprint.file === config.path);
      const trackedLabel = tracked ? chalk.cyan(" (tracked)") : "";
      
      console.log(`  ${chalk.green("✓")} ${chalk.bold(config.name)}${trackedLabel}`);
      console.log(`     ${chalk.gray(`Platform: ${config.platform}`)}`);
      console.log(`     ${chalk.gray(`Size: ${size} (${lines} lines)`)}`);
      
      // Show first non-empty, non-comment line as preview
      const preview = getPreview(content);
      if (preview) {
        console.log(`     ${chalk.gray(`Preview: ${preview}`)}`);
      }
      console.log();
    } catch {
      // File doesn't exist, skip
    }
  }

  // Check directories
  for (const config of CONFIG_DIRS) {
    const dirPath = join(cwd, config.path);
    if (existsSync(dirPath)) {
      try {
        const files = await readdir(dirPath);
        const ruleFiles = files.filter(f => f.endsWith(".md") || f.endsWith(".mdc"));
        
        if (ruleFiles.length > 0) {
          foundAny = true;
          console.log(`  ${chalk.green("✓")} ${chalk.bold(config.name)}`);
          console.log(`     ${chalk.gray(`Platform: ${config.platform}`)}`);
          console.log(`     ${chalk.gray(`Rules: ${ruleFiles.length} file${ruleFiles.length === 1 ? "" : "s"}`)}`);
          
          // List rule files
          for (const file of ruleFiles.slice(0, 3)) {
            console.log(`     ${chalk.gray(`  • ${file}`)}`);
          }
          if (ruleFiles.length > 3) {
            console.log(`     ${chalk.gray(`  ... and ${ruleFiles.length - 3} more`)}`);
          }
          console.log();
        }
      } catch {
        // Can't read directory
      }
    }
  }

  if (!foundAny) {
    console.log(chalk.yellow("  No AI configuration files found."));
    console.log();
    console.log(chalk.gray("  Get started:"));
    console.log(chalk.gray("    lynxp wizard          Generate a configuration"));
    console.log(chalk.gray("    lynxp pull <id>       Download from marketplace"));
    console.log(chalk.gray("    lynxp search <query>  Search for blueprints"));
  } else {
    console.log(chalk.gray("Commands:"));
    console.log(chalk.gray("  lynxp wizard     Regenerate configuration"));
    console.log(chalk.gray("  lynxp check      Validate files"));
    console.log(chalk.gray("  lynxp link --list  Show tracked blueprints"));
  }
  console.log();
}

function getPreview(content: string): string | null {
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed &&
      !trimmed.startsWith("#") &&
      !trimmed.startsWith("//") &&
      !trimmed.startsWith("<!--") &&
      !trimmed.startsWith("---") &&
      !trimmed.startsWith(">")
    ) {
      return truncate(trimmed, 50);
    }
  }
  return null;
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
