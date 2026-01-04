import chalk from "chalk";
import prompts from "prompts";
import ora from "ora";
import { readFile, access, readdir, stat } from "fs/promises";
import { join, relative, dirname, basename } from "path";

// Import command configuration
const CONFIG_FILE_PATTERNS = [
  "AGENTS.md",
  "CLAUDE.md",
  ".cursorrules",  // Legacy
  ".windsurfrules",
];

interface AgentsMdFile {
  path: string;          // Full path to file
  relativePath: string;  // Path relative to scan root
  depth: number;         // Directory depth from root
  name: string;          // Extracted project name (from content or dir)
  parentPath?: string;   // Parent AGENTS.md if in a monorepo
  content: string;       // Raw file content
  sections: ParsedSection[];
}

interface ParsedSection {
  title: string;
  content: string;
  level: number;  // Heading level (1-6)
}

interface ImportOptions {
  dryRun?: boolean;
  recursive?: boolean;
  depth?: number;
  pattern?: string;
  link?: boolean;
  verbose?: boolean;
  json?: boolean;
}

interface ImportResult {
  totalFound: number;
  files: AgentsMdFile[];
  hierarchy: MonorepoHierarchy[];
  errors: string[];
}

interface MonorepoHierarchy {
  rootPath: string;
  root?: AgentsMdFile;
  children: AgentsMdFile[];
}

/**
 * Scan a directory for AGENTS.md and similar config files
 */
async function scanDirectory(
  rootPath: string,
  options: ImportOptions = {}
): Promise<AgentsMdFile[]> {
  const maxDepth = options.depth ?? 10;
  const files: AgentsMdFile[] = [];
  const patterns = options.pattern 
    ? [options.pattern] 
    : CONFIG_FILE_PATTERNS;

  async function scan(dir: string, depth: number): Promise<void> {
    if (depth > maxDepth) return;

    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        // Skip common non-project directories
        if (entry.isDirectory()) {
          const skipDirs = [
            "node_modules", ".git", ".next", "dist", "build", "out",
            "coverage", ".cache", "__pycache__", "venv", ".venv",
            "target", "vendor", ".idea", ".vscode"
          ];
          if (skipDirs.includes(entry.name)) continue;

          if (options.recursive !== false) {
            await scan(fullPath, depth + 1);
          }
        } else if (entry.isFile()) {
          // Check if file matches our patterns
          if (patterns.includes(entry.name)) {
            try {
              const content = await readFile(fullPath, "utf-8");
              const relativePath = relative(rootPath, fullPath);
              
              files.push({
                path: fullPath,
                relativePath,
                depth,
                name: extractProjectName(content, dirname(fullPath)),
                content,
                sections: parseMarkdownSections(content),
              });
            } catch {
              // Skip files we can't read
            }
          }
        }
      }
    } catch {
      // Skip directories we can't access
    }
  }

  await scan(rootPath, 0);
  return files;
}

/**
 * Extract project name from AGENTS.md content or directory name
 */
