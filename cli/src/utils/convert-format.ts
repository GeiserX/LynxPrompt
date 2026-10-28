/**
 * Content conversion between AI config formats for 'lynxp convert'.
 * Kept free of CLI dependencies so it can be unit tested.
 */

/** Check if a target is a command type */
export const isCommandTarget = (target: string) => target.includes("-command") || target.includes("-prompt") || target.includes("-workflow");

/** Split a leading YAML frontmatter block (--- ... ---) from the body. */
function splitFrontmatter(content: string): { frontmatter: string | null; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  if (!match) return { frontmatter: null, body: content };
  return { frontmatter: match[1], body: content.slice(match[0].length).replace(/^\s*\n/, "") };
}

export function parseMarkdownConfig(content: string): Record<string, string> {
  const config: Record<string, string> = {};
  
  // Extract sections from markdown
  const sections = content.split(/^##\s+/m);
  
  for (const section of sections) {
    const lines = section.trim().split("\n");
    if (lines.length === 0) continue;
    
    const title = lines[0].toLowerCase().trim();
    const body = lines.slice(1).join("\n").trim();
    
    config[title] = body;
  }
  
  // Keep the whole file. The source frontmatter is split off so a target never gets
  // two frontmatter blocks; a Cursor-style one is reused for .mdc targets.
  config._raw = content;
  const { frontmatter, body } = splitFrontmatter(content);
  config._body = body;
  if (frontmatter !== null) config._frontmatter = frontmatter;
  
  return config;
}

const DEFAULT_MDC_FRONTMATTER = `description: "AI coding rules"
globs: ["**/*"]
alwaysApply: true`;

export function generateTargetContent(config: Record<string, string>, targetPlatform: string): string {
  const rawContent = config._body ?? config._raw ?? "";
  const sourceFrontmatter = config._frontmatter;
  const mdcFrontmatter = sourceFrontmatter && /^(alwaysApply|globs)\s*:/m.test(sourceFrontmatter)
    ? sourceFrontmatter
    : DEFAULT_MDC_FRONTMATTER;
  
  // Commands are all plain markdown - no conversion needed between command types
  // They just go in different directories
  if (isCommandTarget(targetPlatform)) {
    return config._raw || "";
  }
  
  // For simple conversions, adapt the content format
  switch (targetPlatform) {
    case "cursor":
    case "roocode":
    case "kilocode":
    case "firebase":
      // MDC format with frontmatter; the body (and its title) is kept as written
      return `---
${mdcFrontmatter}
---

${rawContent}`;

    case "kiro":
      // Kiro steering: Markdown with an inclusion frontmatter
      return `---
inclusion: always
---

${rawContent}`;

    case "augment":
      // Augment rules: Markdown with a type frontmatter
      return `---
type: always_apply
---

${rawContent}`;

    case "cursor_legacy":
      // Plain text format
      return rawContent
        .replace(/^#\s+/gm, "")
        .replace(/^##\s+/gm, "\n")
        .replace(/^###\s+/gm, "")
        .trim();

    case "windsurf":
    case "cline":
    case "goose":
    case "trae":
      // These read Markdown as is
      return rawContent;

    case "aider":
      // YAML format (simplified)
      return `# Aider configuration
# Converted from AI IDE configuration

lint-cmd: []
auto-test: false
read: []
# AI rules converted below as conventions
conventions:
${rawContent
  .split("\n")
  .filter(line => line.trim() && !line.startsWith("#"))
  .map(line => `  - "${line.trim().replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`)
  .join("\n")}
`;

    case "tabnine":
      // Tabnine YAML format
      return `# Tabnine configuration
# Converted from AI IDE configuration
instructions: |
${rawContent.split("\n").map(line => `  ${line}`).join("\n")}
`;

    case "void":
    case "continue":
    case "cody":
    case "codegpt":
    case "supermaven":
    case "opencode":
    case "firebender":
      // JSON config format
      return JSON.stringify({ instructions: rawContent }, null, 2) + "\n";

    case "copilot":
      // GitHub Copilot markdown format
      return `# GitHub Copilot Instructions\n\n${rawContent}\n`;

    case "agents":
    case "universal":
    case "claude":
    case "codex":
    case "antigravity":
    case "gemini-cli":
    case "zed":
    case "amazonq":
    case "junie":
    case "warp":
    case "openhands":
    case "crush":
    default:
      // Standard markdown format
      return rawContent;
  }
}
