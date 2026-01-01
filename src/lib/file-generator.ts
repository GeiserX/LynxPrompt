// File generation utilities for the wizard
import JSZip from "jszip";

interface CommandsConfig {
  build?: string;
  test?: string;
  lint?: string;
  dev?: string;
  additional?: string[];
  savePreferences?: boolean;
}

interface BoundariesConfig {
  always?: string[];
  ask?: string[];
  never?: string[];
  savePreferences?: boolean;
}

interface CodeStyleConfig {
  naming?: string;
  errorHandling?: string;
  errorHandlingOther?: string;
  loggingConventions?: string;
  patterns?: string;
  notes?: string;
  savePreferences?: boolean;
}

interface TestingStrategyConfig {
  levels?: string[];
  coverage?: number;
  frameworks?: string[];
  notes?: string;
  savePreferences?: boolean;
}

interface StaticFilesConfig {
  funding?: boolean;
  fundingYml?: string;
  fundingSave?: boolean;
  editorconfig?: boolean;
  editorconfigCustom?: string;
  editorconfigSave?: boolean;
  contributing?: boolean;
  contributingCustom?: string;
  contributingSave?: boolean;
  codeOfConduct?: boolean;
  codeOfConductCustom?: string;
  codeOfConductSave?: boolean;
  security?: boolean;
  securityCustom?: string;
  securitySave?: boolean;
  roadmap?: boolean;
  roadmapCustom?: string;
  roadmapSave?: boolean;
  gitignoreMode?: "generate" | "custom" | "skip";
  gitignoreCustom?: string;
  gitignoreSave?: boolean;
  dockerignoreMode?: "generate" | "custom" | "skip";
  dockerignoreCustom?: string;
  dockerignoreSave?: boolean;
  license?: string;
  licenseSave?: boolean;
}

interface WizardConfig {
  projectName: string;
  projectDescription: string;
  projectType?: string; // work, leisure, open_source_small, etc.
  architecturePattern?: string;
  architecturePatternOther?: string;
  devOS?: string | string[]; // linux, macos, windows, wsl - can be multi-select
  languages: string[];
  frameworks: string[];
  databases?: string[]; // preferred databases (multi-select)
  letAiDecide: boolean;
  repoHost: string;
  repoHostOther?: string;
  repoUrl: string;
  exampleRepoUrl?: string;
  documentationUrl?: string; // external docs (Confluence, Notion, etc.)
  isPublic: boolean;
  license: string;
  licenseOther?: string;
  licenseNotes?: string;
  licenseSave?: boolean;
  repoHosts?: string[];
  multiRepoReason?: string;
  funding: boolean;
  fundingYml?: string;
  releaseStrategy?: string;
  customReleaseStrategy?: string;
  cicd: string[];
  conventionalCommits?: boolean;
  semver?: boolean;
  containerRegistry?: string;
  customRegistry?: string;
  deploymentTarget?: string[];
  buildContainer?: boolean;
  aiBehaviorRules: string[];
  importantFiles?: string[];
  importantFilesOther?: string;
  enableAutoUpdate?: boolean;
  includePersonalData?: boolean;
  platform?: string;
  platforms?: string[];
  blueprintMode?: boolean;
  additionalFeedback: string;
  commands?: CommandsConfig;
  boundaries?: BoundariesConfig;
  codeStyle?: CodeStyleConfig;
  testingStrategy?: TestingStrategyConfig;
  staticFiles?: StaticFilesConfig;
  saveAllPreferences?: boolean;
  security?: SecurityConfig;
}

// Security configuration (FREE tier)
interface SecurityConfig {
  secretsManagement?: string[];
  securityTooling?: string[];
  authPatterns?: string[];
  dataHandling?: string[];
  additionalNotes?: string;
}

// Blueprint variable helpers
// Converts a value to [[VARIABLE|default]] format when blueprint mode is enabled
function bpVar(
  blueprintMode: boolean | undefined,
  varName: string,
  defaultValue: string
): string {
  if (!blueprintMode) return defaultValue;
  // If default is empty, just use [[VAR]]
  if (!defaultValue || defaultValue.trim() === "") {
    return `[[${varName}]]`;
  }
  return `[[${varName}|${defaultValue}]]`;
}

// For multiple values (arrays), creates comma-separated variable or value
function bpVarArray(
  blueprintMode: boolean | undefined,
  varName: string,
  values: string[]
): string {
  const joined = values.join(", ");
  if (!blueprintMode) return joined;
  if (!joined || joined.trim() === "") {
    return `[[${varName}]]`;
  }
  return `[[${varName}|${joined}]]`;
}

// Project type behavioral instructions
const PROJECT_TYPE_INSTRUCTIONS: Record<string, string[]> = {
  work: [
    "**STRICT MODE**: This is a work project. Follow procedures exactly as documented.",
    "Do not deviate from established patterns or make assumptions.",
    "Always ask for clarification rather than guessing.",
    "Document all decisions and changes thoroughly.",
  ],
  leisure: [
    "**CREATIVE MODE**: This is a leisure/learning project.",
    "Be inventive and suggest creative solutions.",
    "**IMPORTANT**: Never delete files without explicit consent.",
    "Take time to explain concepts and alternatives.",
  ],
  open_source_small: [
    "This is a small open source project.",
    "Balance best practices with pragmatic simplicity.",
    "Keep documentation user-friendly for potential contributors.",
  ],
  open_source_large: [
    "This is a large open source project with an established community.",
    "Follow existing conventions strictly.",
    "Consider backward compatibility for all changes.",
    "Document everything thoroughly for maintainers and contributors.",
  ],
  private_business: [
    "This is a private business project.",
    "Balance development speed with code quality.",
    "Focus on MVP features and iterate.",
    "Document important architectural decisions.",
  ],
};

interface UserProfile {
  displayName?: string | null;
  name?: string | null;
  persona?: string | null;
  skillLevel?: string | null;
  tier?: string; // "free" | "pro" | "max"
}

// Tier access helper - checks if user tier can access a feature tier
function canAccessFeature(userTier: string | undefined, featureTier: "basic" | "intermediate" | "advanced"): boolean {
  const tierLevels: Record<string, number> = { free: 0, pro: 1, max: 2 };
  const featureLevels: Record<string, number> = { basic: 0, intermediate: 1, advanced: 2 };
  const userLevel = tierLevels[userTier || "free"] ?? 0;
  return userLevel >= featureLevels[featureTier];
}

// Platform file names
// These are the PRIMARY platforms, but files work across multiple IDEs
const PLATFORM_FILES: Record<string, string> = {
  universal: "AGENTS.md",
  cursor: ".cursor/rules/project.mdc",
  claude: "CLAUDE.md",
  copilot: ".github/copilot-instructions.md",
  windsurf: ".windsurfrules",
  antigravity: "GEMINI.md",
  aider: ".aider.conf.yml",
  continue: ".continue/config.json",
  cody: ".cody/config.json",
  tabnine: ".tabnine.yaml",
  supermaven: ".supermaven/config.json",
  codegpt: ".codegpt/config.json",
  void: ".void/config.json",
};

// Helper: normalize platforms array (supports legacy array or single string)
function resolvePlatforms(config: WizardConfig): string[] {
  if (Array.isArray(config.platforms)) return config.platforms;
  if (config.platform) return [config.platform];
  return ["cursor"];
}

// Helper: normalize devOS to array (supports legacy string or new array format)
function resolveDevOS(config: WizardConfig): string[] {
  if (Array.isArray(config.devOS)) return config.devOS;
  if (config.devOS) return [config.devOS];
  return ["linux"];
}

// Helper: check if multiple OS platforms are selected
function isMultiPlatformOS(config: WizardConfig): boolean {
  const osList = resolveDevOS(config);
  if (osList.length > 1) return true;
  const hasWindows = osList.includes("windows");
  const hasUnix = osList.includes("linux") || osList.includes("macos") || osList.includes("wsl");
  return hasWindows && hasUnix;
}

// Helper: format devOS list for display
function formatDevOSDisplay(config: WizardConfig): string {
  const osNames: Record<string, string> = {
    linux: "Linux",
    macos: "macOS",
    windows: "Windows",
    wsl: "WSL",
  };
  const osList = resolveDevOS(config);
  if (osList.length === 0) return "Linux";
  if (osList.length === 1) return osNames[osList[0]] || osList[0];
  return osList.map(os => osNames[os] || os).join(", ");
}

// ============================================================================
// TEMPLATE VARIABLES SYSTEM
// Delimiter: [[variable_name]] or [[variable_name|default_value]]
// Chosen to avoid conflicts with {{}} templates (Vue, Angular, Handlebars, etc.)
// ============================================================================

// Regular expression to detect template variables with optional defaults
// Matches: [[VAR_NAME]] or [[VAR_NAME|default value]]
const VARIABLE_PATTERN = /\[\[([A-Za-z_][A-Za-z0-9_]*)(?:\|([^\]]*))?\]\]/g;

// Pattern for simple detection (without capturing defaults)
const VARIABLE_SIMPLE_PATTERN = /\[\[([A-Za-z_][A-Za-z0-9_]*)(?:\|[^\]]*)?\]\]/g;

// Common variable suggestions
export const SUGGESTED_VARIABLES = [
  { name: "PROJECT_NAME", description: "Name of the project", example: "my-awesome-app" },
  { name: "CONFLUENCE_URL", description: "Confluence documentation URL", example: "https://company.atlassian.net/wiki" },
  { name: "K8S_CLUSTER", description: "Kubernetes cluster name", example: "prod-cluster-eu-west-1" },
  { name: "JIRA_PROJECT", description: "Jira project key", example: "PROJ" },
  { name: "SLACK_CHANNEL", description: "Slack channel for notifications", example: "#team-dev" },
  { name: "DOCKER_REGISTRY", description: "Docker registry URL", example: "gcr.io/my-project" },
  { name: "API_BASE_URL", description: "Base API URL", example: "https://api.example.com" },
  { name: "TEAM_NAME", description: "Team or department name", example: "Platform Team" },
  { name: "REPO_URL", description: "Repository URL", example: "https://github.com/org/repo" },
  { name: "CI_TOOL", description: "CI/CD tool name", example: "GitHub Actions" },
];

/**
 * Parsed variable with name and optional creator-provided default
 */
export interface ParsedVariable {
  name: string;
  creatorDefault?: string;
}

/**
 * Detect all template variables in content
 * Variables use [[VARIABLE_NAME]] or [[VARIABLE_NAME|default]] format
 * All variable names are normalized to UPPERCASE internally
 * So [[myVar]], [[MYVAR]], [[MyVar]] are all treated as [[MYVAR]]
 */
export function detectVariables(content: string): string[] {
  const matches = content.match(VARIABLE_SIMPLE_PATTERN);
  if (!matches) return [];
  
  // Extract unique variable names (without brackets/defaults), normalized to UPPERCASE
  const variables = new Set<string>();
  for (const match of matches) {
    // Remove [[ and ]], then split by | and take the first part (variable name)
    const inner = match.replace(/\[\[|\]\]/g, "");
    const varName = inner.split("|")[0].toUpperCase();
    variables.add(varName);
  }
  
  return Array.from(variables);
}

/**
 * Parse variables with their creator-provided defaults
 * Returns a map of variable names to their defaults (if any)
 */
export function parseVariablesWithDefaults(content: string): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};
  let match;
  
  // Reset regex state
  const regex = new RegExp(VARIABLE_PATTERN.source, "g");
  
  while ((match = regex.exec(content)) !== null) {
    const varName = match[1].toUpperCase();
    const defaultValue = match[2]; // May be undefined if no | was present
    
    // Only set the default if this variable hasn't been seen yet,
    // or if this instance has a default and the previous one didn't
    if (!(varName in result) || (defaultValue !== undefined && result[varName] === undefined)) {
      result[varName] = defaultValue;
    }
  }
  
  return result;
}

/**
 * Replace variables in content with provided values
 * Matches are case-insensitive: [[var]], [[VAR]], [[Var]] all work
 * Handles both [[VAR]] and [[VAR|default]] syntax
 * Values are looked up by UPPERCASE key
 */
export function replaceVariables(
  content: string, 
  values: Record<string, string>
): string {
  return content.replace(VARIABLE_PATTERN, (match, varName, defaultVal) => {
    const upperVarName = varName.toUpperCase();
    // If we have a user-provided value, use it
    if (values[upperVarName] !== undefined && values[upperVarName] !== "") {
      return values[upperVarName];
    }
    // If there's a default in the pattern and no user value, use the default
    if (defaultVal !== undefined) {
      return defaultVal;
    }
    // Otherwise keep the original pattern (without default syntax for cleaner output)
    return `[[${upperVarName}]]`;
  });
}

/**
 * Highlight variables in content for preview (returns HTML)
 */
export function highlightVariables(content: string): string {
  return content.replace(
    VARIABLE_PATTERN,
    '<span class="variable-highlight bg-yellow-200 dark:bg-yellow-800 px-1 rounded font-mono text-sm">$&</span>'
  );
}

/**
 * Check if content contains any variables
 */
export function hasVariables(content: string): boolean {
  // Use a fresh regex to avoid state issues with global flag
  return /\[\[([A-Za-z_][A-Za-z0-9_]*)(?:\|[^\]]*)?\]\]/.test(content);
}

/**
 * Duplicate variable default info for warnings
 */
export interface DuplicateVariableDefault {
  variableName: string;
  occurrences: Array<{ line: number; defaultValue: string }>;
}

/**
 * Detect variables that have multiple different default values
 * 
 * Rules:
 * - [[VAR]] and [[VAR]] → No warning (repeated without defaults)
 * - [[VAR]] and [[VAR|default]] → No warning (pick the one with default)
 * - [[VAR|default1]] and [[VAR|default2]] → Warning! Different defaults
 * - [[VAR|default]] and [[VAR|default]] → No warning (same default)
 * 
 * Returns array of variables that have conflicting defaults, with line numbers
 */
export function detectDuplicateVariableDefaults(content: string): DuplicateVariableDefault[] {
  const lines = content.split("\n");
  const variableOccurrences: Record<string, Array<{ line: number; defaultValue: string }>> = {};
  
  // Pattern to match variables with defaults only
  const patternWithDefault = /\[\[([A-Za-z_][A-Za-z0-9_]*)\|([^\]]*)\]\]/g;
  
  lines.forEach((lineContent, index) => {
    const lineNumber = index + 1;
    let match;
    
    // Reset regex state
    const regex = new RegExp(patternWithDefault.source, "g");
    
    while ((match = regex.exec(lineContent)) !== null) {
      const varName = match[1].toUpperCase();
      const defaultValue = match[2];
      
      if (!variableOccurrences[varName]) {
        variableOccurrences[varName] = [];
      }
      
      variableOccurrences[varName].push({ line: lineNumber, defaultValue });
    }
  });
  
  // Find variables with multiple DIFFERENT defaults
  const duplicates: DuplicateVariableDefault[] = [];
  
  for (const [varName, occurrences] of Object.entries(variableOccurrences)) {
    // Get unique default values
    const uniqueDefaults = new Set(occurrences.map(o => o.defaultValue));
    
    // Only warn if there are multiple DIFFERENT default values
    if (uniqueDefaults.size > 1) {
      duplicates.push({
        variableName: varName,
        occurrences: occurrences,
      });
    }
  }
  
  return duplicates;
}

/**
 * Escape literal brackets that should not be treated as variables
 * Use \\[\\[ for literal [[
 */
export function escapeVariables(content: string): string {
  return content.replace(/\\\[\\\[/g, "[[").replace(/\\\]\\\]/g, "]]");
}

