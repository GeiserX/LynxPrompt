import { prismaApp } from "@/lib/db-app";
import { prismaUsers } from "@/lib/db-users";

/**
 * Who may read a user blueprint. The web routes, getTemplateById and the v1
 * API (used by the CLI) all call these, so the rule lives in one place.
 */

/** The fields of a UserTemplate that decide who may read it. */
export const BLUEPRINT_ACCESS_SELECT = {
  userId: true,
  isPublic: true,
  visibility: true,
  teamId: true,
} as const;

export interface BlueprintAccessFields {
  userId: string;
  isPublic: boolean;
  visibility: string;
  teamId: string | null;
}

/**
 * True when the user owns the blueprint, or belongs to the team it is shared
 * with. A PRIVATE blueprint is never shared, even when it still carries the
 * team id from a time it was TEAM. A published team blueprint (PUBLIC with a
 * team id) still counts as the team's.
 */
export async function isOwnerOrTeamMember(
  blueprint: BlueprintAccessFields,
  userId: string | null | undefined
): Promise<boolean> {
  if (!userId) return false;
  if (blueprint.userId === userId) return true;
  if (!blueprint.teamId || blueprint.visibility === "PRIVATE") return false;
  const membership = await prismaUsers.teamMember.findUnique({
    where: { teamId_userId: { teamId: blueprint.teamId, userId } },
    select: { id: true },
  });
  return !!membership;
}

/**
 * True when the blueprint is public, or the user owns it or is on its team.
 * isPublic is the flag the public listings filter on, so it decides here too.
 */
export async function canReadBlueprint(
  blueprint: BlueprintAccessFields,
  userId: string | null | undefined
): Promise<boolean> {
  if (blueprint.isPublic) return true;
  return isOwnerOrTeamMember(blueprint, userId);
}

/** True when the template exists and the user may read it. System templates are public. */
export async function canReadTemplate(
  templateType: "system" | "user",
  templateId: string,
  userId: string | null | undefined
): Promise<boolean> {
  if (templateType === "system") {
    const template = await prismaApp.systemTemplate.findUnique({
      where: { id: templateId },
      select: { id: true },
    });
    return !!template;
  }
  const template = await prismaUsers.userTemplate.findUnique({
    where: { id: templateId },
    select: BLUEPRINT_ACCESS_SELECT,
  });
  return !!template && canReadBlueprint(template, userId);
}

/**
 * True when the user owns the blueprint, or is an admin of the team it is
 * shared with. A team blueprint is the team's, so its admins can fix or remove
 * one a member wrote. A PRIVATE blueprint stays its owner's alone.
 */
export async function canEditBlueprint(
  blueprint: Pick<BlueprintAccessFields, "userId" | "visibility" | "teamId">,
  userId: string | null | undefined
): Promise<boolean> {
  if (!userId) return false;
  if (blueprint.userId === userId) return true;
  if (!blueprint.teamId || blueprint.visibility === "PRIVATE") return false;
  const membership = await prismaUsers.teamMember.findUnique({
    where: { teamId_userId: { teamId: blueprint.teamId, userId } },
    select: { role: true },
  });
  return membership?.role === "ADMIN";
}
