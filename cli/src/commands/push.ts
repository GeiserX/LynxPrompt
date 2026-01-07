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
import { isCommandFilePath, inferCommandTypeFromPath, detectCommandFiles } from "../utils/detect.js";

interface PushOptions {
  name?: string;
  description?: string;
  visibility?: string;
  tags?: string;
  yes?: boolean;
  force?: boolean;
}

interface HierarchyInfo {
  repositoryPath: string | null;
  hierarchyId: string | null;
  parentId: string | null;
  repositoryRoot: string; // Used to create/find hierarchy
}

interface DiscoveredFile {
  path: string;       // Relative path from cwd
  absolutePath: string;
  isRoot: boolean;    // Is this the root AGENTS.md?
}

/**
 * Scan for AGENTS.md files in current directory and subdirectories
 */
function scanForAgentFiles(cwd: string, maxDepth: number = 5): DiscoveredFile[] {
  const results: DiscoveredFile[] = [];
  
  function scan(dir: string, depth: number) {
    if (depth > maxDepth) return;
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        // Skip common non-project directories
        if (entry.isDirectory()) {
          if (["node_modules", ".git", "dist", "build", ".next", "__pycache__", "venv", ".venv"].includes(entry.name)) {
            continue;
          }
          scan(fullPath, depth + 1);
        } else if (entry.name === "AGENTS.md") {
          const relativePath = path.relative(cwd, fullPath);
          results.push({
            path: relativePath,
            absolutePath: fullPath,
            isRoot: relativePath === "AGENTS.md",
          });
        }
      }
    } catch {
      // Ignore directories we can't read
    }
  }
  
  scan(cwd, 0);
  
  // Sort: root first, then alphabetically by path
  results.sort((a, b) => {
    if (a.isRoot && !b.isRoot) return -1;
    if (!a.isRoot && b.isRoot) return 1;
    return a.path.localeCompare(b.path);
  });
  
  return results;
}

/**
 * Detect hierarchy info for a file being pushed
 * Creates or gets a hierarchy for the repository
 */
async function detectHierarchyInfo(cwd: string, file: string): Promise<HierarchyInfo> {
  const repositoryRoot = createRepositoryRoot(cwd);
  const result: HierarchyInfo = {
    repositoryPath: null,
    hierarchyId: null,
    parentId: null,
    repositoryRoot,
  };

  try {
    const relativePath = path.relative(cwd, path.resolve(file));
    
    // Check if file is in a subdirectory (potential monorepo child)
    if (relativePath.includes(path.sep) && !relativePath.startsWith("..")) {
      result.repositoryPath = relativePath;
      
      // Check if there's an AGENTS.md at the root that was already pushed
      const rootAgentsMd = path.join(cwd, "AGENTS.md");
      if (fs.existsSync(rootAgentsMd) && path.resolve(file) !== rootAgentsMd) {
        const blueprints = await loadBlueprints(cwd);
        const parentBlueprint = blueprints.blueprints.find(
          b => b.file === "AGENTS.md"
        );
        if (parentBlueprint) {
          result.parentId = parentBlueprint.id;
        }
      }
    } else if (relativePath === "AGENTS.md" || relativePath === path.basename(file)) {
      // Root-level file
      result.repositoryPath = relativePath;
    }
  } catch {
    // Silently fail - hierarchy detection is optional
  }

  return result;
}

/**
 * Ensure a hierarchy exists for the repository and return its ID
 */
