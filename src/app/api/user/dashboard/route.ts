import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { prismaApp } from "@/lib/db-app";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user stats in parallel
    const [
      templatesCreated,
      totalDownloads,
      totalFavorites,
      myTemplates,
      recentActivity,
      linkedAccounts,
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

      // Get user's recent templates (max 5)
      prismaUsers.userTemplate.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          type: true,
          downloads: true,
          favorites: true,
          isPublic: true,
          createdAt: true,
        },
      }),

      // Get recent activity (downloads on user's templates + user's downloads)
      prismaUsers.templateDownload.findMany({
        where: {
          OR: [
            { userId }, // Downloads by user
            {
              templateId: {
                in: await prismaUsers.userTemplate
                  .findMany({
                    where: { userId },
                    select: { id: true },
                  })
                  .then((t) => t.map((x) => x.id)),
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

      // Get linked accounts
      prismaUsers.account.findMany({
        where: { userId },
        select: {
          provider: true,
        },
      }),
    ]);

    // Enrich activity with template names
    const templateIds = [...new Set(recentActivity.map((a) => a.templateId))];
    const templateNames = await prismaUsers.userTemplate.findMany({
      where: { id: { in: templateIds } },
      select: { id: true, name: true },
    });
    const templateNameMap = new Map(templateNames.map((t) => [t.id, t.name]));

    const enrichedActivity = recentActivity.map((activity) => ({
      ...activity,
      templateName: templateNameMap.get(activity.templateId) || "Unknown",
      isOwnDownload: activity.userId === userId,
    }));

    // Get user's favorite templates (max 6)
    const favorites = await prismaUsers.templateFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 6,
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
              id: `usr_${template.id}`,
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

    return NextResponse.json({
      stats: {
        templatesCreated,
        totalDownloads: totalDownloads._sum.downloads || 0,
        totalFavorites,
        linkedProviders: linkedAccounts.map(
          (a: { provider: string }) => a.provider
        ),
      },
      myTemplates,
      recentActivity: enrichedActivity,
      favoriteTemplates: enrichedFavorites.filter((f) => f !== null),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

