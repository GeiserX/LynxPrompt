import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { prismaApp } from "@/lib/db-app";
import { prismaSupport } from "@/lib/db-support";
import { prismaBlog } from "@/lib/db-blog";
import {
  ENABLE_SUPPORT_FORUM,
  ENABLE_BLOG,
  ENABLE_STRIPE,
  ENABLE_AI,
} from "@/lib/feature-flags";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const daysBack = parseInt(searchParams.get("days") || "30", 10);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    startDate.setHours(0, 0, 0, 0);

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const excludeTestUsers = {
      NOT: {
        OR: [
          { email: { startsWith: "dev-test-" } },
          { email: "dev@lynxprompt.com" },
        ],
      },
    };

    const excludeTestUserRelation = {
      user: {
        NOT: {
          OR: [
            { email: { startsWith: "dev-test-" } },
            { email: "dev@lynxprompt.com" },
          ],
        },
      },
    };

    // ===== USER STATS =====

    const totalUsers = await prismaUsers.user.count({
      where: excludeTestUsers,
    });

    const activeUsers7d = await prismaUsers.user.count({
      where: { ...excludeTestUsers, lastLoginAt: { gte: sevenDaysAgo } },
    });

    const activeUsers30d = await prismaUsers.user.count({
      where: { ...excludeTestUsers, lastLoginAt: { gte: thirtyDaysAgo } },
    });

    const onboardedUsers = await prismaUsers.user.count({
      where: { ...excludeTestUsers, profileCompleted: true },
    });

    const allUsers = await prismaUsers.user.findMany({
      where: {
        createdAt: { gte: startDate },
        ...excludeTestUsers,
      },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const userTimeSeries: Record<string, number> = {};
    for (let i = daysBack; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      userTimeSeries[date.toISOString().split("T")[0]] = 0;
    }
    allUsers.forEach((user) => {
      const dateStr = user.createdAt.toISOString().split("T")[0];
      if (userTimeSeries[dateStr] !== undefined) {
        userTimeSeries[dateStr]++;
      }
    });

    const userGrowthData = Object.entries(userTimeSeries).map(
      ([date, count]) => ({ date, count })
    );

    const newUsersThisPeriod = allUsers.length;

    const usersByRole = await prismaUsers.user.groupBy({
      by: ["role"],
      where: excludeTestUsers,
      _count: { id: true },
    });

    // Auth provider breakdown
    const authProviders = await prismaUsers.account.groupBy({
      by: ["provider"],
      where: excludeTestUserRelation,
      _count: { id: true },
    });

    // Passkey adoption
    let passkeysUsers = 0;
    try {
      passkeysUsers = await prismaUsers.authenticator.groupBy({
        by: ["userId"],
        where: excludeTestUserRelation,
      }).then((r) => r.length);
    } catch {
      // Authenticator model may not be populated
    }

    const usersList = await prismaUsers.user.findMany({
      where: excludeTestUsers,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        displayName: true,
        email: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        profileCompleted: true,
        _count: { select: { templates: true } },
      },
    });

    // ===== BLUEPRINT STATS =====

    const totalBlueprints = await prismaUsers.userTemplate.count({
      where: excludeTestUserRelation,
    });

    const blueprintsByVisibility = await prismaUsers.userTemplate.groupBy({
      by: ["visibility"],
      where: excludeTestUserRelation,
      _count: { id: true },
    });

    const blueprintsCreatedThisPeriod = await prismaUsers.userTemplate.count({
      where: {
        createdAt: { gte: startDate },
        ...excludeTestUserRelation,
      },
    });

    const totalFavorites = await prismaUsers.templateFavorite.count({
      where: excludeTestUserRelation,
    });

    const totalHierarchies = await prismaUsers.hierarchy.count({
      where: excludeTestUserRelation,
    });

    const systemTemplates = await prismaApp.systemTemplate.count();

    const topBlueprints = await prismaUsers.userTemplate.findMany({
      where: excludeTestUserRelation,
      take: 10,
      orderBy: { downloads: "desc" },
      select: {
        id: true,
        name: true,
        downloads: true,
        favorites: true,
        user: { select: { displayName: true, name: true } },
      },
    });

    // Downloads over time
    const downloads = await prismaUsers.templateDownload.findMany({
      where: {
        createdAt: { gte: startDate },
        OR: [
          { userId: null },
          {
            user: {
              NOT: {
                OR: [
                  { email: { startsWith: "dev-test-" } },
                  { email: "dev@lynxprompt.com" },
                ],
              },
            },
          },
        ],
      },
      select: { createdAt: true, platform: true, templateType: true },
    });

    const downloadsTimeSeries: Record<string, number> = {};
    for (let i = daysBack; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      downloadsTimeSeries[date.toISOString().split("T")[0]] = 0;
    }
    downloads.forEach((d) => {
      const dateStr = d.createdAt.toISOString().split("T")[0];
      if (downloadsTimeSeries[dateStr] !== undefined) {
        downloadsTimeSeries[dateStr]++;
      }
    });

    const downloadGrowthData = Object.entries(downloadsTimeSeries).map(
      ([date, count]) => ({ date, downloads: count })
    );

    const platformCounts: Record<string, number> = {};
    downloads.forEach((d) => {
      if (d.platform) {
        platformCounts[d.platform] = (platformCounts[d.platform] || 0) + 1;
      }
    });
    const platformData = Object.entries(platformCounts)
      .map(([platform, count]) => ({ platform, count }))
      .sort((a, b) => b.count - a.count);

    // ===== ENGAGEMENT STATS =====

    let wizardDrafts = 0;
    let recentDrafts = 0;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prismaAny = prismaUsers as any;
      if (prismaAny.wizardDraft) {
        wizardDrafts = await prismaAny.wizardDraft.count({
          where: excludeTestUserRelation,
        });
        recentDrafts = await prismaAny.wizardDraft.count({
          where: { updatedAt: { gte: startDate }, ...excludeTestUserRelation },
        });
      }
    } catch {
      // WizardDraft model may not exist yet
    }

    const activeApiTokens = await prismaUsers.apiToken.count({
      where: {
        revokedAt: null,
        expiresAt: { gt: now },
        ...excludeTestUserRelation,
      },
    });

    let totalProjects = 0;
    try {
      totalProjects = await prismaUsers.project.count({
        where: excludeTestUserRelation,
      });
    } catch {
      // Project model may not exist
    }

    let totalCliSessions = 0;
    let activeCliSessions = 0;
    try {
      totalCliSessions = await prismaUsers.cliSession.count({
        where: excludeTestUserRelation,
      });
      activeCliSessions = await prismaUsers.cliSession.count({
        where: {
          status: "AUTHENTICATED" as never,
          expiresAt: { gt: now },
          ...excludeTestUserRelation,
        },
      });
    } catch {
      // CliSession model may not exist
    }

    // ===== FEATURE-GATED SECTIONS =====

    let supportStats = null;
    if (ENABLE_SUPPORT_FORUM) {
      try {
        const totalPosts = await prismaSupport.supportPost.count();
        const openPosts = await prismaSupport.supportPost.count({
          where: { status: { in: ["OPEN", "IN_PROGRESS"] as never } },
        });
        const resolvedPosts = await prismaSupport.supportPost.count({
          where: { status: "COMPLETED" as never },
        });
        const postsThisPeriod = await prismaSupport.supportPost.count({
          where: { createdAt: { gte: startDate } },
        });
        let totalComments = 0;
        try {
          totalComments = await prismaSupport.supportComment.count();
        } catch {
          // Comment count optional
        }
        supportStats = {
          totalPosts,
          openPosts,
          resolvedPosts,
          postsThisPeriod,
          totalComments,
        };
      } catch {
        // Support DB not available
      }
    }

    let blogStats = null;
    if (ENABLE_BLOG) {
      try {
        const totalPosts = await prismaBlog.blogPost.count();
        const publishedPosts = await prismaBlog.blogPost.count({
          where: { status: "PUBLISHED" as never },
        });
        blogStats = { totalPosts, publishedPosts };
      } catch {
        // Blog DB not available
      }
    }

    return NextResponse.json({
      period: {
        days: daysBack,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      },
      featureFlags: {
        supportEnabled: ENABLE_SUPPORT_FORUM,
        blogEnabled: ENABLE_BLOG,
        stripeEnabled: ENABLE_STRIPE,
        aiEnabled: ENABLE_AI,
      },
      users: {
        total: totalUsers,
        active7d: activeUsers7d,
        active30d: activeUsers30d,
        onboarded: onboardedUsers,
        byRole: Object.fromEntries(
          usersByRole.map((r) => [r.role, r._count.id])
        ),
        newThisPeriod: newUsersThisPeriod,
        growthData: userGrowthData,
        authProviders: Object.fromEntries(
          authProviders.map((p) => [p.provider, p._count.id])
        ),
        passkeysUsers,
        list: usersList.map((u) => ({
          id: u.id,
          name: u.displayName || u.name || "Anonymous",
          email: u.email,
          role: u.role,
          createdAt: u.createdAt.toISOString(),
          lastLoginAt: u.lastLoginAt?.toISOString() || null,
          profileCompleted: u.profileCompleted,
          blueprintsCount: u._count.templates,
        })),
      },
      blueprints: {
        total: totalBlueprints,
        byVisibility: Object.fromEntries(
          blueprintsByVisibility.map((v) => [v.visibility, v._count.id])
        ),
        createdThisPeriod: blueprintsCreatedThisPeriod,
        totalFavorites,
        totalHierarchies,
        systemTemplates,
        avgPerUser: totalUsers > 0 ? +(totalBlueprints / totalUsers).toFixed(1) : 0,
        topDownloaded: topBlueprints.map((b) => ({
          id: b.id,
          name: b.name,
          downloads: b.downloads,
          favorites: b.favorites,
          author: b.user.displayName || b.user.name || "Anonymous",
        })),
        downloadGrowthData,
        platformDistribution: platformData,
        totalDownloadsThisPeriod: downloads.length,
      },
      support: supportStats,
      blog: blogStats,
      engagement: {
        wizardDrafts,
        recentDrafts,
        activeApiTokens,
        totalProjects,
        totalCliSessions,
        activeCliSessions,
      },
    });
  } catch (error) {
    console.error("Admin stats API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
}
