/**
 * Write rules for user blueprints that the web routes and the v1 API (used by
 * the CLI) apply the same way. Read access lives in blueprint-access.ts.
 */
import { prismaUsers } from "@/lib/db-users";
import { TemplateType } from "@/generated/prisma-users/enums";
import { detectSensitiveData, type SensitiveMatch } from "@/lib/sensitive-data";
import { checkBlueprintLineCount } from "@/lib/subscription";
import { MCP_BLUEPRINT_TYPE } from "@/lib/platforms";

export type TeamResolution =
  | { ok: true; teamId: string }
  | { ok: false; status: number; error: string };

/**
 * Pick the team a TEAM blueprint belongs to. An explicit team id must be one
 * of the user's teams; without one, the user's only team is used.
 */
export async function resolveBlueprintTeamId(
  userId: string,
  requestedTeamId: unknown
): Promise<TeamResolution> {
  if (requestedTeamId !== undefined && requestedTeamId !== null && requestedTeamId !== "") {
    if (typeof requestedTeamId !== "string") {
      return { ok: false, status: 400, error: "team_id must be a string" };
    }
    const membership = await prismaUsers.teamMember.findUnique({
      where: { teamId_userId: { teamId: requestedTeamId, userId } },
      select: { teamId: true },
    });
    if (!membership) {
      return { ok: false, status: 403, error: "You are not a member of this team" };
    }
    return { ok: true, teamId: membership.teamId };
  }

  const memberships = await prismaUsers.teamMember.findMany({
    where: { userId },
    select: { teamId: true },
    take: 2,
  });
  if (memberships.length === 0) {
    return {
      ok: false,
      status: 400,
      error: "You are not a member of any team, so the blueprint cannot have TEAM visibility",
    };
  }
  if (memberships.length > 1) {
    return {
      ok: false,
      status: 400,
      error: "You belong to more than one team; send team_id to choose one",
    };
  }
  return { ok: true, teamId: memberships[0].teamId };
}

/** Every blueprint type the database accepts, straight from the Prisma enum. */
export const BLUEPRINT_TYPES = Object.values(TemplateType) as TemplateType[];

const TEMPLATE_TYPES = new Set<string>(BLUEPRINT_TYPES);

// Names older CLI releases send that are not in the TemplateType enum.
const TYPE_ALIASES: Record<string, TemplateType> = {
  FIREBASE_RULES: "IDX_CONFIG",
  OPENHANDS_CONFIG: "OPENHANDS_MD",
  GOOSE_HINTS: "GOOSEHINTS",
  OPENCODE_CONFIG: "OPENCODE_JSON",
};

// Loose names older web clients send, such as "cursor" or "claude", matched
// by substring in this order (the command types before their platform).
const LOOSE_TYPES: [string, TemplateType][] = [
  ["CURSOR_COMMAND", "CURSOR_COMMAND"],
  ["CLAUDE_COMMAND", "CLAUDE_COMMAND"],
  ["WINDSURF_WORKFLOW", "WINDSURF_WORKFLOW"],
  ["COPILOT_PROMPT", "COPILOT_PROMPT"],
  ["CONTINUE_PROMPT", "CONTINUE_PROMPT"],
  ["OPENCODE_COMMAND", "OPENCODE_COMMAND"],
  ["CURSOR", "CURSOR_RULES"],
  ["CLAUDE", "CLAUDE_MD"],
  ["COPILOT", "COPILOT_INSTRUCTIONS"],
  ["WINDSURF", "WINDSURF_RULES"],
  ["AGENT", "AGENTS_MD"],
];

/**
 * Map a type sent by any client (web or CLI) to a stored TemplateType.
 *
 * An exact enum value (case, spaces and "-" vs "_" ignored) is kept as is,
 * then the old CLI names and the old loose web names are mapped, and
 * anything else becomes CUSTOM instead of failing the database write.
 */
export function normalizeBlueprintType(type: unknown): TemplateType {
  if (typeof type !== "string") return "CUSTOM";
  const upper = type.trim().toUpperCase().replace(/-/g, "_");
  if (TEMPLATE_TYPES.has(upper)) return upper as TemplateType;
  if (TYPE_ALIASES[upper]) return TYPE_ALIASES[upper];
  for (const [needle, mapped] of LOOSE_TYPES) {
    if (upper.includes(needle)) return mapped;
  }
  return "CUSTOM";
}

export type ContentCheck =
  | { ok: true }
  | {
      ok: false;
      status: number;
      body: {
        error: string;
        message?: string;
        requires_acknowledgment?: boolean;
        sensitive_data?: SensitiveMatch[];
      };
    };

/**
 * Content rules shared by v1 create and update: the line cap for every
 * blueprint, and the sensitive-data check for anything that will be public.
 * MCP server configs are checked at every visibility: they are where API keys
 * usually sit, and a team or private copy still sends them to the server.
 * The sensitive-data check can be confirmed with sensitive_data_acknowledged.
 */
export function checkBlueprintContent(
  content: string,
  options: { willBePublic: boolean; sensitiveDataAcknowledged: boolean; type?: string | null }
): ContentCheck {
  const lineCheck = checkBlueprintLineCount(content);
  if (!lineCheck.valid) {
    return {
      ok: false,
      status: 400,
      body: {
        error: `Blueprint exceeds maximum line limit. Your blueprint has ${lineCheck.lineCount.toLocaleString()} lines, but the maximum is ${lineCheck.maxLines.toLocaleString()} lines.`,
      },
    };
  }

  const isMcpConfig = options.type === MCP_BLUEPRINT_TYPE;
  if ((options.willBePublic || isMcpConfig) && !options.sensitiveDataAcknowledged) {
    const matches = detectSensitiveData(content);
    if (matches.length > 0) {
      const found = [...new Set(matches.map((m) => `${m.type} (line ${m.line})`))].join(", ");
      const advice = isMcpConfig
        ? "Remove them (reference an environment variable instead), or confirm with sensitive_data_acknowledged."
        : "Remove them, keep the blueprint private, or confirm with sensitive_data_acknowledged.";
      return {
        ok: false,
        status: 422,
        body: {
          error: "Sensitive data detected",
          message: `${options.willBePublic ? "Public blueprint" : "MCP config"} not saved: found ${matches.length} possible secret(s): ${found}. ${advice}`,
          requires_acknowledgment: true,
          sensitive_data: matches,
        },
      };
    }
  }

  return { ok: true };
}
