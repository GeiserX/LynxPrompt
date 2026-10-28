/**
 * Access and write rules for user blueprints that the v1 API (used by the
 * CLI) must apply the same way the web routes do.
 */
import { prismaUsers } from "@/lib/db-users";
import { TemplateType } from "@/generated/prisma-users/enums";
import { detectSensitiveData, type SensitiveMatch } from "@/lib/sensitive-data";
import { checkBlueprintLineCount } from "@/lib/subscription";

export interface BlueprintAccessFields {
  userId: string;
  isPublic: boolean;
  visibility: string;
  teamId: string | null;
}

/**
 * A user may read a blueprint when it is public, when they own it, or when it
 * is a TEAM blueprint of a team they belong to. Same rule as getTemplateById.
 */
export async function canReadBlueprint(
  userId: string | null | undefined,
  blueprint: BlueprintAccessFields
): Promise<boolean> {
  if (blueprint.isPublic) return true;
  if (!userId) return false;
  if (blueprint.userId === userId) return true;
  if (blueprint.visibility === "TEAM" && blueprint.teamId) {
    const membership = await prismaUsers.teamMember.findUnique({
      where: { teamId_userId: { teamId: blueprint.teamId, userId } },
      select: { teamId: true },
    });
    return Boolean(membership);
  }
  return false;
}

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

const TEMPLATE_TYPES = new Set<string>(Object.values(TemplateType));

// Names older CLI releases send that are not in the TemplateType enum.
const TYPE_ALIASES: Record<string, TemplateType> = {
  FIREBASE_RULES: "IDX_CONFIG",
  OPENHANDS_CONFIG: "OPENHANDS_MD",
  GOOSE_HINTS: "GOOSEHINTS",
  OPENCODE_CONFIG: "OPENCODE_JSON",
};

/**
 * Map a client-sent type to a stored TemplateType. Unknown types become
 * CUSTOM instead of failing the database write.
 */
export function normalizeBlueprintType(type: unknown): TemplateType {
  if (typeof type !== "string") return "CUSTOM";
  const upper = type.trim().toUpperCase().replace(/-/g, "_");
  if (TEMPLATE_TYPES.has(upper)) return upper as TemplateType;
  return TYPE_ALIASES[upper] ?? "CUSTOM";
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
 * The sensitive-data check can be confirmed with sensitive_data_acknowledged.
 */
export function checkBlueprintContent(
  content: string,
  options: { willBePublic: boolean; sensitiveDataAcknowledged: boolean }
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

  if (options.willBePublic && !options.sensitiveDataAcknowledged) {
    const matches = detectSensitiveData(content);
    if (matches.length > 0) {
      const found = [...new Set(matches.map((m) => `${m.type} (line ${m.line})`))].join(", ");
      return {
        ok: false,
        status: 422,
        body: {
          error: "Sensitive data detected",
          message: `Public blueprint not saved: found ${matches.length} possible secret(s): ${found}. Remove them, keep the blueprint private, or confirm with sensitive_data_acknowledged.`,
          requires_acknowledgment: true,
          sensitive_data: matches,
        },
      };
    }
  }

  return { ok: true };
}
