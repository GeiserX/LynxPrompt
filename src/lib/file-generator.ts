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
  gitignoreMode?: "generate" | "custom" | "skip";
  gitignoreCustom?: string;
  gitignoreSave?: boolean;
  dockerignore?: boolean;
  dockerignoreCustom?: string;
  dockerignoreSave?: boolean;
  license?: string;
  licenseSave?: boolean;
}

interface WizardConfig {
  projectName: string;
  projectDescription: string;
  projectType?: string; // work, leisure, open_source_small, etc.
  devOS?: string; // linux, macos, windows, wsl, multi
  languages: string[];
  frameworks: string[];
  database?: string; // preferred database
  letAiDecide: boolean;
  repoHost: string;
  repoHostOther?: string;
  repoUrl: string;
  exampleRepoUrl?: string;
  isPublic: boolean;
  license: string;
  licenseSave?: boolean;
  funding: boolean;
  fundingYml?: string;
  releaseStrategy?: string;
  customReleaseStrategy?: string;
  cicd: string[];
  dependabot?: boolean;
  conventionalCommits?: boolean;
  semver?: boolean;
  containerRegistry?: string;
  customRegistry?: string;
  deploymentTarget?: string[];
  buildContainer?: boolean;
  aiBehaviorRules: string[];
  enableAutoUpdate?: boolean;
  includePersonalData?: boolean;
  platform?: string;
  platforms?: string[];
  additionalFeedback: string;
  commands?: CommandsConfig;
  boundaries?: BoundariesConfig;
  codeStyle?: CodeStyleConfig;
  testingStrategy?: TestingStrategyConfig;
  staticFiles?: StaticFilesConfig;
  saveAllPreferences?: boolean;
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

// ============================================================================
// TEMPLATE VARIABLES SYSTEM
// Delimiter: [[variable_name]] - Chosen to avoid conflicts with {{}} templates
// ============================================================================

// Regular expression to detect template variables (accepts both uppercase and lowercase)
const VARIABLE_PATTERN = /\[\[([A-Za-z_][A-Za-z0-9_]*)\]\]/g;

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
 * Detect all template variables in content
 * Variables use [[VARIABLE_NAME]] format
 * All variable names are normalized to UPPERCASE internally
 * So [[myVar]], [[MYVAR]], [[MyVar]] are all treated as [[MYVAR]]
 */
export function detectVariables(content: string): string[] {
  const matches = content.match(VARIABLE_PATTERN);
  if (!matches) return [];
  
  // Extract unique variable names (without brackets), normalized to UPPERCASE
  const variables = new Set<string>();
  for (const match of matches) {
    const varName = match.replace(/\[\[|\]\]/g, "").toUpperCase();
    variables.add(varName);
  }
  
  return Array.from(variables);
}

/**
 * Replace variables in content with provided values
 * Matches are case-insensitive: [[var]], [[VAR]], [[Var]] all work
 * Values are looked up by UPPERCASE key
 */
export function replaceVariables(
  content: string, 
  values: Record<string, string>
): string {
  return content.replace(VARIABLE_PATTERN, (match, varName) => {
    const upperVarName = varName.toUpperCase();
    return values[upperVarName] !== undefined ? values[upperVarName] : match;
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
  return VARIABLE_PATTERN.test(content);
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

  // MDC frontmatter
  lines.push("---");
  lines.push(`description: AI rules for ${config.projectName || "this project"}`);
  lines.push("alwaysApply: true");
  lines.push("---");
  lines.push("");
  lines.push(`# ${config.projectName || "Project"} - AI Rules`);
  lines.push("");
  lines.push("## Project Context");
  lines.push(`This is ${config.projectDescription || "a software project"}.`);
  if (config.devOS) {
    const osNames: Record<string, string> = {
      linux: "Linux",
      macos: "macOS",
      windows: "Windows",
      wsl: "Windows with WSL (Windows Subsystem for Linux)",
      multi: "Multi-platform (use cross-platform compatible commands)"
    };
    lines.push(`**Development Environment**: ${osNames[config.devOS] || config.devOS}`);
    if (config.devOS === "windows") {
      lines.push("- Use PowerShell or CMD compatible commands");
      lines.push("- Use backslashes for file paths or forward slashes for cross-platform compatibility");
    } else if (config.devOS === "wsl") {
      lines.push("- Prefer Linux commands (bash/zsh) but be aware of Windows/Linux path translations");
    } else if (config.devOS === "multi") {
      lines.push("- Use cross-platform commands that work on Windows, macOS, and Linux");
      lines.push("- Prefer npm scripts or Makefile targets over platform-specific commands");
    }
  }
  if (config.repoHost) {
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
    lines.push(`**Repository Host**: ${hostNames[config.repoHost] || config.repoHost}`);
  }
  if (config.exampleRepoUrl) {
    lines.push("");
    lines.push(`**Reference Repository**: ${config.exampleRepoUrl}`);
    lines.push("Use this repository as a reference for coding patterns, conventions, and architecture decisions.");
  }
  lines.push("");

  if (config.languages.length > 0 || config.frameworks.length > 0 || config.database || config.letAiDecide) {
    lines.push("## Tech Stack");
    if (config.languages.length > 0) {
      const langs = config.languages.map(l => l.startsWith("custom:") ? l.replace("custom:", "") : l);
      lines.push(`- Languages: ${langs.join(", ")}`);
    }
    if (config.frameworks.length > 0) {
      const fws = config.frameworks.map(f => f.startsWith("custom:") ? f.replace("custom:", "") : f);
      lines.push(`- Frameworks: ${fws.join(", ")}`);
    }
    if (config.database) {
      const db = config.database.startsWith("custom:") ? config.database.replace("custom:", "") : config.database;
      lines.push(`- Database: ${db}`);
    }
    if (config.letAiDecide) {
      if (config.languages.length > 0 || config.frameworks.length > 0) {
        lines.push("- **Note**: For technologies beyond those listed above, feel free to suggest and use what's best suited for the project based on codebase analysis.");
      } else {
        lines.push("- **Note**: Analyze the codebase and determine the appropriate languages and frameworks. You have full flexibility to choose what works best.");
      }
    }
    lines.push("");
  }

  lines.push("## Code Style & Preferences");
  // Only include skill-based instructions if includePersonalData is true
  if (config.includePersonalData !== false && user.skillLevel) {
    if (user.skillLevel === "novice" || user.skillLevel === "beginner") {
      lines.push("- Be verbose with explanations and comments");
      lines.push("- Explain concepts as you implement them");
      lines.push("- Ask clarifying questions when unsure");
    } else if (user.skillLevel === "intermediate") {
      lines.push("- Provide balanced explanations");
      lines.push("- Focus on important decisions and trade-offs");
    } else {
      lines.push("- Be concise and direct");
      lines.push("- Assume expertise, minimal hand-holding");
      lines.push("- Focus on implementation, skip basics");
    }
    if (user.persona) {
      lines.push(`- Developer context: ${user.persona.replace(/_/g, " ")}`);
    }
    lines.push(`- Skill level: ${user.skillLevel.charAt(0).toUpperCase() + user.skillLevel.slice(1)}`);
  }
  if (config.codeStyle?.naming) {
    lines.push(`- Naming: ${config.codeStyle.naming}`);
  }
  if (config.codeStyle?.notes) {
    lines.push(`- Style notes: ${config.codeStyle.notes}`);
  }
  lines.push("");

  if (config.aiBehaviorRules.length > 0) {
    lines.push("## AI Behavior Rules");
    config.aiBehaviorRules.forEach((rule) => {
      const ruleText = getRuleDescription(rule);
      if (ruleText) lines.push(`- ${ruleText}`);
    });
    lines.push("");
  }

  // Only include Boundaries section if user actually specified boundaries AND has Max tier access
  const hasBoundaries = config.boundaries && (
    (config.boundaries.always?.length ?? 0) > 0 ||
    (config.boundaries.ask?.length ?? 0) > 0 ||
    (config.boundaries.never?.length ?? 0) > 0
  );
  if (hasBoundaries && canAccessFeature(user.tier, "advanced")) {
    lines.push("## Boundaries");
    if (config.boundaries!.always?.length) {
      lines.push("- Always do:");
      config.boundaries!.always.forEach(item => lines.push(`  - ${item}`));
    }
    if (config.boundaries!.ask?.length) {
      lines.push("- Ask first:");
      config.boundaries!.ask.forEach(item => lines.push(`  - ${item}`));
    }
    if (config.boundaries!.never?.length) {
      lines.push("- Never do:");
      config.boundaries!.never.forEach(item => lines.push(`  - ${item}`));
    }
    lines.push("");
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
    lines.push("## Commands");
    if (config.commands!.build) lines.push(`- Build: ${config.commands!.build}`);
    if (config.commands!.test) lines.push(`- Test: ${config.commands!.test}`);
    if (config.commands!.lint) lines.push(`- Lint: ${config.commands!.lint}`);
    if (config.commands!.dev) lines.push(`- Dev: ${config.commands!.dev}`);
    if (config.commands!.additional?.length) {
      lines.push("- Other commands:");
      config.commands!.additional.forEach(cmd => lines.push(`  - ${cmd}`));
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
    lines.push("## Testing Strategy");
    if (config.testingStrategy!.levels?.length) lines.push(`- Levels: ${config.testingStrategy!.levels.join(", ")}`);
    if (config.testingStrategy!.frameworks?.length) lines.push(`- Frameworks: ${config.testingStrategy!.frameworks.join(", ")}`);
    if (config.testingStrategy!.coverage !== undefined) lines.push(`- Coverage target: ${config.testingStrategy!.coverage}%`);
    if (config.testingStrategy!.notes) lines.push(`- Notes: ${config.testingStrategy!.notes}`);
    lines.push("");
  }

  if (config.additionalFeedback) {
    lines.push("## Additional Instructions");
    lines.push(config.additionalFeedback);
    lines.push("");
  }

  // Project type specific instructions
  if (config.projectType && PROJECT_TYPE_INSTRUCTIONS[config.projectType]) {
    lines.push("## Project Context & AI Behavior");
    PROJECT_TYPE_INSTRUCTIONS[config.projectType].forEach((instruction) => {
      lines.push(`- ${instruction}`);
    });
    lines.push("");
  }

  lines.push("## Best Practices");
  lines.push("- Follow existing code patterns in the repository");
  lines.push("- Write clean, maintainable code");
  lines.push("- Add appropriate error handling");
  lines.push("- Consider security implications");
  if (config.conventionalCommits) {
    lines.push("- Use conventional commit messages (feat:, fix:, docs:, etc.)");
  }
  if (config.semver) {
    lines.push("- Follow semantic versioning (MAJOR.MINOR.PATCH)");
  }
  if (config.dependabot) {
    lines.push("- Enable automated dependency updates (Dependabot/GitLab equivalent).");
  }

  // Only include Static Files summary if user explicitly enabled any AND has Max tier access
  const hasStaticFiles = config.staticFiles && (
    config.staticFiles.editorconfig ||
    config.staticFiles.contributing ||
    config.staticFiles.codeOfConduct ||
    config.staticFiles.security ||
    (config.staticFiles.gitignoreMode && config.staticFiles.gitignoreMode !== "skip") ||
    config.staticFiles.dockerignore ||
    config.funding
  );
  if (hasStaticFiles && canAccessFeature(user.tier, "advanced")) {
    lines.push("");
    lines.push("## Static Files");
    lines.push("Ensure static repo helpers are generated as requested:");
    if (config.staticFiles!.editorconfig) lines.push("- Include .editorconfig aligned with project style.");
    if (config.staticFiles!.contributing) lines.push("- Include CONTRIBUTING.md with contribution guidelines.");
    if (config.staticFiles!.codeOfConduct) lines.push("- Include CODE_OF_CONDUCT.md.");
    if (config.staticFiles!.security) lines.push("- Include SECURITY.md with reporting instructions.");
    if (config.staticFiles!.gitignoreMode && config.staticFiles!.gitignoreMode !== "skip") lines.push("- Add project-specific .gitignore.");
    if (config.buildContainer || config.staticFiles!.dockerignore) lines.push("- Add .dockerignore for container builds.");
    if (config.funding) lines.push("- Add .github/FUNDING.yml when applicable.");
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
    const staticFilesSection = generateEmbeddedStaticFiles(config, user);
    if (staticFilesSection) {
      lines.push(staticFilesSection);
    }
  }

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

// Generate Universal AGENTS.md - works with any AI IDE
function generateAgentsMd(config: WizardConfig, user: UserProfile): string {
  const lines: string[] = [];

  lines.push(`# ${config.projectName || "Project"} - AI Agent Instructions`);
  lines.push("");
  lines.push("> **Universal AI Configuration** - Compatible with Cursor, Claude Code, GitHub Copilot, and other AI IDEs.");
  lines.push("");
  lines.push("## Overview");
  lines.push(config.projectDescription || "A software project.");
  
  if (config.devOS) {
    const osNames: Record<string, string> = {
      linux: "Linux",
      macos: "macOS",
      windows: "Windows",
      wsl: "Windows with WSL",
      multi: "Multi-platform"
    };
    lines.push(`**Development Environment**: ${osNames[config.devOS] || config.devOS}`);
  }
  if (config.repoHost) {
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
    lines.push(`**Repository Host**: ${hostNames[config.repoHost] || config.repoHost}`);
  }
  lines.push("");

  if (config.languages.length > 0 || config.frameworks.length > 0 || config.database || config.letAiDecide) {
    lines.push("## Technology Stack");
    lines.push("");
    if (config.languages.length > 0) {
      lines.push("### Languages");
      config.languages.forEach((lang) => {
        const cleanLang = lang.startsWith("custom:") ? lang.replace("custom:", "") : lang;
        lines.push(`- ${cleanLang}`);
      });
      lines.push("");
    }
    if (config.frameworks.length > 0) {
      lines.push("### Frameworks & Libraries");
      config.frameworks.forEach((fw) => {
        const cleanFw = fw.startsWith("custom:") ? fw.replace("custom:", "") : fw;
        lines.push(`- ${cleanFw}`);
      });
      lines.push("");
    }
    if (config.database) {
      const db = config.database.startsWith("custom:") ? config.database.replace("custom:", "") : config.database;
      lines.push("### Database");
      lines.push(`- ${db}`);
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
    if (config.commands.build) lines.push(`- Build: \`${config.commands.build}\``);
    if (config.commands.test) lines.push(`- Test: \`${config.commands.test}\``);
    if (config.commands.lint) lines.push(`- Lint: \`${config.commands.lint}\``);
    if (config.commands.dev) lines.push(`- Dev: \`${config.commands.dev}\``);
    if (config.commands.additional?.length) {
      config.commands.additional.forEach(cmd => lines.push(`- \`${cmd}\``));
    }
    lines.push("");
  }

  // Code Style - requires Pro tier
  if ((config.codeStyle?.naming || config.codeStyle?.notes) && canAccessFeature(user.tier, "intermediate")) {
    lines.push("### Code Style");
    if (config.codeStyle.naming) lines.push(`- Naming convention: ${config.codeStyle.naming}`);
    if (config.codeStyle.notes) lines.push(`- ${config.codeStyle.notes}`);
    lines.push("");
  }

  // Boundaries - requires Max tier
  const hasBoundariesAgents = config.boundaries && (
    (config.boundaries.always?.length ?? 0) > 0 ||
    (config.boundaries.ask?.length ?? 0) > 0 ||
    (config.boundaries.never?.length ?? 0) > 0
  );
  if (hasBoundariesAgents && canAccessFeature(user.tier, "advanced")) {
    lines.push("### Boundaries");
    if (config.boundaries!.always?.length) lines.push(`- ✅ Always: ${config.boundaries!.always.join(", ")}`);
    if (config.boundaries!.ask?.length) lines.push(`- ❓ Ask first: ${config.boundaries!.ask.join(", ")}`);
    if (config.boundaries!.never?.length) lines.push(`- 🚫 Never: ${config.boundaries!.never.join(", ")}`);
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
    lines.push("### Testing Strategy");
    if (config.testingStrategy!.levels?.length) lines.push(`- Test levels: ${config.testingStrategy!.levels.join(", ")}`);
    if (config.testingStrategy!.frameworks?.length) lines.push(`- Frameworks: ${config.testingStrategy!.frameworks.join(", ")}`);
    if (config.testingStrategy!.coverage !== undefined) lines.push(`- Coverage target: ${config.testingStrategy!.coverage}%`);
    if (config.testingStrategy!.notes) lines.push(`- ${config.testingStrategy!.notes}`);
    lines.push("");
  }

  if (config.cicd.length > 0) {
    lines.push("### CI/CD & Deployment");
    lines.push(`- CI/CD: ${config.cicd.join(", ")}`);
    if (config.deploymentTarget && config.deploymentTarget.length > 0) {
      lines.push(`- Targets: ${config.deploymentTarget.join(", ")}`);
    }
    lines.push("");
  }

  if (config.additionalFeedback) {
    lines.push("## Additional Notes");
    lines.push(config.additionalFeedback);
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
    const staticFilesSection = generateEmbeddedStaticFiles(config, user);
    if (staticFilesSection) {
      lines.push(staticFilesSection);
    }
  }

  return lines.join("\n");
}

// Generate Aider config (.aider.conf.yml)
function generateAiderConfig(config: WizardConfig, user: UserProfile): string {
  const lines: string[] = [];
  lines.push("# Aider AI Pair Programming Configuration");
  lines.push("# See: https://aider.chat/docs/config.html");
  lines.push("");
  lines.push("# Auto-commit changes");
  lines.push("auto-commits: true");
  lines.push("");
  lines.push("# Include project context");
  if (config.projectDescription) {
    lines.push(`# Project: ${config.projectDescription}`);
  }
  lines.push("");
  lines.push("# Coding guidelines (add as conventions file)");
  lines.push("# Create .aider/conventions.md with:");
  lines.push("#");
  if (config.codeStyle?.naming) {
    lines.push(`#   - Naming: ${config.codeStyle.naming}`);
  }
  if (config.aiBehaviorRules.length > 0) {
    lines.push("#   - Rules:");
    config.aiBehaviorRules.forEach((rule) => {
      const ruleText = getRuleDescription(rule);
      if (ruleText) lines.push(`#     - ${ruleText}`);
    });
  }
  lines.push("");
  lines.push("# Map repository files to help Aider understand structure");
  lines.push("map-tokens: 1024");
  
  return lines.join("\n");
}

// Generate Continue config (.continue/config.json)
function generateContinueConfig(config: WizardConfig, user: UserProfile): string {
  const continueConfig = {
    models: [],
    customCommands: [] as Array<{ name: string; prompt: string }>,
    systemMessage: `You are an AI assistant helping with ${config.projectName || "this project"}. ${config.projectDescription || ""}\n\nGuidelines:\n${config.aiBehaviorRules.map(r => `- ${getRuleDescription(r)}`).join("\n")}`,
    contextProviders: [
      { name: "code", params: {} },
      { name: "docs", params: {} }
    ]
  };
  
  if (config.commands?.test) {
    continueConfig.customCommands.push({
      name: "test",
      prompt: `Run the test command: ${config.commands.test}`
    });
  }
  if (config.commands?.build) {
    continueConfig.customCommands.push({
      name: "build",
      prompt: `Run the build command: ${config.commands.build}`
    });
  }
  
  return JSON.stringify(continueConfig, null, 2);
}

// Generate Cody config (.cody/config.json)
function generateCodyConfig(config: WizardConfig, user: UserProfile): string {
  const codyConfig = {
    chat: {
      preInstruction: `Project: ${config.projectName || "Software Project"}\n${config.projectDescription || ""}\n\nFollow these guidelines:\n${config.aiBehaviorRules.map(r => `- ${getRuleDescription(r)}`).join("\n")}`,
    },
    autocomplete: {
      enabled: true
    },
    codeActions: {
      enabled: true
    }
  };
  
  return JSON.stringify(codyConfig, null, 2);
}

// Generate TabNine config (.tabnine.yaml)
function generateTabnineConfig(config: WizardConfig): string {
  const lines: string[] = [];
  lines.push("# TabNine Configuration");
  lines.push("# See: https://www.tabnine.com/");
  lines.push("");
  lines.push("version: 1");
  lines.push("");
  lines.push("# Enable/disable features");
  lines.push("enable_telemetry: false");
  lines.push("");
  lines.push("# Language preferences");
  if (config.languages.length > 0) {
    lines.push("languages:");
    config.languages.forEach(lang => {
      const cleanLang = lang.startsWith("custom:") ? lang.replace("custom:", "") : lang;
      lines.push(`  - ${cleanLang.toLowerCase()}`);
    });
  }
  lines.push("");
  lines.push("# Project context");
  lines.push(`# ${config.projectDescription || "Software project"}`);
  
  return lines.join("\n");
}

// Generate Supermaven config (.supermaven/config.json)
function generateSupermavenConfig(config: WizardConfig, user: UserProfile): string {
  const supermavenConfig = {
    project: config.projectName || "project",
    description: config.projectDescription || "",
    guidelines: config.aiBehaviorRules.map(r => getRuleDescription(r)),
    codeStyle: {
      naming: config.codeStyle?.naming || "camelCase",
      notes: config.codeStyle?.notes || ""
    }
  };
  
  return JSON.stringify(supermavenConfig, null, 2);
}

// Generate CodeGPT config (.codegpt/config.json)
function generateCodeGPTConfig(config: WizardConfig, user: UserProfile): string {
  const codegptConfig = {
    version: "1.0",
    project: {
      name: config.projectName || "Project",
      description: config.projectDescription || ""
    },
    assistant: {
      systemPrompt: `You are helping with ${config.projectName || "a software project"}. ${config.projectDescription || ""}\n\nGuidelines:\n${config.aiBehaviorRules.map(r => `- ${getRuleDescription(r)}`).join("\n")}`,
      codeStyle: config.codeStyle?.naming || "camelCase"
    },
    commands: {
      build: config.commands?.build || "",
      test: config.commands?.test || "",
      lint: config.commands?.lint || ""
    }
  };
  
  return JSON.stringify(codegptConfig, null, 2);
}

// Generate Void config (.void/config.json) - Open source Cursor alternative
function generateVoidConfig(config: WizardConfig, user: UserProfile): string {
  // Void uses similar format to Cursor, generate as JSON with rules
  const voidConfig = {
    version: 1,
    rules: {
      project: config.projectName || "Project",
      description: config.projectDescription || "",
      behavior: config.aiBehaviorRules.map(r => getRuleDescription(r)),
      codeStyle: {
        naming: config.codeStyle?.naming || "camelCase",
        notes: config.codeStyle?.notes || ""
      },
      commands: {
        build: config.commands?.build || "",
        test: config.commands?.test || "",
        lint: config.commands?.lint || "",
        dev: config.commands?.dev || ""
      }
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
function generateEmbeddedStaticFiles(config: WizardConfig, user: UserProfile): string {
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
      instructions.push("- Generate `.editorconfig` with standard settings for the project's languages.");
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
      instructions.push("- Generate `CONTRIBUTING.md` with standard contribution guidelines.");
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
      instructions.push("- Generate `CODE_OF_CONDUCT.md` based on Contributor Covenant or similar.");
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
      instructions.push("- Generate `SECURITY.md` with vulnerability reporting instructions.");
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
      instructions.push("- Generate appropriate `.gitignore` based on detected project languages and frameworks.");
    } else if (langs.length > 0 || frameworks.length > 0) {
      const techs = [...langs, ...frameworks].map(t => t.startsWith("custom:") ? t.replace("custom:", "") : t);
      instructions.push(`- Generate appropriate \`.gitignore\` for: ${techs.join(", ")}.`);
    }
  }
  
  // Dockerignore
  if (config.staticFiles?.dockerignore) {
    if (config.staticFiles.dockerignoreCustom?.trim()) {
      customFiles.push(`### .dockerignore
\`\`\`
${config.staticFiles.dockerignoreCustom.trim()}
\`\`\``);
    } else {
      instructions.push("- Generate `.dockerignore` excluding build artifacts, node_modules, .env files, and other non-essential files.");
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
      instructions.push("- Generate `.github/FUNDING.yml` template for sponsorship links.");
    }
  }
  
  // License - just reference the type, don't embed full text
  if (config.license && config.license !== "none") {
    const licenseName = LICENSE_NAMES[config.license] || config.license;
    const author = user.displayName || user.name || "the project author";
    instructions.push(`- This project uses the **${licenseName}** license. Generate \`LICENSE\` file if not present, with copyright holder: ${author}.`);
  }
  
  if (instructions.length === 0 && customFiles.length === 0) return "";
  
  const parts: string[] = [];
  
  if (instructions.length > 0) {
    parts.push(`## Static Files

Generate the following files if they don't exist:

${instructions.join("\n")}`);
  }
  
  if (customFiles.length > 0) {
    parts.push(`## Custom Static Files

Create these files with the exact content provided:

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

// Generate all files as an array (for preview) - now returns single AI config file with embedded static files
export function generateAllFiles(
  config: WizardConfig,
  user: UserProfile
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
      content = generateTabnineConfig(config);
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

