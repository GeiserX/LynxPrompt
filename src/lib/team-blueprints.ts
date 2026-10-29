import type { Prisma } from "@/generated/prisma-users/client";
import { prismaUsers } from "@/lib/db-users";

/**
 * Team blueprints stay with the team when their author leaves it.
 *
 * A blueprint shared with a team (TEAM, or PUBLIC with a team id) is the
 * team's. When its author is removed from the team, leaves it, or deletes
 * their account, it goes to the team admin who joined first, so the author can
 * no longer change what the team syncs and the team does not lose it. It
 * leaves the author's hierarchy, which the new owner cannot see.
 */
export async function teamBlueprintHandover(
  userId: string,
  teamIds: string[]
): Promise<{ blueprintIds: string[]; operations: Prisma.PrismaPromise<unknown>[] }> {
  const blueprintIds: string[] = [];
  const operations: Prisma.PrismaPromise<unknown>[] = [];

  for (const teamId of teamIds) {
    const blueprints = await prismaUsers.userTemplate.findMany({
      where: { userId, teamId, visibility: { not: "PRIVATE" } },
      select: { id: true },
    });
    if (blueprints.length === 0) continue;

    const heir = await prismaUsers.teamMember.findFirst({
      where: { teamId, userId: { not: userId }, role: "ADMIN" },
      orderBy: { joinedAt: "asc" },
      select: { userId: true },
    });
    // No other admin: the team has no other members (it goes with the
    // account) or the caller already refused to leave it without an admin.
    if (!heir) continue;

    const ids = blueprints.map(({ id }) => id);
    blueprintIds.push(...ids);
    operations.push(
      prismaUsers.userTemplate.updateMany({
        where: { id: { in: ids } },
        data: { userId: heir.userId, hierarchyId: null, parentId: null },
      }),
      // The author's own blueprints that hung under a handed-over one
      prismaUsers.userTemplate.updateMany({
        where: { parentId: { in: ids }, userId },
        data: { parentId: null },
      })
    );
  }

  return { blueprintIds, operations };
}
