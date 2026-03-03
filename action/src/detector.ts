import * as core from '@actions/core';
import * as glob from '@actions/glob';
import * as fs from 'fs/promises';
import * as path from 'path';
import { BlueprintType, mapFileToType, buildBlueprintName } from './mapper';

/**
 * Built-in glob patterns for ALL AI IDE configuration files.
 * Covers 30+ tools — derived from LynxPrompt's platforms.ts.
 */
const BUILT_IN_PATTERNS = [
  // === Popular platforms ===
  '**/AGENTS.md',
  '**/CLAUDE.md',
  '**/.cursor/rules/**/*.mdc',
  '**/.github/copilot-instructions.md',
  '**/.windsurfrules',

  // === IDE configs ===
  '**/GEMINI.md',
  '**/.zed/instructions.md',
  '**/.void/config.json',
  '**/.trae/rules/**/*.mdc',
  '**/.idx/**/*.mdc',

  // === Editor extension configs ===
  '**/.clinerules',
  '**/.roo/rules/**/*.mdc',
  '**/.continue/config.json',
  '**/.cody/config.json',
  '**/.tabnine.yaml',
  '**/.supermaven/config.json',
  '**/.codegpt/config.json',
  '**/.amazonq/rules/**/*.mdc',
  '**/.augment/rules/**/*.mdc',
  '**/.kilocode/rules/**/*.mdc',
  '**/.junie/guidelines.md',
  '**/.kiro/steering/**/*.mdc',

  // === CLI tool configs ===
  '**/AIDER.md',
  '**/.goosehints',
  '**/WARP.md',
  '**/opencode.json',

  // === Other/emerging ===
  '**/.openhands/microagents/repo.md',
  '**/CRUSH.md',
  '**/firebender.json',

  // === Slash commands ===
  '**/.cursor/commands/**/*.md',
  '**/.claude/commands/**/*.md',
  '**/.windsurf/workflows/**/*.md',
  '**/.copilot/prompts/**/*.md',
  '**/.continue/prompts/**/*.md',
  '**/.opencode/commands/**/*.md',
];

/**
 * Directories to always exclude from scanning.
 */
const EXCLUDED_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'vendor',
  '.next',
  '__pycache__',
  '.terraform',
  '.venv',
  'venv',
  'target',
  'out',
  '.output',
  '.nuxt',
  'coverage',
  '.cache',
  'tmp',
];

export interface DetectedFile {
  absolutePath: string;
  relativePath: string;
  type: BlueprintType;
  content: string;
  blueprintName: string;
  sizeBytes: number;
}

/**
 * Detect AI configuration files in the workspace.
 * Built-in patterns are always included. Extra patterns from the user are appended.
 */
export async function detectConfigFiles(
  workspace: string,
  extraPatterns?: string,
): Promise<DetectedFile[]> {
  const patterns = [...BUILT_IN_PATTERNS];

  // Append user-provided extra patterns
  if (extraPatterns) {
    const extras = extraPatterns
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    patterns.push(...extras);
  }

  // Add exclusions
  const excludePatterns = EXCLUDED_DIRS.map((d) => `!**/${d}/**`);
  const allPatterns = [...patterns, ...excludePatterns];

  core.debug(`Glob patterns (${allPatterns.length}): ${allPatterns.join(', ')}`);

  const globber = await glob.create(allPatterns.join('\n'), {
    followSymbolicLinks: false,
  });

  const files = await globber.glob();
  const detected: DetectedFile[] = [];
  const seenPaths = new Set<string>();

  for (const filePath of files) {
    const relativePath = path.relative(workspace, filePath);

    // Deduplicate (globs can overlap)
    if (seenPaths.has(relativePath)) continue;
    seenPaths.add(relativePath);

    const type = mapFileToType(relativePath);

    if (!type) {
      core.debug(`Skipping unrecognized file: ${relativePath}`);
      continue;
    }

    try {
      const stat = await fs.stat(filePath);

      // Skip files larger than 1MB (likely not config files)
      if (stat.size > 1024 * 1024) {
        core.warning(`Skipping ${relativePath}: file too large (${(stat.size / 1024).toFixed(0)}KB, max 1MB)`);
        continue;
      }

      // Skip empty files
      if (stat.size === 0) {
        core.warning(`Skipping ${relativePath}: file is empty`);
        continue;
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const blueprintName = buildBlueprintName(relativePath);

      detected.push({
        absolutePath: filePath,
        relativePath,
        type,
        content,
        blueprintName,
        sizeBytes: stat.size,
      });

      core.debug(`Detected: ${relativePath} -> ${type} (${blueprintName}, ${stat.size}B)`);
    } catch (err) {
      core.warning(`Could not read ${relativePath}: ${err instanceof Error ? err.message : err}`);
    }
  }

  return detected;
}
