import { PLATFORMS, resolvePlatformId } from "../../../packages/shared/src/platforms.js";
import {
  generatePlatformFiles,
  stackLabel,
  type GeneratorConfig,
  type GeneratorUser,
} from "../../../packages/shared/src/generator.js";
import { DATABASES, LANGUAGES } from "../../../packages/shared/src/wizard/index.js";
import { parseDocument } from "yaml";

// The rules content comes from the generator the web wizard uses
// (packages/shared/src/generator.ts). This module maps the CLI wizard's
// answers onto it, writes the static files the CLI can create, and fills
// blueprint variables.

export interface GenerateOptions {
  // Server the sync header points at. The CLI passes getApiUrl(); kept as an
  // option so this module does not load the CLI config store.
  apiUrl?: string;
  name: string;
  description: string;
  stack: string[];
  platforms: string[];
  // One AGENTS.md for every picked tool: tools that read it get no file of
  // their own, CLAUDE.md and GEMINI.md import it
  pointerFiles?: boolean;
  persona: string;
  boundaries: "conservative" | "standard" | "permissive";
  commands: Record<string, string | string[]>;
  // Blueprint mode - generates [[VARIABLE|default]] placeholders
  blueprintMode?: boolean;
  // Variable values to fill in [[VAR|default]] placeholders
  // Pass as { VAR_NAME: "value" } to replace [[VAR_NAME|default]] with "value"
  variables?: Record<string, string>;
  // Extended options for all users
  projectType?: string;
  devOS?: string | string[];
  architecture?: string;
  architectureOther?: string;
  repoHost?: string;
  isPublic?: boolean;
  license?: string;
  conventionalCommits?: boolean;
  semver?: boolean;
  cicd?: string | string[];        // The wizard allows several CI/CD platforms
  cicdOther?: string;
  deploymentTargets?: string[];
  buildContainer?: boolean;
  containerRegistry?: string;
  customRegistryUrl?: string;
  exampleRepoUrl?: string;
  documentationUrl?: string;
  letAiDecide?: boolean;
  loggingConventions?: string;
  loggingConventionsOther?: string;
  namingConvention?: string;
  errorHandling?: string;
  errorHandlingOther?: string;
  styleNotes?: string;
  maxFileLength?: number;
  importOrder?: string;
  commentLanguage?: string;
  docStyle?: string;
  aiBehavior?: string[];
  importantFiles?: string[];
  importantFilesOther?: string;
  selfImprove?: boolean;
  includePersonalData?: boolean;
  enableAutoUpdate?: boolean;
  blueprintId?: string; // For auto-update curl command
  preferCliSync?: boolean; // Use CLI commands instead of curl (default true)
  tokenEnvVar?: string; // Environment variable name for API token (default LYNXPROMPT_API_TOKEN)
  // User profile data (fetched from cloud)
  userName?: string;
  userEmail?: string;
  userPersona?: string;
  userRole?: string;
  userExpertise?: string;
  boundaryAlways?: string[];
  boundaryNever?: string[];
  boundaryAsk?: string[];
  testLevels?: string[];
  testFrameworks?: string[];
  coverageTarget?: number;
  testNotes?: string;
  tddPreference?: boolean;
  snapshotTesting?: boolean;
  mockStrategy?: string;
  staticFiles?: string[];
  staticFileContents?: Record<string, string>;
  staticFileHandling?: "config_only" | "both"; // How to handle static files
  includeFunding?: boolean;
  extraNotes?: string;
  // Security configuration (FREE tier)
  security?: {
    authProviders?: string[];          // Login providers (Google, GitHub, etc.)
    authProvidersOther?: string;       // Custom auth provider description
    secretsManagement?: string[];      // Secrets management strategies
    secretsManagementOther?: string;   // Custom secrets management description
    securityTooling?: string[];        // Security scanning tools (includes dependabot/renovate)
    securityToolingOther?: string;     // Custom security tooling description
    authPatterns?: string[];           // Authentication patterns
    authPatternsOther?: string;        // Custom auth pattern description
    dataHandling?: string[];           // Data handling policies
    dataHandlingOther?: string;        // Custom data handling description
    compliance?: string[];             // Compliance standards (GDPR, HIPAA, etc.)
    complianceOther?: string;          // Custom compliance description
    analytics?: string[];              // Analytics tools
    analyticsOther?: string;           // Custom analytics description
    additionalNotes?: string;          // Custom security notes
  };
  // Versioning (conditional on semver)
  versionTagFormat?: string;       // v_prefix, no_prefix, package_prefix, etc.
  changelogTool?: string;          // manual, conventional_changelog, etc.
  // AI Behavior
  planModeFrequency?: string;      // always, complex_tasks, multi_file, etc.
  explanationVerbosity?: string;   // concise, balanced, detailed
  accessibilityFocus?: boolean;
  performanceFocus?: boolean;
  // Tech stack details
  packageManager?: string;
  jsRuntime?: string;
  monorepoTool?: string;
  orm?: string;
  // Git workflow
  branchStrategy?: string;         // none, github_flow, gitflow, trunk_based, ...
  defaultBranch?: string;
  commitSigning?: boolean;
  // Which platform's file is uploaded when cloud sync is on (wizard only, not rendered)
  primarySyncFormat?: string;
  // Direct commits for small fixes
  allowDirectCommits?: boolean;    // Allow direct commits for typos, docs, minor fixes
  // Git worktrees for parallel AI sessions
  useGitWorktrees?: boolean;       // Use git worktrees for each task
  // Additional libraries not in predefined lists
  additionalLibraries?: string;    // comma-separated (e.g., "Telethon, APScheduler, alembic")
  // Docker image names
  dockerImageNames?: string;       // comma-separated (e.g., "myuser/myapp, myuser/myapp-viewer")
  // MCP servers the developer uses (e.g., "filesystem, github, postgres")
  mcpServers?: string;
  // Whether AI should attempt workarounds when stuck, or stop and ask
  attemptWorkarounds?: boolean;
  // Server/SSH access
  serverAccess?: boolean;        // Whether the project requires server access
  sshKeyPath?: string;           // SSH key path (empty = default location)
  // Manual deployment (when no CI/CD)
  manualDeployment?: boolean;    // Whether deployment is manual (no CI/CD)
  deploymentMethod?: string;     // portainer, docker_compose, kubernetes, bare_metal, etc.
}

