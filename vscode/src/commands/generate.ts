import * as vscode from "vscode";
import { BlueprintType } from "../types";
import { blueprintTypeLabel } from "../utils/fileMapping";

/**
 * Opens the LynxPrompt wizard in the user's default browser.
 */
export async function generateConfig(): Promise<void> {
  const config = vscode.workspace.getConfiguration("lynxprompt");
  const baseUrl = config
    .get<string>("apiUrl", "https://lynxprompt.com")
    .replace(/\/+$/, "");

  const wizardUrl = `${baseUrl}/wizard`;
  await vscode.env.openExternal(vscode.Uri.parse(wizardUrl));
}

/**
 * Convert content between AI config formats locally.
 * This performs basic structural conversions (primarily content-level,
 * since most formats are plain Markdown/text with slight conventions).
 */
export async function convertFormat(): Promise<void> {
  // Get the active editor content
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage(
      "Open an AI config file first, then run this command."
    );
    return;
  }

  const content = editor.document.getText();
  if (content.trim().length === 0) {
    vscode.window.showWarningMessage("The current file is empty.");
    return;
  }

  const targetFormats: Array<{ label: string; type: BlueprintType }> = [
    { label: "AGENTS.md", type: "AGENTS_MD" },
    { label: "CLAUDE.md", type: "CLAUDE_MD" },
    { label: "Cursor Rules (.cursor/rules/*.mdc)", type: "CURSOR_RULES" },
    { label: "Copilot Instructions", type: "COPILOT_INSTRUCTIONS" },
    { label: "Windsurf Rules", type: "WINDSURF_RULES" },
    { label: "Cline Rules", type: "CLINE_RULES" },
    { label: "Codex Rules", type: "CODEX_RULES" },
  ];

  const picked = await vscode.window.showQuickPick(
    targetFormats.map((f) => ({ label: f.label, type: f.type })),
    { placeHolder: "Convert to which format?" }
  );

  if (!picked) {
    return;
  }

  const converted = convertContent(content, picked.type);

  // Open in a new untitled document
  const doc = await vscode.workspace.openTextDocument({
    content: converted,
    language: picked.type === "CURSOR_RULES" ? "markdown" : "markdown",
  });

  await vscode.window.showTextDocument(doc, { preview: false });

  vscode.window.showInformationMessage(
    `Content converted to ${blueprintTypeLabel(picked.type)} format. Save it to the appropriate location.`
  );
}

/**
 * Basic format conversion. Wraps content with appropriate headers/frontmatter
 * depending on target format conventions.
 */
function convertContent(content: string, targetType: BlueprintType): string {
  // Strip any existing frontmatter / format-specific headers
  const stripped = stripFormatHeaders(content);

  switch (targetType) {
    case "CURSOR_RULES":
      return wrapCursorRules(stripped);
    case "CLAUDE_MD":
      return wrapClaudeMd(stripped);
    case "AGENTS_MD":
      return wrapAgentsMd(stripped);
    case "COPILOT_INSTRUCTIONS":
      return wrapCopilotInstructions(stripped);
    case "WINDSURF_RULES":
      return stripped; // Plain text, no special wrapping
    case "CLINE_RULES":
      return stripped;
    case "CODEX_RULES":
      return wrapCodexMd(stripped);
    default:
      return stripped;
  }
}

function stripFormatHeaders(content: string): string {
  let result = content;

  // Strip MDC frontmatter (---\n...\n---)
  result = result.replace(/^---\n[\s\S]*?\n---\n?/, "");

  // Strip leading "# AGENTS.md" or "# CLAUDE.md" style headers
  result = result.replace(
    /^#\s+(AGENTS\.md|CLAUDE\.md|Copilot Instructions|Codex Rules)[^\n]*\n*/i,
    ""
  );

  return result.trim();
}

function wrapCursorRules(content: string): string {
  return `---
description: Project rules
globs:
alwaysApply: true
---

${content}
`;
}

function wrapClaudeMd(content: string): string {
  return `# CLAUDE.md

${content}
`;
}

function wrapAgentsMd(content: string): string {
  return `# AGENTS.md

${content}
`;
}

function wrapCopilotInstructions(content: string): string {
  return `# Copilot Instructions

${content}
`;
}

function wrapCodexMd(content: string): string {
  return `# CODEX.md

${content}
`;
}
