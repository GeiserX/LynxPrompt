import chalk from "chalk";
import ora from "ora";
import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import prompts from "prompts";
import { api, ApiRequestError } from "../api.js";
import { isAuthenticated } from "../config.js";
import {
  findBlueprintByFile,
  trackBlueprint,
  updateChecksum,
  loadBlueprints,
} from "../utils/blueprint-tracker.js";

interface PushOptions {
  name?: string;
  description?: string;
  visibility?: string;
  tags?: string;
  yes?: boolean;
}

interface HierarchyInfo {
  repositoryPath: string | null;
  repositoryRoot: string | null;
  parentId: string | null;
}

/**
 * Detect hierarchy info for a file being pushed
 * Reads from .lynxprompt/hierarchy.json if it exists, or scans for AGENTS.md files
 */
async function detectHierarchyInfo(cwd: string, file: string): Promise<HierarchyInfo> {
  const result: HierarchyInfo = {
    repositoryPath: null,
    repositoryRoot: null,
    parentId: null,
  };

  try {
    // Check for hierarchy.json (created by `lynxp import --save`)
    const hierarchyPath = path.join(cwd, ".lynxprompt", "hierarchy.json");
    if (fs.existsSync(hierarchyPath)) {
      const hierarchyData = JSON.parse(fs.readFileSync(hierarchyPath, "utf-8"));
      
      // Find this file in the hierarchy
      const relativePath = path.relative(cwd, path.resolve(file));
      
      for (const group of hierarchyData.hierarchy || []) {
        // Check if this is the root file
        if (group.rootFile === relativePath) {
          result.repositoryPath = relativePath;
          result.repositoryRoot = createRepositoryRoot(hierarchyData.rootPath || cwd);
          break;
        }
        
        // Check if this is a child file
        for (const child of group.children || []) {
          if (child.path === relativePath) {
            result.repositoryPath = relativePath;
            result.repositoryRoot = createRepositoryRoot(hierarchyData.rootPath || cwd);
            
            // Find parent blueprint ID if the root file was already pushed
            if (group.rootFile) {
              const blueprints = await loadBlueprints(cwd);
              const parentBlueprint = blueprints.blueprints.find(
                b => b.file === group.rootFile
              );
              if (parentBlueprint) {
                result.parentId = parentBlueprint.id;
              }
            }
            break;
          }
        }
      }
    }

    // If no hierarchy.json, try to auto-detect based on file location
    if (!result.repositoryPath) {
      const relativePath = path.relative(cwd, path.resolve(file));
      
      // Check if file is in a subdirectory (potential monorepo child)
      if (relativePath.includes(path.sep) && !relativePath.startsWith("..")) {
        result.repositoryPath = relativePath;
        result.repositoryRoot = createRepositoryRoot(cwd);
        
        // Check if there's an AGENTS.md at the root
        const rootAgentsMd = path.join(cwd, "AGENTS.md");
        if (fs.existsSync(rootAgentsMd) && path.resolve(file) !== rootAgentsMd) {
          // Look for a tracked blueprint for the root AGENTS.md
          const blueprints = await loadBlueprints(cwd);
          const parentBlueprint = blueprints.blueprints.find(
            b => b.file === "AGENTS.md"
          );
          if (parentBlueprint) {
            result.parentId = parentBlueprint.id;
          }
        }
      } else if (relativePath === "AGENTS.md" || relativePath === path.basename(file)) {
        // Root-level file, check for children
        result.repositoryPath = relativePath;
        result.repositoryRoot = createRepositoryRoot(cwd);
      }
    }
  } catch (error) {
    // Silently fail - hierarchy detection is optional
  }

  return result;
}

/**
 * Create a stable repository root identifier from a path
 */
function createRepositoryRoot(rootPath: string): string {
  // Try to get git remote URL first
  try {
    const gitConfigPath = path.join(rootPath, ".git", "config");
    if (fs.existsSync(gitConfigPath)) {
      const gitConfig = fs.readFileSync(gitConfigPath, "utf-8");
      const urlMatch = gitConfig.match(/url = (.+)/);
      if (urlMatch) {
        // Hash the git URL for consistent identification
        return createHash("sha256").update(urlMatch[1].trim()).digest("hex").substring(0, 16);
      }
    }
  } catch {
    // Fall through to path-based hashing
  }
  
  // Fall back to hashing the absolute path
  return createHash("sha256").update(path.resolve(rootPath)).digest("hex").substring(0, 16);
}

export async function pushCommand(
  fileArg: string | undefined,
  options: PushOptions
): Promise<void> {
  const cwd = process.cwd();

  // Check authentication
  if (!isAuthenticated()) {
    console.log(chalk.yellow("You need to be logged in to push blueprints."));
    console.log(chalk.gray("Run 'lynxp login' to authenticate."));
    process.exit(1);
  }

  // Find the file to push
  const file = fileArg || findDefaultFile();
  if (!file) {
    console.log(chalk.red("No AI configuration file found."));
    console.log(
      chalk.gray("Specify a file or run in a directory with AGENTS.md, CLAUDE.md, etc.")
    );
    process.exit(1);
  }

  if (!fs.existsSync(file)) {
    console.log(chalk.red(`File not found: ${file}`));
    process.exit(1);
  }

  const content = fs.readFileSync(file, "utf-8");
  const filename = path.basename(file);

  // Check if file is already linked to a blueprint
  const linked = await findBlueprintByFile(cwd, file);

  if (linked) {
    // Update existing blueprint
    await updateBlueprint(cwd, file, linked.id, content, options);
  } else {
    // Create new blueprint or link to existing
    await createOrLinkBlueprint(cwd, file, filename, content, options);
  }
}

