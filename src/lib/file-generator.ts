// File generation utilities for the wizard
import JSZip from "jszip";

interface WizardConfig {
  projectName: string;
  projectDescription: string;
  projectType?: string; // work, leisure, open_source_small, etc.
  languages: string[];
  frameworks: string[];
  letAiDecide: boolean;
  repoHost: string;
  repoUrl: string;
  isPublic: boolean;
  license: string;
  funding: boolean;
  fundingUrl: string;
  releaseStrategy: string;
  customReleaseStrategy: string;
  cicd: string[];
  containerRegistry: string;
  customRegistry: string;
  deploymentTarget: string[];
  aiBehaviorRules: string[];
  enableAutoUpdate?: boolean;
  platforms: string[];
  additionalFeedback: string;
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
}

// Platform file names
// These are the PRIMARY platforms, but files work across multiple IDEs
const PLATFORM_FILES: Record<string, string> = {
  cursor: ".cursor/rules/project.mdc", // Cursor's native project rules format
  claude: "CLAUDE.md",
  copilot: ".github/copilot-instructions.md",
  windsurf: ".windsurfrules",
};

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
  lines.push("");

  if (config.languages.length > 0 || config.frameworks.length > 0) {
    lines.push("## Tech Stack");
    if (config.languages.length > 0) {
      lines.push(`- Languages: ${config.languages.join(", ")}`);
    }
    if (config.frameworks.length > 0) {
      lines.push(`- Frameworks: ${config.frameworks.join(", ")}`);
    }
    lines.push("");
  }

  lines.push("## Code Style & Preferences");
  if (user.skillLevel === "novice") {
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
  lines.push("");

  if (config.aiBehaviorRules.length > 0) {
    lines.push("## AI Behavior Rules");
    config.aiBehaviorRules.forEach((rule) => {
      const ruleText = getRuleDescription(rule);
      if (ruleText) lines.push(`- ${ruleText}`);
    });
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

  return lines.join("\n");
}

// Generate CLAUDE.md content
function generateClaudeMd(config: WizardConfig, user: UserProfile): string {
  const lines: string[] = [];

  lines.push(`# ${config.projectName || "Project"} - Claude Code Instructions`);
  lines.push("");
  lines.push("## Overview");
  lines.push(config.projectDescription || "A software project.");
  lines.push("");

  if (config.languages.length > 0 || config.frameworks.length > 0) {
    lines.push("## Technology Stack");
    lines.push("");
    if (config.languages.length > 0) {
      lines.push("### Languages");
      config.languages.forEach((lang) => lines.push(`- ${lang}`));
      lines.push("");
    }
    if (config.frameworks.length > 0) {
      lines.push("### Frameworks & Libraries");
      config.frameworks.forEach((fw) => lines.push(`- ${fw}`));
      lines.push("");
    }
  }

  lines.push("## Development Guidelines");
  lines.push("");
  lines.push("### Communication Style");
  if (user.skillLevel === "novice") {
    lines.push("I'm newer to development. Please explain concepts thoroughly,");
    lines.push(
      "provide detailed comments in code, and walk me through your reasoning."
    );
  } else if (user.skillLevel === "intermediate") {
    lines.push(
      "I have solid experience. Balance explanations with efficiency -"
    );
    lines.push("explain non-obvious decisions but skip the basics.");
  } else {
    lines.push("I'm experienced. Be concise and direct. Skip explanations of");
    lines.push("well-known patterns. Focus on implementation and edge cases.");
  }
  lines.push("");

  if (config.aiBehaviorRules.length > 0) {
    lines.push("### Workflow Rules");
    config.aiBehaviorRules.forEach((rule) => {
      const ruleText = getRuleDescription(rule);
      if (ruleText) lines.push(`- ${ruleText}`);
    });
    lines.push("");
  }

  // Project type specific instructions
  if (config.projectType && PROJECT_TYPE_INSTRUCTIONS[config.projectType]) {
    lines.push("### Project Context");
    PROJECT_TYPE_INSTRUCTIONS[config.projectType].forEach((instruction) => {
      lines.push(`- ${instruction}`);
    });
    lines.push("");
  }

  if (config.cicd.length > 0) {
    lines.push("### CI/CD & Deployment");
    lines.push(`This project uses: ${config.cicd.join(", ")}`);
    if (config.deploymentTarget.length > 0) {
      lines.push(`Deployment targets: ${config.deploymentTarget.join(", ")}`);
    }
    lines.push("");
  }

  if (config.additionalFeedback) {
    lines.push("### Additional Notes");
    lines.push(config.additionalFeedback);
    lines.push("");
  }

  // Auto-update instruction
  if (config.enableAutoUpdate) {
    lines.push("## Self-Improving Configuration");
    lines.push("");
    lines.push("**This file is set to self-improve.** As we work together:");
    lines.push("");
    lines.push("1. Track patterns in how I work and prefer to code");
    lines.push("2. Note any corrections I make to your suggestions");
    lines.push("3. Update this file periodically with what you learn");
    lines.push("4. Add new rules or refine existing ones based on our interactions");
    lines.push("");
    lines.push("This helps future sessions start with better context about my preferences.");
    lines.push("");
  }

  return lines.join("\n");
}

// Generate GitHub Copilot instructions
function generateCopilotInstructions(
  config: WizardConfig,
  user: UserProfile
): string {
  const lines: string[] = [];

  lines.push(
    `# GitHub Copilot Instructions for ${config.projectName || "this project"}`
  );
  lines.push("");
  lines.push("## Context");
  lines.push(config.projectDescription || "A software project.");
  lines.push("");

  if (config.languages.length > 0) {
    lines.push(`**Languages:** ${config.languages.join(", ")}`);
  }
  if (config.frameworks.length > 0) {
    lines.push(`**Frameworks:** ${config.frameworks.join(", ")}`);
  }
  lines.push("");

  lines.push("## Guidelines");
  lines.push("");

  if (user.skillLevel === "novice") {
    lines.push("- Provide detailed code comments");
    lines.push("- Include examples where helpful");
    lines.push("- Explain complex logic");
  } else if (user.skillLevel === "senior") {
    lines.push("- Be concise");
    lines.push("- Skip obvious explanations");
    lines.push("- Focus on clean, efficient code");
  } else {
    lines.push("- Balance between explanation and efficiency");
  }

  lines.push("");
  lines.push("## Code Style");
  lines.push("- Follow existing patterns in the codebase");
  lines.push("- Use meaningful variable and function names");
  lines.push("- Add error handling where appropriate");

  // Project type specific instructions
  if (config.projectType && PROJECT_TYPE_INSTRUCTIONS[config.projectType]) {
    lines.push("");
    lines.push("## Project Context");
    PROJECT_TYPE_INSTRUCTIONS[config.projectType].forEach((instruction) => {
      lines.push(`- ${instruction}`);
    });
  }

  // Auto-update instruction
  if (config.enableAutoUpdate) {
    lines.push("");
    lines.push("## Self-Improving Configuration");
    lines.push("This file should be updated as the project evolves.");
    lines.push("Track coding patterns and preferences, and refine these rules over time.");
  }

  return lines.join("\n");
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
  const lines: string[] = [];
  lines.push("# Funding links");
  lines.push(
    "# See https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/displaying-a-sponsor-button-in-your-repository"
  );
  lines.push("");

  if (config.fundingUrl) {
    if (config.fundingUrl.includes("github.com/sponsors")) {
      const username = config.fundingUrl.split("/").pop();
      lines.push(`github: [${username}]`);
    } else if (config.fundingUrl.includes("patreon.com")) {
      const username = config.fundingUrl.split("/").pop();
      lines.push(`patreon: ${username}`);
    } else if (config.fundingUrl.includes("ko-fi.com")) {
      const username = config.fundingUrl.split("/").pop();
      lines.push(`ko_fi: ${username}`);
    } else {
      lines.push(`custom: ["${config.fundingUrl}"]`);
    }
  } else {
    lines.push("# github: your-username");
    lines.push("# patreon: your-username");
    lines.push("# custom: ['https://your-donation-link.com']");
  }

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
    prefer_simple_solutions:
      "Favor straightforward implementations over complex ones",
    follow_existing_patterns:
      "Match the codebase's existing style and patterns",
    ask_before_large_refactors: "Confirm before making significant changes",
    check_for_security_issues: "Review code for security vulnerabilities",
    document_complex_logic: "Add documentation for complex implementations",
    use_conventional_commits: "Follow conventional commit message format",
  };
  return rules[ruleId] || ruleId;
}

