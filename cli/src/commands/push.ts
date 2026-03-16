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
  force?: boolean;
  all?: boolean;
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
  type?: string;      // Blueprint type (set by scanForAllConfigFiles)
  label?: string;     // Human-readable label
}

/**
 * Directories to always exclude from scanning.
 * Mirrors action/src/detector.ts EXCLUDED_DIRS.
 */
const EXCLUDED_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next", "__pycache__",
  "venv", ".venv", "target", "vendor", "out", ".output", ".nuxt",
  "coverage", ".cache", "tmp", ".lynxprompt",
]);

/**
 * Config file pattern rules — mirrors action/src/mapper.ts PATTERN_RULES.
 * Ordered from most specific to least specific.
 */
interface ConfigPattern {
  match: (relativePath: string) => boolean;
  type: string;
  label: string;
}

function normPath(p: string): string {
  return p.replace(/\\/g, "/").toLowerCase();
}

const CONFIG_PATTERNS: ConfigPattern[] = [
  // Commands (most specific paths first)
  { match: (p) => normPath(p).includes(".cursor/commands/") && p.endsWith(".md"), type: "CURSOR_COMMAND", label: "Cursor Command" },
  { match: (p) => normPath(p).includes(".claude/commands/") && p.endsWith(".md"), type: "CLAUDE_COMMAND", label: "Claude Command" },
  { match: (p) => normPath(p).includes(".windsurf/workflows/") && p.endsWith(".md"), type: "WINDSURF_WORKFLOW", label: "Windsurf Workflow" },
  { match: (p) => normPath(p).includes(".copilot/prompts/") && p.endsWith(".md"), type: "COPILOT_PROMPT", label: "Copilot Prompt" },
  { match: (p) => normPath(p).includes(".continue/prompts/") && p.endsWith(".md"), type: "CONTINUE_PROMPT", label: "Continue Prompt" },
  { match: (p) => normPath(p).includes(".opencode/commands/") && p.endsWith(".md"), type: "OPENCODE_COMMAND", label: "OpenCode Command" },

  // Directory-based rules
  { match: (p) => normPath(p).includes(".cursor/rules/") && p.endsWith(".mdc"), type: "CURSOR_RULES", label: "Cursor Rules" },
  { match: (p) => normPath(p).includes(".trae/rules/") && p.endsWith(".mdc"), type: "TRAE_RULES", label: "Trae Rules" },
  { match: (p) => normPath(p).includes(".idx/") && p.endsWith(".mdc"), type: "FIREBASE_RULES", label: "Firebase Rules" },
  { match: (p) => normPath(p).includes(".roo/rules/") && p.endsWith(".mdc"), type: "ROO_RULES", label: "Roo Rules" },
  { match: (p) => normPath(p).includes(".amazonq/rules/") && p.endsWith(".mdc"), type: "AMAZONQ_RULES", label: "Amazon Q Rules" },
  { match: (p) => normPath(p).includes(".augment/rules/") && p.endsWith(".mdc"), type: "AUGMENT_RULES", label: "Augment Rules" },
  { match: (p) => normPath(p).includes(".kilocode/rules/") && p.endsWith(".mdc"), type: "KILOCODE_RULES", label: "Kilo Code Rules" },
  { match: (p) => normPath(p).includes(".kiro/steering/") && p.endsWith(".mdc"), type: "KIRO_STEERING", label: "Kiro Steering" },

  // Path-based configs
  { match: (p) => normPath(p).includes(".github/copilot-instructions.md"), type: "COPILOT_INSTRUCTIONS", label: "Copilot Instructions" },
  { match: (p) => normPath(p).includes(".zed/instructions.md"), type: "ZED_INSTRUCTIONS", label: "Zed Instructions" },
  { match: (p) => normPath(p).includes(".openhands/microagents/repo.md"), type: "OPENHANDS_CONFIG", label: "OpenHands Config" },
  { match: (p) => normPath(p).includes(".junie/guidelines.md"), type: "JUNIE_GUIDELINES", label: "Junie Guidelines" },
  { match: (p) => normPath(p).includes(".void/config.json"), type: "VOID_CONFIG", label: "Void Config" },
  { match: (p) => normPath(p).includes(".continue/config.json"), type: "CONTINUE_CONFIG", label: "Continue Config" },
  { match: (p) => normPath(p).includes(".cody/config.json"), type: "CODY_CONFIG", label: "Cody Config" },
  { match: (p) => normPath(p).includes(".supermaven/config.json"), type: "SUPERMAVEN_CONFIG", label: "Supermaven Config" },
  { match: (p) => normPath(p).includes(".codegpt/config.json"), type: "CODEGPT_CONFIG", label: "CodeGPT Config" },

  // Basename rules
  { match: (p) => path.basename(p) === "AGENTS.md", type: "AGENTS_MD", label: "AGENTS.md" },
  { match: (p) => path.basename(p) === "CLAUDE.md", type: "CLAUDE_MD", label: "CLAUDE.md" },
  { match: (p) => path.basename(p) === "AIDER.md", type: "AIDER_MD", label: "AIDER.md" },
  { match: (p) => path.basename(p) === "GEMINI.md", type: "GEMINI_MD", label: "GEMINI.md" },
  { match: (p) => path.basename(p) === "WARP.md", type: "WARP_MD", label: "WARP.md" },
  { match: (p) => path.basename(p) === "CRUSH.md", type: "CRUSH_MD", label: "CRUSH.md" },
  { match: (p) => path.basename(p) === ".windsurfrules", type: "WINDSURF_RULES", label: "Windsurf Rules" },
  { match: (p) => path.basename(p) === ".clinerules", type: "CLINE_RULES", label: "Cline Rules" },
  { match: (p) => path.basename(p) === ".goosehints", type: "GOOSE_HINTS", label: "Goose Hints" },
  { match: (p) => path.basename(p) === ".tabnine.yaml", type: "TABNINE_CONFIG", label: "Tabnine Config" },
  { match: (p) => path.basename(p) === "opencode.json", type: "OPENCODE_CONFIG", label: "OpenCode Config" },
  { match: (p) => path.basename(p) === "firebender.json", type: "FIREBENDER_CONFIG", label: "Firebender Config" },
];

