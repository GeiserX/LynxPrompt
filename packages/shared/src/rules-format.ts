/**
 * Rule file frontmatter, shared by the web app (wizard output and the
 * blueprint download modal) and the CLI (`lynxp convert`), so re-targeting a
 * rules file to another tool gives the same file everywhere.
 *
 * Tools that read YAML frontmatter on their rule files, and the keys that make
 * the rule apply to every request. Every other platform gets plain Markdown.
 */

// A double-quoted YAML scalar. JSON string syntax is valid YAML, so a value
// with ": ", "#", quotes or newlines cannot break the frontmatter.
function yamlString(value: string): string {
  return JSON.stringify(value);
}

const cursorFrontmatter = (description: string) => [`description: ${yamlString(description)}`, "alwaysApply: true"];

const PLATFORM_FRONTMATTER: Record<string, (description: string) => string[]> = {
  cursor: cursorFrontmatter,
  firebender: cursorFrontmatter, // Firebender reads Cursor-style .mdc rules
  kiro: () => ["inclusion: always"],
  augment: (description) => ["type: always_apply", `description: ${yamlString(description)}`],
  windsurf: () => ["trigger: always_on"], // Devin Desktop's .devin/rules/ (Windsurf's rule frontmatter)
  trae: () => ["alwaysApply: true"],
};

const FRONTMATTER_PATTERN = /^---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n)+/;

/** The frontmatter lines (with the --- fences and a blank line) a platform's rule file starts with, or none. */
export function frontmatterLines(platform: string, description: string): string[] {
  const keys = PLATFORM_FRONTMATTER[platform];
  return keys ? ["---", ...keys(description), "---", ""] : [];
}

/** Split leading YAML frontmatter (if any) from the rest of a rules file. */
export function splitFrontmatter(content: string): { frontmatter: string; body: string } {
  const match = content.match(FRONTMATTER_PATTERN);
  if (!match) return { frontmatter: "", body: content };
  return { frontmatter: match[0], body: content.slice(match[0].length) };
}

/**
 * Re-target Markdown rules content written for one platform to another one:
 * drop frontmatter the target does not read and add the frontmatter it needs.
 * Content already shaped for the target (same platform, or one sharing its
 * frontmatter keys) is returned untouched, so hand-written keys like globs stay.
 */
export function adaptRulesContent(
  content: string,
  fromPlatform: string,
  toPlatform: string,
  description: string
): string {
  const { frontmatter, body } = splitFrontmatter(content);
  const target = PLATFORM_FRONTMATTER[toPlatform];
  if (fromPlatform === toPlatform && (frontmatter || !target)) return content;
  if (frontmatter && target && PLATFORM_FRONTMATTER[fromPlatform] === target) return content;
  const lines = frontmatterLines(toPlatform, description);
  return lines.length ? `${lines.join("\n")}\n${body}` : body;
}