// Type for generated file
export interface GeneratedFile {
  fileName: string;
  content: string;
  platform?: string;
}

// Generate all files as an array (for preview)
export function generateAllFiles(
  config: WizardConfig,
  user: UserProfile
): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  // Generate platform-specific files
  config.platforms.forEach((platform) => {
    const fileName = PLATFORM_FILES[platform];
    if (!fileName) return;

    let content = "";
    switch (platform) {
      case "cursor":
        // Generate Cursor's native .mdc format for .cursor/rules/
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
    }

    if (content) {
      files.push({ fileName, content, platform });
    }
  });

  // Generate LICENSE if selected
  if (config.license && config.license !== "none") {
    const licenseContent = generateLicense(config.license, user);
    if (licenseContent) {
      files.push({ fileName: "LICENSE", content: licenseContent });
    }
  }

  // Generate FUNDING.yml if enabled
  if (config.funding) {
    const fundingContent = generateFunding(config);
    files.push({ fileName: ".github/FUNDING.yml", content: fundingContent });
  }

  return files;
}

// Main function to generate all files and create ZIP
export async function generateConfigFiles(
  config: WizardConfig,
  user: UserProfile
): Promise<Blob> {
  const zip = new JSZip();
  const files = generateAllFiles(config, user);

  files.forEach((file) => {
    zip.file(file.fileName, file.content);
  });

  // Generate the ZIP blob
  return await zip.generateAsync({ type: "blob" });
}

// Trigger download
export function downloadZip(blob: Blob, projectName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${projectName || "config"}-files.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