async function updateBlueprint(
  cwd: string,
  file: string,
  blueprintId: string,
  content: string,
  options: PushOptions
): Promise<void> {
  console.log(chalk.cyan(`\n📤 Updating blueprint ${chalk.bold(blueprintId)}...`));
  console.log(chalk.gray(`   File: ${file}`));

  if (!options.yes) {
    const confirm = await prompts({
      type: "confirm",
      name: "value",
      message: `Push changes to ${blueprintId}?`,
      initial: true,
    });

    if (!confirm.value) {
      console.log(chalk.yellow("Push cancelled."));
      return;
    }
  }

  const spinner = ora("Pushing changes...").start();

  try {
    const result = await api.updateBlueprint(blueprintId, { content });
    spinner.succeed("Blueprint updated!");

    // Update local tracking
    await updateChecksum(cwd, file, content);

    console.log();
    console.log(chalk.green(`✅ Successfully updated ${chalk.bold(result.blueprint.name)}`));
    console.log(chalk.gray(`   ID: ${blueprintId}`));
    console.log(chalk.gray(`   View: https://lynxprompt.com/templates/${blueprintId.replace("bp_", "")}`));
  } catch (error) {
    spinner.fail("Failed to update blueprint");
    handleError(error);
  }
}

async function createOrLinkBlueprint(
  cwd: string,
  file: string,
  filename: string,
  content: string,
  options: PushOptions
): Promise<void> {
  console.log(chalk.cyan("\n📤 Push new blueprint"));
  console.log(chalk.gray(`   File: ${file}`));

  // Ask for details if not provided
  let name = options.name;
  let description = options.description;
  let visibility = options.visibility || "PRIVATE";
  let tags = options.tags ? options.tags.split(",").map((t) => t.trim()) : [];

  if (!options.yes) {
    const responses = await prompts([
      {
        type: name ? null : "text",
        name: "name",
        message: "Blueprint name:",
        initial: filename.replace(/\.(md|mdc|json|yml|yaml)$/, ""),
        validate: (v) => v.length > 0 || "Name is required",
      },
      {
        type: description ? null : "text",
        name: "description",
        message: "Description:",
        initial: "",
      },
      {
        type: "select",
        name: "visibility",
        message: "Visibility:",
        choices: [
          { title: "Private (only you)", value: "PRIVATE" },
          { title: "Team (your team members)", value: "TEAM" },
          { title: "Public (visible to everyone)", value: "PUBLIC" },
        ],
        initial: 0,
      },
      {
        type: "text",
        name: "tags",
        message: "Tags (comma-separated):",
        initial: "",
      },
    ]);

    if (!responses.name && !name) {
      console.log(chalk.yellow("Push cancelled."));
      return;
    }

    name = name || responses.name;
    description = description || responses.description || "";
    visibility = responses.visibility || visibility;
    tags = responses.tags ? responses.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : tags;
  }

  if (!name) {
    name = filename.replace(/\.(md|mdc|json|yml|yaml)$/, "");
  }

  // Detect hierarchy info for monorepo support
  const hierarchyInfo = await detectHierarchyInfo(cwd, file);
  
  const spinner = ora("Creating blueprint...").start();

  try {
    const result = await api.createBlueprint({
      name,
      description: description || "",
      content,
      visibility: visibility as "PRIVATE" | "TEAM" | "PUBLIC",
      tags,
      // Include hierarchy info if detected
      parent_id: hierarchyInfo.parentId,
      repository_path: hierarchyInfo.repositoryPath,
      repository_root: hierarchyInfo.repositoryRoot,
    });

    spinner.succeed("Blueprint created!");

    // Track the blueprint locally
    await trackBlueprint(cwd, {
      id: result.blueprint.id,
      name: result.blueprint.name,
      file,
      content,
      source: "private",
    });

    console.log();
    console.log(chalk.green(`✅ Created blueprint ${chalk.bold(result.blueprint.name)}`));
    console.log(chalk.gray(`   ID: ${result.blueprint.id}`));
    console.log(chalk.gray(`   Visibility: ${visibility}`));
    if (hierarchyInfo.repositoryPath) {
      console.log(chalk.gray(`   Path: ${hierarchyInfo.repositoryPath}`));
    }
    if (hierarchyInfo.parentId) {
      console.log(chalk.cyan(`   ↳ Linked to parent blueprint: ${hierarchyInfo.parentId}`));
    }
    if (visibility === "PUBLIC") {
      console.log(chalk.gray(`   View: https://lynxprompt.com/templates/${result.blueprint.id.replace("bp_", "")}`));
    }
    console.log();
    console.log(chalk.cyan("The file is now linked. Future 'lynxp push' will update this blueprint."));
  } catch (error) {
    spinner.fail("Failed to create blueprint");
    handleError(error);
  }
}

function findDefaultFile(): string | null {
  const candidates = [
    "AGENTS.md",
    "CLAUDE.md",
    ".cursor/rules/project.mdc",
    ".github/copilot-instructions.md",
    ".windsurfrules",
    "AIDER.md",
    "GEMINI.md",
    ".clinerules",
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function handleError(error: unknown): void {
  if (error instanceof ApiRequestError) {
    console.error(chalk.red(`Error: ${error.message}`));
    if (error.statusCode === 401) {
      console.error(chalk.gray("Your session may have expired. Run 'lynxp login' to re-authenticate."));
    } else if (error.statusCode === 403) {
      console.error(chalk.gray("You don't have permission to modify this blueprint."));
    } else if (error.statusCode === 404) {
      console.error(chalk.gray("Blueprint not found. It may have been deleted."));
    }
  } else {
    console.error(chalk.red("An unexpected error occurred."));
  }
  process.exit(1);
}