/**
 * Fill variables in content with provided values
 * Replaces [[VAR_NAME|default]] with actual values from variables map
 * If variable not provided, uses the default value from the placeholder
 */
export function fillVariables(content: string, variables: Record<string, string>): string {
  // Pattern matches [[VAR_NAME|default_value]]
  return content.replace(/\[\[([A-Z_]+)\|([^\]]*)\]\]/g, (_, varName, defaultValue) => {
    return variables[varName] ?? defaultValue;
  });
}

/**
 * Parse variables string from CLI --vars argument
 * Format: "VAR1=value1,VAR2=value2"
 */
export function parseVariablesString(varsStr: string): Record<string, string> {
  const variables: Record<string, string> = {};
  
  if (!varsStr) return variables;
  
  // Split by comma, handling potential quoted values
  const parts = varsStr.split(",");
  
  for (const part of parts) {
    const eqIndex = part.indexOf("=");
    if (eqIndex > 0) {
      const key = part.slice(0, eqIndex).trim().toUpperCase();
      const value = part.slice(eqIndex + 1).trim();
      variables[key] = value;
    }
  }
  
  return variables;
}

// Platform to filename mapping, from the shared platform table
// (packages/shared/src/platforms.ts), so the CLI writes the file the web
// download names. "agents" is the CLI's alias for universal.
export const PLATFORM_FILES: Record<string, string> = {
  ...Object.fromEntries(PLATFORMS.filter((p) => !p.isCommand).map((p) => [p.id, p.file])),
  agents: "AGENTS.md",
};

