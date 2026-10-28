// File generation for the web wizard. The rules content comes from the
// generator in packages/shared, which the CLI uses too; this module adds the
// app's name and URL, the template variable helpers, and the browser downloads.
import JSZip from "jszip";
import { APP_NAME, APP_URL } from "@/lib/feature-flags";
import { adaptRulesContent } from "../../packages/shared/src/rules-format";
import {
  generateAllFiles as generateSharedFiles,
  generatePlatformFiles as generateSharedPlatformFiles,
  type GeneratedFile,
  type GenerateFilesOptions,
  type GeneratorConfig,
  type GeneratorUser,
} from "../../packages/shared/src/generator";

export type { GeneratedFile, GenerateFilesOptions, GeneratorConfig, GeneratorUser };

const brand = () => ({ appName: APP_NAME, appUrl: APP_URL });

// ============================================================================
// TEMPLATE VARIABLES SYSTEM
// Delimiter: [[variable_name]] or [[variable_name|default_value]]
// Chosen to avoid conflicts with {{}} templates (Vue, Angular, Handlebars, etc.)
// ============================================================================

// Regular expression to detect template variables with optional defaults
// Matches: [[VAR_NAME]] or [[VAR_NAME|default value]]
// A default may contain "]" (a value like "items[0]"): it runs to the first
// "]]" that is not followed by another "]", and never across another "[[".
const VARIABLE_DEFAULT = String.raw`((?:(?!\[\[)[\s\S])*?)\]\](?!\])`;
export const VARIABLE_PATTERN_SOURCE = String.raw`\[\[([A-Za-z_][A-Za-z0-9_]*)(?:\|${VARIABLE_DEFAULT}|\]\])`;
const VARIABLE_PATTERN = new RegExp(VARIABLE_PATTERN_SOURCE, "g");

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
  const matches = content.match(VARIABLE_PATTERN);
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
  return new RegExp(VARIABLE_PATTERN_SOURCE).test(content);
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
  const patternWithDefault = new RegExp(String.raw`\[\[([A-Za-z_][A-Za-z0-9_]*)\|${VARIABLE_DEFAULT}`, "g");
  
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

// Rule file frontmatter (Cursor, Firebender, Kiro, Augment) lives in
// packages/shared so the CLI's `lynxp convert` re-targets files the same way.
export { adaptRulesContent };

/** The rules file of `config.platform`, branded with this instance's name and URL. */
export function generateAllFiles(
  config: GeneratorConfig,
  user: GeneratorUser,
  options?: GenerateFilesOptions
): GeneratedFile[] {
  return generateSharedFiles(config, user, { brand: brand(), ...options });
}

/**
 * The rule files of several tools from one wizard config, for a .zip
 * download. Tools that read the same file (AGENTS.md) get it once. With
 * `pointers`, CLAUDE.md and GEMINI.md next to AGENTS.md just import it.
 */
export function generatePlatformFiles(
  config: GeneratorConfig,
  user: GeneratorUser,
  platforms: string[],
  { pointers = true }: { pointers?: boolean } = {}
): GeneratedFile[] {
  return generateSharedPlatformFiles(config, user, platforms, { pointers, brand: brand() });
}

/** A .zip of the files at their full paths, so it unpacks into the project as is. */
export async function zipFiles(files: GeneratedFile[]): Promise<Blob> {
  const zip = new JSZip();
  for (const file of files) zip.file(file.fileName, file.content);
  return zip.generateAsync({ type: "blob", mimeType: "application/zip" });
}

/** Save a blob under the given name. */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Main function to generate single config file
export async function generateConfigFiles(
  config: GeneratorConfig,
  user: GeneratorUser
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
  a.download = downloadName(fileName);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Browsers cannot save into a folder, and they mangle a "/" in a download
 * name, so save the last path segment. The UI shows the full path to put it in.
 */
export function downloadName(filePath: string): string {
  return filePath.split("/").filter(Boolean).pop() || "ai-config.md";
}

// Download with filename from files array
export function downloadConfigFile(blob: Blob, files: GeneratedFile[]) {
  const fileName = files[0]?.fileName || "ai-config.md";
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = downloadName(fileName);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
