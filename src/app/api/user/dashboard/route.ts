import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { prismaApp } from "@/lib/db-app";

/**
 * Get team membership for a user
 */
async function getUserTeamInfo(userId: string) {
  const membership = await prismaUsers.teamMember.findFirst({
    where: { userId },
    include: {
      team: {
        include: {
          members: {
            select: { userId: true },
            take: 100, // Limit for performance
          },
          _count: {
            select: { members: true },
          },
        },
      },
    },
  });
  
  if (!membership) return null;
  
  return {
    teamId: membership.team.id,
    teamName: membership.team.name,
    teamSlug: membership.team.slug,
    role: membership.role,
    memberCount: membership.team._count.members,
    memberIds: membership.team.members.map(m => m.userId),
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Check if user is part of a team
    const teamInfo = await getUserTeamInfo(userId);

    // Get user stats in parallel
    const [
      templatesCreated,
      totalDownloads,
      totalFavorites,
      favoritesReceived,
      myTemplates,
      recentActivity,
      purchasedBlueprints,
    ] = await Promise.all([
      // Count templates created by user
      prismaUsers.userTemplate.count({
        where: { userId },
      }),

      // Sum of downloads on user's templates
      prismaUsers.userTemplate.aggregate({
        where: { userId },
        _sum: { downloads: true },
      }),

      // Count favorites user has given
      prismaUsers.templateFavorite.count({
        where: { userId },
      }),

      // Sum of favorites received on user's templates
      prismaUsers.userTemplate.aggregate({
        where: { userId },
        _sum: { favorites: true },
      }),

      // Get user's templates (all, for client-side pagination and search)
      prismaUsers.userTemplate.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          type: true,
          downloads: true,
          favorites: true,
          isPublic: true,
          visibility: true,
          createdAt: true,
        currentVersion: true,
        publishedVersion: true,
        // Hierarchy fields
        hierarchyId: true,
        parentId: true,
        repositoryPath: true,
      },
    }).then(templates => templates.map(template => ({
      ...template,
      id: `bp_${template.id}`, // Add bp_ prefix for template detail routing
      version: template.currentVersion,
      publishedVersion: template.publishedVersion,
      // Include hierarchy info
      hierarchyId: template.hierarchyId ? `ha_${template.hierarchyId}` : null,
      parentId: template.parentId ? `bp_${template.parentId}` : null,
      repositoryPath: template.repositoryPath,
    }))),

      // Get recent activity (downloads on user's templates + user's downloads)
      prismaUsers.templateDownload.findMany({
        where: {
          OR: [
            { userId }, // Downloads by user
            {
              templateId: {
                // Template IDs in downloads are stored WITH prefix (bp_xxx)
                in: await prismaUsers.userTemplate
                  .findMany({
                    where: { userId },
                    select: { id: true },
                  })
                  .then((t) => t.map((x) => `bp_${x.id}`)),
              },
              templateType: "user",
            }, // Downloads of user's templates
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          templateId: true,
          templateType: true,
          platform: true,
          createdAt: true,
          userId: true,
        },
      }),

      // Get purchased blueprints (individual purchases, max 6)
      prismaUsers.blueprintPurchase.findMany({
        where: { userId, teamId: null }, // Only individual purchases
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          template: {
            select: {
              id: true,
              name: true,
              description: true,
              downloads: true,
              favorites: true,
              tier: true,
              price: true,
              currentVersion: true,
              publishedVersion: true,
              user: {
                select: { name: true, displayName: true },
              },
            },
          },
        },
      }),
    ]);
    
    // Get user's hierarchies with their blueprints
    const userHierarchies = await prismaUsers.hierarchy.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        blueprints: {
          orderBy: { repositoryPath: "asc" },
          select: {
            id: true,
            name: true,
            type: true,
            downloads: true,
            favorites: true,
            visibility: true,
            createdAt: true,
            parentId: true,
            repositoryPath: true,
            contentChecksum: true,
          },
        },
      },
    });

    // Format hierarchies with ha_ prefix
    const hierarchicalBlueprints = userHierarchies.map(hierarchy => ({
      id: `ha_${hierarchy.id}`,
      name: hierarchy.name,
      description: hierarchy.description,
      repositoryRoot: hierarchy.repositoryRoot,
      createdAt: hierarchy.createdAt,
      updatedAt: hierarchy.updatedAt,
      blueprints: hierarchy.blueprints.map(bp => ({
        id: `bp_${bp.id}`,
        name: bp.name,
        type: bp.type,
        downloads: bp.downloads,
        favorites: bp.favorites,
        visibility: bp.visibility,
        createdAt: bp.createdAt,
        parentId: bp.parentId ? `bp_${bp.parentId}` : null,
        repositoryPath: bp.repositoryPath,
        contentChecksum: bp.contentChecksum,
      })),
    }));

    // Team-specific data (if user is in a team)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let teamBlueprints: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let teamPurchases: any[] = [];
    
    if (teamInfo) {
      // Get team-shared blueprints (created by team members and marked as TEAM visibility)
      teamBlueprints = await prismaUsers.userTemplate.findMany({
        where: {
          userId: { in: teamInfo.memberIds },
          visibility: "TEAM",
          teamId: teamInfo.teamId,
        },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          name: true,
          type: true,
          downloads: true,
          favorites: true,
          isPublic: true,
          createdAt: true,
          user: {
            select: { name: true, displayName: true },
          },
        },
      }).then(templates => templates.map(template => ({
        id: `bp_${template.id}`,
        name: template.name,
        type: template.type,
        downloads: template.downloads,
        favorites: template.favorites,
        isPublic: template.isPublic,
        createdAt: template.createdAt,
        author: template.user?.displayName || template.user?.name || "Team member",
      })));
      
      // Get team-purchased blueprints (shared with entire team)
      teamPurchases = await prismaUsers.blueprintPurchase.findMany({
        where: { teamId: teamInfo.teamId },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          template: {
            select: {
              id: true,
              name: true,
              description: true,
              downloads: true,
              favorites: true,
              tier: true,
              price: true,
              user: {
                select: { name: true, displayName: true },
              },
            },
          },
          user: {
            select: { name: true, displayName: true },
          },
        },
      });
    }

    // Enrich activity with template names
    // Template IDs in downloads are stored WITH prefix (bp_xxx, sys_xxx)
    // Need to strip prefix for database lookup, then map back
    const userTemplateIds = recentActivity
      .filter((a) => a.templateId.startsWith("bp_"))
      .map((a) => a.templateId.replace(/^bp_/, ""));
    const systemTemplateIds = recentActivity
      .filter((a) => a.templateId.startsWith("sys_"))
      .map((a) => a.templateId.replace(/^sys_/, ""));

    // Fetch user templates
    const userTemplateNames = await prismaUsers.userTemplate.findMany({
      where: { id: { in: userTemplateIds } },
      select: { id: true, name: true },
    });
    
    // Fetch system templates if any
    const systemTemplateNames = systemTemplateIds.length > 0 
      ? await prismaApp.systemTemplate.findMany({
          where: { id: { in: systemTemplateIds } },
          select: { id: true, name: true },
        })
      : [];

    // Create map with prefixed IDs
    const templateNameMap = new Map<string, string>();
    userTemplateNames.forEach((t) => templateNameMap.set(`bp_${t.id}`, t.name));
    systemTemplateNames.forEach((t) => templateNameMap.set(`sys_${t.id}`, t.name));

    const enrichedActivity = recentActivity.map((activity) => ({
      ...activity,
      templateName: templateNameMap.get(activity.templateId) || "Unknown",
      isOwnDownload: activity.userId === userId,
    }));

    // Get user's favorite templates (all for client-side pagination)
    const favorites = await prismaUsers.templateFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    // Enrich favorites with template details
    const enrichedFavorites = await Promise.all(
      favorites.map(async (fav) => {
        if (fav.templateType === "system") {
          const template = await prismaApp.systemTemplate.findUnique({
            where: { id: fav.templateId },
            select: {
              id: true,
              name: true,
              description: true,
              downloads: true,
              favorites: true,
              tier: true,
            },
          });
          if (template) {
            return {
              id: `sys_${template.id}`,
              name: template.name,
              description: template.description,
              downloads: template.downloads,
              favorites: template.favorites,
              tier: template.tier,
              isOfficial: true,
            };
          }
        } else {
          const template = await prismaUsers.userTemplate.findUnique({
            where: { id: fav.templateId },
            include: {
              user: { select: { name: true } },
            },
          });
          if (template) {
            return {
              id: `bp_${template.id}`,
              name: template.name,
              description: template.description,
              downloads: template.downloads,
              favorites: template.favorites,
              tier: template.tier,
              author: template.user?.name || "Anonymous",
              isOfficial: false,
            };
          }
        }
        return null;
      })
    );

    // Format purchased blueprints
    const formattedPurchases = purchasedBlueprints
      .filter(p => p.template) // Only include if template still exists
      .map(p => ({
        id: `bp_${p.template.id}`,
        name: p.template.name,
        description: p.template.description,
        downloads: p.template.downloads,
        favorites: p.template.favorites,
        tier: p.template.tier,
        price: p.template.price,
        author: p.template.user?.displayName || p.template.user?.name || "Anonymous",
        purchasedAt: p.createdAt,
        purchasedVersion: p.versionNumber || 1,
        currentVersion: p.template.publishedVersion || p.template.currentVersion || 1,
      }));
    
    // Format team-purchased blueprints
    const formattedTeamPurchases = teamPurchases
      .filter(p => p.template)
      .map(p => ({
        id: `bp_${p.template.id}`,
        name: p.template.name,
        description: p.template.description,
        downloads: p.template.downloads,
        favorites: p.template.favorites,
        tier: p.template.tier,
        price: p.template.price,
        author: p.template.user?.displayName || p.template.user?.name || "Anonymous",
        purchasedAt: p.createdAt,
        purchasedBy: p.user?.displayName || p.user?.name || "Team member",
      }));

    return NextResponse.json({
      stats: {
        templatesCreated,
        totalDownloads: totalDownloads._sum.downloads || 0,
        totalFavorites,
        favoritesReceived: favoritesReceived._sum.favorites || 0,
      },
      myTemplates,
      recentActivity: enrichedActivity,
      favoriteTemplates: enrichedFavorites.filter((f) => f !== null),
      purchasedBlueprints: formattedPurchases,
      // Hierarchical blueprints (grouped by repository)
      hierarchicalBlueprints,
      // Team data (only included if user is in a team)
      team: teamInfo ? {
        id: teamInfo.teamId,
        name: teamInfo.teamName,
        slug: teamInfo.teamSlug,
        role: teamInfo.role,
        memberCount: teamInfo.memberCount,
      } : null,
      teamBlueprints: teamInfo ? teamBlueprints : [],
      teamPurchases: teamInfo ? formattedTeamPurchases : [],
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