/**
 * Match a relative path against all known config file patterns.
 * Returns type + label if it matches, null otherwise.
 */
function matchConfigFile(relativePath: string): { type: string; label: string } | null {
  for (const pattern of CONFIG_PATTERNS) {
    if (pattern.match(relativePath)) {
      return { type: pattern.type, label: pattern.label };
    }
  }
  return null;
}

/**
 * Scan for AGENTS.md files only (used when pushing a single AGENTS.md).
 */
function scanForAgentFiles(cwd: string, maxDepth: number = 5): DiscoveredFile[] {
  const results: DiscoveredFile[] = [];

  function scan(dir: string, depth: number) {
    if (depth > maxDepth) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (EXCLUDED_DIRS.has(entry.name)) continue;
          scan(fullPath, depth + 1);
        } else if (entry.name === "AGENTS.md") {
          const relativePath = path.relative(cwd, fullPath);
          results.push({
            path: relativePath,
            absolutePath: fullPath,
            isRoot: relativePath === "AGENTS.md",
            type: "AGENTS_MD",
            label: "AGENTS.md",
          });
        }
      }
    } catch {
      // Ignore directories we can't read
    }
  }

  scan(cwd, 0);
  results.sort((a, b) => {
    if (a.isRoot && !b.isRoot) return -1;
    if (!a.isRoot && b.isRoot) return 1;
    return a.path.localeCompare(b.path);
  });
  return results;
}

/**
 * Scan for ALL AI config files recursively (--all mode).
 * Mirrors the GitHub Action's detector.ts patterns.
 */
function scanForAllConfigFiles(cwd: string, maxDepth: number = 5): DiscoveredFile[] {
  const results: DiscoveredFile[] = [];
  const MAX_FILE_SIZE = 1024 * 1024; // 1MB

  function scan(dir: string, depth: number) {
    if (depth > maxDepth) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (EXCLUDED_DIRS.has(entry.name)) continue;
          scan(fullPath, depth + 1);
        } else {
          const relativePath = path.relative(cwd, fullPath);
          const configMatch = matchConfigFile(relativePath);
          if (configMatch) {
            // Skip files that are too large or empty
            try {
              const stat = fs.statSync(fullPath);
              if (stat.size === 0 || stat.size > MAX_FILE_SIZE) continue;
            } catch {
              continue;
            }
            results.push({
              path: relativePath,
              absolutePath: fullPath,
              isRoot: relativePath === "AGENTS.md",
              type: configMatch.type,
              label: configMatch.label,
            });
          }
        }
      }
    } catch {
      // Ignore directories we can't read
    }
  }

  scan(cwd, 0);
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
/**
 * Search user's existing blueprints for one matching the same repository_path and hierarchy
 * Used to deduplicate: if .lynxprompt/ tracking is deleted, we can still find the existing blueprint
 */