/**
 * The generated file Cloud Sync uploads and links: the chosen platform's file,
 * else the first. Only a rules file, never a tool's settings file (YAML, JSON,
 * TOML): Aider's .aider.conf.yml may hold API keys, and the rules it points at
 * are in AGENTS.md.
 */
export function pickSyncFile(
  files: Record<string, string>,
  primaryPlatform?: string
): readonly [string, string] | undefined {
  const isToolConfig = (name: string) => /\.(ya?ml|json|toml)$/i.test(name);
  const primaryName = primaryPlatform ? PLATFORM_FILES[primaryPlatform] : undefined;
  const primaryFile = primaryName && isToolConfig(primaryName) ? "AGENTS.md" : primaryName;
  if (primaryFile && files[primaryFile] !== undefined) return [primaryFile, files[primaryFile]];
  return Object.entries(files).find(([name]) => !isToolConfig(name));
}

/**
 * An existing .aider.conf.yml with AGENTS.md added to its `read:` files (a
 * single file name becomes a list). The rest of the file, comments included,
 * is kept. Throws on a file that is not a YAML mapping.
 */
export function mergeAiderConfig(existing: string): string {
  const doc = parseDocument(existing);
  if (doc.errors.length > 0) throw doc.errors[0];
  const config = doc.toJS() as unknown;
  if (config !== null && (typeof config !== "object" || Array.isArray(config))) {
    throw new Error(".aider.conf.yml is not a YAML mapping");
  }
  const read = (config as { read?: unknown } | null)?.read;
  const files = read == null ? [] : Array.isArray(read) ? read : [read];
  if (files.includes("AGENTS.md")) return existing;
  doc.set("read", [...files, "AGENTS.md"]);
  return doc.toString();
}

// Persona descriptions - these describe the developer's background so the AI can adapt
const PERSONA_DESCRIPTIONS: Record<string, string> = {
  backend: "a senior backend developer specializing in APIs, databases, and microservices architecture",
  frontend: "a senior frontend developer specializing in UI components, styling, and user experience",
  fullstack: "a senior full-stack developer capable of working across the entire application stack",
  devops: "a DevOps engineer specializing in infrastructure, CI/CD pipelines, and containerization",
  data: "a data engineer specializing in data pipelines, ETL processes, and database optimization",
  security: "a security engineer focused on secure coding practices and vulnerability prevention",
};

// Boundary presets
const BOUNDARIES: Record<string, { always: string[]; askFirst: string[]; never: string[] }> = {
  conservative: {
    always: ["Read any file in the project", "Run lint and format commands"],
    askFirst: [
      "Modify any source file",
      "Add new dependencies",
      "Create new files",
      "Run test commands",
      "Modify configuration files",
    ],
    never: [
      "Delete any files",
      "Modify .env or secret files",
      "Push to git or make commits",
      "Access external APIs or services",
    ],
  },
  standard: {
    always: [
      "Read any file in the project",
      "Modify files in src/ or lib/",
      "Run build, test, and lint commands",
      "Create test files",
      "Fix linting errors automatically",
    ],
    askFirst: [
      "Add new dependencies to package.json",
      "Modify configuration files at root level",
      "Create new modules or directories",
      "Refactor code structure significantly",
    ],
    never: [
      "Modify .env files or secrets",
      "Delete critical files without backup",
      "Force push to git",
      "Expose sensitive information in logs",
    ],
  },
  permissive: {
    always: [
      "Modify any file in src/ or lib/",
      "Run any build, test, or dev scripts",
      "Add or update dependencies",
      "Create new files and directories",
      "Refactor and reorganize code",
    ],
    askFirst: [
      "Modify root-level configuration files",
      "Delete directories",
      "Make breaking changes to public APIs",
    ],
    never: [
      "Modify .env files directly",
      "Commit secrets or credentials",
      "Access production databases",
    ],
  },
};