// Generate Cursor project rules content (.cursor/rules/*.mdc format)
// MDC format: Markdown with YAML frontmatter
function generateCursorRules(config: WizardConfig, user: UserProfile): string {
  const lines: string[] = [];
  const bp = config.blueprintMode;

  // MDC frontmatter
  lines.push("---");
  lines.push(`description: AI rules for ${bpVar(bp, "PROJECT_NAME", config.projectName || "this project")}`);
  lines.push("alwaysApply: true");
  lines.push("---");
  lines.push("");
  lines.push(`# ${bpVar(bp, "PROJECT_NAME", config.projectName || "Project")} - AI Rules`);
  lines.push("");
  lines.push("## Project Overview");
  lines.push("");
  lines.push(`**Description**: ${bpVar(bp, "PROJECT_DESCRIPTION", config.projectDescription || "A software project.")}`);
  lines.push("");
  if (config.architecturePattern) {
    const archLabels: Record<string, string> = {
      monolith: "Monolith - single deployable unit",
      modular_monolith: "Modular Monolith - organized into modules but deployed as one unit",
      microservices: "Microservices - independently deployable services",
      serverless: "Serverless - function-as-a-service architecture",
      event_driven: "Event-Driven - components communicate via events",
      layered: "Layered / N-Tier - separated into presentation, business, data layers",
      hexagonal: "Hexagonal / Ports & Adapters - domain at center, adapters at edges",
      clean: "Clean Architecture - dependency rule points inward",
      cqrs: "CQRS - separate read and write models",
      mvc: "MVC / MVVM - Model-View-Controller or Model-View-ViewModel",
      other: config.architecturePatternOther || "Custom architecture",
    };
    const archValue = archLabels[config.architecturePattern] || config.architecturePattern;
    lines.push(`**Architecture Pattern**: ${bpVar(bp, "ARCHITECTURE_PATTERN", archValue)}`);
  }
  if (config.isPublic !== undefined) {
    lines.push(`**Visibility**: ${config.isPublic ? "Public repository" : "Private repository"}`);
  }
  if (config.devOS) {
    lines.push(`**Development OS**: ${formatDevOSDisplay(config)}`);
  }
  lines.push("");

  // Repository information
  const hasRepoInfo = config.repoUrl || config.repoHosts?.length || config.repoHost;
  if (hasRepoInfo) {
    lines.push("### Repository");
    if (config.repoUrl) {
      lines.push(`- **URL**: ${bpVar(bp, "REPO_URL", config.repoUrl)}`);
    }
    if (config.repoHosts?.length || config.repoHost) {
      const hostNames: Record<string, string> = {
        github: "GitHub",
        gitlab: "GitLab",
        bitbucket: "Bitbucket",
        gitea: "Gitea",
        forgejo: "Forgejo",
        codeberg: "Codeberg",
        sourcehut: "SourceHut",
        gogs: "Gogs",
        aws_codecommit: "AWS CodeCommit",
        azure_devops: "Azure DevOps",
        gerrit: "Gerrit",
        phabricator: "Phabricator",
        other: config.repoHostOther || "Other",
      };
      const hosts = config.repoHosts?.length ? config.repoHosts : [config.repoHost];
      const hostLabels = hosts.map(h => hostNames[h] || h).join(", ");
      lines.push(`- **Platform${hosts.length > 1 ? 's' : ''}**: ${bpVar(bp, "REPO_HOST", hostLabels)}`);
      if (hosts.length > 1 && config.multiRepoReason) {
        lines.push(`- **Why multiple platforms**: ${config.multiRepoReason}`);
      }
    }
    lines.push("");
  }

  // Development environment details
  if (config.devOS) {
    const osList = resolveDevOS(config);
    lines.push("### Development Environment");
    if (isMultiPlatformOS(config) || osList.length > 1) {
      lines.push("- Use cross-platform commands that work on Windows, macOS, and Linux");
      lines.push("- Prefer npm scripts or Makefile targets over platform-specific commands");
    } else if (osList.includes("windows")) {
      lines.push("- Use PowerShell or CMD compatible commands");
      lines.push("- Use backslashes for paths, or forward slashes for cross-platform compatibility");
    } else if (osList.includes("wsl")) {
      lines.push("- Prefer Linux commands (bash/zsh)");
      lines.push("- Be aware of Windows/Linux path translations when needed");
    } else if (osList.includes("linux")) {
      lines.push("- Use standard Unix/Linux commands (bash, zsh)");
    } else if (osList.includes("macos")) {
      lines.push("- Use standard Unix commands, macOS-specific tools are acceptable");
    }
    lines.push("");
  }

  // Reference materials
  if (config.exampleRepoUrl || config.documentationUrl) {
    lines.push("### Reference Materials");
    if (config.exampleRepoUrl) {
      lines.push(`- **Example Repository**: ${bpVar(bp, "EXAMPLE_REPO_URL", config.exampleRepoUrl)}`);
      lines.push("  Use this as a reference for coding patterns, conventions, and architecture decisions.");
    }
    if (config.documentationUrl) {
      lines.push(`- **External Documentation**: ${bpVar(bp, "DOCUMENTATION_URL", config.documentationUrl)}`);
      lines.push("  Refer to this for additional project context, architecture decisions, and team guidelines.");
    }
    lines.push("");
  }

  if (config.languages.length > 0 || config.frameworks.length > 0 || (config.databases && config.databases.length > 0) || config.letAiDecide) {
    lines.push("## Technology Stack");
    lines.push("");
    lines.push("This project uses the following technologies. Please ensure all code follows the conventions and best practices for these:");
    lines.push("");
    if (config.languages.length > 0) {
      const langs = config.languages.map(l => l.startsWith("custom:") ? l.replace("custom:", "") : l);
      lines.push(`**Programming Languages**: ${bpVarArray(bp, "LANGUAGES", langs)}`);
    }
    if (config.frameworks.length > 0) {
      const fws = config.frameworks.map(f => f.startsWith("custom:") ? f.replace("custom:", "") : f);
      lines.push(`**Frameworks & Libraries**: ${bpVarArray(bp, "FRAMEWORKS", fws)}`);
    }
    if (config.databases && config.databases.length > 0) {
      const dbs = config.databases.map(d => d.startsWith("custom:") ? d.replace("custom:", "") : d);
      lines.push(`**Database${config.databases.length > 1 ? 's' : ''}**: ${bpVarArray(bp, "DATABASES", dbs)}`);
    }
    if (config.letAiDecide) {
      lines.push("");
      if (config.languages.length > 0 || config.frameworks.length > 0) {
        lines.push("**AI Flexibility**: For technologies not listed above, you may suggest and use what's best suited for the project based on codebase analysis.");
      } else {
        lines.push("**AI Flexibility**: Analyze the codebase to determine appropriate languages and frameworks. You have full flexibility to choose what works best.");
      }
    }
    lines.push("");
  }

  lines.push("## Code Style & Conventions");
  lines.push("");
  lines.push("Follow these coding style guidelines when writing or modifying code:");
  lines.push("");
  
  // Developer profile (if included)
  if (config.includePersonalData !== false && user.skillLevel) {
    lines.push("### Developer Profile");
    const authorName = user.displayName || user.name || "Developer";
    lines.push(`- **Author**: ${bpVar(bp, "AUTHOR_NAME", authorName)}`);
    if (user.persona) {
      lines.push(`- **Developer Type**: ${user.persona.replace(/_/g, " ")}`);
    }
    lines.push(`- **Experience Level**: ${user.skillLevel.charAt(0).toUpperCase() + user.skillLevel.slice(1)}`);
    lines.push("");
    lines.push("### Communication Style");
    if (user.skillLevel === "novice" || user.skillLevel === "beginner") {
      lines.push("- Be verbose with explanations and add helpful comments");
      lines.push("- Explain concepts and reasoning as you implement them");
      lines.push("- Ask clarifying questions when requirements are unclear");
    } else if (user.skillLevel === "intermediate") {
      lines.push("- Provide balanced explanations, not too verbose");
      lines.push("- Focus on important decisions, trade-offs, and non-obvious choices");
    } else {
      lines.push("- Be concise and direct in communications");
      lines.push("- Assume expertise - minimal hand-holding needed");
      lines.push("- Focus on implementation details, skip explanations of basics");
    }
    lines.push("");
  }

  // Naming conventions
  if (config.codeStyle?.naming) {
    const namingDescriptions: Record<string, string> = {
      language_default: "Follow the idiomatic naming conventions of each language",
      camelCase: "Use camelCase for variables and functions (e.g., myVariable, getUserName)",
      snake_case: "Use snake_case for variables and functions (e.g., my_variable, get_user_name)",
      PascalCase: "Use PascalCase for classes and types (e.g., MyClass, UserProfile)",
      "kebab-case": "Use kebab-case for file names and URLs (e.g., my-component, user-profile)",
    };
    const namingValue = namingDescriptions[config.codeStyle.naming] || config.codeStyle.naming;
    lines.push("### Naming Conventions");
    lines.push(`**Style**: ${bpVar(bp, "NAMING_CONVENTION", namingValue)}`);
    lines.push("");
  }

  // Error handling
  if (config.codeStyle?.errorHandling) {
    const errorDescriptions: Record<string, string> = {
      try_catch: "Wrap risky operations in try-catch blocks and handle errors appropriately",
      result_types: "Use Result/Either types to represent success or failure (no exceptions for control flow)",
      error_boundaries: "Use React Error Boundaries to catch rendering errors in component trees",
      global_handler: "Use a centralized global error handler for consistent error processing",
      middleware: "Handle errors through middleware layers (e.g., Express error middleware)",
      exceptions: "Use custom exception/error classes with meaningful error messages and types",
      other: config.codeStyle.errorHandlingOther || "Follow the project's custom error handling approach",
    };
    const errorValue = errorDescriptions[config.codeStyle.errorHandling] || config.codeStyle.errorHandling;
    lines.push("### Error Handling");
    lines.push(`**Approach**: ${bpVar(bp, "ERROR_HANDLING", errorValue)}`);
    lines.push("");
  }

  // Logging
  if (config.codeStyle?.loggingConventions) {
    lines.push("### Logging Conventions");
    lines.push(`**Guidelines**: ${bpVar(bp, "LOGGING_CONVENTIONS", config.codeStyle.loggingConventions)}`);
    lines.push("");
  }

  // Additional style notes
  if (config.codeStyle?.notes) {
    lines.push("### Additional Style Notes");
    lines.push(bpVar(bp, "CODE_STYLE_NOTES", config.codeStyle.notes));
    lines.push("");
  }

  if (config.aiBehaviorRules.length > 0) {
    lines.push("## AI Behavior Guidelines");
    lines.push("");
    lines.push("When assisting with this project, follow these specific rules:");
    lines.push("");
    config.aiBehaviorRules.forEach((rule) => {
      const ruleText = getRuleDescription(rule);
      if (ruleText) lines.push(`- ${ruleText}`);
    });
    lines.push("");
  }

  // Important files to read first
  const importantFileLabels: Record<string, string> = {
    readme: "README.md - Project overview and setup instructions",
    package_json: "package.json - Dependencies and scripts",
    changelog: "CHANGELOG.md - Version history and changes",
    contributing: "CONTRIBUTING.md - Contribution guidelines",
    makefile: "Makefile - Build and task automation",
    dockerfile: "Dockerfile - Container build instructions",
    docker_compose: "docker-compose.yml - Multi-container setup",
    env_example: ".env.example - Environment variable reference",
    openapi: "openapi.yaml / swagger.json - API specification",
    architecture_md: "ARCHITECTURE.md - System architecture docs",
    api_docs: "API documentation files",
    database_schema: "Database schema / migration files",
  };
  const hasImportantFiles = (config.importantFiles?.length ?? 0) > 0 || config.importantFilesOther?.trim();
  if (hasImportantFiles) {
    lines.push("## Important Files to Read First");
    lines.push("");
    lines.push("Before making significant changes, read these files to understand the project context:");
    lines.push("");
    const allFiles: string[] = [];
    if (config.importantFiles?.length) {
      config.importantFiles.forEach(f => {
        allFiles.push(importantFileLabels[f] || f);
      });
    }
    if (config.importantFilesOther?.trim()) {
      config.importantFilesOther.split(",").map(f => f.trim()).filter(Boolean).forEach(f => {
        allFiles.push(f);
      });
    }
    if (bp && allFiles.length > 0) {
      lines.push(bpVar(bp, "IMPORTANT_FILES", allFiles.join(", ")));
    } else {
      allFiles.forEach(f => lines.push(`- ${f}`));
    }
    lines.push("");
  }

  // Only include Boundaries section if user actually specified boundaries AND has Max tier access
  const hasBoundaries = config.boundaries && (
    (config.boundaries.always?.length ?? 0) > 0 ||
    (config.boundaries.ask?.length ?? 0) > 0 ||
    (config.boundaries.never?.length ?? 0) > 0
  );
  if (hasBoundaries && canAccessFeature(user.tier, "advanced")) {
    lines.push("## Boundaries & Permissions");
    lines.push("");
    lines.push("These are explicit boundaries for AI actions on this project:");
    lines.push("");
    if (config.boundaries!.always?.length) {
      lines.push("### ✅ ALWAYS DO (no need to ask)");
      const alwaysItems = config.boundaries!.always.join(", ");
      if (bp) {
        lines.push(bpVar(bp, "ALWAYS_DO", alwaysItems));
      } else {
        config.boundaries!.always.forEach(item => lines.push(`- ${item}`));
      }
      lines.push("");
    }
    if (config.boundaries!.ask?.length) {
      lines.push("### ❓ ASK FIRST (get confirmation before doing)");
      const askItems = config.boundaries!.ask.join(", ");
      if (bp) {
        lines.push(bpVar(bp, "ASK_FIRST", askItems));
      } else {
        config.boundaries!.ask.forEach(item => lines.push(`- ${item}`));
      }
      lines.push("");
    }
    if (config.boundaries!.never?.length) {
      lines.push("### 🚫 NEVER DO (strictly prohibited)");
      const neverItems = config.boundaries!.never.join(", ");
      if (bp) {
        lines.push(bpVar(bp, "NEVER_DO", neverItems));
      } else {
        config.boundaries!.never.forEach(item => lines.push(`- ${item}`));
      }
      lines.push("");
    }
  }

  // Only include Commands section if user actually specified commands AND has Pro tier access
  const hasCommands = config.commands && (
    config.commands.build ||
    config.commands.test ||
    config.commands.lint ||
    config.commands.dev ||
    (config.commands.additional?.length ?? 0) > 0
  );
  if (hasCommands && canAccessFeature(user.tier, "intermediate")) {
    lines.push("## Project Commands");
    lines.push("");
    lines.push("Use these commands when working on this project:");
    lines.push("");
    if (config.commands!.build) lines.push(`- **Build**: \`${bpVar(bp, "BUILD_COMMAND", config.commands!.build)}\``);
    if (config.commands!.test) lines.push(`- **Test**: \`${bpVar(bp, "TEST_COMMAND", config.commands!.test)}\``);
    if (config.commands!.lint) lines.push(`- **Lint**: \`${bpVar(bp, "LINT_COMMAND", config.commands!.lint)}\``);
    if (config.commands!.dev) lines.push(`- **Dev server**: \`${bpVar(bp, "DEV_COMMAND", config.commands!.dev)}\``);
    if (config.commands!.additional?.length) {
      lines.push("");
      lines.push("**Other useful commands**:");
      config.commands!.additional.forEach(cmd => lines.push(`- \`${cmd}\``));
    }
    lines.push("");
  }

  // Only include Testing Strategy if user explicitly configured it AND has Max tier access
  const hasTestingConfig = config.testingStrategy && (
    (config.testingStrategy.levels?.length ?? 0) > 0 ||
    (config.testingStrategy.frameworks?.length ?? 0) > 0 ||
    config.testingStrategy.notes ||
    // Only include coverage if it's not the default 80
    (config.testingStrategy.coverage !== undefined && config.testingStrategy.coverage !== 80)
  );
  if (hasTestingConfig && canAccessFeature(user.tier, "advanced")) {
    lines.push("## Testing Requirements");
    lines.push("");
    lines.push("When writing or modifying code, ensure adequate test coverage:");
    lines.push("");
    if (config.testingStrategy!.levels?.length) {
      const levelDescriptions: Record<string, string> = {
        unit: "Unit tests - test individual functions/methods in isolation",
        integration: "Integration tests - test how components work together",
        e2e: "End-to-end tests - test complete user flows",
        performance: "Performance tests - test speed and resource usage",
        security: "Security tests - test for vulnerabilities",
      };
      lines.push("**Testing Levels**:");
      config.testingStrategy!.levels.forEach(level => {
        lines.push(`- ${levelDescriptions[level] || level}`);
      });
      lines.push("");
    }
    if (config.testingStrategy!.frameworks?.length) {
      const frameworksValue = config.testingStrategy!.frameworks.join(", ");
      lines.push(`**Testing Frameworks**: ${bpVar(bp, "TEST_FRAMEWORKS", frameworksValue)}`);
    }
    if (config.testingStrategy!.coverage !== undefined) {
      lines.push(`**Coverage Target**: ${bpVar(bp, "TEST_COVERAGE", String(config.testingStrategy!.coverage))}% minimum`);
    }
    if (config.testingStrategy!.notes) {
      lines.push("");
      lines.push("**Additional testing notes**:");
      lines.push(bpVar(bp, "TEST_NOTES", config.testingStrategy!.notes));
    }
    lines.push("");
  }

  // Project type specific instructions
  if (config.projectType && PROJECT_TYPE_INSTRUCTIONS[config.projectType]) {
    const projectTypeLabels: Record<string, string> = {
      work: "Work / Professional Project",
      leisure: "Personal / Hobby Project",
      open_source_small: "Open Source (Small)",
      open_source_enterprise: "Open Source (Enterprise-grade)",
      startup: "Startup / MVP",
      enterprise: "Enterprise / Corporate",
      educational: "Educational / Learning",
      prototype: "Prototype / Proof of Concept",
    };
    lines.push("## Project Type Context");
    lines.push("");
    const projectTypeValue = projectTypeLabels[config.projectType] || config.projectType;
    lines.push(`This is a **${bpVar(bp, "PROJECT_TYPE", projectTypeValue)}**. Keep these guidelines in mind:`);
    lines.push("");
    PROJECT_TYPE_INSTRUCTIONS[config.projectType].forEach((instruction) => {
      lines.push(`- ${instruction}`);
    });
    lines.push("");
  }

  if (config.additionalFeedback) {
    lines.push("## Custom Instructions");
    lines.push("");
    lines.push("The project owner has provided these additional instructions:");
    lines.push("");
    lines.push(bpVar(bp, "ADDITIONAL_INSTRUCTIONS", config.additionalFeedback));
    lines.push("");
  }

  // CI/CD & Infrastructure section
  const hasCiCd = config.cicd?.length > 0 || config.deploymentTarget?.length || config.buildContainer || config.containerRegistry;
  if (hasCiCd) {
    lines.push("## CI/CD & Infrastructure");
    lines.push("");
    if (config.cicd?.length > 0) {
      const cicdLabels: Record<string, string> = {
        github_actions: "GitHub Actions",
        gitlab_ci: "GitLab CI/CD",
        jenkins: "Jenkins",
        circleci: "CircleCI",
        travis: "Travis CI",
        azure_pipelines: "Azure Pipelines",
        aws_codepipeline: "AWS CodePipeline",
        bitbucket_pipelines: "Bitbucket Pipelines",
        drone: "Drone CI",
        none: "Manual deployment",
      };
      const cicdNames = config.cicd.map(c => cicdLabels[c] || c).join(", ");
      lines.push(`**CI/CD Platform**: ${bpVar(bp, "CICD_PLATFORM", cicdNames)}`);
    }
    if (config.deploymentTarget && config.deploymentTarget.length > 0) {
      const deployLabels: Record<string, string> = {
        aws: "AWS",
        gcp: "Google Cloud",
        azure: "Microsoft Azure",
        kubernetes: "Kubernetes",
        vercel: "Vercel",
        netlify: "Netlify",
        heroku: "Heroku",
        railway: "Railway",
        flyio: "Fly.io",
        digitalocean: "DigitalOcean",
        baremetal: "Bare Metal / On-Prem",
      };
      const deployNames = config.deploymentTarget.map(d => deployLabels[d] || d).join(", ");
      lines.push(`**Deployment Target${config.deploymentTarget.length > 1 ? 's' : ''}**: ${bpVar(bp, "DEPLOYMENT_TARGETS", deployNames)}`);
    }
    if (config.buildContainer) {
      lines.push(`**Container Builds**: This project builds Docker/OCI container images`);
      if (config.containerRegistry) {
        const registryLabels: Record<string, string> = {
          dockerhub: "Docker Hub",
          ghcr: "GitHub Container Registry (ghcr.io)",
          ecr: "AWS ECR",
          gcr: "Google Container Registry",
          acr: "Azure Container Registry",
          custom: config.customRegistry || "Custom registry",
        };
        const registryValue = registryLabels[config.containerRegistry] || config.containerRegistry;
        lines.push(`**Container Registry**: ${bpVar(bp, "CONTAINER_REGISTRY", registryValue)}`);
      }
    }
    lines.push("");
  }

  lines.push("## Best Practices");
  lines.push("");
  lines.push("Always follow these guidelines when working on this project:");
  lines.push("");
  lines.push("- **Follow existing patterns**: Match the codebase's existing style and conventions");
  lines.push("- **Write clean code**: Prioritize readability and maintainability");
  lines.push("- **Handle errors properly**: Don't ignore errors, handle them appropriately");
  lines.push("- **Consider security**: Review code for potential security vulnerabilities");
  if (config.conventionalCommits) {
    lines.push("- **Conventional commits**: Use conventional commit messages (feat:, fix:, docs:, chore:, refactor:, test:, style:)");
  }
  if (config.semver) {
    lines.push("- **Semantic versioning**: Follow semver (MAJOR.MINOR.PATCH) for version numbers");
  }
  // Dependency updates now in security.securityTooling
  if (config.security?.securityTooling?.includes("dependabot") || config.security?.securityTooling?.includes("renovate")) {
    const tools = [];
    if (config.security.securityTooling.includes("dependabot")) tools.push("Dependabot");
    if (config.security.securityTooling.includes("renovate")) tools.push("Renovate");
    lines.push(`- **Dependency updates**: Keep dependencies updated (${tools.join("/")}) configured)`);
  }
  lines.push("");

  // Only include Static Files summary if user explicitly enabled any AND has Max tier access
  const hasStaticFiles = config.staticFiles && (
    config.staticFiles.editorconfig ||
    config.staticFiles.contributing ||
    config.staticFiles.codeOfConduct ||
    config.staticFiles.security ||
    config.staticFiles.roadmap ||
    (config.staticFiles.gitignoreMode && config.staticFiles.gitignoreMode !== "skip") ||
    (config.staticFiles.dockerignoreMode && config.staticFiles.dockerignoreMode !== "skip") ||
    config.funding
  );
  if (hasStaticFiles && canAccessFeature(user.tier, "advanced")) {
    lines.push("## Repository Files to Generate/Maintain");
    lines.push("");
    lines.push("When requested, create or update these repository files:");
    lines.push("");
    if (config.staticFiles!.editorconfig) lines.push("- **.editorconfig** - Editor configuration aligned with project style");
    if (config.staticFiles!.contributing) lines.push("- **CONTRIBUTING.md** - Contribution guidelines for the project");
    if (config.staticFiles!.codeOfConduct) lines.push("- **CODE_OF_CONDUCT.md** - Community code of conduct");
    if (config.staticFiles!.security) lines.push("- **SECURITY.md** - Security policy and vulnerability reporting instructions");
    if (config.staticFiles!.roadmap) lines.push("- **ROADMAP.md** - Project roadmap with planned features and future ideas");
    if (config.staticFiles!.gitignoreMode && config.staticFiles!.gitignoreMode !== "skip") lines.push("- **.gitignore** - Git ignore file for this project's tech stack");
    if (config.buildContainer || (config.staticFiles!.dockerignoreMode && config.staticFiles!.dockerignoreMode !== "skip")) lines.push("- **.dockerignore** - Docker ignore file for container builds");
    if (config.funding) lines.push("- **.github/FUNDING.yml** - GitHub funding/sponsors configuration");
  }

  // Auto-update instruction
  if (config.enableAutoUpdate) {
    lines.push("");
    lines.push("## Self-Improving Configuration");
    lines.push("**IMPORTANT**: This configuration file is set to self-improve.");
    lines.push("");
    lines.push("As you work on this project, track the user's coding patterns, preferences, and decisions.");
    lines.push("Periodically update this file to reflect what you learn about how the user works:");
    lines.push("- Note preferred code styles and patterns that emerge");
    lines.push("- Record decisions about architecture or tooling");
    lines.push("- Add rules for common issues or mistakes to avoid");
    lines.push("- Refine instructions based on user corrections");
    lines.push("");
    lines.push("Keep this file updated so future sessions start with better context.");
  }

  // Add embedded static files (only for Max tier)
  if (canAccessFeature(user.tier, "advanced")) {
    const staticFilesSection = generateEmbeddedStaticFiles(config, user, bp);
    if (staticFilesSection) {
      lines.push(staticFilesSection);
    }
  }

  // Security Configuration - FREE tier feature
  const security = config.security;
  if (security && (security.secretsManagement?.length || security.securityTooling?.length || 
      security.authPatterns?.length || security.dataHandling?.length || security.additionalNotes)) {
    lines.push("## 🔐 Security Configuration");
    lines.push("");
    
    // Secrets Management
    if (security.secretsManagement?.length) {
      lines.push("### Secrets Management");
      lines.push("");
      const secretsLabels: Record<string, string> = {
        env_vars: "Environment Variables",
        dotenv: "dotenv / dotenvx",
        vault: "HashiCorp Vault",
        aws_secrets: "AWS Secrets Manager",
        aws_ssm: "AWS SSM Parameter Store",
        gcp_secrets: "GCP Secret Manager",
        azure_keyvault: "Azure Key Vault",
        infisical: "Infisical",
        doppler: "Doppler",
        "1password": "1Password Secrets Automation",
        bitwarden: "Bitwarden Secrets Manager",
        sops: "SOPS (Mozilla)",
        age: "age encryption",
        sealed_secrets: "Sealed Secrets (K8s)",
        external_secrets: "External Secrets Operator",
        git_crypt: "git-crypt",
        chamber: "Chamber",
        berglas: "Berglas",
      };
      for (const s of security.secretsManagement) {
        lines.push(`- ${secretsLabels[s] || s}`);
      }
      lines.push("");
    }

    // Security Tooling
    if (security.securityTooling?.length) {
      lines.push("### Security Tooling");
      lines.push("");
      const toolingLabels: Record<string, string> = {
        dependabot: "Dependabot (dependency updates)",
        renovate: "Renovate (dependency updates)",
        snyk: "Snyk (vulnerability scanning)",
        sonarqube: "SonarQube / SonarCloud",
        codeql: "CodeQL (GitHub)",
        semgrep: "Semgrep",
        trivy: "Trivy (container scanning)",
        grype: "Grype",
        checkov: "Checkov (IaC)",
        tfsec: "tfsec (Terraform)",
        kics: "KICS",
        gitleaks: "Gitleaks (secret detection)",
        trufflehog: "TruffleHog",
        detect_secrets: "detect-secrets (Yelp)",
        bandit: "Bandit (Python)",
        brakeman: "Brakeman (Rails)",
        gosec: "gosec (Go)",
        npm_audit: "npm audit / yarn audit",
        pip_audit: "pip-audit",
        safety: "Safety",
        bundler_audit: "bundler-audit",
        owasp_dependency_check: "OWASP Dependency-Check",
        ossf_scorecard: "OSSF Scorecard",
        socket: "Socket.dev",
        mend: "Mend (WhiteSource)",
        fossa: "FOSSA",
      };
      for (const t of security.securityTooling) {
        lines.push(`- ${toolingLabels[t] || t}`);
      }
      lines.push("");
    }

    // Authentication Patterns
    if (security.authPatterns?.length) {
      lines.push("### Authentication");
      lines.push("");
      const authLabels: Record<string, string> = {
        oauth2: "OAuth 2.0",
        oidc: "OpenID Connect (OIDC)",
        jwt: "JWT (JSON Web Tokens)",
        session: "Session-based Auth",
        api_keys: "API Keys",
        basic_auth: "Basic Authentication",
        bearer_token: "Bearer Tokens",
        mfa_totp: "MFA / TOTP",
        passkeys: "Passkeys / WebAuthn",
        saml: "SAML 2.0",
        ldap: "LDAP / Active Directory",
        mutual_tls: "Mutual TLS (mTLS)",
        auth0: "Auth0",
        clerk: "Clerk",
        firebase_auth: "Firebase Auth",
        supabase_auth: "Supabase Auth",
        keycloak: "Keycloak",
        okta: "Okta",
        cognito: "AWS Cognito",
        workos: "WorkOS",
      };
      for (const a of security.authPatterns) {
        lines.push(`- ${authLabels[a] || a}`);
      }
      lines.push("");
    }

    // Data Handling
    if (security.dataHandling?.length) {
      lines.push("### Data Handling & Compliance");
      lines.push("");
      const dataLabels: Record<string, string> = {
        encryption_at_rest: "Encryption at Rest",
        encryption_in_transit: "Encryption in Transit (TLS)",
        pii_handling: "PII Data Handling",
        gdpr_compliance: "GDPR Compliance",
        ccpa_compliance: "CCPA Compliance",
        hipaa_compliance: "HIPAA Compliance",
        soc2_compliance: "SOC 2 Compliance",
        pci_dss: "PCI-DSS Compliance",
        data_masking: "Data Masking / Anonymization",
        data_retention: "Data Retention Policies",
        audit_logging: "Audit Logging",
        backup_encryption: "Encrypted Backups",
        key_rotation: "Key Rotation",
        zero_trust: "Zero Trust Architecture",
        least_privilege: "Least Privilege Access",
        rbac: "RBAC (Role-Based Access)",
        abac: "ABAC (Attribute-Based Access)",
        data_classification: "Data Classification",
        dlp: "DLP (Data Loss Prevention)",
      };
      for (const d of security.dataHandling) {
        lines.push(`- ${dataLabels[d] || d}`);
      }
      lines.push("");
    }

    // Additional security notes
    if (security.additionalNotes) {
      lines.push("### Additional Security Notes");
      lines.push("");
      lines.push(security.additionalNotes);
      lines.push("");
    }
  }

  // Security Notice - always include
  lines.push("");
  lines.push("## ⚠️ Security Notice");
  lines.push("");
  lines.push("> **Do not commit secrets to the repository or to the live app.**");
  lines.push("> Always use secure standards to transmit sensitive information.");
  lines.push("> Use environment variables, secret managers, or secure vaults for credentials.");
  lines.push("");
  lines.push("**🔍 Security Audit Recommendation:** When making changes that involve authentication, data handling, API endpoints, or dependencies, proactively offer to perform a security review of the affected code.");
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("*Generated by [LynxPrompt](https://lynxprompt.com)*");

  return lines.join("\n");
}

