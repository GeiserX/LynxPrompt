import * as path from 'path';

/**
 * All blueprint types supported by LynxPrompt.
 * Derived from src/lib/platforms.ts — the single source of truth.
 */
export type BlueprintType =
  // Popular
  | 'AGENTS_MD'
  | 'CLAUDE_MD'
  | 'CURSOR_RULES'
  | 'COPILOT_INSTRUCTIONS'
  | 'WINDSURF_RULES'
  // IDEs
  | 'GEMINI_MD'
  | 'ZED_INSTRUCTIONS'
  | 'VOID_CONFIG'
  | 'TRAE_RULES'
  | 'FIREBASE_RULES'
  // Editor extensions
  | 'CLINE_RULES'
  | 'ROO_RULES'
  | 'CONTINUE_CONFIG'
  | 'CODY_CONFIG'
  | 'TABNINE_CONFIG'
  | 'SUPERMAVEN_CONFIG'
  | 'CODEGPT_CONFIG'
  | 'AMAZONQ_RULES'
  | 'AUGMENT_RULES'
  | 'KILOCODE_RULES'
  | 'JUNIE_GUIDELINES'
  | 'KIRO_STEERING'
  // CLI tools
  | 'AIDER_MD'
  | 'GOOSE_HINTS'
  | 'WARP_MD'
  | 'OPENCODE_CONFIG'
  // Other
  | 'OPENHANDS_CONFIG'
  | 'CRUSH_MD'
  | 'FIREBENDER_CONFIG'
  // Commands (slash commands)
  | 'CURSOR_COMMAND'
  | 'CLAUDE_COMMAND'
  | 'WINDSURF_WORKFLOW'
  | 'COPILOT_PROMPT'
  | 'CONTINUE_PROMPT'
  | 'OPENCODE_COMMAND';

interface PatternRule {
  test: (relativePath: string) => boolean;
  type: BlueprintType;
  label: string;
  tool: string;
}

/**
 * Pattern rules ordered from most specific to least specific.
 * Directory-based patterns come before basename patterns to avoid mismatches.
 */
