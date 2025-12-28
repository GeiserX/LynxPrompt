import chalk from "chalk";
import { access, readFile } from "fs/promises";
import { join } from "path";

// AI config files to look for
const CONFIG_FILES = [
  { path: "AGENTS.md", name: "AGENTS.md", platform: "Claude Code, Cursor, AI Agents" },
  { path: "CLAUDE.md", name: "CLAUDE.md", platform: "Claude Code" },
  { path: ".cursorrules", name: ".cursorrules", platform: "Cursor" },
  { path: ".github/copilot-instructions.md", name: "Copilot Instructions", platform: "GitHub Copilot" },
  { path: ".windsurfrules", name: ".windsurfrules", platform: "Windsurf" },
  { path: ".zed/instructions.md", name: "Zed Instructions", platform: "Zed" },
];

export async function statusCommand(): Promise<void> {
  const cwd = process.cwd();
  
  console.log();
  console.log(chalk.cyan("🐱 AI Config Status"));
  console.log(chalk.gray(`   Directory: ${cwd}`));
  console.log();

  let foundAny = false;

  for (const config of CONFIG_FILES) {
    const filePath = join(cwd, config.path);
    try {
      await access(filePath);
      const content = await readFile(filePath, "utf-8");
      const lines = content.split("\n").length;
      const size = formatBytes(content.length);

      foundAny = true;
      console.log(`  ${chalk.green("✓")} ${chalk.bold(config.name)}`);
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

  if (!foundAny) {
    console.log(chalk.yellow("  No AI configuration files found in this directory."));
    console.log();
    console.log(chalk.gray("  Run 'lynxprompt init' to create a configuration."));
    console.log(chalk.gray("  Or run 'lynxprompt pull <id>' to download an existing blueprint."));
  } else {
    console.log(chalk.gray("Run 'lynxprompt init' to update or create additional configs."));
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
      !trimmed.startsWith("<!--")
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