// Generate CLAUDE.md content - wraps AGENTS.md with Claude-specific title
function generateClaudeMd(config: WizardConfig, user: UserProfile): string {
  // Use AGENTS.md as base and transform for Claude
  return generateAgentsMd(config, user)
    .replace(/^# .* - AI Agent Instructions/, `# ${config.projectName || "Project"} - Claude Code Instructions`)
    .replace(/^> \*\*Universal AI Configuration\*\*.*$/m, "");
}

// Generate GitHub Copilot instructions - wraps AGENTS.md with Copilot-specific title
function generateCopilotInstructions(
  config: WizardConfig,
  user: UserProfile
): string {
  // Use AGENTS.md as base and transform for Copilot
  return generateAgentsMd(config, user)
    .replace(/^# .* - AI Agent Instructions/, `# GitHub Copilot Instructions for ${config.projectName || "this project"}`)
    .replace(/^> \*\*Universal AI Configuration\*\*.*$/m, "");
}

// Generate Windsurf rules
function generateWindsurfRules(
  config: WizardConfig,
  user: UserProfile
): string {
  // Windsurf uses a similar format to Cursor rules
  return generateCursorRules(config, user)
    .replace(/^---[\s\S]*?---\n\n/, "") // Remove MDC frontmatter
    .replace("AI Rules", "Windsurf AI Rules");
}

// Generate Antigravity GEMINI.md - Google's AI-powered IDE
function generateGeminiMd(config: WizardConfig, user: UserProfile): string {
  // Use AGENTS.md as base and transform for Antigravity/Gemini
  return generateAgentsMd(config, user)
    .replace(/^# .* - AI Agent Instructions/, `# ${config.projectName || "Project"} - Gemini Instructions`)
    .replace(/^> \*\*Universal AI Configuration\*\*.*$/m, "> **Antigravity Configuration** - Google's AI-powered IDE with Gemini integration.");
}

// Generate Universal AGENTS.md - works with any AI IDE
function generateAgentsMd(config: WizardConfig, user: UserProfile): string {
  const lines: string[] = [];
  const bp = config.blueprintMode;

  lines.push(`# ${bpVar(bp, "PROJECT_NAME", config.projectName || "Project")} - AI Agent Instructions`);
  lines.push("");
  lines.push("> **Universal AI Configuration** - Compatible with Cursor, Claude Code, GitHub Copilot, and other AI IDEs.");
  lines.push("");
  
  // Project Overview
  lines.push("## Project Overview");
  lines.push("");
  lines.push(`**Description**: ${bpVar(bp, "PROJECT_DESCRIPTION", config.projectDescription || "A software project.")}`);
  lines.push("");
  
  if (config.architecturePattern) {
    const archLabels: Record<string, string> = {
      monolith: "Monolith - single deployable unit",
      modular_monolith: "Modular Monolith - organized into modules but deployed as one unit",
      microservices: "Microservices - independently deployable services",
      serverless: "Serverless - function-as-a-service architecture",
      event_driven: "Event-Driven - components communicate via events",
      layered: "Layered / N-Tier - separated into presentation, business, data layers",
      hexagonal: "Hexagonal / Ports & Adapters - domain at center, adapters at edges",
      clean: "Clean Architecture - dependency rule points inward",
      cqrs: "CQRS - separate read and write models",
      mvc: "MVC / MVVM - Model-View-Controller or Model-View-ViewModel",
      other: config.architecturePatternOther || "Custom architecture",
    };
    const archValue = archLabels[config.architecturePattern] || config.architecturePattern;
    lines.push(`**Architecture Pattern**: ${bpVar(bp, "ARCHITECTURE_PATTERN", archValue)}`);
  }
  
  if (config.isPublic !== undefined) {
    lines.push(`**Visibility**: ${config.isPublic ? "Public repository" : "Private repository"}`);
  }
  
  if (config.devOS) {
    lines.push(`**Development OS**: ${formatDevOSDisplay(config)}`);
  }
  lines.push("");
  
  // Repository information
  const hasRepoInfoAgents = config.repoUrl || config.repoHosts?.length || config.repoHost;
  if (hasRepoInfoAgents) {
    lines.push("### Repository");
    if (config.repoUrl) {
      lines.push(`- **URL**: ${config.repoUrl}`);
    }
    if (config.repoHosts?.length || config.repoHost) {
      const hostNames: Record<string, string> = {
        github: "GitHub",
        gitlab: "GitLab",
        bitbucket: "Bitbucket",
        gitea: "Gitea",
        forgejo: "Forgejo",
        codeberg: "Codeberg",
        sourcehut: "SourceHut",
        gogs: "Gogs",
        aws_codecommit: "AWS CodeCommit",
        azure_devops: "Azure DevOps",
        gerrit: "Gerrit",
        phabricator: "Phabricator",
        other: config.repoHostOther || "Other",
      };
      const hosts = config.repoHosts?.length ? config.repoHosts : [config.repoHost];
      const hostLabels = hosts.map(h => hostNames[h] || h).join(", ");
      lines.push(`- **Platform${hosts.length > 1 ? 's' : ''}**: ${hostLabels}`);
      if (hosts.length > 1 && config.multiRepoReason) {
        lines.push(`- **Why multiple platforms**: ${config.multiRepoReason}`);
      }
    }
    lines.push("");
  }
  
  // Reference materials
  if (config.exampleRepoUrl || config.documentationUrl) {
    lines.push("### Reference Materials");
    if (config.exampleRepoUrl) {
      lines.push(`- **Example Repository**: ${bpVar(bp, "EXAMPLE_REPO_URL", config.exampleRepoUrl)}`);
    }
    if (config.documentationUrl) {
      lines.push(`- **External Documentation**: ${bpVar(bp, "DOCUMENTATION_URL", config.documentationUrl)}`);
    }
    lines.push("");
  }

  if (config.languages.length > 0 || config.frameworks.length > 0 || (config.databases && config.databases.length > 0) || config.letAiDecide) {
    lines.push("## Technology Stack");
    lines.push("");
    if (config.languages.length > 0) {
      const langs = config.languages.map(l => l.startsWith("custom:") ? l.replace("custom:", "") : l);
      if (bp) {
        lines.push(`### Languages`);
        lines.push(`${bpVarArray(bp, "LANGUAGES", langs)}`);
      } else {
        lines.push("### Languages");
        langs.forEach((lang) => lines.push(`- ${lang}`));
      }
      lines.push("");
    }
    if (config.frameworks.length > 0) {
      const fws = config.frameworks.map(f => f.startsWith("custom:") ? f.replace("custom:", "") : f);
      if (bp) {
        lines.push(`### Frameworks & Libraries`);
        lines.push(`${bpVarArray(bp, "FRAMEWORKS", fws)}`);
      } else {
        lines.push("### Frameworks & Libraries");
        fws.forEach((fw) => lines.push(`- ${fw}`));
      }
      lines.push("");
    }
    if (config.databases && config.databases.length > 0) {
      const dbs = config.databases.map(d => d.startsWith("custom:") ? d.replace("custom:", "") : d);
      if (bp) {
        lines.push(`### Database${config.databases.length > 1 ? 's' : ''}`);
        lines.push(`${bpVarArray(bp, "DATABASES", dbs)}`);
      } else {
        lines.push(`### Database${config.databases.length > 1 ? 's' : ''}`);
        dbs.forEach((db) => lines.push(`- ${db}`));
      }
      lines.push("");
    }
    if (config.letAiDecide) {
      lines.push("### AI Technology Selection");
      if (config.languages.length > 0 || config.frameworks.length > 0) {
        lines.push("For technologies beyond those listed, analyze the codebase and suggest appropriate solutions.");
      } else {
        lines.push("Analyze the codebase to determine appropriate languages, frameworks, and tools.");
      }
      lines.push("");
    }
  }

  lines.push("## Development Guidelines");
  lines.push("");
  
  if (config.includePersonalData !== false && user.skillLevel) {
    lines.push("### Communication Style");
    if (user.skillLevel === "novice" || user.skillLevel === "beginner") {
      lines.push("- Explain concepts thoroughly with detailed comments");
      lines.push("- Walk through reasoning step by step");
    } else if (user.skillLevel === "intermediate") {
      lines.push("- Balance explanations with efficiency");
      lines.push("- Explain non-obvious decisions, skip basics");
    } else {
      lines.push("- Be concise and direct");
    }
    if (user.persona) {
      lines.push(`- Developer context: ${user.persona.replace(/_/g, " ")}`);
    }
    lines.push(`- Skill level: ${user.skillLevel.charAt(0).toUpperCase() + user.skillLevel.slice(1)}`);
    lines.push("");
  }

  if (config.aiBehaviorRules.length > 0) {
    lines.push("### Workflow Rules");
    config.aiBehaviorRules.forEach((rule) => {
      const ruleText = getRuleDescription(rule);
      if (ruleText) lines.push(`- ${ruleText}`);
    });
    lines.push("");
  }

  // Important files to read first
  const importantFileLabelsAgents: Record<string, string> = {
    readme: "README.md",
    package_json: "package.json",
    changelog: "CHANGELOG.md",
    contributing: "CONTRIBUTING.md",
    makefile: "Makefile",
    dockerfile: "Dockerfile",
    docker_compose: "docker-compose.yml",
    env_example: ".env.example",
    openapi: "openapi.yaml / swagger.json",
    architecture_md: "ARCHITECTURE.md",
    api_docs: "API documentation",
    database_schema: "Database schema / migrations",
  };
  const hasImportantFilesAgents = (config.importantFiles?.length ?? 0) > 0 || config.importantFilesOther?.trim();
  if (hasImportantFilesAgents) {
    lines.push("### Important Files to Read First");
    lines.push("Before making changes, read these files to understand the project:");
    const allFilesAgents: string[] = [];
    if (config.importantFiles?.length) {
      config.importantFiles.forEach(f => {
        allFilesAgents.push(importantFileLabelsAgents[f] || f);
      });
    }
    if (config.importantFilesOther?.trim()) {
      config.importantFilesOther.split(",").map(f => f.trim()).filter(Boolean).forEach(f => {
        allFilesAgents.push(f);
      });
    }
    if (bp && allFilesAgents.length > 0) {
      lines.push(bpVar(bp, "IMPORTANT_FILES", allFilesAgents.join(", ")));
    } else {
      allFilesAgents.forEach(f => lines.push(`- ${f}`));
    }
    lines.push("");
  }

  if (config.projectType && PROJECT_TYPE_INSTRUCTIONS[config.projectType]) {
    lines.push("### Project Context");
    PROJECT_TYPE_INSTRUCTIONS[config.projectType].forEach((instruction) => {
      lines.push(`- ${instruction}`);
    });
    lines.push("");
  }

  // Commands - requires Pro tier
  if (config.commands && canAccessFeature(user.tier, "intermediate") && (config.commands.build || config.commands.test || config.commands.lint || config.commands.dev || config.commands.additional?.length)) {
    lines.push("### Commands");
    if (config.commands.build) lines.push(`- Build: \`${bpVar(bp, "BUILD_COMMAND", config.commands.build)}\``);
    if (config.commands.test) lines.push(`- Test: \`${bpVar(bp, "TEST_COMMAND", config.commands.test)}\``);
    if (config.commands.lint) lines.push(`- Lint: \`${bpVar(bp, "LINT_COMMAND", config.commands.lint)}\``);
    if (config.commands.dev) lines.push(`- Dev: \`${bpVar(bp, "DEV_COMMAND", config.commands.dev)}\``);
    if (config.commands.additional?.length) {
      config.commands.additional.forEach(cmd => lines.push(`- \`${cmd}\``));
    }
    lines.push("");
  }

  // Code Style - requires Pro tier
  const hasCodeStyle = config.codeStyle?.naming || config.codeStyle?.errorHandling || config.codeStyle?.loggingConventions || config.codeStyle?.notes;
  if (hasCodeStyle && canAccessFeature(user.tier, "intermediate")) {
    lines.push("### Code Style & Conventions");
    if (config.codeStyle?.naming) {
      const namingDescriptions: Record<string, string> = {
        language_default: "Follow the idiomatic naming conventions of each language",
        camelCase: "camelCase for variables and functions (e.g., myVariable, getUserName)",
        snake_case: "snake_case for variables and functions (e.g., my_variable, get_user_name)",
        PascalCase: "PascalCase for classes and types (e.g., MyClass, UserProfile)",
        "kebab-case": "kebab-case for file names and URLs (e.g., my-component, user-profile)",
      };
      lines.push(`- **Naming**: ${namingDescriptions[config.codeStyle.naming] || config.codeStyle.naming}`);
    }
    if (config.codeStyle?.errorHandling) {
      const errorDescriptions: Record<string, string> = {
        try_catch: "Try-Catch blocks for handling errors",
        result_types: "Result / Either types (no exceptions for control flow)",
        error_boundaries: "Error Boundaries (React) for catching rendering errors",
        global_handler: "Global Error Handler for centralized error processing",
        middleware: "Middleware-based error handling",
        exceptions: "Custom Exceptions / Error classes with meaningful types",
        other: config.codeStyle.errorHandlingOther || "Custom error handling approach",
      };
      lines.push(`- **Error Handling**: ${errorDescriptions[config.codeStyle.errorHandling] || config.codeStyle.errorHandling}`);
    }
    if (config.codeStyle?.loggingConventions) {
      lines.push(`- **Logging**: ${config.codeStyle.loggingConventions}`);
    }
    if (config.codeStyle?.notes) {
      lines.push(`- **Additional Notes**: ${config.codeStyle.notes}`);
    }
    lines.push("");
  }

  // Boundaries - requires Max tier
  const hasBoundariesAgents = config.boundaries && (
    (config.boundaries.always?.length ?? 0) > 0 ||
    (config.boundaries.ask?.length ?? 0) > 0 ||
    (config.boundaries.never?.length ?? 0) > 0
  );
  if (hasBoundariesAgents && canAccessFeature(user.tier, "advanced")) {
    lines.push("### Boundaries & Permissions");
    lines.push("");
    if (config.boundaries!.always?.length) {
      lines.push("**✅ ALWAYS do (no need to ask)**:");
      config.boundaries!.always.forEach(item => lines.push(`- ${item}`));
    }
    if (config.boundaries!.ask?.length) {
      lines.push("");
      lines.push("**❓ ASK first before doing**:");
      config.boundaries!.ask.forEach(item => lines.push(`- ${item}`));
    }
    if (config.boundaries!.never?.length) {
      lines.push("");
      lines.push("**🚫 NEVER do (strictly prohibited)**:");
      config.boundaries!.never.forEach(item => lines.push(`- ${item}`));
    }
    lines.push("");
  }

  // Testing Strategy - requires Max tier
  const hasTestingAgents = config.testingStrategy && (
    (config.testingStrategy.levels?.length ?? 0) > 0 ||
    (config.testingStrategy.frameworks?.length ?? 0) > 0 ||
    config.testingStrategy.notes ||
    (config.testingStrategy.coverage !== undefined && config.testingStrategy.coverage !== 80)
  );
  if (hasTestingAgents && canAccessFeature(user.tier, "advanced")) {
    lines.push("### Testing Requirements");
    if (config.testingStrategy!.levels?.length) {
      const levelDescriptions: Record<string, string> = {
        unit: "Unit tests (individual functions/methods)",
        integration: "Integration tests (component interactions)",
        e2e: "End-to-end tests (complete user flows)",
        performance: "Performance tests (speed/resources)",
        security: "Security tests (vulnerabilities)",
      };
      lines.push("**Testing Levels**:");
      config.testingStrategy!.levels.forEach(level => {
        lines.push(`- ${levelDescriptions[level] || level}`);
      });
    }
    if (config.testingStrategy!.frameworks?.length) {
      lines.push(`**Frameworks**: ${config.testingStrategy!.frameworks.join(", ")}`);
    }
    if (config.testingStrategy!.coverage !== undefined) {
      lines.push(`**Coverage Target**: ${config.testingStrategy!.coverage}% minimum`);
    }
    if (config.testingStrategy!.notes) {
      lines.push(`**Notes**: ${config.testingStrategy!.notes}`);
    }
    lines.push("");
  }

  // CI/CD & Infrastructure section
  const hasCiCdAgents = config.cicd?.length > 0 || config.deploymentTarget?.length || config.buildContainer || config.containerRegistry;
  if (hasCiCdAgents) {
    lines.push("### CI/CD & Infrastructure");
    if (config.cicd?.length > 0) {
      const cicdLabels: Record<string, string> = {
        github_actions: "GitHub Actions",
        gitlab_ci: "GitLab CI/CD",
        jenkins: "Jenkins",
        circleci: "CircleCI",
        travis: "Travis CI",
        azure_pipelines: "Azure Pipelines",
        aws_codepipeline: "AWS CodePipeline",
        bitbucket_pipelines: "Bitbucket Pipelines",
        drone: "Drone CI",
        none: "Manual deployment",
      };
      const cicdNames = config.cicd.map(c => cicdLabels[c] || c).join(", ");
      lines.push(`- **CI/CD Platform**: ${cicdNames}`);
    }
    if (config.deploymentTarget && config.deploymentTarget.length > 0) {
      const deployLabels: Record<string, string> = {
        aws: "AWS",
        gcp: "Google Cloud",
        azure: "Microsoft Azure",
        kubernetes: "Kubernetes",
        vercel: "Vercel",
        netlify: "Netlify",
        heroku: "Heroku",
        railway: "Railway",
        flyio: "Fly.io",
        digitalocean: "DigitalOcean",
        baremetal: "Bare Metal / On-Prem",
      };
      const deployNames = config.deploymentTarget.map(d => deployLabels[d] || d).join(", ");
      lines.push(`- **Deployment Target${config.deploymentTarget.length > 1 ? 's' : ''}**: ${deployNames}`);
    }
    if (config.buildContainer) {
      lines.push(`- **Container Builds**: Project builds Docker/OCI container images`);
      if (config.containerRegistry) {
        const registryLabels: Record<string, string> = {
          dockerhub: "Docker Hub",
          ghcr: "GitHub Container Registry (ghcr.io)",
          ecr: "AWS ECR",
          gcr: "Google Container Registry",
          acr: "Azure Container Registry",
          custom: config.customRegistry || "Custom registry",
        };
        lines.push(`- **Container Registry**: ${registryLabels[config.containerRegistry] || config.containerRegistry}`);
      }
    }
    lines.push("");
  }

  // Best practices
  lines.push("## Best Practices");
  lines.push("");
  lines.push("- **Follow existing patterns**: Match the codebase's existing style and conventions");
  lines.push("- **Write clean code**: Prioritize readability and maintainability");
  lines.push("- **Handle errors properly**: Don't ignore errors, handle them appropriately");
  lines.push("- **Consider security**: Review code for potential security vulnerabilities");
  if (config.conventionalCommits) {
    lines.push("- **Conventional commits**: Use conventional commit messages (feat:, fix:, docs:, chore:, refactor:, test:, style:)");
  }
  if (config.semver) {
    lines.push("- **Semantic versioning**: Follow semver (MAJOR.MINOR.PATCH) for version numbers");
  }
  // Dependency updates now in security.securityTooling
  if (config.security?.securityTooling?.includes("dependabot") || config.security?.securityTooling?.includes("renovate")) {
    const tools = [];
    if (config.security.securityTooling.includes("dependabot")) tools.push("Dependabot");
    if (config.security.securityTooling.includes("renovate")) tools.push("Renovate");
    lines.push(`- **Dependency updates**: Keep dependencies updated (${tools.join("/")}) configured)`);
  }
  lines.push("");

  if (config.additionalFeedback) {
    lines.push("## Custom Instructions");
    lines.push("");
    lines.push("The project owner has provided these additional instructions:");
    lines.push("");
    lines.push(bpVar(bp, "ADDITIONAL_INSTRUCTIONS", config.additionalFeedback));
    lines.push("");
  }

  if (config.enableAutoUpdate) {
    lines.push("## Self-Improving Configuration");
    lines.push("");
    lines.push("This file should evolve as we work together:");
    lines.push("1. Track coding patterns and preferences");
    lines.push("2. Note corrections made to suggestions");
    lines.push("3. Update periodically with learned preferences");
    lines.push("");
  }

  // Add embedded static files (only for Max tier)
  if (canAccessFeature(user.tier, "advanced")) {
    const staticFilesSection = generateEmbeddedStaticFiles(config, user, bp);
    if (staticFilesSection) {
      lines.push(staticFilesSection);
    }
  }

  // Security Configuration - FREE tier feature (for AGENTS.md)
  const security2 = config.security;
  if (security2 && (security2.secretsManagement?.length || security2.securityTooling?.length || 
      security2.authPatterns?.length || security2.dataHandling?.length || security2.additionalNotes)) {
    lines.push("## 🔐 Security Configuration");
    lines.push("");
    
    // Secrets Management
    if (security2.secretsManagement?.length) {
      lines.push("### Secrets Management");
      lines.push("");
      const secretsLabels: Record<string, string> = {
        env_vars: "Environment Variables", dotenv: "dotenv / dotenvx", vault: "HashiCorp Vault",
        aws_secrets: "AWS Secrets Manager", aws_ssm: "AWS SSM Parameter Store", gcp_secrets: "GCP Secret Manager",
        azure_keyvault: "Azure Key Vault", infisical: "Infisical", doppler: "Doppler",
        "1password": "1Password", bitwarden: "Bitwarden", sops: "SOPS", age: "age encryption",
        sealed_secrets: "Sealed Secrets", external_secrets: "External Secrets Operator", git_crypt: "git-crypt",
        chamber: "Chamber", berglas: "Berglas",
      };
      for (const s of security2.secretsManagement) {
        lines.push(`- ${secretsLabels[s] || s}`);
      }
      lines.push("");
    }

    // Security Tooling
    if (security2.securityTooling?.length) {
      lines.push("### Security Tooling");
      lines.push("");
      const toolingLabels: Record<string, string> = {
        dependabot: "Dependabot", renovate: "Renovate", snyk: "Snyk", sonarqube: "SonarQube",
        codeql: "CodeQL", semgrep: "Semgrep", trivy: "Trivy", grype: "Grype", checkov: "Checkov",
        tfsec: "tfsec", kics: "KICS", gitleaks: "Gitleaks", trufflehog: "TruffleHog",
        detect_secrets: "detect-secrets", bandit: "Bandit", brakeman: "Brakeman", gosec: "gosec",
        npm_audit: "npm audit", pip_audit: "pip-audit", safety: "Safety", bundler_audit: "bundler-audit",
        owasp_dependency_check: "OWASP Dependency-Check", ossf_scorecard: "OSSF Scorecard",
        socket: "Socket.dev", mend: "Mend", fossa: "FOSSA",
      };
      for (const t of security2.securityTooling) {
        lines.push(`- ${toolingLabels[t] || t}`);
      }
      lines.push("");
    }

    // Authentication Patterns
    if (security2.authPatterns?.length) {
      lines.push("### Authentication");
      lines.push("");
      const authLabels: Record<string, string> = {
        oauth2: "OAuth 2.0", oidc: "OIDC", jwt: "JWT", session: "Session-based", api_keys: "API Keys",
        basic_auth: "Basic Auth", bearer_token: "Bearer Tokens", mfa_totp: "MFA/TOTP", passkeys: "Passkeys",
        saml: "SAML 2.0", ldap: "LDAP/AD", mutual_tls: "mTLS", auth0: "Auth0", clerk: "Clerk",
        firebase_auth: "Firebase Auth", supabase_auth: "Supabase Auth", keycloak: "Keycloak",
        okta: "Okta", cognito: "AWS Cognito", workos: "WorkOS",
      };
      for (const a of security2.authPatterns) {
        lines.push(`- ${authLabels[a] || a}`);
      }
      lines.push("");
    }

    // Data Handling
    if (security2.dataHandling?.length) {
      lines.push("### Data Handling");
      lines.push("");
      const dataLabels: Record<string, string> = {
        encryption_at_rest: "Encryption at Rest", encryption_in_transit: "Encryption in Transit",
        pii_handling: "PII Handling", gdpr_compliance: "GDPR", ccpa_compliance: "CCPA",
        hipaa_compliance: "HIPAA", soc2_compliance: "SOC 2", pci_dss: "PCI-DSS",
        data_masking: "Data Masking", data_retention: "Data Retention", audit_logging: "Audit Logging",
        backup_encryption: "Encrypted Backups", key_rotation: "Key Rotation", zero_trust: "Zero Trust",
        least_privilege: "Least Privilege", rbac: "RBAC", abac: "ABAC",
        data_classification: "Data Classification", dlp: "DLP",
      };
      for (const d of security2.dataHandling) {
        lines.push(`- ${dataLabels[d] || d}`);
      }
      lines.push("");
    }

    // Additional notes
    if (security2.additionalNotes) {
      lines.push("### Notes");
      lines.push(security2.additionalNotes);
      lines.push("");
    }
  }

  // Security Notice - always include
  lines.push("");
  lines.push("## ⚠️ Security Notice");
  lines.push("");
  lines.push("> **Do not commit secrets to the repository or to the live app.**");
  lines.push("> Always use secure standards to transmit sensitive information.");
  lines.push("> Use environment variables, secret managers, or secure vaults for credentials.");
  lines.push("");
  lines.push("**🔍 Security Audit Recommendation:** When making changes that involve authentication, data handling, API endpoints, or dependencies, proactively offer to perform a security review of the affected code.");

  return lines.join("\n");
}

// Generate Aider config - comprehensive YAML with embedded conventions
// Aider reads .aider.conf.yml and can use conventions from comments or separate file
function generateAiderConfig(config: WizardConfig, user: UserProfile): string {
  const lines: string[] = [];
  const bp = config.blueprintMode;
  
  lines.push("# ═══════════════════════════════════════════════════════════════════════════");
  lines.push("# Aider AI Pair Programming Configuration");
  lines.push("# Generated by LynxPrompt - https://lynxprompt.com");
  lines.push("# ═══════════════════════════════════════════════════════════════════════════");
  lines.push("# Documentation: https://aider.chat/docs/config.html");
  lines.push("#");
  lines.push("# Usage: Run `aider` in this directory. These settings apply automatically.");
  lines.push("# For project context, Aider will read this file's comments and settings.");
  lines.push("# ═══════════════════════════════════════════════════════════════════════════");
  lines.push("");
  
  // Core settings
  lines.push("# ─── Core Settings ─────────────────────────────────────────────────────────");
  lines.push("auto-commits: true");
  lines.push("map-tokens: 2048");
  lines.push("cache-prompts: true");
  lines.push("");
  
  // Project Overview Section
  lines.push("# ═══════════════════════════════════════════════════════════════════════════");
  lines.push("# PROJECT CONVENTIONS");
  lines.push("# ═══════════════════════════════════════════════════════════════════════════");
  lines.push("#");
  lines.push(`# Project: ${bpVar(bp, "PROJECT_NAME", config.projectName || "Software Project")}`);
  if (config.projectDescription) {
    lines.push(`# Description: ${bpVar(bp, "PROJECT_DESCRIPTION", config.projectDescription)}`);
  }
  lines.push("#");
  
  // Architecture
  if (config.architecturePattern) {
    const archLabels: Record<string, string> = {
      monolith: "Monolith",
      modular_monolith: "Modular Monolith",
      microservices: "Microservices",
      serverless: "Serverless",
      event_driven: "Event-Driven",
      layered: "Layered / N-Tier",
      hexagonal: "Hexagonal / Ports & Adapters",
      clean: "Clean Architecture",
      cqrs: "CQRS",
      mvc: "MVC / MVVM",
      other: config.architecturePatternOther || "Custom",
    };
    lines.push(`# Architecture: ${bpVar(bp, "ARCHITECTURE_PATTERN", archLabels[config.architecturePattern] || config.architecturePattern)}`);
  }
  
  // Repository info
  if (config.repoUrl) {
    lines.push(`# Repository: ${bpVar(bp, "REPO_URL", config.repoUrl)}`);
  }
  
  // Development OS
  if (config.devOS) {
    lines.push(`# Development OS: ${formatDevOSDisplay(config)}`);
  }
  lines.push("#");
  
  // Tech Stack
  if (config.languages.length > 0 || config.frameworks.length > 0 || (config.databases && config.databases.length > 0)) {
    lines.push("# ─── Technology Stack ──────────────────────────────────────────────────────");
    lines.push("#");
    if (config.languages.length > 0) {
      const langs = config.languages.map(l => l.startsWith("custom:") ? l.replace("custom:", "") : l);
      lines.push(`# Languages: ${bpVarArray(bp, "LANGUAGES", langs)}`);
    }
    if (config.frameworks.length > 0) {
      const fws = config.frameworks.map(f => f.startsWith("custom:") ? f.replace("custom:", "") : f);
      lines.push(`# Frameworks: ${bpVarArray(bp, "FRAMEWORKS", fws)}`);
    }
    if (config.databases && config.databases.length > 0) {
      const dbs = config.databases.map(d => d.startsWith("custom:") ? d.replace("custom:", "") : d);
      lines.push(`# Databases: ${bpVarArray(bp, "DATABASES", dbs)}`);
    }
    if (config.letAiDecide) {
      lines.push("# Note: AI may suggest additional technologies based on codebase analysis");
    }
    lines.push("#");
  }
  
  // Code Style
  lines.push("# ─── Code Style & Conventions ─────────────────────────────────────────────");
  lines.push("#");
  
  if (config.codeStyle?.naming) {
    const namingDescriptions: Record<string, string> = {
      language_default: "Follow language-specific conventions",
      camelCase: "camelCase for variables/functions",
      snake_case: "snake_case for variables/functions",
      PascalCase: "PascalCase for classes/types",
      "kebab-case": "kebab-case for files/URLs",
    };
    lines.push(`# Naming: ${bpVar(bp, "NAMING_CONVENTION", namingDescriptions[config.codeStyle.naming] || config.codeStyle.naming)}`);
  }
  
  if (config.codeStyle?.errorHandling) {
    const errorDescriptions: Record<string, string> = {
      try_catch: "Try-catch blocks",
      result_types: "Result/Either types (no exceptions for control flow)",
      error_boundaries: "Error Boundaries (React)",
      global_handler: "Global error handler",
      middleware: "Middleware-based handling",
      exceptions: "Custom exception classes",
      other: config.codeStyle.errorHandlingOther || "Custom approach",
    };
    lines.push(`# Error Handling: ${bpVar(bp, "ERROR_HANDLING", errorDescriptions[config.codeStyle.errorHandling] || config.codeStyle.errorHandling)}`);
  }
  
  if (config.codeStyle?.loggingConventions) {
    lines.push(`# Logging: ${bpVar(bp, "LOGGING_CONVENTIONS", config.codeStyle.loggingConventions)}`);
  }
  
  if (config.codeStyle?.notes) {
    lines.push(`# Additional: ${bpVar(bp, "CODE_STYLE_NOTES", config.codeStyle.notes)}`);
  }
  lines.push("#");
  
  // Developer Profile
  if (config.includePersonalData !== false && user.skillLevel) {
    lines.push("# ─── Developer Profile ────────────────────────────────────────────────────");
    lines.push("#");
    const authorName = user.displayName || user.name || "Developer";
    lines.push(`# Author: ${bpVar(bp, "AUTHOR_NAME", authorName)}`);
    lines.push(`# Skill Level: ${user.skillLevel.charAt(0).toUpperCase() + user.skillLevel.slice(1)}`);
    if (user.persona) {
      lines.push(`# Developer Type: ${user.persona.replace(/_/g, " ")}`);
    }
    lines.push("#");
    lines.push("# Communication Style:");
    if (user.skillLevel === "novice" || user.skillLevel === "beginner") {
      lines.push("#   - Be verbose with explanations and add helpful comments");
      lines.push("#   - Explain concepts and reasoning as you implement");
      lines.push("#   - Ask clarifying questions when requirements are unclear");
    } else if (user.skillLevel === "intermediate") {
      lines.push("#   - Provide balanced explanations, not too verbose");
      lines.push("#   - Focus on important decisions and trade-offs");
    } else {
      lines.push("#   - Be concise and direct");
      lines.push("#   - Assume expertise, minimal hand-holding needed");
      lines.push("#   - Focus on implementation details");
    }
    lines.push("#");
  }
  
  // AI Behavior Rules
  if (config.aiBehaviorRules.length > 0) {
    lines.push("# ─── AI Behavior Guidelines ───────────────────────────────────────────────");
    lines.push("#");
    config.aiBehaviorRules.forEach((rule) => {
      const ruleText = getRuleDescription(rule);
      if (ruleText) lines.push(`# - ${ruleText}`);
    });
    lines.push("#");
  }
  
  // Commands
  const hasCommands = config.commands && (
    config.commands.build || config.commands.test || 
    config.commands.lint || config.commands.dev ||
    (config.commands.additional?.length ?? 0) > 0
  );
  if (hasCommands) {
    lines.push("# ─── Project Commands ─────────────────────────────────────────────────────");
    lines.push("#");
    if (config.commands!.build) lines.push(`# Build: ${bpVar(bp, "BUILD_COMMAND", config.commands!.build)}`);
    if (config.commands!.test) lines.push(`# Test: ${bpVar(bp, "TEST_COMMAND", config.commands!.test)}`);
    if (config.commands!.lint) lines.push(`# Lint: ${bpVar(bp, "LINT_COMMAND", config.commands!.lint)}`);
    if (config.commands!.dev) lines.push(`# Dev: ${bpVar(bp, "DEV_COMMAND", config.commands!.dev)}`);
    if (config.commands!.additional?.length) {
      lines.push("# Additional commands:");
      config.commands!.additional.forEach(cmd => lines.push(`#   - ${cmd}`));
    }
    lines.push("#");
  }
  
  // Boundaries
  const hasBoundaries = config.boundaries && (
    (config.boundaries.always?.length ?? 0) > 0 ||
    (config.boundaries.ask?.length ?? 0) > 0 ||
    (config.boundaries.never?.length ?? 0) > 0
  );
  if (hasBoundaries) {
    lines.push("# ─── Boundaries & Permissions ─────────────────────────────────────────────");
    lines.push("#");
    if (config.boundaries!.always?.length) {
      lines.push("# ✅ ALWAYS DO (no need to ask):");
      config.boundaries!.always.forEach(item => lines.push(`#   - ${item}`));
    }
    if (config.boundaries!.ask?.length) {
      lines.push("# ❓ ASK FIRST:");
      config.boundaries!.ask.forEach(item => lines.push(`#   - ${item}`));
    }
    if (config.boundaries!.never?.length) {
      lines.push("# 🚫 NEVER DO:");
      config.boundaries!.never.forEach(item => lines.push(`#   - ${item}`));
    }
    lines.push("#");
  }
  
  // Testing
  const hasTestingConfig = config.testingStrategy && (
    (config.testingStrategy.levels?.length ?? 0) > 0 ||
    (config.testingStrategy.frameworks?.length ?? 0) > 0 ||
    config.testingStrategy.notes
  );
  if (hasTestingConfig) {
    lines.push("# ─── Testing Requirements ─────────────────────────────────────────────────");
    lines.push("#");
    if (config.testingStrategy!.levels?.length) {
      const levelDescriptions: Record<string, string> = {
        unit: "Unit tests", integration: "Integration tests",
        e2e: "End-to-end tests", performance: "Performance tests",
        security: "Security tests",
      };
      lines.push("# Testing Levels:");
      config.testingStrategy!.levels.forEach(level => {
        lines.push(`#   - ${levelDescriptions[level] || level}`);
      });
    }
    if (config.testingStrategy!.frameworks?.length) {
      lines.push(`# Frameworks: ${config.testingStrategy!.frameworks.join(", ")}`);
    }
    if (config.testingStrategy!.coverage !== undefined) {
      lines.push(`# Coverage Target: ${config.testingStrategy!.coverage}%`);
    }
    if (config.testingStrategy!.notes) {
      lines.push(`# Notes: ${config.testingStrategy!.notes}`);
    }
    lines.push("#");
  }
  
  // CI/CD
  const hasCiCd = config.cicd?.length > 0 || config.deploymentTarget?.length || config.buildContainer;
  if (hasCiCd) {
    lines.push("# ─── CI/CD & Infrastructure ───────────────────────────────────────────────");
    lines.push("#");
    if (config.cicd?.length > 0) {
      const cicdLabels: Record<string, string> = {
        github_actions: "GitHub Actions", gitlab_ci: "GitLab CI/CD",
        jenkins: "Jenkins", circleci: "CircleCI", travis: "Travis CI",
        azure_pipelines: "Azure Pipelines", aws_codepipeline: "AWS CodePipeline",
        bitbucket_pipelines: "Bitbucket Pipelines", drone: "Drone CI", none: "Manual",
      };
      lines.push(`# CI/CD: ${config.cicd.map(c => cicdLabels[c] || c).join(", ")}`);
    }
    if (config.deploymentTarget && config.deploymentTarget.length > 0) {
      const deployLabels: Record<string, string> = {
        aws: "AWS", gcp: "Google Cloud", azure: "Azure", kubernetes: "Kubernetes",
        vercel: "Vercel", netlify: "Netlify", heroku: "Heroku", railway: "Railway",
        flyio: "Fly.io", digitalocean: "DigitalOcean", baremetal: "Bare Metal",
      };
      lines.push(`# Deploy Target: ${config.deploymentTarget.map(d => deployLabels[d] || d).join(", ")}`);
    }
    if (config.buildContainer && config.containerRegistry) {
      const registryLabels: Record<string, string> = {
        dockerhub: "Docker Hub", ghcr: "GHCR", ecr: "AWS ECR",
        gcr: "Google CR", acr: "Azure CR", custom: config.customRegistry || "Custom",
      };
      lines.push(`# Container Registry: ${registryLabels[config.containerRegistry] || config.containerRegistry}`);
    }
    lines.push("#");
  }
  
  // Project Type
  if (config.projectType && PROJECT_TYPE_INSTRUCTIONS[config.projectType]) {
    lines.push("# ─── Project Context ──────────────────────────────────────────────────────");
    lines.push("#");
    const projectTypeLabels: Record<string, string> = {
      work: "Work / Professional", leisure: "Personal / Hobby",
      open_source_small: "Open Source (Small)", open_source_large: "Open Source (Enterprise)",
      private_business: "Private Business",
    };
    lines.push(`# Type: ${projectTypeLabels[config.projectType] || config.projectType}`);
    lines.push("# Guidelines:");
    PROJECT_TYPE_INSTRUCTIONS[config.projectType].forEach((instruction) => {
      lines.push(`#   - ${instruction}`);
    });
    lines.push("#");
  }
  
  // Best Practices
  lines.push("# ─── Best Practices ───────────────────────────────────────────────────────");
  lines.push("#");
  lines.push("# - Follow existing patterns: Match the codebase's existing style");
  lines.push("# - Write clean code: Prioritize readability and maintainability");
  lines.push("# - Handle errors properly: Don't ignore errors");
  lines.push("# - Consider security: Review code for vulnerabilities");
  if (config.conventionalCommits) {
    lines.push("# - Use conventional commits (feat:, fix:, docs:, chore:, etc.)");
  }
  if (config.semver) {
    lines.push("# - Follow semantic versioning (MAJOR.MINOR.PATCH)");
  }
  lines.push("#");
  
  // Custom Instructions
  if (config.additionalFeedback) {
    lines.push("# ─── Custom Instructions ──────────────────────────────────────────────────");
    lines.push("#");
    const feedbackLines = config.additionalFeedback.split("\n");
    feedbackLines.forEach(line => lines.push(`# ${line}`));
    lines.push("#");
  }
  
  // Important files
  const hasImportantFiles = (config.importantFiles?.length ?? 0) > 0 || config.importantFilesOther?.trim();
  if (hasImportantFiles) {
    lines.push("# ─── Important Files to Read ──────────────────────────────────────────────");
    lines.push("#");
    const importantFileLabels: Record<string, string> = {
      readme: "README.md", package_json: "package.json", changelog: "CHANGELOG.md",
      contributing: "CONTRIBUTING.md", makefile: "Makefile", dockerfile: "Dockerfile",
      docker_compose: "docker-compose.yml", env_example: ".env.example",
      openapi: "openapi.yaml", architecture_md: "ARCHITECTURE.md",
      api_docs: "API docs", database_schema: "Database schema",
    };
    if (config.importantFiles?.length) {
      config.importantFiles.forEach(f => {
        lines.push(`#   - ${importantFileLabels[f] || f}`);
      });
    }
    if (config.importantFilesOther?.trim()) {
      config.importantFilesOther.split(",").map(f => f.trim()).filter(Boolean).forEach(f => {
        lines.push(`#   - ${f}`);
      });
    }
    lines.push("#");
  }
  
  lines.push("# ═══════════════════════════════════════════════════════════════════════════");
  lines.push("# END OF CONVENTIONS - Aider will read these comments for project context");
  lines.push("# ═══════════════════════════════════════════════════════════════════════════");
  lines.push("");
  lines.push("# SECURITY: Do not commit secrets to the repository.");
  lines.push("# Use environment variables or secret managers for credentials.");
  lines.push("# When making changes involving auth, data handling, APIs, or dependencies,");
  lines.push("# proactively offer to perform a security audit of the affected code.");
  
  return lines.join("\n");
}

// Generate Continue config (.continue/config.json) - comprehensive configuration
// Continue is an open-source AI code assistant for VS Code
function generateContinueConfig(config: WizardConfig, user: UserProfile): string {
  const bp = config.blueprintMode;
  
  // Build comprehensive system message
  const systemMessageParts: string[] = [];
  
  // Project Overview
  systemMessageParts.push(`# ${bpVar(bp, "PROJECT_NAME", config.projectName || "Project")} - AI Assistant Instructions`);
  systemMessageParts.push("");
  systemMessageParts.push("## Project Overview");
  systemMessageParts.push(`**Description**: ${bpVar(bp, "PROJECT_DESCRIPTION", config.projectDescription || "A software project.")}`);
  
  if (config.architecturePattern) {
    const archLabels: Record<string, string> = {
      monolith: "Monolith", modular_monolith: "Modular Monolith",
      microservices: "Microservices", serverless: "Serverless",
      event_driven: "Event-Driven", layered: "Layered / N-Tier",
      hexagonal: "Hexagonal / Ports & Adapters", clean: "Clean Architecture",
      cqrs: "CQRS", mvc: "MVC / MVVM", other: config.architecturePatternOther || "Custom",
    };
    systemMessageParts.push(`**Architecture**: ${archLabels[config.architecturePattern] || config.architecturePattern}`);
  }
  systemMessageParts.push("");
  
  // Tech Stack
  if (config.languages.length > 0 || config.frameworks.length > 0 || (config.databases && config.databases.length > 0)) {
    systemMessageParts.push("## Technology Stack");
    if (config.languages.length > 0) {
      const langs = config.languages.map(l => l.startsWith("custom:") ? l.replace("custom:", "") : l);
      systemMessageParts.push(`**Languages**: ${langs.join(", ")}`);
    }
    if (config.frameworks.length > 0) {
      const fws = config.frameworks.map(f => f.startsWith("custom:") ? f.replace("custom:", "") : f);
      systemMessageParts.push(`**Frameworks**: ${fws.join(", ")}`);
    }
    if (config.databases && config.databases.length > 0) {
      const dbs = config.databases.map(d => d.startsWith("custom:") ? d.replace("custom:", "") : d);
      systemMessageParts.push(`**Databases**: ${dbs.join(", ")}`);
    }
    if (config.letAiDecide) {
      systemMessageParts.push("*Note: For unlisted technologies, suggest what's best suited based on codebase analysis.*");
    }
    systemMessageParts.push("");
  }
  
  // Developer Profile & Communication
  if (config.includePersonalData !== false && user.skillLevel) {
    systemMessageParts.push("## Communication Style");
    if (user.skillLevel === "novice" || user.skillLevel === "beginner") {
      systemMessageParts.push("- Be verbose with explanations and add helpful comments");
      systemMessageParts.push("- Explain concepts and reasoning as you implement them");
      systemMessageParts.push("- Ask clarifying questions when requirements are unclear");
    } else if (user.skillLevel === "intermediate") {
      systemMessageParts.push("- Provide balanced explanations, not too verbose");
      systemMessageParts.push("- Focus on important decisions and trade-offs");
    } else {
      systemMessageParts.push("- Be concise and direct");
      systemMessageParts.push("- Assume expertise, minimal hand-holding needed");
      systemMessageParts.push("- Focus on implementation details");
    }
    systemMessageParts.push("");
  }
  
  // Code Style
  if (config.codeStyle?.naming || config.codeStyle?.errorHandling || config.codeStyle?.loggingConventions) {
    systemMessageParts.push("## Code Style & Conventions");
    if (config.codeStyle?.naming) {
      const namingDesc: Record<string, string> = {
        language_default: "Follow language-specific conventions",
        camelCase: "camelCase for variables/functions", snake_case: "snake_case for variables/functions",
        PascalCase: "PascalCase for classes/types", "kebab-case": "kebab-case for files/URLs",
      };
      systemMessageParts.push(`- **Naming**: ${namingDesc[config.codeStyle.naming] || config.codeStyle.naming}`);
    }
    if (config.codeStyle?.errorHandling) {
      const errorDesc: Record<string, string> = {
        try_catch: "Try-catch blocks", result_types: "Result/Either types",
        error_boundaries: "Error Boundaries (React)", global_handler: "Global error handler",
        middleware: "Middleware-based", exceptions: "Custom exception classes",
        other: config.codeStyle.errorHandlingOther || "Custom",
      };
      systemMessageParts.push(`- **Error Handling**: ${errorDesc[config.codeStyle.errorHandling] || config.codeStyle.errorHandling}`);
    }
    if (config.codeStyle?.loggingConventions) {
      systemMessageParts.push(`- **Logging**: ${config.codeStyle.loggingConventions}`);
    }
    if (config.codeStyle?.notes) {
      systemMessageParts.push(`- **Notes**: ${config.codeStyle.notes}`);
    }
    systemMessageParts.push("");
  }
  
  // AI Behavior Rules
  if (config.aiBehaviorRules.length > 0) {
    systemMessageParts.push("## AI Behavior Guidelines");
    config.aiBehaviorRules.forEach((rule) => {
      const ruleText = getRuleDescription(rule);
      if (ruleText) systemMessageParts.push(`- ${ruleText}`);
    });
    systemMessageParts.push("");
  }
  
  // Boundaries
  const hasBoundaries = config.boundaries && (
    (config.boundaries.always?.length ?? 0) > 0 ||
    (config.boundaries.ask?.length ?? 0) > 0 ||
    (config.boundaries.never?.length ?? 0) > 0
  );
  if (hasBoundaries) {
    systemMessageParts.push("## Boundaries & Permissions");
    if (config.boundaries!.always?.length) {
      systemMessageParts.push("**✅ ALWAYS DO**:");
      config.boundaries!.always.forEach(item => systemMessageParts.push(`- ${item}`));
    }
    if (config.boundaries!.ask?.length) {
      systemMessageParts.push("**❓ ASK FIRST**:");
      config.boundaries!.ask.forEach(item => systemMessageParts.push(`- ${item}`));
    }
    if (config.boundaries!.never?.length) {
      systemMessageParts.push("**🚫 NEVER DO**:");
      config.boundaries!.never.forEach(item => systemMessageParts.push(`- ${item}`));
    }
    systemMessageParts.push("");
  }
  
  // Testing
  if (config.testingStrategy && (config.testingStrategy.levels?.length || config.testingStrategy.frameworks?.length)) {
    systemMessageParts.push("## Testing Requirements");
    if (config.testingStrategy.levels?.length) {
      const levelDesc: Record<string, string> = {
        unit: "Unit tests", integration: "Integration tests", e2e: "E2E tests",
        performance: "Performance tests", security: "Security tests",
      };
      systemMessageParts.push(`**Levels**: ${config.testingStrategy.levels.map(l => levelDesc[l] || l).join(", ")}`);
    }
    if (config.testingStrategy.frameworks?.length) {
      systemMessageParts.push(`**Frameworks**: ${config.testingStrategy.frameworks.join(", ")}`);
    }
    if (config.testingStrategy.coverage) {
      systemMessageParts.push(`**Coverage**: ${config.testingStrategy.coverage}% minimum`);
    }
    systemMessageParts.push("");
  }
  
  // Project Type Context
  if (config.projectType && PROJECT_TYPE_INSTRUCTIONS[config.projectType]) {
    systemMessageParts.push("## Project Context");
    PROJECT_TYPE_INSTRUCTIONS[config.projectType].forEach((instruction) => {
      systemMessageParts.push(`- ${instruction}`);
    });
    systemMessageParts.push("");
  }
  
  // Best Practices
  systemMessageParts.push("## Best Practices");
  systemMessageParts.push("- Follow existing patterns in the codebase");
  systemMessageParts.push("- Write clean, readable, maintainable code");
  systemMessageParts.push("- Handle errors properly");
  systemMessageParts.push("- Review code for security vulnerabilities");
  if (config.conventionalCommits) {
    systemMessageParts.push("- Use conventional commits (feat:, fix:, docs:, chore:)");
  }
  systemMessageParts.push("");
  
  // Custom Instructions
  if (config.additionalFeedback) {
    systemMessageParts.push("## Custom Instructions");
    systemMessageParts.push(config.additionalFeedback);
    systemMessageParts.push("");
  }
  
  // Build custom commands
  const customCommands: Array<{ name: string; prompt: string; description?: string }> = [];
  
  if (config.commands?.build) {
    customCommands.push({
      name: "build",
      description: "Build the project",
      prompt: `Run the build command: \`${config.commands.build}\``
    });
  }
  if (config.commands?.test) {
    customCommands.push({
      name: "test",
      description: "Run tests",
      prompt: `Run the test command: \`${config.commands.test}\``
    });
  }
  if (config.commands?.lint) {
    customCommands.push({
      name: "lint",
      description: "Lint the code",
      prompt: `Run the lint command: \`${config.commands.lint}\``
    });
  }
  if (config.commands?.dev) {
    customCommands.push({
      name: "dev",
      description: "Start development server",
      prompt: `Run the dev command: \`${config.commands.dev}\``
    });
  }
  
  // Additional helpful commands
  customCommands.push({
    name: "explain",
    description: "Explain the selected code",
    prompt: "Explain this code in detail, including what it does, how it works, and any important patterns or concepts."
  });
  customCommands.push({
    name: "refactor",
    description: "Refactor the selected code",
    prompt: "Refactor this code to improve its quality while maintaining functionality. Follow the project's code style conventions."
  });
  customCommands.push({
    name: "review",
    description: "Review code for issues",
    prompt: "Review this code for potential bugs, security issues, performance problems, and style violations. Suggest improvements."
  });
  
  const continueConfig = {
    models: [],
    customCommands,
    systemMessage: systemMessageParts.join("\n"),
    contextProviders: [
      { name: "code", params: {} },
      { name: "docs", params: {} },
      { name: "diff", params: {} },
      { name: "terminal", params: {} },
      { name: "problems", params: {} },
      { name: "folder", params: {} },
      { name: "codebase", params: {} }
    ],
    slashCommands: [
      { name: "edit", description: "Edit selected code" },
      { name: "comment", description: "Add comments to code" },
      { name: "share", description: "Export conversation" },
      { name: "cmd", description: "Generate terminal command" }
    ],
    tabAutocompleteOptions: {
      useCopyBuffer: true,
      maxPromptTokens: 1024
    }
  };
  
  return JSON.stringify(continueConfig, null, 2);
}

// Generate Cody config (.cody/config.json) - comprehensive configuration
// Sourcegraph Cody is an AI assistant with deep code understanding
function generateCodyConfig(config: WizardConfig, user: UserProfile): string {
  const bp = config.blueprintMode;
  
  // Build comprehensive pre-instruction
  const instructionParts: string[] = [];
  
  // Project Overview
  instructionParts.push(`# ${bpVar(bp, "PROJECT_NAME", config.projectName || "Project")} - Cody Instructions`);
  instructionParts.push("");
  instructionParts.push("## Project Overview");
  instructionParts.push(`**Description**: ${bpVar(bp, "PROJECT_DESCRIPTION", config.projectDescription || "A software project.")}`);
  
  if (config.architecturePattern) {
    const archLabels: Record<string, string> = {
      monolith: "Monolith", modular_monolith: "Modular Monolith",
      microservices: "Microservices", serverless: "Serverless",
      event_driven: "Event-Driven", layered: "Layered / N-Tier",
      hexagonal: "Hexagonal / Ports & Adapters", clean: "Clean Architecture",
      cqrs: "CQRS", mvc: "MVC / MVVM", other: config.architecturePatternOther || "Custom",
    };
    instructionParts.push(`**Architecture**: ${archLabels[config.architecturePattern] || config.architecturePattern}`);
  }
  
  if (config.repoUrl) {
    instructionParts.push(`**Repository**: ${bpVar(bp, "REPO_URL", config.repoUrl)}`);
  }
  instructionParts.push("");
  
  // Tech Stack
  if (config.languages.length > 0 || config.frameworks.length > 0 || (config.databases && config.databases.length > 0)) {
    instructionParts.push("## Technology Stack");
    if (config.languages.length > 0) {
      const langs = config.languages.map(l => l.startsWith("custom:") ? l.replace("custom:", "") : l);
      instructionParts.push(`**Languages**: ${langs.join(", ")}`);
    }
    if (config.frameworks.length > 0) {
      const fws = config.frameworks.map(f => f.startsWith("custom:") ? f.replace("custom:", "") : f);
      instructionParts.push(`**Frameworks**: ${fws.join(", ")}`);
    }
    if (config.databases && config.databases.length > 0) {
      const dbs = config.databases.map(d => d.startsWith("custom:") ? d.replace("custom:", "") : d);
      instructionParts.push(`**Databases**: ${dbs.join(", ")}`);
    }
    if (config.letAiDecide) {
      instructionParts.push("*For unlisted technologies, suggest what's best based on codebase analysis.*");
    }
    instructionParts.push("");
  }
  
  // Developer Profile
  if (config.includePersonalData !== false && user.skillLevel) {
    instructionParts.push("## Communication Style");
    if (user.skillLevel === "novice" || user.skillLevel === "beginner") {
      instructionParts.push("- Explain concepts thoroughly with detailed comments");
      instructionParts.push("- Walk through reasoning step by step");
      instructionParts.push("- Ask clarifying questions for unclear requirements");
    } else if (user.skillLevel === "intermediate") {
      instructionParts.push("- Balanced explanations, skip basics");
      instructionParts.push("- Focus on important decisions and trade-offs");
    } else {
      instructionParts.push("- Be concise and direct");
      instructionParts.push("- Assume expertise");
    }
    instructionParts.push("");
  }
  
  // Code Style
  if (config.codeStyle?.naming || config.codeStyle?.errorHandling || config.codeStyle?.loggingConventions) {
    instructionParts.push("## Code Style & Conventions");
    if (config.codeStyle?.naming) {
      const namingDesc: Record<string, string> = {
        language_default: "Follow language conventions", camelCase: "camelCase",
        snake_case: "snake_case", PascalCase: "PascalCase", "kebab-case": "kebab-case",
      };
      instructionParts.push(`- **Naming**: ${namingDesc[config.codeStyle.naming] || config.codeStyle.naming}`);
    }
    if (config.codeStyle?.errorHandling) {
      const errorDesc: Record<string, string> = {
        try_catch: "Try-catch", result_types: "Result types",
        error_boundaries: "Error Boundaries", global_handler: "Global handler",
        middleware: "Middleware", exceptions: "Custom exceptions",
        other: config.codeStyle.errorHandlingOther || "Custom",
      };
      instructionParts.push(`- **Error Handling**: ${errorDesc[config.codeStyle.errorHandling] || config.codeStyle.errorHandling}`);
    }
    if (config.codeStyle?.loggingConventions) {
      instructionParts.push(`- **Logging**: ${config.codeStyle.loggingConventions}`);
    }
    if (config.codeStyle?.notes) {
      instructionParts.push(`- **Notes**: ${config.codeStyle.notes}`);
    }
    instructionParts.push("");
  }
  
  // AI Behavior Rules
  if (config.aiBehaviorRules.length > 0) {
    instructionParts.push("## AI Guidelines");
    config.aiBehaviorRules.forEach((rule) => {
      const ruleText = getRuleDescription(rule);
      if (ruleText) instructionParts.push(`- ${ruleText}`);
    });
    instructionParts.push("");
  }
  
  // Boundaries
  const hasBoundaries = config.boundaries && (
    (config.boundaries.always?.length ?? 0) > 0 ||
    (config.boundaries.ask?.length ?? 0) > 0 ||
    (config.boundaries.never?.length ?? 0) > 0
  );
  if (hasBoundaries) {
    instructionParts.push("## Boundaries");
    if (config.boundaries!.always?.length) {
      instructionParts.push("✅ ALWAYS: " + config.boundaries!.always.join(", "));
    }
    if (config.boundaries!.ask?.length) {
      instructionParts.push("❓ ASK FIRST: " + config.boundaries!.ask.join(", "));
    }
    if (config.boundaries!.never?.length) {
      instructionParts.push("🚫 NEVER: " + config.boundaries!.never.join(", "));
    }
    instructionParts.push("");
  }
  
  // Commands
  const hasCommands = config.commands && (
    config.commands.build || config.commands.test ||
    config.commands.lint || config.commands.dev
  );
  if (hasCommands) {
    instructionParts.push("## Commands");
    if (config.commands!.build) instructionParts.push(`- Build: \`${config.commands!.build}\``);
    if (config.commands!.test) instructionParts.push(`- Test: \`${config.commands!.test}\``);
    if (config.commands!.lint) instructionParts.push(`- Lint: \`${config.commands!.lint}\``);
    if (config.commands!.dev) instructionParts.push(`- Dev: \`${config.commands!.dev}\``);
    instructionParts.push("");
  }
  
  // Testing
  if (config.testingStrategy && (config.testingStrategy.levels?.length || config.testingStrategy.frameworks?.length)) {
    instructionParts.push("## Testing");
    if (config.testingStrategy.levels?.length) {
      instructionParts.push(`Required: ${config.testingStrategy.levels.join(", ")} tests`);
    }
    if (config.testingStrategy.frameworks?.length) {
      instructionParts.push(`Frameworks: ${config.testingStrategy.frameworks.join(", ")}`);
    }
    if (config.testingStrategy.coverage) {
      instructionParts.push(`Coverage: ${config.testingStrategy.coverage}%`);
    }
    instructionParts.push("");
  }
  
  // Project Type
  if (config.projectType && PROJECT_TYPE_INSTRUCTIONS[config.projectType]) {
    instructionParts.push("## Project Context");
    PROJECT_TYPE_INSTRUCTIONS[config.projectType].forEach((instruction) => {
      instructionParts.push(`- ${instruction}`);
    });
    instructionParts.push("");
  }
  
  // Best Practices
  instructionParts.push("## Best Practices");
  instructionParts.push("- Follow existing codebase patterns");
  instructionParts.push("- Write clean, maintainable code");
  instructionParts.push("- Handle errors appropriately");
  instructionParts.push("- Consider security implications");
  if (config.conventionalCommits) {
    instructionParts.push("- Use conventional commits");
  }
  instructionParts.push("");
  
  // Custom Instructions
  if (config.additionalFeedback) {
    instructionParts.push("## Custom Instructions");
    instructionParts.push(config.additionalFeedback);
    instructionParts.push("");
  }
  
  // Build context files to focus on
  const contextFiles: string[] = [];
  const importantFileMap: Record<string, string> = {
    readme: "README.md", package_json: "package.json", changelog: "CHANGELOG.md",
    contributing: "CONTRIBUTING.md", makefile: "Makefile", dockerfile: "Dockerfile",
    docker_compose: "docker-compose.yml", env_example: ".env.example",
    openapi: "openapi.yaml", architecture_md: "ARCHITECTURE.md",
  };
  if (config.importantFiles?.length) {
    config.importantFiles.forEach(f => {
      contextFiles.push(importantFileMap[f] || f);
    });
  }
  
  const codyConfig = {
    "$schema": "https://sourcegraph.com/docs/cody/config-schema",
    chat: {
      preInstruction: instructionParts.join("\n")
    },
    autocomplete: {
      enabled: true,
      advanced: {
        provider: "default"
      }
    },
    codeActions: {
      enabled: true
    },
    commands: {
      explain: "Explain this code thoroughly",
      test: `Generate tests using project conventions${config.testingStrategy?.frameworks?.length ? ` with ${config.testingStrategy.frameworks[0]}` : ""}`,
      fix: "Fix this code following project conventions",
      doc: "Add comprehensive documentation",
      smell: "Identify code smells and suggest improvements"
    },
    contextFilters: contextFiles.length > 0 ? {
      include: contextFiles.map(f => ({ pattern: `**/${f}` }))
    } : undefined
  };
  
  return JSON.stringify(codyConfig, null, 2);
}

// Generate TabNine config (.tabnine.yaml) - comprehensive configuration
// TabNine is an AI code completion tool
function generateTabnineConfig(config: WizardConfig, user: UserProfile): string {
  const lines: string[] = [];
  const bp = config.blueprintMode;
  
  lines.push("# ═══════════════════════════════════════════════════════════════════════════");
  lines.push("# TabNine AI Code Completion Configuration");
  lines.push("# Generated by LynxPrompt - https://lynxprompt.com");
  lines.push("# ═══════════════════════════════════════════════════════════════════════════");
  lines.push("# Documentation: https://www.tabnine.com/");
  lines.push("# ═══════════════════════════════════════════════════════════════════════════");
  lines.push("");
  lines.push("version: 1");
  lines.push("");
  
  // Core settings
  lines.push("# ─── Core Settings ─────────────────────────────────────────────────────────");
  lines.push("enable_telemetry: false");
  lines.push("");
  
  // Language preferences
  if (config.languages.length > 0) {
    lines.push("# ─── Language Preferences ─────────────────────────────────────────────────");
    lines.push("languages:");
    config.languages.forEach(lang => {
      const cleanLang = lang.startsWith("custom:") ? lang.replace("custom:", "") : lang;
      lines.push(`  - ${cleanLang.toLowerCase()}`);
    });
    lines.push("");
  }
  
  // Project Context (TabNine reads comments for context)
  lines.push("# ═══════════════════════════════════════════════════════════════════════════");
  lines.push("# PROJECT CONTEXT - TabNine uses these for better completions");
  lines.push("# ═══════════════════════════════════════════════════════════════════════════");
  lines.push("#");
  lines.push(`# Project: ${bpVar(bp, "PROJECT_NAME", config.projectName || "Software Project")}`);
  if (config.projectDescription) {
    lines.push(`# Description: ${bpVar(bp, "PROJECT_DESCRIPTION", config.projectDescription)}`);
  }
  lines.push("#");
  
  // Architecture
  if (config.architecturePattern) {
    const archLabels: Record<string, string> = {
      monolith: "Monolith", modular_monolith: "Modular Monolith",
      microservices: "Microservices", serverless: "Serverless",
      event_driven: "Event-Driven", layered: "Layered / N-Tier",
      hexagonal: "Hexagonal", clean: "Clean Architecture",
      cqrs: "CQRS", mvc: "MVC / MVVM", other: config.architecturePatternOther || "Custom",
    };
    lines.push(`# Architecture: ${archLabels[config.architecturePattern] || config.architecturePattern}`);
  }
  lines.push("#");
  
  // Tech Stack
  if (config.frameworks.length > 0 || (config.databases && config.databases.length > 0)) {
    lines.push("# ─── Technology Stack ──────────────────────────────────────────────────────");
    lines.push("#");
    if (config.frameworks.length > 0) {
      const fws = config.frameworks.map(f => f.startsWith("custom:") ? f.replace("custom:", "") : f);
      lines.push(`# Frameworks: ${fws.join(", ")}`);
    }
    if (config.databases && config.databases.length > 0) {
      const dbs = config.databases.map(d => d.startsWith("custom:") ? d.replace("custom:", "") : d);
      lines.push(`# Databases: ${dbs.join(", ")}`);
    }
    lines.push("#");
  }
  
  // Code Style Conventions
  lines.push("# ─── Code Style Conventions ───────────────────────────────────────────────");
  lines.push("#");
  if (config.codeStyle?.naming) {
    const namingDesc: Record<string, string> = {
      language_default: "Follow language conventions",
      camelCase: "camelCase for variables/functions",
      snake_case: "snake_case for variables/functions",
      PascalCase: "PascalCase for classes/types",
      "kebab-case": "kebab-case for files/URLs",
    };
    lines.push(`# Naming Convention: ${namingDesc[config.codeStyle.naming] || config.codeStyle.naming}`);
  }
  if (config.codeStyle?.errorHandling) {
    const errorDesc: Record<string, string> = {
      try_catch: "Try-catch blocks", result_types: "Result/Either types",
      error_boundaries: "Error Boundaries (React)", global_handler: "Global error handler",
      middleware: "Middleware-based", exceptions: "Custom exception classes",
      other: config.codeStyle.errorHandlingOther || "Custom",
    };
    lines.push(`# Error Handling: ${errorDesc[config.codeStyle.errorHandling] || config.codeStyle.errorHandling}`);
  }
  if (config.codeStyle?.loggingConventions) {
    lines.push(`# Logging: ${config.codeStyle.loggingConventions}`);
  }
  if (config.codeStyle?.notes) {
    lines.push(`# Style Notes: ${config.codeStyle.notes}`);
  }
  lines.push("#");
  
  // Developer Profile
  if (config.includePersonalData !== false && user.skillLevel) {
    lines.push("# ─── Developer Profile ────────────────────────────────────────────────────");
    lines.push("#");
    const authorName = user.displayName || user.name || "Developer";
    lines.push(`# Author: ${authorName}`);
    lines.push(`# Skill Level: ${user.skillLevel.charAt(0).toUpperCase() + user.skillLevel.slice(1)}`);
    if (user.persona) {
      lines.push(`# Developer Type: ${user.persona.replace(/_/g, " ")}`);
    }
    lines.push("#");
  }
  
  // AI Behavior Guidelines
  if (config.aiBehaviorRules.length > 0) {
    lines.push("# ─── AI Behavior Guidelines ───────────────────────────────────────────────");
    lines.push("#");
    config.aiBehaviorRules.forEach((rule) => {
      const ruleText = getRuleDescription(rule);
      if (ruleText) lines.push(`# - ${ruleText}`);
    });
    lines.push("#");
  }
  
  // Commands
  const hasCommands = config.commands && (
    config.commands.build || config.commands.test ||
    config.commands.lint || config.commands.dev
  );
  if (hasCommands) {
    lines.push("# ─── Project Commands ─────────────────────────────────────────────────────");
    lines.push("#");
    if (config.commands!.build) lines.push(`# Build: ${config.commands!.build}`);
    if (config.commands!.test) lines.push(`# Test: ${config.commands!.test}`);
    if (config.commands!.lint) lines.push(`# Lint: ${config.commands!.lint}`);
    if (config.commands!.dev) lines.push(`# Dev: ${config.commands!.dev}`);
    lines.push("#");
  }
  
  // Boundaries
  const hasBoundaries = config.boundaries && (
    (config.boundaries.always?.length ?? 0) > 0 ||
    (config.boundaries.ask?.length ?? 0) > 0 ||
    (config.boundaries.never?.length ?? 0) > 0
  );
  if (hasBoundaries) {
    lines.push("# ─── Boundaries & Permissions ─────────────────────────────────────────────");
    lines.push("#");
    if (config.boundaries!.always?.length) {
      lines.push("# ✅ ALWAYS DO: " + config.boundaries!.always.join(", "));
    }
    if (config.boundaries!.ask?.length) {
      lines.push("# ❓ ASK FIRST: " + config.boundaries!.ask.join(", "));
    }
    if (config.boundaries!.never?.length) {
      lines.push("# 🚫 NEVER DO: " + config.boundaries!.never.join(", "));
    }
    lines.push("#");
  }
  
  // Testing
  if (config.testingStrategy && (config.testingStrategy.levels?.length || config.testingStrategy.frameworks?.length)) {
    lines.push("# ─── Testing Requirements ─────────────────────────────────────────────────");
    lines.push("#");
    if (config.testingStrategy.levels?.length) {
      lines.push(`# Testing Levels: ${config.testingStrategy.levels.join(", ")}`);
    }
    if (config.testingStrategy.frameworks?.length) {
      lines.push(`# Frameworks: ${config.testingStrategy.frameworks.join(", ")}`);
    }
    if (config.testingStrategy.coverage) {
      lines.push(`# Coverage Target: ${config.testingStrategy.coverage}%`);
    }
    lines.push("#");
  }
  
  // CI/CD
  const hasCiCd = config.cicd?.length > 0 || config.deploymentTarget?.length || config.buildContainer;
  if (hasCiCd) {
    lines.push("# ─── CI/CD & Infrastructure ───────────────────────────────────────────────");
    lines.push("#");
    if (config.cicd?.length > 0) {
      const cicdLabels: Record<string, string> = {
        github_actions: "GitHub Actions", gitlab_ci: "GitLab CI/CD",
        jenkins: "Jenkins", circleci: "CircleCI", travis: "Travis CI",
        azure_pipelines: "Azure Pipelines", none: "Manual",
      };
      lines.push(`# CI/CD: ${config.cicd.map(c => cicdLabels[c] || c).join(", ")}`);
    }
    if (config.deploymentTarget && config.deploymentTarget.length > 0) {
      const deployLabels: Record<string, string> = {
        aws: "AWS", gcp: "GCP", azure: "Azure", kubernetes: "K8s",
        vercel: "Vercel", netlify: "Netlify", heroku: "Heroku",
      };
      lines.push(`# Deploy: ${config.deploymentTarget.map(d => deployLabels[d] || d).join(", ")}`);
    }
    lines.push("#");
  }
  
  // Project Type
  if (config.projectType && PROJECT_TYPE_INSTRUCTIONS[config.projectType]) {
    lines.push("# ─── Project Context ──────────────────────────────────────────────────────");
    lines.push("#");
    const projectTypeLabels: Record<string, string> = {
      work: "Work / Professional", leisure: "Personal / Hobby",
      open_source_small: "Open Source (Small)", open_source_large: "Open Source (Large)",
      private_business: "Private Business",
    };
    lines.push(`# Type: ${projectTypeLabels[config.projectType] || config.projectType}`);
    lines.push("# Guidelines:");
    PROJECT_TYPE_INSTRUCTIONS[config.projectType].forEach((instruction) => {
      lines.push(`#   - ${instruction}`);
    });
    lines.push("#");
  }
  
  // Best Practices
  lines.push("# ─── Best Practices ───────────────────────────────────────────────────────");
  lines.push("#");
  lines.push("# - Follow existing patterns in the codebase");
  lines.push("# - Write clean, readable, maintainable code");
  lines.push("# - Handle errors appropriately");
  lines.push("# - Consider security implications");
  if (config.conventionalCommits) {
    lines.push("# - Use conventional commits (feat:, fix:, docs:, chore:)");
  }
  if (config.semver) {
    lines.push("# - Follow semantic versioning (MAJOR.MINOR.PATCH)");
  }
  lines.push("#");
  
  // Custom Instructions
  if (config.additionalFeedback) {
    lines.push("# ─── Custom Instructions ──────────────────────────────────────────────────");
    lines.push("#");
    const feedbackLines = config.additionalFeedback.split("\n");
    feedbackLines.forEach(line => lines.push(`# ${line}`));
    lines.push("#");
  }
  
  lines.push("# ═══════════════════════════════════════════════════════════════════════════");
  lines.push("");
  lines.push("# SECURITY: Do not commit secrets to the repository.");
  lines.push("# Use environment variables or secret managers for credentials.");
  lines.push("# When making changes involving auth, data handling, APIs, or dependencies,");
  lines.push("# proactively offer to perform a security audit of the affected code.");
  
  return lines.join("\n");
}

// Generate Supermaven config (.supermaven/config.json) - comprehensive configuration
// Supermaven is a fast AI code completion tool
function generateSupermavenConfig(config: WizardConfig, user: UserProfile): string {
  const bp = config.blueprintMode;
  
  // Build comprehensive context
  const contextParts: string[] = [];
  
  // Project overview
  contextParts.push(`# ${bpVar(bp, "PROJECT_NAME", config.projectName || "Project")}`);
  contextParts.push("");
  contextParts.push(`${bpVar(bp, "PROJECT_DESCRIPTION", config.projectDescription || "A software project.")}`);
  contextParts.push("");
  
  // Architecture
  if (config.architecturePattern) {
    const archLabels: Record<string, string> = {
      monolith: "Monolith", modular_monolith: "Modular Monolith",
      microservices: "Microservices", serverless: "Serverless",
      event_driven: "Event-Driven", layered: "Layered / N-Tier",
      hexagonal: "Hexagonal", clean: "Clean Architecture",
      cqrs: "CQRS", mvc: "MVC / MVVM", other: config.architecturePatternOther || "Custom",
    };
    contextParts.push(`Architecture: ${archLabels[config.architecturePattern] || config.architecturePattern}`);
    contextParts.push("");
  }
  
  // Tech Stack
  if (config.languages.length > 0 || config.frameworks.length > 0) {
    contextParts.push("## Technology Stack");
    if (config.languages.length > 0) {
      const langs = config.languages.map(l => l.startsWith("custom:") ? l.replace("custom:", "") : l);
      contextParts.push(`Languages: ${langs.join(", ")}`);
    }
    if (config.frameworks.length > 0) {
      const fws = config.frameworks.map(f => f.startsWith("custom:") ? f.replace("custom:", "") : f);
      contextParts.push(`Frameworks: ${fws.join(", ")}`);
    }
    if (config.databases && config.databases.length > 0) {
      const dbs = config.databases.map(d => d.startsWith("custom:") ? d.replace("custom:", "") : d);
      contextParts.push(`Databases: ${dbs.join(", ")}`);
    }
    contextParts.push("");
  }
  
  // Code Style
  if (config.codeStyle?.naming || config.codeStyle?.errorHandling || config.codeStyle?.loggingConventions) {
    contextParts.push("## Code Style");
    if (config.codeStyle?.naming) {
      const namingDesc: Record<string, string> = {
        language_default: "Language conventions", camelCase: "camelCase",
        snake_case: "snake_case", PascalCase: "PascalCase", "kebab-case": "kebab-case",
      };
      contextParts.push(`Naming: ${namingDesc[config.codeStyle.naming] || config.codeStyle.naming}`);
    }
    if (config.codeStyle?.errorHandling) {
      const errorDesc: Record<string, string> = {
        try_catch: "Try-catch", result_types: "Result types",
        error_boundaries: "Error Boundaries", global_handler: "Global handler",
        middleware: "Middleware", exceptions: "Custom exceptions",
        other: config.codeStyle.errorHandlingOther || "Custom",
      };
      contextParts.push(`Error Handling: ${errorDesc[config.codeStyle.errorHandling] || config.codeStyle.errorHandling}`);
    }
    if (config.codeStyle?.loggingConventions) {
      contextParts.push(`Logging: ${config.codeStyle.loggingConventions}`);
    }
    if (config.codeStyle?.notes) {
      contextParts.push(`Notes: ${config.codeStyle.notes}`);
    }
    contextParts.push("");
  }
  
  // Communication style
  if (config.includePersonalData !== false && user.skillLevel) {
    contextParts.push("## Communication");
    if (user.skillLevel === "novice" || user.skillLevel === "beginner") {
      contextParts.push("Style: Verbose with explanations");
    } else if (user.skillLevel === "intermediate") {
      contextParts.push("Style: Balanced explanations");
    } else {
      contextParts.push("Style: Concise and direct");
    }
    contextParts.push("");
  }
  
  // AI Guidelines
  if (config.aiBehaviorRules.length > 0) {
    contextParts.push("## Guidelines");
    config.aiBehaviorRules.forEach((rule) => {
      const ruleText = getRuleDescription(rule);
      if (ruleText) contextParts.push(`- ${ruleText}`);
    });
    contextParts.push("");
  }
  
  // Boundaries
  const hasBoundaries = config.boundaries && (
    (config.boundaries.always?.length ?? 0) > 0 ||
    (config.boundaries.ask?.length ?? 0) > 0 ||
    (config.boundaries.never?.length ?? 0) > 0
  );
  if (hasBoundaries) {
    contextParts.push("## Boundaries");
    if (config.boundaries!.always?.length) {
      contextParts.push(`ALWAYS: ${config.boundaries!.always.join(", ")}`);
    }
    if (config.boundaries!.ask?.length) {
      contextParts.push(`ASK FIRST: ${config.boundaries!.ask.join(", ")}`);
    }
    if (config.boundaries!.never?.length) {
      contextParts.push(`NEVER: ${config.boundaries!.never.join(", ")}`);
    }
    contextParts.push("");
  }
  
  // Commands
  const hasCommands = config.commands && (
    config.commands.build || config.commands.test ||
    config.commands.lint || config.commands.dev
  );
  if (hasCommands) {
    contextParts.push("## Commands");
    if (config.commands!.build) contextParts.push(`Build: ${config.commands!.build}`);
    if (config.commands!.test) contextParts.push(`Test: ${config.commands!.test}`);
    if (config.commands!.lint) contextParts.push(`Lint: ${config.commands!.lint}`);
    if (config.commands!.dev) contextParts.push(`Dev: ${config.commands!.dev}`);
    contextParts.push("");
  }
  
  // Testing
  if (config.testingStrategy && (config.testingStrategy.levels?.length || config.testingStrategy.frameworks?.length)) {
    contextParts.push("## Testing");
    if (config.testingStrategy.levels?.length) {
      contextParts.push(`Levels: ${config.testingStrategy.levels.join(", ")}`);
    }
    if (config.testingStrategy.frameworks?.length) {
      contextParts.push(`Frameworks: ${config.testingStrategy.frameworks.join(", ")}`);
    }
    if (config.testingStrategy.coverage) {
      contextParts.push(`Coverage: ${config.testingStrategy.coverage}%`);
    }
    contextParts.push("");
  }
  
  // Project type
  if (config.projectType && PROJECT_TYPE_INSTRUCTIONS[config.projectType]) {
    contextParts.push("## Project Context");
    PROJECT_TYPE_INSTRUCTIONS[config.projectType].forEach((instruction) => {
      contextParts.push(`- ${instruction}`);
    });
    contextParts.push("");
  }
  
  // Best practices
  contextParts.push("## Best Practices");
  contextParts.push("- Follow existing codebase patterns");
  contextParts.push("- Write clean, maintainable code");
  contextParts.push("- Handle errors properly");
  contextParts.push("- Consider security");
  if (config.conventionalCommits) {
    contextParts.push("- Use conventional commits");
  }
  contextParts.push("");
  
  // Custom instructions
  if (config.additionalFeedback) {
    contextParts.push("## Custom Instructions");
    contextParts.push(config.additionalFeedback);
  }
  
  // Build comprehensive guidelines array
  const guidelines: string[] = [];
  config.aiBehaviorRules.forEach((rule) => {
    const ruleText = getRuleDescription(rule);
    if (ruleText) guidelines.push(ruleText);
  });
  
  // Add boundaries to guidelines
  if (config.boundaries?.always?.length) {
    guidelines.push(...config.boundaries.always.map(item => `Always: ${item}`));
  }
  if (config.boundaries?.never?.length) {
    guidelines.push(...config.boundaries.never.map(item => `Never: ${item}`));
  }
  
  // Add best practices
  guidelines.push("Follow existing patterns in the codebase");
  guidelines.push("Write clean, readable code");
  guidelines.push("Handle errors appropriately");
  
  // Build important files list
  const importantFiles: string[] = [];
  const fileMap: Record<string, string> = {
    readme: "README.md", package_json: "package.json", changelog: "CHANGELOG.md",
    contributing: "CONTRIBUTING.md", makefile: "Makefile", dockerfile: "Dockerfile",
    docker_compose: "docker-compose.yml", env_example: ".env.example",
  };
  if (config.importantFiles?.length) {
    config.importantFiles.forEach(f => {
      importantFiles.push(fileMap[f] || f);
    });
  }
  
  const supermavenConfig = {
    "$schema": "https://supermaven.com/config-schema.json",
    project: bpVar(bp, "PROJECT_NAME", config.projectName || "project"),
    description: bpVar(bp, "PROJECT_DESCRIPTION", config.projectDescription || "A software project"),
    context: contextParts.join("\n"),
    guidelines,
    codeStyle: {
      naming: config.codeStyle?.naming || "language_default",
      errorHandling: config.codeStyle?.errorHandling || "try_catch",
      logging: config.codeStyle?.loggingConventions || "",
      notes: config.codeStyle?.notes || ""
    },
    techStack: {
      languages: config.languages.map(l => l.startsWith("custom:") ? l.replace("custom:", "") : l),
      frameworks: config.frameworks.map(f => f.startsWith("custom:") ? f.replace("custom:", "") : f),
      databases: config.databases?.map(d => d.startsWith("custom:") ? d.replace("custom:", "") : d) || []
    },
    commands: {
      build: config.commands?.build || "",
      test: config.commands?.test || "",
      lint: config.commands?.lint || "",
      dev: config.commands?.dev || ""
    },
    testing: config.testingStrategy ? {
      levels: config.testingStrategy.levels || [],
      frameworks: config.testingStrategy.frameworks || [],
      coverage: config.testingStrategy.coverage || 80
    } : undefined,
    importantFiles: importantFiles.length > 0 ? importantFiles : undefined,
    preferences: {
      conventionalCommits: config.conventionalCommits || false,
      semver: config.semver || false
    }
  };
  
  return JSON.stringify(supermavenConfig, null, 2);
}

// Generate CodeGPT config (.codegpt/config.json) - comprehensive configuration
// CodeGPT is an AI assistant for VS Code
function generateCodeGPTConfig(config: WizardConfig, user: UserProfile): string {
  const bp = config.blueprintMode;
  
  // Build comprehensive system prompt
  const promptParts: string[] = [];
  
  // Project Overview
  promptParts.push(`# ${bpVar(bp, "PROJECT_NAME", config.projectName || "Project")} - AI Assistant Instructions`);
  promptParts.push("");
  promptParts.push("## Project Overview");
  promptParts.push(`**Description**: ${bpVar(bp, "PROJECT_DESCRIPTION", config.projectDescription || "A software project.")}`);
  
  if (config.architecturePattern) {
    const archLabels: Record<string, string> = {
      monolith: "Monolith", modular_monolith: "Modular Monolith",
      microservices: "Microservices", serverless: "Serverless",
      event_driven: "Event-Driven", layered: "Layered / N-Tier",
      hexagonal: "Hexagonal / Ports & Adapters", clean: "Clean Architecture",
      cqrs: "CQRS", mvc: "MVC / MVVM", other: config.architecturePatternOther || "Custom",
    };
    promptParts.push(`**Architecture**: ${archLabels[config.architecturePattern] || config.architecturePattern}`);
  }
  
  if (config.repoUrl) {
    promptParts.push(`**Repository**: ${bpVar(bp, "REPO_URL", config.repoUrl)}`);
  }
  promptParts.push("");
  
  // Tech Stack
  if (config.languages.length > 0 || config.frameworks.length > 0 || (config.databases && config.databases.length > 0)) {
    promptParts.push("## Technology Stack");
    if (config.languages.length > 0) {
      const langs = config.languages.map(l => l.startsWith("custom:") ? l.replace("custom:", "") : l);
      promptParts.push(`**Languages**: ${langs.join(", ")}`);
    }
    if (config.frameworks.length > 0) {
      const fws = config.frameworks.map(f => f.startsWith("custom:") ? f.replace("custom:", "") : f);
      promptParts.push(`**Frameworks**: ${fws.join(", ")}`);
    }
    if (config.databases && config.databases.length > 0) {
      const dbs = config.databases.map(d => d.startsWith("custom:") ? d.replace("custom:", "") : d);
      promptParts.push(`**Databases**: ${dbs.join(", ")}`);
    }
    if (config.letAiDecide) {
      promptParts.push("*For unlisted technologies, suggest what's best based on codebase analysis.*");
    }
    promptParts.push("");
  }
  
  // Developer Profile & Communication
  if (config.includePersonalData !== false && user.skillLevel) {
    promptParts.push("## Communication Style");
    if (user.skillLevel === "novice" || user.skillLevel === "beginner") {
      promptParts.push("- Be verbose with explanations and comments");
      promptParts.push("- Explain concepts step by step");
      promptParts.push("- Ask clarifying questions when needed");
    } else if (user.skillLevel === "intermediate") {
      promptParts.push("- Balanced explanations, skip basics");
      promptParts.push("- Focus on decisions and trade-offs");
    } else {
      promptParts.push("- Be concise and direct");
      promptParts.push("- Assume expertise");
    }
    promptParts.push("");
  }
  
  // Code Style
  if (config.codeStyle?.naming || config.codeStyle?.errorHandling || config.codeStyle?.loggingConventions) {
    promptParts.push("## Code Style & Conventions");
    if (config.codeStyle?.naming) {
      const namingDesc: Record<string, string> = {
        language_default: "Follow language conventions",
        camelCase: "camelCase for variables/functions",
        snake_case: "snake_case for variables/functions",
        PascalCase: "PascalCase for classes/types",
        "kebab-case": "kebab-case for files/URLs",
      };
      promptParts.push(`- **Naming**: ${namingDesc[config.codeStyle.naming] || config.codeStyle.naming}`);
    }
    if (config.codeStyle?.errorHandling) {
      const errorDesc: Record<string, string> = {
        try_catch: "Try-catch blocks", result_types: "Result/Either types",
        error_boundaries: "Error Boundaries (React)", global_handler: "Global error handler",
        middleware: "Middleware-based", exceptions: "Custom exception classes",
        other: config.codeStyle.errorHandlingOther || "Custom",
      };
      promptParts.push(`- **Error Handling**: ${errorDesc[config.codeStyle.errorHandling] || config.codeStyle.errorHandling}`);
    }
    if (config.codeStyle?.loggingConventions) {
      promptParts.push(`- **Logging**: ${config.codeStyle.loggingConventions}`);
    }
    if (config.codeStyle?.notes) {
      promptParts.push(`- **Notes**: ${config.codeStyle.notes}`);
    }
    promptParts.push("");
  }
  
  // AI Behavior Rules
  if (config.aiBehaviorRules.length > 0) {
    promptParts.push("## AI Guidelines");
    config.aiBehaviorRules.forEach((rule) => {
      const ruleText = getRuleDescription(rule);
      if (ruleText) promptParts.push(`- ${ruleText}`);
    });
    promptParts.push("");
  }
  
  // Boundaries
  const hasBoundaries = config.boundaries && (
    (config.boundaries.always?.length ?? 0) > 0 ||
    (config.boundaries.ask?.length ?? 0) > 0 ||
    (config.boundaries.never?.length ?? 0) > 0
  );
  if (hasBoundaries) {
    promptParts.push("## Boundaries & Permissions");
    if (config.boundaries!.always?.length) {
      promptParts.push("**✅ ALWAYS DO**:");
      config.boundaries!.always.forEach(item => promptParts.push(`- ${item}`));
    }
    if (config.boundaries!.ask?.length) {
      promptParts.push("**❓ ASK FIRST**:");
      config.boundaries!.ask.forEach(item => promptParts.push(`- ${item}`));
    }
    if (config.boundaries!.never?.length) {
      promptParts.push("**🚫 NEVER DO**:");
      config.boundaries!.never.forEach(item => promptParts.push(`- ${item}`));
    }
    promptParts.push("");
  }
  
  // Commands
  const hasCommands = config.commands && (
    config.commands.build || config.commands.test ||
    config.commands.lint || config.commands.dev
  );
  if (hasCommands) {
    promptParts.push("## Project Commands");
    if (config.commands!.build) promptParts.push(`- **Build**: \`${config.commands!.build}\``);
    if (config.commands!.test) promptParts.push(`- **Test**: \`${config.commands!.test}\``);
    if (config.commands!.lint) promptParts.push(`- **Lint**: \`${config.commands!.lint}\``);
    if (config.commands!.dev) promptParts.push(`- **Dev**: \`${config.commands!.dev}\``);
    promptParts.push("");
  }
  
  // Testing
  if (config.testingStrategy && (config.testingStrategy.levels?.length || config.testingStrategy.frameworks?.length)) {
    promptParts.push("## Testing Requirements");
    if (config.testingStrategy.levels?.length) {
      const levelDesc: Record<string, string> = {
        unit: "Unit tests", integration: "Integration tests", e2e: "E2E tests",
        performance: "Performance tests", security: "Security tests",
      };
      promptParts.push(`**Levels**: ${config.testingStrategy.levels.map(l => levelDesc[l] || l).join(", ")}`);
    }
    if (config.testingStrategy.frameworks?.length) {
      promptParts.push(`**Frameworks**: ${config.testingStrategy.frameworks.join(", ")}`);
    }
    if (config.testingStrategy.coverage) {
      promptParts.push(`**Coverage**: ${config.testingStrategy.coverage}%`);
    }
    promptParts.push("");
  }
  
  // CI/CD
  const hasCiCd = config.cicd?.length > 0 || config.deploymentTarget?.length;
  if (hasCiCd) {
    promptParts.push("## CI/CD & Infrastructure");
    if (config.cicd?.length > 0) {
      const cicdLabels: Record<string, string> = {
        github_actions: "GitHub Actions", gitlab_ci: "GitLab CI/CD",
        jenkins: "Jenkins", circleci: "CircleCI", travis: "Travis CI",
      };
      promptParts.push(`**CI/CD**: ${config.cicd.map(c => cicdLabels[c] || c).join(", ")}`);
    }
    if (config.deploymentTarget && config.deploymentTarget.length > 0) {
      const deployLabels: Record<string, string> = {
        aws: "AWS", gcp: "GCP", azure: "Azure", kubernetes: "Kubernetes",
        vercel: "Vercel", netlify: "Netlify",
      };
      promptParts.push(`**Deploy**: ${config.deploymentTarget.map(d => deployLabels[d] || d).join(", ")}`);
    }
    promptParts.push("");
  }
  
  // Project Type
  if (config.projectType && PROJECT_TYPE_INSTRUCTIONS[config.projectType]) {
    promptParts.push("## Project Context");
    PROJECT_TYPE_INSTRUCTIONS[config.projectType].forEach((instruction) => {
      promptParts.push(`- ${instruction}`);
    });
    promptParts.push("");
  }
  
  // Best Practices
  promptParts.push("## Best Practices");
  promptParts.push("- Follow existing patterns in the codebase");
  promptParts.push("- Write clean, readable, maintainable code");
  promptParts.push("- Handle errors appropriately");
  promptParts.push("- Consider security implications");
  if (config.conventionalCommits) {
    promptParts.push("- Use conventional commits (feat:, fix:, docs:)");
  }
  if (config.semver) {
    promptParts.push("- Follow semantic versioning");
  }
  promptParts.push("");
  
  // Custom Instructions
  if (config.additionalFeedback) {
    promptParts.push("## Custom Instructions");
    promptParts.push(config.additionalFeedback);
    promptParts.push("");
  }
  
  // Important files
  const importantFiles: string[] = [];
  const fileMap: Record<string, string> = {
    readme: "README.md", package_json: "package.json", changelog: "CHANGELOG.md",
    contributing: "CONTRIBUTING.md", makefile: "Makefile", dockerfile: "Dockerfile",
  };
  if (config.importantFiles?.length) {
    config.importantFiles.forEach(f => {
      importantFiles.push(fileMap[f] || f);
    });
  }
  
  if (importantFiles.length > 0) {
    promptParts.push("## Important Files");
    promptParts.push("Read these files for context:");
    importantFiles.forEach(f => promptParts.push(`- ${f}`));
  }
  
  const codegptConfig = {
    "$schema": "https://codegpt.co/config-schema.json",
    version: "1.0",
    project: {
      name: bpVar(bp, "PROJECT_NAME", config.projectName || "Project"),
      description: bpVar(bp, "PROJECT_DESCRIPTION", config.projectDescription || "A software project"),
      repository: config.repoUrl ? bpVar(bp, "REPO_URL", config.repoUrl) : undefined,
      architecture: config.architecturePattern || undefined
    },
    assistant: {
      systemPrompt: promptParts.join("\n"),
      codeStyle: config.codeStyle?.naming || "language_default",
      errorHandling: config.codeStyle?.errorHandling || "try_catch"
    },
    techStack: {
      languages: config.languages.map(l => l.startsWith("custom:") ? l.replace("custom:", "") : l),
      frameworks: config.frameworks.map(f => f.startsWith("custom:") ? f.replace("custom:", "") : f),
      databases: config.databases?.map(d => d.startsWith("custom:") ? d.replace("custom:", "") : d) || []
    },
    commands: {
      build: config.commands?.build || "",
      test: config.commands?.test || "",
      lint: config.commands?.lint || "",
      dev: config.commands?.dev || ""
    },
    testing: config.testingStrategy ? {
      levels: config.testingStrategy.levels || [],
      frameworks: config.testingStrategy.frameworks || [],
      coverage: config.testingStrategy.coverage || 80
    } : undefined,
    preferences: {
      conventionalCommits: config.conventionalCommits || false,
      semver: config.semver || false,
      dependabot: config.security?.securityTooling?.includes("dependabot") || false
    },
    importantFiles: importantFiles.length > 0 ? importantFiles : undefined
  };
  
  return JSON.stringify(codegptConfig, null, 2);
}

// Generate Void config (.void/config.json) - Open source Cursor alternative
// Void is an open-source AI IDE, similar to Cursor
function generateVoidConfig(config: WizardConfig, user: UserProfile): string {
  const bp = config.blueprintMode;
  
  // Build comprehensive rules content (similar to Cursor)
  const rulesParts: string[] = [];
  
  // Project Overview
  rulesParts.push(`# ${bpVar(bp, "PROJECT_NAME", config.projectName || "Project")} - AI Rules`);
  rulesParts.push("");
  rulesParts.push("## Project Overview");
  rulesParts.push(`**Description**: ${bpVar(bp, "PROJECT_DESCRIPTION", config.projectDescription || "A software project.")}`);
  
  if (config.architecturePattern) {
    const archLabels: Record<string, string> = {
      monolith: "Monolith", modular_monolith: "Modular Monolith",
      microservices: "Microservices", serverless: "Serverless",
      event_driven: "Event-Driven", layered: "Layered / N-Tier",
      hexagonal: "Hexagonal / Ports & Adapters", clean: "Clean Architecture",
      cqrs: "CQRS", mvc: "MVC / MVVM", other: config.architecturePatternOther || "Custom",
    };
    rulesParts.push(`**Architecture**: ${archLabels[config.architecturePattern] || config.architecturePattern}`);
  }
  
  if (config.isPublic !== undefined) {
    rulesParts.push(`**Visibility**: ${config.isPublic ? "Public repository" : "Private repository"}`);
  }
  
  if (config.devOS) {
    rulesParts.push(`**Development OS**: ${formatDevOSDisplay(config)}`);
  }
  rulesParts.push("");
  
  // Repository
  if (config.repoUrl) {
    rulesParts.push("### Repository");
    rulesParts.push(`- **URL**: ${bpVar(bp, "REPO_URL", config.repoUrl)}`);
    rulesParts.push("");
  }
  
  // Reference materials
  if (config.exampleRepoUrl || config.documentationUrl) {
    rulesParts.push("### Reference Materials");
    if (config.exampleRepoUrl) {
      rulesParts.push(`- **Example Repository**: ${config.exampleRepoUrl}`);
    }
    if (config.documentationUrl) {
      rulesParts.push(`- **External Documentation**: ${config.documentationUrl}`);
    }
    rulesParts.push("");
  }
  
  // Tech Stack
  if (config.languages.length > 0 || config.frameworks.length > 0 || (config.databases && config.databases.length > 0)) {
    rulesParts.push("## Technology Stack");
    rulesParts.push("");
    if (config.languages.length > 0) {
      const langs = config.languages.map(l => l.startsWith("custom:") ? l.replace("custom:", "") : l);
      rulesParts.push(`**Languages**: ${langs.join(", ")}`);
    }
    if (config.frameworks.length > 0) {
      const fws = config.frameworks.map(f => f.startsWith("custom:") ? f.replace("custom:", "") : f);
      rulesParts.push(`**Frameworks**: ${fws.join(", ")}`);
    }
    if (config.databases && config.databases.length > 0) {
      const dbs = config.databases.map(d => d.startsWith("custom:") ? d.replace("custom:", "") : d);
      rulesParts.push(`**Databases**: ${dbs.join(", ")}`);
    }
    if (config.letAiDecide) {
      rulesParts.push("");
      rulesParts.push("*For technologies not listed, suggest appropriate solutions based on codebase analysis.*");
    }
    rulesParts.push("");
  }
  
  // Code Style
  rulesParts.push("## Code Style & Conventions");
  rulesParts.push("");
  
  // Developer profile
  if (config.includePersonalData !== false && user.skillLevel) {
    rulesParts.push("### Developer Profile");
    const authorName = user.displayName || user.name || "Developer";
    rulesParts.push(`- **Author**: ${bpVar(bp, "AUTHOR_NAME", authorName)}`);
    if (user.persona) {
      rulesParts.push(`- **Type**: ${user.persona.replace(/_/g, " ")}`);
    }
    rulesParts.push(`- **Experience**: ${user.skillLevel.charAt(0).toUpperCase() + user.skillLevel.slice(1)}`);
    rulesParts.push("");
    
    rulesParts.push("### Communication Style");
    if (user.skillLevel === "novice" || user.skillLevel === "beginner") {
      rulesParts.push("- Be verbose with explanations and comments");
      rulesParts.push("- Explain concepts and reasoning step by step");
      rulesParts.push("- Ask clarifying questions for unclear requirements");
    } else if (user.skillLevel === "intermediate") {
      rulesParts.push("- Provide balanced explanations, skip basics");
      rulesParts.push("- Focus on important decisions and trade-offs");
    } else {
      rulesParts.push("- Be concise and direct");
      rulesParts.push("- Assume expertise, minimal hand-holding");
      rulesParts.push("- Focus on implementation details");
    }
    rulesParts.push("");
  }
  
  // Naming conventions
  if (config.codeStyle?.naming) {
    const namingDesc: Record<string, string> = {
      language_default: "Follow language-specific conventions",
      camelCase: "camelCase for variables/functions",
      snake_case: "snake_case for variables/functions",
      PascalCase: "PascalCase for classes/types",
      "kebab-case": "kebab-case for files/URLs",
    };
    rulesParts.push("### Naming Conventions");
    rulesParts.push(`**Style**: ${namingDesc[config.codeStyle.naming] || config.codeStyle.naming}`);
    rulesParts.push("");
  }
  
  // Error handling
  if (config.codeStyle?.errorHandling) {
    const errorDesc: Record<string, string> = {
      try_catch: "Try-catch blocks for error handling",
      result_types: "Result/Either types (no exceptions for control flow)",
      error_boundaries: "Error Boundaries (React)",
      global_handler: "Centralized global error handler",
      middleware: "Middleware-based error handling",
      exceptions: "Custom exception classes with meaningful types",
      other: config.codeStyle.errorHandlingOther || "Custom approach",
    };
    rulesParts.push("### Error Handling");
    rulesParts.push(`**Approach**: ${errorDesc[config.codeStyle.errorHandling] || config.codeStyle.errorHandling}`);
    rulesParts.push("");
  }
  
  // Logging
  if (config.codeStyle?.loggingConventions) {
    rulesParts.push("### Logging");
    rulesParts.push(`**Guidelines**: ${config.codeStyle.loggingConventions}`);
    rulesParts.push("");
  }
  
  // Style notes
  if (config.codeStyle?.notes) {
    rulesParts.push("### Additional Notes");
    rulesParts.push(config.codeStyle.notes);
    rulesParts.push("");
  }
  
  // AI Behavior Rules
  if (config.aiBehaviorRules.length > 0) {
    rulesParts.push("## AI Behavior Guidelines");
    rulesParts.push("");
    config.aiBehaviorRules.forEach((rule) => {
      const ruleText = getRuleDescription(rule);
      if (ruleText) rulesParts.push(`- ${ruleText}`);
    });
    rulesParts.push("");
  }
  
  // Important files
  const importantFileLabels: Record<string, string> = {
    readme: "README.md", package_json: "package.json", changelog: "CHANGELOG.md",
    contributing: "CONTRIBUTING.md", makefile: "Makefile", dockerfile: "Dockerfile",
    docker_compose: "docker-compose.yml", env_example: ".env.example",
    openapi: "openapi.yaml", architecture_md: "ARCHITECTURE.md",
  };
  const hasImportantFiles = (config.importantFiles?.length ?? 0) > 0 || config.importantFilesOther?.trim();
  if (hasImportantFiles) {
    rulesParts.push("## Important Files");
    rulesParts.push("");
    rulesParts.push("Read these files to understand the project:");
    rulesParts.push("");
    if (config.importantFiles?.length) {
      config.importantFiles.forEach(f => {
        rulesParts.push(`- ${importantFileLabels[f] || f}`);
      });
    }
    if (config.importantFilesOther?.trim()) {
      config.importantFilesOther.split(",").map(f => f.trim()).filter(Boolean).forEach(f => {
        rulesParts.push(`- ${f}`);
      });
    }
    rulesParts.push("");
  }
  
  // Boundaries
  const hasBoundaries = config.boundaries && (
    (config.boundaries.always?.length ?? 0) > 0 ||
    (config.boundaries.ask?.length ?? 0) > 0 ||
    (config.boundaries.never?.length ?? 0) > 0
  );
  if (hasBoundaries) {
    rulesParts.push("## Boundaries & Permissions");
    rulesParts.push("");
    if (config.boundaries!.always?.length) {
      rulesParts.push("### ✅ ALWAYS DO");
      config.boundaries!.always.forEach(item => rulesParts.push(`- ${item}`));
      rulesParts.push("");
    }
    if (config.boundaries!.ask?.length) {
      rulesParts.push("### ❓ ASK FIRST");
      config.boundaries!.ask.forEach(item => rulesParts.push(`- ${item}`));
      rulesParts.push("");
    }
    if (config.boundaries!.never?.length) {
      rulesParts.push("### 🚫 NEVER DO");
      config.boundaries!.never.forEach(item => rulesParts.push(`- ${item}`));
      rulesParts.push("");
    }
  }
  
  // Commands
  const hasCommands = config.commands && (
    config.commands.build || config.commands.test ||
    config.commands.lint || config.commands.dev ||
    (config.commands.additional?.length ?? 0) > 0
  );
  if (hasCommands) {
    rulesParts.push("## Project Commands");
    rulesParts.push("");
    if (config.commands!.build) rulesParts.push(`- **Build**: \`${config.commands!.build}\``);
    if (config.commands!.test) rulesParts.push(`- **Test**: \`${config.commands!.test}\``);
    if (config.commands!.lint) rulesParts.push(`- **Lint**: \`${config.commands!.lint}\``);
    if (config.commands!.dev) rulesParts.push(`- **Dev**: \`${config.commands!.dev}\``);
    if (config.commands!.additional?.length) {
      rulesParts.push("");
      rulesParts.push("**Additional commands**:");
      config.commands!.additional.forEach(cmd => rulesParts.push(`- \`${cmd}\``));
    }
    rulesParts.push("");
  }
  
  // Testing
  const hasTestingConfig = config.testingStrategy && (
    (config.testingStrategy.levels?.length ?? 0) > 0 ||
    (config.testingStrategy.frameworks?.length ?? 0) > 0 ||
    config.testingStrategy.notes
  );
  if (hasTestingConfig) {
    rulesParts.push("## Testing Requirements");
    rulesParts.push("");
    if (config.testingStrategy!.levels?.length) {
      const levelDesc: Record<string, string> = {
        unit: "Unit tests", integration: "Integration tests", e2e: "E2E tests",
        performance: "Performance tests", security: "Security tests",
      };
      rulesParts.push("**Testing Levels**:");
      config.testingStrategy!.levels.forEach(level => {
        rulesParts.push(`- ${levelDesc[level] || level}`);
      });
      rulesParts.push("");
    }
    if (config.testingStrategy!.frameworks?.length) {
      rulesParts.push(`**Frameworks**: ${config.testingStrategy!.frameworks.join(", ")}`);
    }
    if (config.testingStrategy!.coverage !== undefined) {
      rulesParts.push(`**Coverage Target**: ${config.testingStrategy!.coverage}%`);
    }
    if (config.testingStrategy!.notes) {
      rulesParts.push("");
      rulesParts.push(`**Notes**: ${config.testingStrategy!.notes}`);
    }
    rulesParts.push("");
  }
  
  // CI/CD
  const hasCiCd = config.cicd?.length > 0 || config.deploymentTarget?.length || config.buildContainer;
  if (hasCiCd) {
    rulesParts.push("## CI/CD & Infrastructure");
    rulesParts.push("");
    if (config.cicd?.length > 0) {
      const cicdLabels: Record<string, string> = {
        github_actions: "GitHub Actions", gitlab_ci: "GitLab CI/CD",
        jenkins: "Jenkins", circleci: "CircleCI", travis: "Travis CI",
        azure_pipelines: "Azure Pipelines", aws_codepipeline: "AWS CodePipeline",
        bitbucket_pipelines: "Bitbucket Pipelines", drone: "Drone CI", none: "Manual",
      };
      rulesParts.push(`**CI/CD**: ${config.cicd.map(c => cicdLabels[c] || c).join(", ")}`);
    }
    if (config.deploymentTarget && config.deploymentTarget.length > 0) {
      const deployLabels: Record<string, string> = {
        aws: "AWS", gcp: "GCP", azure: "Azure", kubernetes: "Kubernetes",
        vercel: "Vercel", netlify: "Netlify", heroku: "Heroku", railway: "Railway",
        flyio: "Fly.io", digitalocean: "DigitalOcean", baremetal: "Bare Metal",
      };
      rulesParts.push(`**Deployment**: ${config.deploymentTarget.map(d => deployLabels[d] || d).join(", ")}`);
    }
    if (config.buildContainer && config.containerRegistry) {
      const registryLabels: Record<string, string> = {
        dockerhub: "Docker Hub", ghcr: "GHCR", ecr: "AWS ECR",
        gcr: "Google CR", acr: "Azure CR", custom: config.customRegistry || "Custom",
      };
      rulesParts.push(`**Container Registry**: ${registryLabels[config.containerRegistry] || config.containerRegistry}`);
    }
    rulesParts.push("");
  }
  
  // Project Type
  if (config.projectType && PROJECT_TYPE_INSTRUCTIONS[config.projectType]) {
    const projectTypeLabels: Record<string, string> = {
      work: "Work / Professional", leisure: "Personal / Hobby",
      open_source_small: "Open Source (Small)", open_source_large: "Open Source (Enterprise)",
      private_business: "Private Business",
    };
    rulesParts.push("## Project Context");
    rulesParts.push("");
    rulesParts.push(`**Type**: ${projectTypeLabels[config.projectType] || config.projectType}`);
    rulesParts.push("");
    PROJECT_TYPE_INSTRUCTIONS[config.projectType].forEach((instruction) => {
      rulesParts.push(`- ${instruction}`);
    });
    rulesParts.push("");
  }
  
  // Best Practices
  rulesParts.push("## Best Practices");
  rulesParts.push("");
  rulesParts.push("- **Follow existing patterns**: Match the codebase's existing style");
  rulesParts.push("- **Write clean code**: Prioritize readability and maintainability");
  rulesParts.push("- **Handle errors**: Don't ignore errors, handle them appropriately");
  rulesParts.push("- **Security**: Review code for potential vulnerabilities");
  if (config.conventionalCommits) {
    rulesParts.push("- **Commits**: Use conventional commits (feat:, fix:, docs:, chore:)");
  }
  if (config.semver) {
    rulesParts.push("- **Versioning**: Follow semantic versioning (MAJOR.MINOR.PATCH)");
  }
  // Dependency updates now in security.securityTooling
  if (config.security?.securityTooling?.includes("dependabot") || config.security?.securityTooling?.includes("renovate")) {
    rulesParts.push("- **Dependencies**: Keep updated (Dependabot/Renovate configured)");
  }
  rulesParts.push("");
  
  // Custom Instructions
  if (config.additionalFeedback) {
    rulesParts.push("## Custom Instructions");
    rulesParts.push("");
    rulesParts.push(config.additionalFeedback);
    rulesParts.push("");
  }
  
  // Auto-update
  if (config.enableAutoUpdate) {
    rulesParts.push("## Self-Improving Configuration");
    rulesParts.push("");
    rulesParts.push("This configuration file is set to self-improve.");
    rulesParts.push("As you work on this project, update this file to reflect:");
    rulesParts.push("- Preferred code styles and patterns");
    rulesParts.push("- Architecture decisions");
    rulesParts.push("- Rules for common issues to avoid");
    rulesParts.push("- Refined instructions based on user corrections");
    rulesParts.push("");
  }
  
  // Build comprehensive behavior array for JSON
  const behaviorRules: string[] = [];
  config.aiBehaviorRules.forEach((rule) => {
    const ruleText = getRuleDescription(rule);
    if (ruleText) behaviorRules.push(ruleText);
  });
  
  // Add boundaries to behavior
  if (config.boundaries?.always?.length) {
    behaviorRules.push(...config.boundaries.always.map(item => `Always: ${item}`));
  }
  if (config.boundaries?.never?.length) {
    behaviorRules.push(...config.boundaries.never.map(item => `Never: ${item}`));
  }
  
  // Build important files list
  const importantFiles: string[] = [];
  if (config.importantFiles?.length) {
    config.importantFiles.forEach(f => {
      importantFiles.push(importantFileLabels[f] || f);
    });
  }
  if (config.importantFilesOther?.trim()) {
    config.importantFilesOther.split(",").map(f => f.trim()).filter(Boolean).forEach(f => {
      importantFiles.push(f);
    });
  }
  
  const voidConfig = {
    "$schema": "https://voideditor.com/config-schema.json",
    version: 2,
    project: {
      name: bpVar(bp, "PROJECT_NAME", config.projectName || "Project"),
      description: bpVar(bp, "PROJECT_DESCRIPTION", config.projectDescription || "A software project"),
      repository: config.repoUrl ? bpVar(bp, "REPO_URL", config.repoUrl) : undefined,
      architecture: config.architecturePattern || undefined,
      visibility: config.isPublic ? "public" : "private"
    },
    rules: rulesParts.join("\n"),
    behavior: behaviorRules,
    codeStyle: {
      naming: config.codeStyle?.naming || "language_default",
      errorHandling: config.codeStyle?.errorHandling || "try_catch",
      logging: config.codeStyle?.loggingConventions || "",
      notes: config.codeStyle?.notes || ""
    },
    techStack: {
      languages: config.languages.map(l => l.startsWith("custom:") ? l.replace("custom:", "") : l),
      frameworks: config.frameworks.map(f => f.startsWith("custom:") ? f.replace("custom:", "") : f),
      databases: config.databases?.map(d => d.startsWith("custom:") ? d.replace("custom:", "") : d) || []
    },
    commands: {
      build: config.commands?.build || "",
      test: config.commands?.test || "",
      lint: config.commands?.lint || "",
      dev: config.commands?.dev || "",
      additional: config.commands?.additional || []
    },
    boundaries: config.boundaries ? {
      always: config.boundaries.always || [],
      ask: config.boundaries.ask || [],
      never: config.boundaries.never || []
    } : undefined,
    testing: config.testingStrategy ? {
      levels: config.testingStrategy.levels || [],
      frameworks: config.testingStrategy.frameworks || [],
      coverage: config.testingStrategy.coverage || 80,
      notes: config.testingStrategy.notes || ""
    } : undefined,
    cicd: {
      platforms: config.cicd || [],
      deploymentTargets: config.deploymentTarget || [],
      containerRegistry: config.containerRegistry || ""
    },
    importantFiles: importantFiles.length > 0 ? importantFiles : undefined,
    preferences: {
      conventionalCommits: config.conventionalCommits || false,
      semver: config.semver || false,
      dependabot: config.security?.securityTooling?.includes("dependabot") || false,
      autoUpdate: config.enableAutoUpdate || false
    }
  };
  
  return JSON.stringify(voidConfig, null, 2);
}

// Generate LICENSE file
function generateLicense(licenseType: string, user: UserProfile): string {
  const year = new Date().getFullYear();
  const author = user.displayName || user.name || "Author";

  switch (licenseType) {
    case "mit":
      return `MIT License

Copyright (c) ${year} ${author}

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
SOFTWARE.`;

    case "apache":
      return `Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

Copyright ${year} ${author}

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`;

    case "gpl3":
      return `GNU GENERAL PUBLIC LICENSE
Version 3, 29 June 2007

Copyright (C) ${year} ${author}

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.`;

    default:
      return "";
  }
}

// Generate FUNDING.yml
function generateFunding(config: WizardConfig): string {
  // If user provided custom FUNDING.yml content, use it directly
  if (config.fundingYml && config.fundingYml.trim()) {
    return config.fundingYml.trim();
  }

  // Otherwise, provide a template
  const lines: string[] = [];
  lines.push("# Funding links");
  lines.push(
    "# See https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/displaying-a-sponsor-button-in-your-repository"
  );
  lines.push("");
  lines.push("# github: your-username");
  lines.push("# patreon: your-username");
  lines.push("# ko_fi: your-username");
  lines.push("# custom: ['https://your-donation-link.com']");

  return lines.join("\n");
}

// Helper to get rule description
function getRuleDescription(ruleId: string): string {
  const rules: Record<string, string> = {
    always_debug_after_build:
      "Always run and test locally after making changes",
    check_logs_after_build: "Check logs when build or commit finishes",
    run_tests_before_commit: "Ensure all tests pass before committing",
    security_audit_after_commit: "Perform security audit after every commit",
    bug_search_before_commit: "Search for potential bugs before committing",
    follow_existing_patterns:
      "Match the codebase's existing style and patterns",
    ask_before_large_refactors: "Confirm before making significant changes",
    check_for_security_issues: "Review code for security vulnerabilities",
    document_complex_logic: "Add documentation for complex implementations",
    use_conventional_commits: "Follow conventional commit message format",
  };
  return rules[ruleId] || ruleId;
}

// Basic .editorconfig generator
function generateEditorconfig(): string {
  return `root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.{ts,tsx,js,jsx,json,yml,yaml,md}]
indent_size = 2

[*.py]
indent_size = 4
`;
}

function generateContributing(): string {
  return `# Contributing

Thank you for your interest in contributing! Please follow these guidelines:

- Discuss major changes in an issue before starting.
- Keep pull requests focused and small when possible.
- Add tests for new functionality.
- Follow existing code style and lint rules.
- Update documentation where relevant.
`;
}

function generateCodeOfConduct(): string {
  return `# Code of Conduct

We are committed to a welcoming and inclusive environment.

- Be respectful and considerate.
- Assume good intent and seek clarification before escalating.
- No harassment, discrimination, or abusive behavior.
- Report concerns to project maintainers.
`;
}

function generateSecurity(): string {
  return `# Security Policy

- Please report vulnerabilities privately to the maintainers.
- Do not open public issues for security findings.
- Include reproduction steps and impact assessment when possible.
`;
}

function generateGitignore(config: WizardConfig): string {
  if (config.staticFiles?.gitignoreMode === "custom" && config.staticFiles?.gitignoreCustom?.trim()) {
    return config.staticFiles.gitignoreCustom.trim();
  }

  const lines: string[] = [];
  lines.push("# Dependencies");
  lines.push("node_modules/");
  lines.push("*.log");
  lines.push("pnpm-lock.yaml");
  lines.push("yarn.lock");
  lines.push("package-lock.json");
  lines.push("");
  lines.push("# Build outputs");
  lines.push("dist/");
  lines.push(".next/");
  lines.push("out/");
  lines.push("coverage/");
  lines.push("");
  lines.push("# Env");
  lines.push(".env");
  lines.push(".env.*");

  const langs = config.languages || [];
  if (langs.includes("python")) {
    lines.push("");
    lines.push("# Python");
    lines.push("__pycache__/");
    lines.push("*.py[cod]");
    lines.push(".venv/");
    lines.push("env/");
  }
  if (langs.includes("go")) {
    lines.push("");
    lines.push("# Go");
    lines.push("bin/");
    lines.push("*.test");
  }

  return lines.join("\n");
}

function generateDockerignore(config: WizardConfig): string {
  if (config.staticFiles?.dockerignoreCustom?.trim()) {
    return config.staticFiles.dockerignoreCustom.trim();
  }
  return `.git
node_modules
dist
.next
.env
*.log
coverage
`;
}

// License type display names
const LICENSE_NAMES: Record<string, string> = {
  mit: "MIT",
  apache: "Apache 2.0",
  gpl3: "GPL v3",
  bsd2: "BSD 2-Clause",
  bsd3: "BSD 3-Clause",
  isc: "ISC",
  unlicense: "Unlicense",
  proprietary: "Proprietary",
};

// Generate embedded static files section for AI config
// Only embeds files with USER-PROVIDED custom content; otherwise gives instructions
function generateEmbeddedStaticFiles(config: WizardConfig, user: UserProfile, blueprintMode: boolean = false): string {
  const bp = blueprintMode;
  const instructions: string[] = [];
  const customFiles: string[] = [];
  
  // Editorconfig - only if explicitly enabled AND has custom content
  if (config.staticFiles?.editorconfig) {
    if (config.staticFiles.editorconfigCustom?.trim()) {
      customFiles.push(`### .editorconfig
\`\`\`
${config.staticFiles.editorconfigCustom.trim()}
\`\`\``);
    } else {
      instructions.push("- **`.editorconfig`**: Generate with standard settings for consistent code formatting across editors (indent style, line endings, trim trailing whitespace).");
    }
  }
  
  // Contributing - only if enabled
  if (config.staticFiles?.contributing) {
    if (config.staticFiles.contributingCustom?.trim()) {
      customFiles.push(`### CONTRIBUTING.md
\`\`\`markdown
${config.staticFiles.contributingCustom.trim()}
\`\`\``);
    } else {
      instructions.push("- **`CONTRIBUTING.md`**: Generate with contribution guidelines including how to submit issues, pull requests, coding standards, and development setup.");
    }
  }
  
  // Code of Conduct - only if enabled
  if (config.staticFiles?.codeOfConduct) {
    if (config.staticFiles.codeOfConductCustom?.trim()) {
      customFiles.push(`### CODE_OF_CONDUCT.md
\`\`\`markdown
${config.staticFiles.codeOfConductCustom.trim()}
\`\`\``);
    } else {
      instructions.push("- **`CODE_OF_CONDUCT.md`**: Generate based on the Contributor Covenant or similar community standards document.");
    }
  }
  
  // Security - only if enabled
  if (config.staticFiles?.security) {
    if (config.staticFiles.securityCustom?.trim()) {
      customFiles.push(`### SECURITY.md
\`\`\`markdown
${config.staticFiles.securityCustom.trim()}
\`\`\``);
    } else {
      instructions.push("- **`SECURITY.md`**: Generate with security policy, supported versions, and instructions for reporting vulnerabilities privately.");
    }
  }
  
  // Gitignore - describe what to use rather than embed full content
  if (config.staticFiles?.gitignoreMode === "custom" && config.staticFiles.gitignoreCustom?.trim()) {
    customFiles.push(`### .gitignore
\`\`\`
${config.staticFiles.gitignoreCustom.trim()}
\`\`\``);
  } else if (config.staticFiles?.gitignoreMode === "generate") {
    const langs = config.languages || [];
    const frameworks = config.frameworks || [];
    if (config.letAiDecide && langs.length === 0 && frameworks.length === 0) {
      instructions.push("- **`.gitignore`**: Generate based on detected project languages and frameworks. Include IDE files, build artifacts, dependencies, and environment files.");
    } else if (langs.length > 0 || frameworks.length > 0) {
      const techs = [...langs, ...frameworks].map(t => t.startsWith("custom:") ? t.replace("custom:", "") : t);
      instructions.push(`- **\`.gitignore\`**: Generate for ${techs.join(", ")}. Include IDE files, build artifacts, dependencies, and environment files.`);
    }
  }
  
  // Dockerignore
  if (config.staticFiles?.dockerignoreMode && config.staticFiles.dockerignoreMode !== "skip") {
    if (config.staticFiles.dockerignoreMode === "custom" && config.staticFiles.dockerignoreCustom?.trim()) {
      customFiles.push(`### .dockerignore
\`\`\`
${config.staticFiles.dockerignoreCustom.trim()}
\`\`\``);
    } else {
      // "generate" mode or custom without content
      const langs = config.languages || [];
      const frameworks = config.frameworks || [];
      if (config.letAiDecide && langs.length === 0 && frameworks.length === 0) {
        instructions.push("- **`.dockerignore`**: Generate based on detected project languages. Exclude .git, node_modules, .env files, build artifacts, and documentation to keep images small.");
      } else if (langs.length > 0 || frameworks.length > 0) {
        const techs = [...langs, ...frameworks].map(t => t.startsWith("custom:") ? t.replace("custom:", "") : t);
        instructions.push(`- **\`.dockerignore\`**: Generate for ${techs.join(", ")}. Exclude .git, dependencies, .env files, build artifacts, and documentation to keep images small.`);
      } else {
        instructions.push("- **`.dockerignore`**: Generate excluding .git, node_modules, .env files, build artifacts, and non-essential files to keep container images small.");
      }
    }
  }
  
  // Funding
  if (config.funding || config.staticFiles?.funding) {
    const fundingContent = config.fundingYml?.trim() || config.staticFiles?.fundingYml?.trim();
    if (fundingContent) {
      customFiles.push(`### .github/FUNDING.yml
\`\`\`yaml
${fundingContent}
\`\`\``);
    } else {
      instructions.push("- **`.github/FUNDING.yml`**: Generate template with common sponsorship platforms (GitHub Sponsors, Ko-fi, Patreon, etc.).");
    }
  }
  
  // Roadmap - only if enabled
  if (config.staticFiles?.roadmap) {
    if (config.staticFiles.roadmapCustom?.trim()) {
      customFiles.push(`### ROADMAP.md
\`\`\`markdown
${config.staticFiles.roadmapCustom.trim()}
\`\`\``);
    } else {
      instructions.push("- **`ROADMAP.md`**: Create and maintain with planned features, milestones, and future ideas. Organize by timeline (Q1, Q2, etc.) or priority. Keep updated as the project evolves.");
    }
  }
  
  // License - improved text with optional notes
  if (config.license && config.license !== "none") {
    // Get license name, using licenseOther for custom licenses
    const licenseName = config.license === "other" 
      ? (config.licenseOther || "a custom license")
      : (LICENSE_NAMES[config.license] || config.license);
    const author = user.displayName || user.name || "the project author";
    const licenseNameVar = bpVar(bp, "LICENSE_TYPE", licenseName);
    const authorVar = bpVar(bp, "AUTHOR_NAME", author);
    let licenseInstruction = `- This repository uses the **${licenseNameVar}** license. If the \`LICENSE\` file doesn't exist yet, please create it with copyright holder: ${authorVar}.`;
    if (config.licenseNotes?.trim()) {
      const notesVar = bpVar(bp, "LICENSE_NOTES", config.licenseNotes.trim());
      licenseInstruction += ` Additional licensing notes: ${notesVar}`;
    }
    instructions.push(licenseInstruction);
  }
  
  if (instructions.length === 0 && customFiles.length === 0) return "";
  
  const parts: string[] = [];
  
  if (instructions.length > 0) {
    parts.push(`## Repository Files to Generate

When requested or when missing, create these files following these guidelines:

${instructions.join("\n")}`);
  }
  
  if (customFiles.length > 0) {
    parts.push(`## Custom File Templates

Create these files with the exact content provided below. These are user-specified templates:

${customFiles.join("\n\n")}`);
  }
  
  return "\n" + parts.join("\n\n") + "\n";
}

// Type for generated file
export interface GeneratedFile {
  fileName: string;
  content: string;
  platform?: string;
}

// Generate API sync header for files with auto-update enabled
// devOS: linux, macos, windows, wsl - can be array for multi-platform
function generateApiSyncHeader(blueprintId: string, platform: string, devOS: string | string[] = "linux"): string {
  const lines: string[] = [];
  const fileName = getFileName(platform);
  
  // Normalize devOS to array
  const osList = Array.isArray(devOS) ? devOS : [devOS];
  const hasWindows = osList.includes("windows");
  const hasUnix = osList.includes("linux") || osList.includes("macos") || osList.includes("wsl");
  const isMultiPlatform = (hasWindows && hasUnix) || osList.length > 1;
  
  // Add comment style based on platform
  const isJsonPlatform = ["continue", "cody", "supermaven", "codegpt", "void"].includes(platform);
  const isYamlPlatform = ["aider", "tabnine"].includes(platform);
  
  if (isJsonPlatform) {
    // JSON files - add as a _sync property at the top level
    return ""; // JSON platforms will handle this differently
  }
  
  // Generate OS-specific curl command
  let curlCommand = "";
  if (isMultiPlatform) {
    // Show both Unix and Windows commands
    curlCommand = `# Linux/macOS:
curl -X PUT https://lynxprompt.com/api/v1/blueprints/${blueprintId} \\
  -H "Authorization: Bearer $LYNXPROMPT_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d "{\\"content\\": $(cat ${fileName} | jq -Rs .)}"

# Windows PowerShell:
$c = Get-Content "${fileName}" -Raw; Invoke-RestMethod -Uri "https://lynxprompt.com/api/v1/blueprints/${blueprintId}" -Method PUT -Headers @{ Authorization = "Bearer $env:LYNXPROMPT_API_TOKEN" } -Body (@{ content = $c } | ConvertTo-Json)`;
  } else if (osList.includes("windows")) {
    // PowerShell for Windows
    curlCommand = `$content = (Get-Content "${fileName}" -Raw) -replace '"', '\\"'
Invoke-RestMethod -Uri "https://lynxprompt.com/api/v1/blueprints/${blueprintId}" \`
  -Method PUT -Headers @{ "Authorization" = "Bearer $env:LYNXPROMPT_API_TOKEN" } \`
  -Body (@{ content = $content } | ConvertTo-Json)`;
  } else {
    // Linux, macOS, WSL - bash-style
    curlCommand = `curl -X PUT https://lynxprompt.com/api/v1/blueprints/${blueprintId} \\
  -H "Authorization: Bearer $LYNXPROMPT_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d "{\\"content\\": $(cat ${fileName} | jq -Rs .)}"`;
  }
  
  if (isYamlPlatform) {
    lines.push("# ══════════════════════════════════════════════════════════════════");
    lines.push("# LynxPrompt API Sync");
    lines.push(`# Blueprint ID: ${blueprintId}`);
    lines.push("#");
    lines.push("# To update this file on LynxPrompt:");
    curlCommand.split("\n").forEach(line => lines.push(`# ${line}`));
    lines.push("#");
    lines.push("# Docs: https://lynxprompt.com/docs/api");
    lines.push("# ══════════════════════════════════════════════════════════════════");
    lines.push("");
  } else {
    // Markdown-based platforms (cursor, claude, copilot, windsurf, universal)
    lines.push("<!--");
    lines.push("══════════════════════════════════════════════════════════════════");
    lines.push("LynxPrompt API Sync");
    lines.push(`Blueprint ID: ${blueprintId}`);
    lines.push("");
    lines.push("To update this file on LynxPrompt:");
    lines.push(curlCommand);
    lines.push("");
    lines.push("Docs: https://lynxprompt.com/docs/api");
    lines.push("══════════════════════════════════════════════════════════════════");
    lines.push("-->");
    lines.push("");
  }
  
  return lines.join("\n");
}

// Helper to get file name for a platform
function getFileName(platform: string): string {
  return PLATFORM_FILES[platform] || "ai-config.md";
}

// Options for file generation
export interface GenerateFilesOptions {
  blueprintId?: string; // If provided, adds API sync header to the file
}

// Generate all files as an array (for preview) - now returns single AI config file with embedded static files
export function generateAllFiles(
  config: WizardConfig,
  user: UserProfile,
  options?: GenerateFilesOptions
): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  // Generate only the single platform-specific AI config file (static files are embedded)
  const platform = config.platform || "cursor";
  const fileName = PLATFORM_FILES[platform];
  if (!fileName) return files;

  let content = "";
  switch (platform) {
    case "universal":
      content = generateAgentsMd(config, user);
      break;
    case "cursor":
      content = generateCursorRules(config, user);
      break;
    case "claude":
      content = generateClaudeMd(config, user);
      break;
    case "copilot":
      content = generateCopilotInstructions(config, user);
      break;
    case "windsurf":
      content = generateWindsurfRules(config, user);
      break;
    case "antigravity":
      content = generateGeminiMd(config, user);
      break;
    case "aider":
      content = generateAiderConfig(config, user);
      break;
    case "continue":
      content = generateContinueConfig(config, user);
      break;
    case "cody":
      content = generateCodyConfig(config, user);
      break;
    case "tabnine":
      content = generateTabnineConfig(config, user);
      break;
    case "supermaven":
      content = generateSupermavenConfig(config, user);
      break;
    case "codegpt":
      content = generateCodeGPTConfig(config, user);
      break;
    case "void":
      content = generateVoidConfig(config, user);
      break;
  }

  // Add API sync header if blueprintId is provided and enableAutoUpdate is true
  if (content && options?.blueprintId && config.enableAutoUpdate) {
    const syncHeader = generateApiSyncHeader(options.blueprintId, platform, config.devOS || "linux");
    if (syncHeader) {
      content = syncHeader + content;
    }
  }

  if (content) {
    files.push({ fileName, content, platform });
  }

  return files;
}

// Main function to generate single config file
export async function generateConfigFiles(
  config: WizardConfig,
  user: UserProfile
): Promise<Blob> {
  const files = generateAllFiles(config, user);
  if (files.length === 0) {
    return new Blob([""], { type: "text/plain" });
  }
  // Return single file as text blob
  return new Blob([files[0].content], { type: "text/plain" });
}

// Trigger download - now downloads single file
export function downloadZip(blob: Blob, projectName: string) {
  const files = arguments[2] as GeneratedFile[] | undefined;
  const fileName = files?.[0]?.fileName || "ai-config.md";
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Download with filename from files array
export function downloadConfigFile(blob: Blob, files: GeneratedFile[]) {
  const fileName = files[0]?.fileName || "ai-config.md";
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