const PATTERN_RULES: PatternRule[] = [
  // === Commands (most specific paths first) ===
  { test: (p) => norm(p).includes('.cursor/commands/') && p.endsWith('.md'), type: 'CURSOR_COMMAND', label: 'Cursor Command', tool: 'Cursor' },
  { test: (p) => norm(p).includes('.claude/commands/') && p.endsWith('.md'), type: 'CLAUDE_COMMAND', label: 'Claude Code Command', tool: 'Claude Code' },
  { test: (p) => norm(p).includes('.windsurf/workflows/') && p.endsWith('.md'), type: 'WINDSURF_WORKFLOW', label: 'Windsurf Workflow', tool: 'Windsurf' },
  { test: (p) => norm(p).includes('.copilot/prompts/') && p.endsWith('.md'), type: 'COPILOT_PROMPT', label: 'Copilot Prompt', tool: 'GitHub Copilot' },
  { test: (p) => norm(p).includes('.continue/prompts/') && p.endsWith('.md'), type: 'CONTINUE_PROMPT', label: 'Continue Prompt', tool: 'Continue' },
  { test: (p) => norm(p).includes('.opencode/commands/') && p.endsWith('.md'), type: 'OPENCODE_COMMAND', label: 'OpenCode Command', tool: 'OpenCode' },

  // === Directory-based rules (IDE/editor configs) ===
  { test: (p) => norm(p).includes('.cursor/rules/') && p.endsWith('.mdc'), type: 'CURSOR_RULES', label: 'Cursor Rules', tool: 'Cursor' },
  { test: (p) => norm(p).includes('.trae/rules/') && p.endsWith('.mdc'), type: 'TRAE_RULES', label: 'Trae AI Rules', tool: 'Trae AI' },
  { test: (p) => norm(p).includes('.idx/') && p.endsWith('.mdc'), type: 'FIREBASE_RULES', label: 'Firebase Studio Rules', tool: 'Firebase Studio' },
  { test: (p) => norm(p).includes('.roo/rules/') && p.endsWith('.mdc'), type: 'ROO_RULES', label: 'Roo Code Rules', tool: 'Roo Code' },
  { test: (p) => norm(p).includes('.amazonq/rules/') && p.endsWith('.mdc'), type: 'AMAZONQ_RULES', label: 'Amazon Q Rules', tool: 'Amazon Q' },
  { test: (p) => norm(p).includes('.augment/rules/') && p.endsWith('.mdc'), type: 'AUGMENT_RULES', label: 'Augment Code Rules', tool: 'Augment Code' },
  { test: (p) => norm(p).includes('.kilocode/rules/') && p.endsWith('.mdc'), type: 'KILOCODE_RULES', label: 'Kilo Code Rules', tool: 'Kilo Code' },
  { test: (p) => norm(p).includes('.kiro/steering/') && p.endsWith('.mdc'), type: 'KIRO_STEERING', label: 'Kiro Steering', tool: 'Kiro' },

  // === Path-based configs ===
  { test: (p) => norm(p).includes('.github/copilot-instructions.md'), type: 'COPILOT_INSTRUCTIONS', label: 'Copilot Instructions', tool: 'GitHub Copilot' },
  { test: (p) => norm(p).includes('.zed/instructions.md'), type: 'ZED_INSTRUCTIONS', label: 'Zed Instructions', tool: 'Zed' },
  { test: (p) => norm(p).includes('.openhands/microagents/repo.md'), type: 'OPENHANDS_CONFIG', label: 'OpenHands Config', tool: 'OpenHands' },
  { test: (p) => norm(p).includes('.junie/guidelines.md'), type: 'JUNIE_GUIDELINES', label: 'Junie Guidelines', tool: 'Junie' },
  { test: (p) => norm(p).includes('.void/config.json'), type: 'VOID_CONFIG', label: 'Void Config', tool: 'Void' },
  { test: (p) => norm(p).includes('.continue/config.json'), type: 'CONTINUE_CONFIG', label: 'Continue Config', tool: 'Continue' },
  { test: (p) => norm(p).includes('.cody/config.json'), type: 'CODY_CONFIG', label: 'Cody Config', tool: 'Sourcegraph Cody' },
  { test: (p) => norm(p).includes('.supermaven/config.json'), type: 'SUPERMAVEN_CONFIG', label: 'Supermaven Config', tool: 'Supermaven' },
  { test: (p) => norm(p).includes('.codegpt/config.json'), type: 'CODEGPT_CONFIG', label: 'CodeGPT Config', tool: 'CodeGPT' },

  // === Basename-based rules ===
  { test: (p) => base(p) === 'AGENTS.md', type: 'AGENTS_MD', label: 'AGENTS.md', tool: 'Universal' },
  { test: (p) => base(p) === 'CLAUDE.md', type: 'CLAUDE_MD', label: 'CLAUDE.md', tool: 'Claude Code' },
  { test: (p) => base(p) === 'AIDER.md', type: 'AIDER_MD', label: 'AIDER.md', tool: 'Aider' },
  { test: (p) => base(p) === 'GEMINI.md', type: 'GEMINI_MD', label: 'GEMINI.md', tool: 'Gemini' },
  { test: (p) => base(p) === 'WARP.md', type: 'WARP_MD', label: 'WARP.md', tool: 'Warp AI' },
  { test: (p) => base(p) === 'CRUSH.md', type: 'CRUSH_MD', label: 'CRUSH.md', tool: 'Crush' },
  { test: (p) => base(p) === '.windsurfrules', type: 'WINDSURF_RULES', label: 'Windsurf Rules', tool: 'Windsurf' },
  { test: (p) => base(p) === '.clinerules', type: 'CLINE_RULES', label: 'Cline Rules', tool: 'Cline' },
  { test: (p) => base(p) === '.goosehints', type: 'GOOSE_HINTS', label: 'Goose Hints', tool: 'Goose' },
  { test: (p) => base(p) === '.tabnine.yaml', type: 'TABNINE_CONFIG', label: 'Tabnine Config', tool: 'Tabnine' },
  { test: (p) => base(p) === 'opencode.json', type: 'OPENCODE_CONFIG', label: 'OpenCode Config', tool: 'OpenCode' },
  { test: (p) => base(p) === 'firebender.json', type: 'FIREBENDER_CONFIG', label: 'Firebender Config', tool: 'Firebender' },
];

function norm(p: string): string {
  return p.replace(/\\/g, '/').toLowerCase();
}

function base(p: string): string {
  return path.basename(p);
}

/**
 * Map a relative file path to its BlueprintType.
 */
export function mapFileToType(relativePath: string): BlueprintType | undefined {
  for (const rule of PATTERN_RULES) {
    if (rule.test(relativePath)) {
      return rule.type;
    }
  }
  return undefined;
}

/**
 * Build a blueprint name from a relative file path.
 */
export function buildBlueprintName(relativePath: string): string {
  return relativePath.replace(/\\/g, '/').replace(/^\.\//, '');
}

/**
 * Human-readable label for a BlueprintType.
 */
export function typeLabel(type: string): string {
  const rule = PATTERN_RULES.find((r) => r.type === type);
  return rule?.label ?? type;
}

/**
 * Tool name for a BlueprintType.
 */
export function typeTool(type: string): string {
  const rule = PATTERN_RULES.find((r) => r.type === type);
  return rule?.tool ?? 'Unknown';
}