/**
 * Boundary lists for the file. A preset is used only when the user gave no custom lists:
 * once any list is customised, mixing in preset lines would contradict it
 * (e.g. "Delete files" under Always next to a preset "Delete any files" under Never).
 */
function resolveBoundaries(options: GenerateOptions): { always: string[]; askFirst: string[]; never: string[] } {
  const hasCustom = Boolean(
    options.boundaryAlways?.length || options.boundaryNever?.length || options.boundaryAsk?.length
  );
  if (hasCustom) {
    return {
      always: options.boundaryAlways || [],
      askFirst: options.boundaryAsk || [],
      never: options.boundaryNever || [],
    };
  }
  return BOUNDARIES[options.boundaries] || BOUNDARIES.standard;
}

// Static file templates with defaults
const STATIC_FILE_TEMPLATES: Record<string, (options: GenerateOptions) => string> = {
  editorconfig: () => `# EditorConfig is awesome: https://EditorConfig.org

root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false

[Makefile]
indent_style = tab
`,
  contributing: (opts) => `# Contributing to ${opts.name}

Thank you for your interest in contributing!

## How to Contribute

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes${opts.conventionalCommits ? " using Conventional Commits format" : ""}
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## Development Setup

\`\`\`bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/${opts.name}.git
cd ${opts.name}

# Install dependencies
npm install

# Run development server
npm run dev
\`\`\`

## Code Style

Please follow the existing code style and conventions in this project.
`,
  codeOfConduct: (opts) => `# Code of Conduct

## Our Pledge

We pledge to make participation in the ${opts.name} project a harassment-free experience for everyone.

## Our Standards

Examples of behavior that contributes to a positive environment:
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community

## Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported to the project team.

## Attribution

This Code of Conduct is adapted from the Contributor Covenant, version 2.1.
`,
  security: (opts) => `# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in ${opts.name}, please report it by emailing the maintainers.

**Please do not open a public issue for security vulnerabilities.**

We will acknowledge receipt within 48 hours and provide a detailed response within 7 days.
`,
  roadmap: (opts) => `# Roadmap

## ${opts.name} Development Roadmap

### Current Version

- Core functionality

### Planned Features

- [ ] Feature 1
- [ ] Feature 2
- [ ] Feature 3

### Long-term Goals

- Goal 1
- Goal 2

---
*This roadmap is subject to change based on community feedback and priorities.*
`,
  gitignore: (opts) => {
    const patterns = ["# Dependencies", "node_modules/", ".pnpm-store/", ""];
    if (opts.stack.includes("python")) {
      patterns.push("# Python", "__pycache__/", "*.py[cod]", ".venv/", "venv/", "");
    }
    patterns.push("# Environment", ".env", ".env.local", ".env*.local", "");
    patterns.push("# Build outputs", "dist/", "build/", ".next/", "out/", "");
    patterns.push("# IDE", ".idea/", ".vscode/", "*.swp", "*.swo", "");
    patterns.push("# OS", ".DS_Store", "Thumbs.db", "");
    patterns.push("# Logs", "*.log", "npm-debug.log*", "");
    return patterns.join("\n");
  },
  funding: () => `# These are supported funding model platforms

github: [] # Replace with your GitHub username
patreon: # Replace with your Patreon username
open_collective: # Replace with your Open Collective username
ko_fi: # Replace with your Ko-fi username
custom: [] # Add custom funding links
`,
  license: (opts) => {
    if (opts.license === "mit") {
      return `MIT License

Copyright (c) ${new Date().getFullYear()} ${opts.name}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
    }
    return `# License

This project is licensed under the ${opts.license?.toUpperCase() || "Proprietary"} license.
`;
  },
  readme: (opts) => {
    const stackBadges = opts.stack.slice(0, 5).map(stackLabel).join(" • ");
    return `# ${opts.name}

${opts.description || "A project generated with LynxPrompt."}

${stackBadges ? `## Tech Stack\n\n${stackBadges}\n` : ""}
## Getting Started

\`\`\`bash
# Clone the repository
git clone <repository-url>
cd ${opts.name}

# Install dependencies
npm install

# Run development server
npm run dev
\`\`\`

## License

${opts.license && opts.license !== "none" ? `This project is licensed under the ${opts.license.toUpperCase()} License.` : "See LICENSE file for details."}
`;
  },
  architecture: (opts) => `# Architecture

## ${opts.name} Architecture Overview

${opts.architecture ? `### Pattern: ${opts.architecture}\n` : ""}
### Directory Structure

\`\`\`
${opts.name}/
├── src/           # Source code
├── tests/         # Test files
├── docs/          # Documentation
└── ...
\`\`\`

### Key Components

1. **Component A** - Description
2. **Component B** - Description
3. **Component C** - Description

### Data Flow

Describe how data flows through the application.

---
*Generated by LynxPrompt*
`,
  changelog: (opts) => `# Changelog

All notable changes to ${opts.name} will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup

### Changed

### Deprecated

### Removed

### Fixed

### Security
`,
};

// File paths for static files
const STATIC_FILE_PATHS: Record<string, string> = {
  editorconfig: ".editorconfig",
  contributing: "CONTRIBUTING.md",
  codeOfConduct: "CODE_OF_CONDUCT.md",
  security: "SECURITY.md",
  roadmap: "ROADMAP.md",
  gitignore: ".gitignore",
  funding: ".github/FUNDING.yml",
  license: "LICENSE",
  readme: "README.md",
  architecture: "ARCHITECTURE.md",
  changelog: "CHANGELOG.md",
};

// CLI wizard ids that the shared generator and the web wizard spell another way
const ID_ALIASES: Record<string, string> = {
  opensource: "open_source", // project type
  modular: "modular_monolith", // architecture
  azure_devops: "azure_pipelines", // CI/CD
  bitbucket: "bitbucket_pipelines", // CI/CD
  structured_json: "structured", // logging
  console_log: "console", // logging
};
const REGISTRY_ALIASES: Record<string, string> = { gitlab: "gitlab_registry" };
const REPO_HOST_ALIASES: Record<string, string> = { azure: "azure_devops" };

const alias = (id: string | undefined, aliases = ID_ALIASES) => (id ? aliases[id] ?? id : id);
const list = (value: string | string[] | undefined) => (Array.isArray(value) ? value : value ? [value] : []);
const commaItems = (value: string | undefined) => (value || "").split(",").map((item) => item.trim()).filter(Boolean);

// A multi-select with its "other" choice swapped for the text the user typed
function withOther(items: string[] | undefined, other: string | undefined): string[] {
  return (items || []).flatMap((item) => (item === "other" ? commaItems(other) : [item]));
}

const LANGUAGE_IDS = new Set(LANGUAGES.map((option) => option.id));
const DATABASE_IDS = new Set(DATABASES.map((option) => option.id));

// The CLI's command categories, each one string or several
function toCommands(commands: Record<string, string | string[]>): GeneratorConfig["commands"] {
  const first = (key: string) => list(commands[key])[0];
  const rest = (key: string) => list(commands[key]).slice(1);
  return {
    build: first("build"),
    test: first("test"),
    lint: first("lint"),
    dev: first("dev"),
    typecheck: first("typecheck"),
    format: first("format"),
    preCommit: first("preCommit"),
    clean: first("clean"),
    additional: [
      ...list(commands.install),
      ...["build", "test", "lint", "dev", "typecheck", "format", "preCommit", "clean"].flatMap(rest),
      ...list(commands.testCoverage),
      ...list(commands.additional),
      ...list(commands.custom),
    ].filter(Boolean),
  };
}

// Static files whose content goes into the rules file ("config only")
function embeddedStaticFiles(options: GenerateOptions): { path: string; content: string }[] {
  if (options.staticFileHandling !== "config_only") return [];
  return (options.staticFiles || []).flatMap((key) => {
    const path = STATIC_FILE_PATHS[key];
    const content = options.staticFileContents?.[key] ?? STATIC_FILE_TEMPLATES[key]?.(options);
    return path && content ? [{ path, content }] : [];
  });
}

/** The CLI wizard's answers as the shared generator's config. */
export function toGeneratorConfig(options: GenerateOptions): GeneratorConfig {
  const boundaries = resolveBoundaries(options);
  const security = options.security || {};
  const stack = options.stack || [];
  return {
    projectName: options.name,
    projectDescription: options.description || "",
    projectType: alias(options.projectType),
    architecturePattern: alias(options.architecture),
    architecturePatternOther: options.architectureOther,
    devOS: options.devOS,
    languages: stack.filter((id) => LANGUAGE_IDS.has(id)),
    databases: stack.filter((id) => DATABASE_IDS.has(id)),
    frameworks: [
      ...stack.filter((id) => !LANGUAGE_IDS.has(id) && !DATABASE_IDS.has(id)),
      ...commaItems(options.additionalLibraries),
    ],
    letAiDecide: Boolean(options.letAiDecide),
    packageManager: options.packageManager,
    jsRuntime: options.jsRuntime,
    monorepoTool: options.monorepoTool,
    orm: options.orm,
    repoHost: alias(options.repoHost, REPO_HOST_ALIASES) || "",
    repoUrl: "",
    exampleRepoUrl: options.exampleRepoUrl,
    documentationUrl: options.documentationUrl,
    isPublic: options.isPublic,
    license: options.license || "",
    funding: false, // FUNDING.yml is one of the static files below
    conventionalCommits: options.conventionalCommits,
    semver: options.semver,
    versionTagFormat: options.versionTagFormat,
    changelogTool: options.changelogTool,
    branchStrategy: options.branchStrategy,
    defaultBranch: options.defaultBranch,
    allowDirectCommits: options.allowDirectCommits,
    commitSigning: options.commitSigning,
    useGitWorktrees: options.useGitWorktrees,
    cicd: withOther(list(options.cicd), options.cicdOther).map((id) => alias(id) as string),
    deploymentTarget: options.deploymentTargets,
    buildContainer: options.buildContainer,
    containerRegistry: alias(options.containerRegistry, REGISTRY_ALIASES),
    customRegistry: options.customRegistryUrl,
    dockerImageNames: options.dockerImageNames,
    aiBehaviorRules: options.aiBehavior || [],
    planModeFrequency: options.planModeFrequency,
    explanationVerbosity: options.explanationVerbosity,
    accessibilityFocus: options.accessibilityFocus,
    performanceFocus: options.performanceFocus,
    attemptWorkarounds: options.attemptWorkarounds,
    mcpServers: options.mcpServers,
    serverAccess: options.serverAccess,
    sshKeyPath: options.sshKeyPath,
    manualDeployment: options.manualDeployment,
    deploymentMethod: options.deploymentMethod,
    importantFiles: options.importantFiles,
    importantFilesOther: options.importantFilesOther,
    // The web wizard's "self-improving blueprint" answer
    enableAutoUpdate: options.selfImprove,
    preferCliSync: options.preferCliSync !== false,
    tokenEnvVar: options.tokenEnvVar,
    blueprintMode: options.blueprintMode,
    additionalFeedback: options.extraNotes || "",
    commands: toCommands(options.commands || {}),
    boundaries: { always: boundaries.always, ask: boundaries.askFirst, never: boundaries.never },
    codeStyle: {
      naming: options.namingConvention,
      errorHandling: options.errorHandling,
      errorHandlingOther: options.errorHandlingOther,
      loggingConventions:
        options.loggingConventions === "other" ? options.loggingConventionsOther : alias(options.loggingConventions),
      maxFileLength: options.maxFileLength,
      importOrder: options.importOrder,
      commentLanguage: options.commentLanguage,
      docStyle: options.docStyle,
      notes: options.styleNotes,
    },
    testingStrategy: {
      levels: options.testLevels,
      frameworks: options.testFrameworks,
      coverage: options.coverageTarget,
      notes: options.testNotes,
      tddPreference: options.tddPreference,
      snapshotTesting: options.snapshotTesting,
      mockStrategy: options.mockStrategy,
    },
    staticFiles: { customFiles: embeddedStaticFiles(options) },
    security: {
      authProviders: withOther(security.authProviders, security.authProvidersOther),
      secretsManagement: withOther(security.secretsManagement, security.secretsManagementOther),
      securityTooling: withOther(security.securityTooling, security.securityToolingOther),
      authPatterns: withOther(security.authPatterns, security.authPatternsOther),
      dataHandling: withOther(security.dataHandling, security.dataHandlingOther),
      compliance: withOther(security.compliance, security.complianceOther),
      analytics: withOther(security.analytics, security.analyticsOther),
      additionalNotes: security.additionalNotes,
    },
  };
}

/**
 * The developer the file describes. The profile (name, background, skill
 * level) is used only when the user chose to include it; otherwise the
 * persona picked in the wizard is the background.
 */
export function toGeneratorUser(options: GenerateOptions): GeneratorUser {
  const profile = options.includePersonalData;
  return {
    name: profile ? options.userName : undefined,
    persona: (profile && options.userPersona) || PERSONA_DESCRIPTIONS[options.persona] || options.persona || undefined,
    skillLevel: profile ? options.userExpertise : undefined,
  };
}

export function generateConfig(options: GenerateOptions): Record<string, string> {
  const files: Record<string, string> = {};

  // AI tool rule files, from the shared generator. "agents" is universal.
  const platforms = options.platforms
    .map((platform) => (platform === "agents" ? "universal" : resolvePlatformId(platform)))
    .filter((platform) => PLATFORM_FILES[platform]);
  const appUrl = (options.apiUrl ?? "https://lynxprompt.com").replace(/\/+$/, "");
  const generated = generatePlatformFiles(toGeneratorConfig(options), toGeneratorUser(options), platforms, {
    pointers: Boolean(options.pointerFiles),
    brand: { appName: "LynxPrompt", appUrl },
    blueprintId: options.enableAutoUpdate ? options.blueprintId : undefined,
  });
  for (const file of generated) files[file.fileName] = file.content;

  // Static files (only in "both" mode; in "config only" they are in the rules file)
  const createLocalStaticFiles = options.staticFileHandling !== "config_only";
  
  if (options.staticFiles && options.staticFiles.length > 0 && createLocalStaticFiles) {
    for (const fileKey of options.staticFiles) {
      const filePath = STATIC_FILE_PATHS[fileKey];
      if (!filePath) continue;

      // Use custom content if provided, otherwise generate default
      if (options.staticFileContents?.[fileKey]) {
        files[filePath] = options.staticFileContents[fileKey];
      } else {
        const templateFn = STATIC_FILE_TEMPLATES[fileKey];
        if (templateFn) {
          files[filePath] = templateFn(options);
        }
      }
    }
  }

  // Legacy: funding as separate option (respect staticFileHandling)
  if (options.includeFunding && !options.staticFiles?.includes("funding") && createLocalStaticFiles) {
    files[".github/FUNDING.yml"] = STATIC_FILE_TEMPLATES.funding(options);
  }

  // Apply variable filling if variables are provided
  if (options.variables && Object.keys(options.variables).length > 0) {
    for (const [filename, content] of Object.entries(files)) {
      files[filename] = fillVariables(content, options.variables);
    }
  }

  return files;
}
