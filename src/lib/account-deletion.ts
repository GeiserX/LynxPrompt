/**
 * Deleting an account, across the four databases.
 *
 * The users database holds almost everything a user owns, and every table
 * there except TemplateDownload (SET NULL) cascades from User. What the
 * cascade cannot reach is handled here:
 * - favorites and downloads other people left on this user's blueprints
 *   (templateId is polymorphic, so it has no foreign key);
 * - teams: a team where the user is the only member goes with them, and a
 *   team with other members must keep an admin, so the user has to promote
 *   one first;
 * - pending invitations and sign-in tokens addressed to their email;
 * - the support forum and the blog live in other databases, keyed by user id
 *   without a foreign key. Posts and comments stay, so threads keep making
 *   sense, but lose the name and picture; votes are removed.
 * - uploaded avatars on disk.
 */

import { rm } from "node:fs/promises";
import path from "node:path";
import { prismaUsers } from "@/lib/db-users";
import { prismaSupport } from "@/lib/db-support";
import { prismaBlog } from "@/lib/db-blog";

// The id that anonymized forum and blog content points at
export const DELETED_USER_ID = "deleted-user";

const UPLOAD_BASE_DIR = process.env.UPLOAD_DIR?.replace("/blog", "") || "/data/uploads";

/**
 * Teams that would be left with members and no admin. Empty when the user
 * can be deleted.
 */
export async function teamsBlockingDeletion(userId: string): Promise<string[]> {
  const adminOf = await prismaUsers.teamMember.findMany({
    where: { userId, role: "ADMIN" },
    select: { teamId: true, team: { select: { name: true } } },
  });

  const blocking: string[] = [];
  for (const { teamId, team } of adminOf) {
    const [otherMembers, otherAdmins] = await Promise.all([
      prismaUsers.teamMember.count({ where: { teamId, userId: { not: userId } } }),
      prismaUsers.teamMember.count({ where: { teamId, userId: { not: userId }, role: "ADMIN" } }),
    ]);
    if (otherMembers > 0 && otherAdmins === 0) blocking.push(team.name);
  }
  return blocking;
}

async function anonymizeSupport(userId: string): Promise<void> {
  if (!process.env.DATABASE_URL_SUPPORT) return;

  const votes = await prismaSupport.supportVote.findMany({
    where: { userId },
    select: { id: true, postId: true },
  });
  await prismaSupport.$transaction([
    ...votes.map((vote) =>
      prismaSupport.supportPost.update({
        where: { id: vote.postId },
        data: { voteCount: { decrement: 1 } },
      })
    ),
    prismaSupport.supportVote.deleteMany({ where: { userId } }),
    prismaSupport.supportPost.updateMany({
      where: { userId },
      data: { userId: DELETED_USER_ID, userName: null, userImage: null },
    }),
    prismaSupport.supportComment.updateMany({
      where: { userId },
      data: { userId: DELETED_USER_ID, userName: null, userImage: null },
    }),
  ]);
}

async function anonymizeBlog(userId: string): Promise<void> {
  if (!process.env.DATABASE_URL_BLOG) return;
  await prismaBlog.blogPost.updateMany({
    where: { authorId: userId },
    data: { authorId: DELETED_USER_ID, authorName: null },
  });
}

// OAuth keeps the address as the provider sent it; magic links and
// invitations store it lowercased.
function emailForms(email: string): string[] {
  return [...new Set([email, email.toLowerCase()])];
}

/**
 * Deletes the user and everything they own. Call teamsBlockingDeletion first.
 * The forum and blog are anonymized before the account goes, so a failure
 * leaves an account the user can retry deleting, never forum content that
 * still names a deleted account.
 */
export async function deleteAccount(userId: string): Promise<void> {
  const user = await prismaUsers.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user) return;

  await anonymizeSupport(userId);
  await anonymizeBlog(userId);

  const blueprints = await prismaUsers.userTemplate.findMany({
    where: { userId },
    select: { id: true },
  });
  // Rows may name a blueprint by its bare id or its bp_ API id
  const blueprintIds = blueprints.flatMap(({ id }) => [id, `bp_${id}`]);

  const soloTeams = await prismaUsers.team.findMany({
    where: { members: { some: { userId }, every: { userId } } },
    select: { id: true },
  });

  await prismaUsers.$transaction([
    prismaUsers.templateFavorite.deleteMany({
      where: { templateType: "user", templateId: { in: blueprintIds } },
    }),
    prismaUsers.templateDownload.deleteMany({
      where: { templateType: "user", templateId: { in: blueprintIds } },
    }),
    prismaUsers.team.deleteMany({ where: { id: { in: soloTeams.map((t) => t.id) } } }),
    ...(user.email
      ? [
          prismaUsers.teamInvitation.deleteMany({ where: { email: { in: emailForms(user.email) } } }),
          prismaUsers.verificationToken.deleteMany({ where: { identifier: { in: emailForms(user.email) } } }),
        ]
      : []),
    prismaUsers.user.delete({ where: { id: userId } }),
  ]);

  // Avatars; the account is already gone, so a leftover file is only logged
  try {
    await rm(path.join(UPLOAD_BASE_DIR, "profiles", userId), { recursive: true, force: true });
  } catch (error) {
    console.error(`[Account] Could not remove uploads of deleted user ${userId}:`, error);
  }
}
