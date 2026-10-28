/**
 * Deleting an account, across the four databases.
 *
 * The users database holds almost everything a user owns, and every table
 * there except TemplateDownload (SET NULL) cascades from User. What the
 * cascade cannot reach is handled here:
 * - favorites and downloads other people left on this user's blueprints
 *   (templateId is polymorphic, so it has no foreign key);
 * - the favorite counters of the blueprints this user had favorited: the
 *   cascade removes their favorite rows, so each counter goes down by one, as
 *   unfavoriting does;
 * - teams: a team where the user is the only member goes with them, and a
 *   team with other members must keep an admin, so the user has to promote
 *   one first;
 * - pending invitations and sign-in tokens addressed to their email;
 * - the support forum and the blog live in other databases, keyed by user id
 *   without a foreign key. Posts and comments stay, so threads keep making
 *   sense, but lose the name and picture; votes are removed. These run when
 *   their database is configured, and only stop the deletion on failure while
 *   the feature is on (with it off, the database may not exist).
 * - uploaded avatars on disk.
 */

import { rm } from "node:fs/promises";
import path from "node:path";
import { prismaUsers } from "@/lib/db-users";
import { prismaApp } from "@/lib/db-app";
import { prismaSupport } from "@/lib/db-support";
import { prismaBlog } from "@/lib/db-blog";
import { envBool } from "@/lib/feature-flags";

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

/**
 * Runs a step on the forum or blog database. With the feature on, a failure
 * stops the deletion. With it off, the database may hold data from when it was
 * on, or may never have been created, so a failure is only logged.
 */
async function optionalDatabase(flag: string, urlVar: string, step: () => Promise<void>) {
  if (!process.env[urlVar]) return;
  if (envBool(flag, false)) return step();
  try {
    await step();
  } catch (error) {
    console.error(`[Account] ${flag} is off and its database could not be cleaned:`, error);
  }
}

async function anonymizeSupport(userId: string): Promise<void> {

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

  await optionalDatabase("ENABLE_SUPPORT_FORUM", "DATABASE_URL_SUPPORT", () => anonymizeSupport(userId));
  await optionalDatabase("ENABLE_BLOG", "DATABASE_URL_BLOG", () => anonymizeBlog(userId));

  const blueprints = await prismaUsers.userTemplate.findMany({
    where: { userId },
    select: { id: true },
  });
  // Rows may name a blueprint by its bare id or its bp_ API id
  const blueprintIds = blueprints.flatMap(({ id }) => [id, `bp_${id}`]);

  // Favorites this user left elsewhere. Rows may carry an API prefix; the
  // counter never goes below zero, and their own blueprints go anyway.
  const favorited = await prismaUsers.templateFavorite.findMany({
    where: { userId },
    select: { templateId: true, templateType: true },
  });
  const ownIds = new Set(blueprints.map(({ id }) => id));
  const favoritedIds = (type: string) => [
    ...new Set(
      favorited
        .filter((f) => f.templateType === type)
        .map((f) => f.templateId.replace(/^(sys_|bp_|usr_)/, ""))
    ),
  ];
  const favoritedBlueprints = favoritedIds("user").filter((id) => !ownIds.has(id));
  const favoritedSystem = favoritedIds("system");

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
    // One favorite per blueprint, so each matched counter drops by one
    prismaUsers.userTemplate.updateMany({
      where: { id: { in: favoritedBlueprints }, favorites: { gt: 0 } },
      data: { favorites: { decrement: 1 } },
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

  // System templates live in the app database; the favorite rows are already
  // gone, so a counter left high is only logged
  if (favoritedSystem.length > 0) {
    try {
      await prismaApp.systemTemplate.updateMany({
        where: { id: { in: favoritedSystem }, favorites: { gt: 0 } },
        data: { favorites: { decrement: 1 } },
      });
    } catch (error) {
      console.error(`[Account] Could not lower system template favorites for deleted user ${userId}:`, error);
    }
  }

  // Avatars; the account is already gone, so a leftover file is only logged
  try {
    await rm(path.join(UPLOAD_BASE_DIR, "profiles", userId), { recursive: true, force: true });
  } catch (error) {
    console.error(`[Account] Could not remove uploads of deleted user ${userId}:`, error);
  }
}