async function ensureHierarchy(_cwd: string, repositoryRoot: string, name: string): Promise<string | null> {
  try {
    // Try to create or get existing hierarchy
    const response = await api.createHierarchy({
      name,
      repository_root: repositoryRoot,
    });
    return response.hierarchy.id;
  } catch (error) {
    // If it fails, hierarchy feature might not be available
    console.log(chalk.gray("   Note: Hierarchy creation skipped"));
    return null;
  }
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
    await updateBlueprint(cwd, file, linked.id, content, options, linked.checksum);
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
  options: PushOptions,
  expectedChecksum?: string
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
    const updateData: { content: string; expected_checksum?: string } = { content };
    
    // Include expected checksum for optimistic locking (unless force)
    if (expectedChecksum && !options.force) {
      updateData.expected_checksum = expectedChecksum;
    }

    const result = await api.updateBlueprint(blueprintId, updateData);
    spinner.succeed("Blueprint updated!");

    // Update local tracking with new checksum
    await updateChecksum(cwd, file, content);

    console.log();
    console.log(chalk.green(`✅ Successfully updated ${chalk.bold(result.blueprint.name)}`));
    console.log(chalk.gray(`   ID: ${blueprintId}`));
    if (result.blueprint.content_checksum) {
      console.log(chalk.gray(`   Checksum: ${result.blueprint.content_checksum}`));
    }
    console.log(chalk.gray(`   View: https://lynxprompt.com/templates/${blueprintId.replace("bp_", "")}`));
  } catch (error) {
    spinner.fail("Failed to update blueprint");
    
    // Handle optimistic locking conflict
    if (error instanceof ApiRequestError && error.statusCode === 409) {
      console.log();
      console.log(chalk.yellow("⚠ Conflict: The blueprint has been modified since you last pulled it."));
      console.log(chalk.gray("  Someone else may have pushed changes."));
      console.log();
      console.log(chalk.gray("Options:"));
      console.log(chalk.gray("  1. Run 'lynxp pull " + blueprintId + "' to get the latest version"));
      console.log(chalk.gray("  2. Run 'lynxp push --force' to overwrite remote changes"));
      process.exit(1);
    }
    
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
  // Detect if this is a command file
  const isCommand = isCommandFilePath(file);
  const commandInfo = isCommand ? inferCommandTypeFromPath(file) : null;
  
  // Check if pushing AGENTS.md and scan for more AGENTS.md files
  const isAgentsMd = filename === "AGENTS.md";
  
  if (isAgentsMd) {
    const discoveredFiles = scanForAgentFiles(cwd);
    
    // If we found multiple AGENTS.md files, offer to create hierarchy
    if (discoveredFiles.length > 1) {
      console.log();
      console.log(chalk.cyan(`📁 Found ${discoveredFiles.length} AGENTS.md files:`));
      console.log();
      for (const f of discoveredFiles) {
        const icon = f.isRoot ? "📄" : "  └─";
        console.log(chalk.gray(`   ${icon} ${f.path}`));
      }
      console.log();
      
      let shouldCreateHierarchy = options.yes; // Auto-create if -y flag
      
      if (!options.yes) {
        const { createHierarchy } = await prompts({
          type: "confirm",
          name: "createHierarchy",
          message: `Create a hierarchy with all ${discoveredFiles.length} AGENTS.md files?`,
          initial: true,
        });
        shouldCreateHierarchy = createHierarchy;
      } else {
        console.log(chalk.cyan(`Auto-creating hierarchy with ${discoveredFiles.length} files...`));
      }
      
      if (shouldCreateHierarchy) {
        await pushHierarchy(cwd, discoveredFiles, options);
        return;
      }
      
      console.log(chalk.gray("Proceeding with single file push..."));
    }
  }

  // Infer the blueprint type from the file path
  const inferredType = inferBlueprintType(file);
  const COMMAND_TYPES = [
    "CURSOR_COMMAND", "CLAUDE_COMMAND", "WINDSURF_WORKFLOW", 
    "COPILOT_PROMPT", "CONTINUE_PROMPT", "OPENCODE_COMMAND"
  ];
  const isCommandFile = COMMAND_TYPES.includes(inferredType);
  
  // Get friendly name for command type
  const commandNames: Record<string, string> = {
    "CURSOR_COMMAND": "Cursor",
    "CLAUDE_COMMAND": "Claude Code",
    "WINDSURF_WORKFLOW": "Windsurf",
    "COPILOT_PROMPT": "Copilot",
    "CONTINUE_PROMPT": "Continue",
    "OPENCODE_COMMAND": "OpenCode",
  };
  
  const typeLabel = isCommandFile 
    ? chalk.magenta(`[${commandNames[inferredType] || "Command"} Command]`)
    : "";

  console.log(chalk.cyan("\n📤 Push new blueprint"));
  console.log(chalk.gray(`   File: ${file}`));
  if (isCommandFile) {
    console.log(chalk.gray(`   Type: ${typeLabel}`));
  }

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
  
  // If we have hierarchy info, ensure a hierarchy exists
  let hierarchyId: string | null = null;
  if (hierarchyInfo.repositoryPath) {
    hierarchyId = await ensureHierarchy(cwd, hierarchyInfo.repositoryRoot, path.basename(cwd));
  }
  
  const spinner = ora("Creating blueprint...").start();

  try {
    const result = await api.createBlueprint({
      name,
      description: description || "",
      content,
      visibility: visibility as "PRIVATE" | "TEAM" | "PUBLIC",
      tags,
      type: inferredType, // Include the inferred type (AGENTS_MD, CURSOR_COMMAND, etc.)
      // Include hierarchy info if detected
      hierarchy_id: hierarchyId,
      parent_id: hierarchyInfo.parentId,
      repository_path: hierarchyInfo.repositoryPath,
    });

    spinner.succeed("Blueprint created!");

    // Track the blueprint locally
    await trackBlueprint(cwd, {
      id: result.blueprint.id,
      name: result.blueprint.name,
      file,
      content,
      source: "private",
      hierarchyId: hierarchyId || undefined,
      repositoryPath: hierarchyInfo.repositoryPath || undefined,
    });

    console.log();
    console.log(chalk.green(`✅ Created blueprint ${chalk.bold(result.blueprint.name)}`));
    console.log(chalk.gray(`   ID: ${result.blueprint.id}`));
    console.log(chalk.gray(`   Visibility: ${visibility}`));
    if (hierarchyInfo.repositoryPath) {
      console.log(chalk.gray(`   Path: ${hierarchyInfo.repositoryPath}`));
    }
    if (result.blueprint.hierarchy_id) {
      console.log(chalk.gray(`   Hierarchy: ${result.blueprint.hierarchy_id}`));
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

/**
 * Push multiple AGENTS.md files as a hierarchy
 */
async function pushHierarchy(
  cwd: string,
  files: DiscoveredFile[],
  options: PushOptions
): Promise<void> {
  // Get hierarchy name
  let hierarchyName = options.name || path.basename(cwd);
  let visibility = options.visibility || "PRIVATE";
  
  if (!options.yes) {
    const responses = await prompts([
      {
        type: "text",
        name: "name",
        message: "Hierarchy name:",
        initial: hierarchyName,
        validate: (v) => v.length > 0 || "Name is required",
      },
      {
        type: "select",
        name: "visibility",
        message: "Visibility for all blueprints:",
        choices: [
          { title: "Private (only you)", value: "PRIVATE" },
          { title: "Team (your team members)", value: "TEAM" },
          { title: "Public (visible to everyone)", value: "PUBLIC" },
        ],
        initial: 0,
      },
    ]);
    
    if (!responses.name) {
      console.log(chalk.yellow("Push cancelled."));
      return;
    }
    
    hierarchyName = responses.name;
    visibility = responses.visibility || visibility;
  }
  
  console.log();
  console.log(chalk.cyan(`📁 Creating hierarchy "${hierarchyName}" with ${files.length} files...`));
  console.log();
  
  // Create repository root identifier
  const repositoryRoot = createRepositoryRoot(cwd);
  
  // Create hierarchy first
  let hierarchyId: string;
  try {
    const hierarchyResponse = await api.createHierarchy({
      name: hierarchyName,
      repository_root: repositoryRoot,
    });
    hierarchyId = hierarchyResponse.hierarchy.id;
    console.log(chalk.green(`✓ Created hierarchy: ${hierarchyId}`));
  } catch (error) {
    console.log(chalk.red("Failed to create hierarchy"));
    handleError(error);
    return;
  }
  
  // Upload each file
  let rootBlueprintId: string | null = null;
  let successCount = 0;
  let failCount = 0;
  
  for (const file of files) {
    const spinner = ora(`Uploading ${file.path}...`).start();
    
    try {
      const content = fs.readFileSync(file.absolutePath, "utf-8");
      
      // Generate name from path
      let blueprintName: string;
      if (file.isRoot) {
        blueprintName = hierarchyName;
      } else {
        // Use folder name or derive from path
        const dirname = path.dirname(file.path);
        blueprintName = dirname.replace(/[/\\]/g, " / ");
      }
      
      const result = await api.createBlueprint({
        name: blueprintName,
        description: "",
        content,
        visibility: visibility as "PRIVATE" | "TEAM" | "PUBLIC",
        tags: [],
        hierarchy_id: hierarchyId,
        parent_id: file.isRoot ? null : rootBlueprintId,
        repository_path: file.path,
      });
      
      // Track root blueprint ID for linking children
      if (file.isRoot) {
        rootBlueprintId = result.blueprint.id;
      }
      
      // Track locally
      await trackBlueprint(cwd, {
        id: result.blueprint.id,
        name: blueprintName,
        file: file.path,
        content,
        source: "private",
        hierarchyId,
        hierarchyName,
        repositoryPath: file.path,
      });
      
      spinner.succeed(`${file.path} → ${result.blueprint.id}`);
      successCount++;
    } catch (error) {
      spinner.fail(`${file.path} failed`);
      if (error instanceof ApiRequestError) {
        console.log(chalk.red(`   Error: ${error.message}`));
      }
      failCount++;
    }
  }
  
  console.log();
  console.log(chalk.green(`✅ Hierarchy created successfully!`));
  console.log(chalk.gray(`   Hierarchy: ${hierarchyId}`));
  console.log(chalk.gray(`   Name: ${hierarchyName}`));
  console.log(chalk.gray(`   Blueprints: ${successCount} uploaded${failCount > 0 ? `, ${failCount} failed` : ""}`));
  console.log();
  console.log(chalk.cyan("Tips:"));
  console.log(chalk.gray(`  • Run 'lynxp status' to see all tracked blueprints`));
  console.log(chalk.gray(`  • Run 'lynxp pull ${hierarchyId}' to download the entire hierarchy`));
  console.log(chalk.gray(`  • Run 'lynxp push' in any subfolder to update individual blueprints`));
  console.log();
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

/**
 * Infer blueprint type from file path
 * Returns the appropriate TemplateType for the file
 */
function inferBlueprintType(filePath: string): string {
  const normalizedPath = filePath.replace(/\\/g, "/");
  
  // Check if it's a command file first
  const commandInfo = inferCommandTypeFromPath(filePath);
  if (commandInfo) {
    return commandInfo.templateType;
  }
  
  // Infer from file path for rules/config files
  if (normalizedPath.includes(".cursor/rules/")) return "CURSOR_RULES";
  if (normalizedPath.endsWith("CLAUDE.md")) return "CLAUDE_MD";
  if (normalizedPath.endsWith(".windsurfrules")) return "WINDSURF_RULES";
  if (normalizedPath.endsWith(".clinerules")) return "CLINE_RULES";
  if (normalizedPath.includes(".github/copilot-instructions.md")) return "COPILOT_INSTRUCTIONS";
  if (normalizedPath.endsWith("GEMINI.md")) return "GEMINI_MD";
  if (normalizedPath.endsWith("AIDER.md")) return "AGENTS_MD";
  if (normalizedPath.endsWith("AGENTS.md")) return "AGENTS_MD";
  
  // Default to AGENTS_MD for markdown files
  if (normalizedPath.endsWith(".md")) return "AGENTS_MD";
  
  return "CUSTOM";
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
