import { TemplateType } from "@/generated/prisma-users/enums";

/** Every blueprint type the database accepts, straight from the Prisma enum. */
export const BLUEPRINT_TYPES = Object.values(TemplateType) as TemplateType[];

/**
 * Map a type sent by a client to a TemplateType.
 *
 * An exact enum value (case and "-" vs "_" ignored) is kept as is. Older
 * loose names such as "cursor" or "claude" fall back to the closest type,
 * and anything else becomes CUSTOM.
 */
export function normalizeBlueprintType(input: unknown): TemplateType {
  const upper = (typeof input === "string" ? input : "").toUpperCase().replace(/-/g, "_");

  if ((BLUEPRINT_TYPES as string[]).includes(upper)) return upper as TemplateType;

  if (upper.includes("CURSOR_COMMAND")) return "CURSOR_COMMAND";
  if (upper.includes("CLAUDE_COMMAND")) return "CLAUDE_COMMAND";
  if (upper.includes("WINDSURF_WORKFLOW")) return "WINDSURF_WORKFLOW";
  if (upper.includes("COPILOT_PROMPT")) return "COPILOT_PROMPT";
  if (upper.includes("CONTINUE_PROMPT")) return "CONTINUE_PROMPT";
  if (upper.includes("OPENCODE_COMMAND")) return "OPENCODE_COMMAND";
  if (upper.includes("CURSOR")) return "CURSOR_RULES";
  if (upper.includes("CLAUDE")) return "CLAUDE_MD";
  if (upper.includes("COPILOT")) return "COPILOT_INSTRUCTIONS";
  if (upper.includes("WINDSURF")) return "WINDSURF_RULES";
  if (upper.includes("AGENT")) return "AGENTS_MD";
  return "CUSTOM";
}