async function findExistingBlueprintOnServer(
  repositoryPath: string | null,
  hierarchyId: string | null
): Promise<{ id: string; name: string } | null> {
  if (!repositoryPath) return null;

  try {
    // Fetch user's blueprints (paginate to cover all)
    let offset = 0;
    const limit = 50;

    while (true) {
      const response = await api.listBlueprints({ limit, offset });

      for (const bp of response.blueprints) {
        // Match by repository_path, and if we have a hierarchy, also match hierarchy_id
        if (bp.repository_path === repositoryPath) {
          if (hierarchyId) {
            if (bp.hierarchy_id === hierarchyId) {
              return { id: bp.id, name: bp.name };
            }
          } else {
            // No hierarchy context — match on repository_path alone
            return { id: bp.id, name: bp.name };
          }
        }
      }

      if (!response.has_more) break;
      offset += limit;
    }
  } catch {
    // If listing fails, fall through to create new
  }

  return null;
}

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

  // --all mode: scan for ALL config files recursively
  if (options.all) {
    const discoveredFiles = scanForAllConfigFiles(cwd);
    if (discoveredFiles.length === 0) {
      console.log(chalk.yellow("No AI configuration files found."));
      console.log(chalk.gray("Run from a directory containing AGENTS.md, CLAUDE.md, .cursor/rules/, etc."));
      process.exit(1);
    }

    // Group by type for display
    console.log(chalk.cyan(`\n📁 Found ${discoveredFiles.length} AI config files:\n`));
    const byType = new Map<string, DiscoveredFile[]>();
    for (const f of discoveredFiles) {
      const key = f.label || "Unknown";
      if (!byType.has(key)) byType.set(key, []);
      byType.get(key)!.push(f);
    }
    for (const [label, files] of byType) {
      console.log(chalk.white(`  ${label} (${files.length}):`));
      for (const f of files) {
        console.log(chalk.gray(`    ${f.path}`));
      }
    }
    console.log();

    if (!options.yes) {
      const { confirm } = await prompts({
        type: "confirm",
        name: "confirm",
        message: `Push all ${discoveredFiles.length} files as a hierarchy?`,
        initial: true,
      });
      if (!confirm) {
        console.log(chalk.yellow("Push cancelled."));
        return;
      }
    }

    await pushHierarchy(cwd, discoveredFiles, options);
    return;
  }

  // Find the file to push
  const file = fileArg || findDefaultFile();
  if (!file) {
    console.log(chalk.red("No AI configuration file found."));
    console.log(
      chalk.gray("Specify a file or run in a directory with AGENTS.md, CLAUDE.md, etc.")
    );
    console.log(chalk.gray("Or use 'lynxp push --all' to scan recursively for all config files."));
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
  
  console.log(chalk.cyan("\n📤 Push new blueprint"));
  console.log(chalk.gray(`   File: ${file}`));
  if (isCommandFile) {
    console.log(chalk.magenta(`   Type: ${commandNames[inferredType] || "Command"} Command`));
  } else {
    console.log(chalk.gray(`   Type: ${inferredType.replace(/_/g, " ")}`));
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
  
  // Dedup check: look for an existing blueprint on the server with the same repository_path
  const existingBlueprint = await findExistingBlueprintOnServer(
    hierarchyInfo.repositoryPath,
    hierarchyId
  );

  if (existingBlueprint) {
    console.log(chalk.cyan(`\nℹ Linked to existing blueprint "${existingBlueprint.name}" (${existingBlueprint.id}).`));
    console.log(chalk.gray("   Pushing as an update."));

    // Re-link locally and update the existing blueprint
    await trackBlueprint(cwd, {
      id: existingBlueprint.id,
      name: existingBlueprint.name,
      file,
      content,
      source: "private",
      hierarchyId: hierarchyId || undefined,
      repositoryPath: hierarchyInfo.repositoryPath || undefined,
    });

    await updateBlueprint(cwd, file, existingBlueprint.id, content, options);
    return;
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
    const typeDesc = isCommandFile ? `${commandNames[inferredType]} Command` : "Blueprint";
    console.log(chalk.green(`✅ Created ${typeDesc} ${chalk.bold(result.blueprint.name)}`));
    console.log(chalk.gray(`   ID: ${result.blueprint.id}`));
    console.log(chalk.gray(`   Type: ${inferredType}`));
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
 * Push multiple files as a hierarchy.
 * Handles both AGENTS.md-only and --all (mixed types) modes.
 * Deduplicates: updates tracked/existing blueprints, creates new ones.
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
  console.log(chalk.cyan(`📁 Syncing hierarchy "${hierarchyName}" with ${files.length} files...`));
  console.log();

  // Create repository root identifier
  const repositoryRoot = createRepositoryRoot(cwd);

  // Create or get existing hierarchy
  let hierarchyId: string;
  try {
    const hierarchyResponse = await api.createHierarchy({
      name: hierarchyName,
      repository_root: repositoryRoot,
    });
    hierarchyId = hierarchyResponse.hierarchy.id;
    console.log(chalk.green(`✓ Hierarchy: ${hierarchyId}`));
  } catch (error) {
    console.log(chalk.red("Failed to create hierarchy"));
    handleError(error);
    return;
  }

  // Process each file
  let rootBlueprintId: string | null = null;
  let createCount = 0;
  let updateCount = 0;
  let failCount = 0;

  for (const file of files) {
    const spinner = ora(`Processing ${file.path}...`).start();

    try {
      const content = fs.readFileSync(file.absolutePath, "utf-8");

      // 1. Check if already tracked locally → update
      const tracked = await findBlueprintByFile(cwd, file.path);
      if (tracked) {
        const updateData: { content: string; expected_checksum?: string } = { content };
        if (tracked.checksum && !options.force) {
          updateData.expected_checksum = tracked.checksum;
        }
        await api.updateBlueprint(tracked.id, updateData);
        await updateChecksum(cwd, file.path, content);

        if (file.isRoot) rootBlueprintId = tracked.id;
        spinner.succeed(`${file.path} → updated (${tracked.id})`);
        updateCount++;
        continue;
      }

      // 2. Check if exists on server with same repository_path → re-link & update
      const existing = await findExistingBlueprintOnServer(file.path, hierarchyId);
      if (existing) {
        await api.updateBlueprint(existing.id, { content });
        await trackBlueprint(cwd, {
          id: existing.id,
          name: existing.name,
          file: file.path,
          content,
          source: "private",
          hierarchyId,
          hierarchyName,
          repositoryPath: file.path,
        });

        if (file.isRoot) rootBlueprintId = existing.id;
        spinner.succeed(`${file.path} → linked & updated (${existing.id})`);
        updateCount++;
        continue;
      }

      // 3. Create new blueprint
      const blueprintName = file.isRoot
        ? hierarchyName
        : path.basename(file.path) === "AGENTS.md"
          ? path.dirname(file.path).replace(/[/\\]/g, " / ")
          : file.path.replace(/\\/g, "/");

      // Only AGENTS.md children get parent_id
      const parentId = (!file.isRoot && file.type === "AGENTS_MD" && rootBlueprintId)
        ? rootBlueprintId
        : null;

      const result = await api.createBlueprint({
        name: blueprintName,
        description: "",
        content,
        visibility: visibility as "PRIVATE" | "TEAM" | "PUBLIC",
        tags: [],
        type: file.type || inferBlueprintType(file.path),
        hierarchy_id: hierarchyId,
        parent_id: parentId,
        repository_path: file.path,
      });

      if (file.isRoot) rootBlueprintId = result.blueprint.id;

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

      spinner.succeed(`${file.path} → created (${result.blueprint.id})`);
      createCount++;
    } catch (error) {
      spinner.fail(`${file.path} failed`);
      if (error instanceof ApiRequestError) {
        console.log(chalk.red(`   Error: ${error.message}`));
      }
      failCount++;
    }
  }

  console.log();
  console.log(chalk.green(`✅ Hierarchy sync complete!`));
  console.log(chalk.gray(`   Hierarchy: ${hierarchyId}`));
  console.log(chalk.gray(`   Name: ${hierarchyName}`));
  const parts = [];
  if (createCount > 0) parts.push(`${createCount} created`);
  if (updateCount > 0) parts.push(`${updateCount} updated`);
  if (failCount > 0) parts.push(`${failCount} failed`);
  console.log(chalk.gray(`   Results: ${parts.join(", ")}`));
  console.log();
  console.log(chalk.cyan("Tips:"));
  console.log(chalk.gray(`  • Run 'lynxp status' to see all tracked blueprints`));
  console.log(chalk.gray(`  • Run 'lynxp push --all' again to sync changes`));
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
 * Infer blueprint type from file path.
 * Uses CONFIG_PATTERNS for known types, falls back to heuristics.
 */
function inferBlueprintType(filePath: string): string {
  const configMatch = matchConfigFile(filePath);
  if (configMatch) return configMatch.type;

  // Fallback for explicit single-file push of unknown files
  if (filePath.endsWith(".md") || filePath.endsWith(".mdc")) return "AGENTS_MD";
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
