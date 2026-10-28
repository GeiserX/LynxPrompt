import { prismaApp } from "@/lib/db-app";
import { prismaUsers } from "@/lib/db-users";

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
  visibility?: string | null;
  teamId: string | null;
}

/** True when the user owns the blueprint or belongs to the team it is shared with. */
export async function isOwnerOrTeamMember(
  blueprint: BlueprintAccessFields,
  userId: string | null | undefined
): Promise<boolean> {
  if (!userId) return false;
  if (blueprint.userId === userId) return true;
  if (!blueprint.teamId) return false;
  const membership = await prismaUsers.teamMember.findUnique({
    where: { teamId_userId: { teamId: blueprint.teamId, userId } },
    select: { id: true },
  });
  return !!membership;
}

/** True when the blueprint is public, or the user owns it or is on its team. */
export async function canReadBlueprint(
  blueprint: BlueprintAccessFields,
  userId: string | null | undefined
): Promise<boolean> {
  if (blueprint.isPublic || blueprint.visibility === "PUBLIC") return true;
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