function extractProjectName(content: string, dirPath: string): string {
  // Try to find project name in common patterns
  const patterns = [
    /^#\s+(.+?)(?:\s*-|$)/m,  // # Project Name or # Project Name - Description
    /Project(?:\s+Overview)?[:\s]*(.+?)(?:\n|$)/i,
    /Name[:\s]*(.+?)(?:\n|$)/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim().replace(/[#*`]/g, "").trim();
      if (name && name.length < 100) {
        return name;
      }
    }
  }

  // Fall back to directory name
  return basename(dirPath) || "Unnamed";
}

/**
 * Parse markdown content into sections
 */
function parseMarkdownSections(content: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const lines = content.split("\n");
  let currentSection: ParsedSection | null = null;
  let contentLines: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    
    if (headingMatch) {
      // Save previous section
      if (currentSection) {
        currentSection.content = contentLines.join("\n").trim();
        sections.push(currentSection);
      }
      
      currentSection = {
        title: headingMatch[2].trim(),
        content: "",
        level: headingMatch[1].length,
      };
      contentLines = [];
    } else {
      contentLines.push(line);
    }
  }

  // Don't forget the last section
  if (currentSection) {
    currentSection.content = contentLines.join("\n").trim();
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Build hierarchy from flat list of files
 */
function buildHierarchy(files: AgentsMdFile[], rootPath: string): MonorepoHierarchy[] {
  const hierarchies: MonorepoHierarchy[] = [];
  
  // Sort by path depth (root files first)
  const sorted = [...files].sort((a, b) => a.depth - b.depth);
  
  // Find potential roots (depth 0 or 1)
  const potentialRoots = sorted.filter(f => f.depth <= 1);
  
  if (potentialRoots.length === 0 && files.length > 0) {
    // No clear root, treat each file as its own hierarchy
    return files.map(f => ({
      rootPath: dirname(f.path),
      root: f,
      children: [],
    }));
  }

  // For each potential root, find children
  for (const root of potentialRoots) {
    const rootDir = dirname(root.path);
    const children = files.filter(f => {
      if (f === root) return false;
      // Child must be under root's directory
      return f.path.startsWith(rootDir + "/") && f.depth > root.depth;
    });

    // Set parent references
    for (const child of children) {
      child.parentPath = root.relativePath;
    }

    hierarchies.push({
      rootPath: rootDir,
      root,
      children,
    });
  }

  // Handle orphan files (not under any root)
  const assignedPaths = new Set(hierarchies.flatMap(h => [h.root?.path, ...h.children.map(c => c.path)]));
  const orphans = files.filter(f => !assignedPaths.has(f.path));
  
  for (const orphan of orphans) {
    hierarchies.push({
      rootPath: dirname(orphan.path),
      root: orphan,
      children: [],
    });
  }

  return hierarchies;
}

/**
 * Display import results
 */
function displayResults(result: ImportResult, options: ImportOptions): void {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log();
  console.log(chalk.cyan.bold("  📥 Import Results"));
  console.log();

  if (result.totalFound === 0) {
    console.log(chalk.yellow("  No AGENTS.md or compatible files found."));
    console.log(chalk.gray("  Try running from your project root, or use --pattern to specify custom filenames."));
    return;
  }

  console.log(chalk.green(`  Found ${result.totalFound} configuration file(s)`));
  console.log();

  // Display hierarchy
  for (const hierarchy of result.hierarchy) {
    const isMonorepo = hierarchy.children.length > 0;
    
    if (hierarchy.root) {
      const icon = isMonorepo ? "🏢" : "📄";
      const typeLabel = isMonorepo ? chalk.magenta("[Monorepo Root]") : chalk.blue("[Standalone]");
      console.log(`  ${icon} ${chalk.white.bold(hierarchy.root.name)} ${typeLabel}`);
      console.log(chalk.gray(`     ${hierarchy.root.relativePath}`));
      
      // Show sections summary
      if (options.verbose && hierarchy.root.sections.length > 0) {
        const sectionNames = hierarchy.root.sections.slice(0, 5).map(s => s.title);
        console.log(chalk.gray(`     Sections: ${sectionNames.join(", ")}${hierarchy.root.sections.length > 5 ? "..." : ""}`));
      }
    }

    // Show children
    for (const child of hierarchy.children) {
      console.log(`     └─ 📄 ${chalk.white(child.name)}`);
      console.log(chalk.gray(`        ${child.relativePath}`));
      
      if (options.verbose && child.sections.length > 0) {
        const sectionNames = child.sections.slice(0, 3).map(s => s.title);
        console.log(chalk.gray(`        Sections: ${sectionNames.join(", ")}${child.sections.length > 3 ? "..." : ""}`));
      }
    }
    console.log();
  }

  // Summary
  const monorepoCount = result.hierarchy.filter(h => h.children.length > 0).length;
  const standaloneCount = result.hierarchy.filter(h => h.children.length === 0).length;
  
  if (monorepoCount > 0) {
    console.log(chalk.cyan(`  📊 ${monorepoCount} monorepo(s) detected with hierarchical configs`));
  }
  if (standaloneCount > 0) {
    console.log(chalk.cyan(`  📊 ${standaloneCount} standalone config(s)`));
  }

  // Errors
  if (result.errors.length > 0) {
    console.log();
    console.log(chalk.yellow("  ⚠️ Warnings:"));
    for (const error of result.errors) {
      console.log(chalk.gray(`     ${error}`));
    }
  }
}

/**
 * Main import command
 */
export async function importCommand(path: string = ".", options: ImportOptions): Promise<void> {
  console.log();
  console.log(chalk.cyan.bold("  📥 LynxPrompt Import"));
  console.log(chalk.gray("     Scan and import AGENTS.md files from your repository"));
  console.log();

  // Resolve the path
  const rootPath = join(process.cwd(), path);
  
  // Check if path exists
  try {
    await access(rootPath);
  } catch {
    console.log(chalk.red(`  ✗ Path not found: ${rootPath}`));
    process.exit(1);
  }

  const spinner = ora("Scanning for configuration files...").start();

  try {
    // Scan for files
    const files = await scanDirectory(rootPath, options);
    
    if (files.length === 0) {
      spinner.warn("No configuration files found");
      console.log();
      console.log(chalk.gray("  Looking for: AGENTS.md, CLAUDE.md, .cursorrules, .windsurfrules"));
      console.log(chalk.gray("  Try specifying a different path or use --pattern for custom filenames"));
      return;
    }

    spinner.succeed(`Found ${files.length} configuration file(s)`);

    // Build hierarchy
    const hierarchy = buildHierarchy(files, rootPath);

    const result: ImportResult = {
      totalFound: files.length,
      files,
      hierarchy,
      errors: [],
    };

    // Display results
    displayResults(result, options);

    // Dry run mode - stop here
    if (options.dryRun) {
      console.log(chalk.yellow("  📋 Dry run complete - no changes made"));
      console.log(chalk.gray("     Remove --dry-run to proceed with import"));
      return;
    }

    // Ask what to do with the files
    if (!options.json) {
      console.log();
      const { action } = await prompts({
        type: "select",
        name: "action",
        message: "What would you like to do?",
        choices: [
          { title: "Preview only (done)", value: "preview" },
          { title: "Convert all to AGENTS.md format", value: "convert" },
          { title: "Save hierarchy info for wizard", value: "save" },
          { title: "Push to LynxPrompt cloud as blueprints", value: "push" },
        ],
        initial: 0,
      });

      switch (action) {
        case "convert":
          console.log(chalk.cyan("\n  💡 Use 'lynxp convert <file> agents' to convert individual files"));
          console.log(chalk.cyan("     or 'lynxp merge <files...>' to combine multiple configs\n"));
          break;
        case "save":
          // Save to .lynxprompt/hierarchy.json for wizard reference
          await saveHierarchyInfo(rootPath, result);
          break;
        case "push":
          console.log(chalk.cyan("\n  💡 Use 'lynxp push <file>' to push files individually"));
          console.log(chalk.cyan("     Requires login: 'lynxp login'\n"));
          break;
        default:
          // Preview only - done
          break;
      }
    }
  } catch (error) {
    spinner.fail("Import failed");
    console.error(chalk.red(`  Error: ${error instanceof Error ? error.message : "Unknown error"}`));
    process.exit(1);
  }
}

/**
 * Save hierarchy info for wizard to use
 */
async function saveHierarchyInfo(rootPath: string, result: ImportResult): Promise<void> {
  const { writeFile, mkdir } = await import("fs/promises");
  const configDir = join(rootPath, ".lynxprompt");
  
  try {
    await mkdir(configDir, { recursive: true });
    
    const hierarchyInfo = {
      scannedAt: new Date().toISOString(),
      rootPath,
      totalFiles: result.totalFound,
      hierarchy: result.hierarchy.map(h => ({
        rootPath: h.rootPath,
        rootFile: h.root?.relativePath,
        rootName: h.root?.name,
        children: h.children.map(c => ({
          path: c.relativePath,
          name: c.name,
          sections: c.sections.map(s => s.title),
        })),
      })),
    };

    await writeFile(
      join(configDir, "hierarchy.json"),
      JSON.stringify(hierarchyInfo, null, 2),
      "utf-8"
    );

    console.log(chalk.green("\n  ✓ Hierarchy saved to .lynxprompt/hierarchy.json"));
    console.log(chalk.gray("    The wizard will use this to understand your monorepo structure"));
  } catch (error) {
    console.error(chalk.red(`  ✗ Failed to save hierarchy: ${error instanceof Error ? error.message : "Unknown"}`));
  }
}

export { ImportOptions, ImportResult, AgentsMdFile };

