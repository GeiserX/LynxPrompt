/**
 * Agent detection for LynxPrompt
 * Scans the project to detect which AI agents are in use
 */

import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { AGENTS, type AgentDefinition, getAgentDisplayName } from "./agents.js";

export interface DetectedAgent {
  /** Agent definition */
  agent: AgentDefinition;
  /** Files/directories found */
  files: string[];
  /** Whether the files have content (not empty) */
  hasContent: boolean;
  /** Approximate rule/section count */
  ruleCount: number;
}

export interface DetectionResult {
  /** All detected agents with their files */
  detected: DetectedAgent[];
  /** Popular agents that were detected */
  popularDetected: DetectedAgent[];
  /** Agents that could be imported (have content) */
  importable: DetectedAgent[];
  /** Summary for display */
  summary: string;
}

/**
 * Detect all AI coding agents in the project
 * @param cwd - Directory to scan (defaults to process.cwd())
 */
export function detectAgents(cwd: string = process.cwd()): DetectionResult {
  const detected: DetectedAgent[] = [];

  for (const agent of AGENTS) {
    const result = detectAgent(cwd, agent);
    if (result) {
      detected.push(result);
    }
  }

  const popularDetected = detected.filter((d) => d.agent.popular);
  const importable = detected.filter((d) => d.hasContent);

  // Build summary
  let summary: string;
  if (detected.length === 0) {
    summary = "No AI agent configuration files detected";
  } else if (detected.length === 1) {
    summary = `Found ${getAgentDisplayName(detected[0].agent.id)} configuration`;
  } else {
    const names = detected.slice(0, 3).map((d) => d.agent.name);
    const more = detected.length > 3 ? ` +${detected.length - 3} more` : "";
    summary = `Found ${detected.length} agents: ${names.join(", ")}${more}`;
  }

  return { detected, popularDetected, importable, summary };
}

/**
 * Detect a single agent
 */
function detectAgent(cwd: string, agent: AgentDefinition): DetectedAgent | null {
  const files: string[] = [];
  let hasContent = false;
  let ruleCount = 0;

  for (const pattern of agent.patterns) {
    const fullPath = join(cwd, pattern);

    if (!existsSync(fullPath)) {
      continue;
    }

    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      // Scan directory for rule files
      const dirFiles = scanDirectory(fullPath, agent.format);
      if (dirFiles.length > 0) {
        files.push(pattern);
        hasContent = true;
        ruleCount += dirFiles.reduce((sum, f) => sum + f.sections, 0);
      }
    } else if (stats.isFile()) {
      files.push(pattern);
      const content = safeReadFile(fullPath);
      if (content && content.trim().length > 0) {
        hasContent = true;
        ruleCount += countSections(content);
      }
    }
  }

  if (files.length === 0) {
    return null;
  }

  return { agent, files, hasContent, ruleCount };
}

interface ScannedFile {
  path: string;
  sections: number;
}

/**
 * Scan a directory for rule files
 */
function scanDirectory(dirPath: string, format: string): ScannedFile[] {
  const results: ScannedFile[] = [];

  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile()) continue;

      // Check file extension based on format
      const name = entry.name.toLowerCase();
      const isRuleFile =
        (format === "mdc" && name.endsWith(".mdc")) ||
        (format === "markdown" && name.endsWith(".md")) ||
        (format === "json" && name.endsWith(".json")) ||
        (format === "yaml" && (name.endsWith(".yml") || name.endsWith(".yaml")));

      if (!isRuleFile) continue;

      const filePath = join(dirPath, entry.name);
      const content = safeReadFile(filePath);
      if (content && content.trim().length > 0) {
        results.push({
          path: filePath,
          sections: countSections(content),
        });
      }
    }
  } catch {
    // Directory not readable
  }

  return results;
}

/**
 * Count sections/rules in content (by counting markdown headings)
 */
function countSections(content: string): number {
  const headings = content.match(/^#{1,6}\s+.+$/gm);
  return headings ? headings.length : (content.trim().length > 0 ? 1 : 0);
}

/**
 * Safely read a file
 */
function safeReadFile(path: string): string | null {
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return null;
  }
}

/**
 * Get a simple list of detected agent names
 */
export function getDetectedAgentNames(cwd: string = process.cwd()): string[] {
  const result = detectAgents(cwd);
  return result.detected.map((d) => d.agent.id);
}

/**
 * Check if a specific agent is detected
 */
export function isAgentDetected(agentId: string, cwd: string = process.cwd()): boolean {
  const result = detectAgents(cwd);
  return result.detected.some((d) => d.agent.id === agentId);
}

/**
 * Get recommended agents based on detection
 * Returns detected agents, or popular defaults if none detected
 */
export function getRecommendedAgents(cwd: string = process.cwd()): AgentDefinition[] {
  const result = detectAgents(cwd);
  
  if (result.detected.length > 0) {
    return result.detected.map((d) => d.agent);
  }

  // Default to popular agents
  return AGENTS.filter((a) => a.popular).slice(0, 2);
}

/**
 * Format detection results for display
 */
export function formatDetectionResults(result: DetectionResult): string {
  if (result.detected.length === 0) {
    return "No AI agent configuration files found.\n\nRun 'lynxp wizard' to create your first configuration.";
  }

  const lines: string[] = [
    `Found ${result.detected.length} AI agent${result.detected.length === 1 ? "" : "s"}:`,
    "",
  ];

  for (const detected of result.detected) {
    const icon = detected.hasContent ? "✓" : "○";
    const rules = detected.ruleCount > 0 ? ` (${detected.ruleCount} sections)` : "";
    lines.push(`  ${icon} ${detected.agent.name}${rules}`);
    for (const file of detected.files) {
      lines.push(`    └─ ${file}`);
    }
  }

  if (result.importable.length > 0) {
    lines.push("");
    lines.push(`${result.importable.length} can be imported into LynxPrompt.`);
  }

  return lines.join("\n");
}



