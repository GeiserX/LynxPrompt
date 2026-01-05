import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { prismaApp } from "@/lib/db-app";
import { prismaSupport } from "@/lib/db-support";

// Subscription plan prices in cents (monthly)
const PLAN_PRICES = {
  FREE: 0,
  TEAMS: 3000, // €30/seat
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is SUPERADMIN
    if (session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query params for date range
    const searchParams = req.nextUrl.searchParams;
    const daysBack = parseInt(searchParams.get("days") || "30", 10);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    startDate.setHours(0, 0, 0, 0);

    // Filter to exclude test/seed users (dev-test-*@lynxprompt.com and dev@lynxprompt.com)
    const excludeTestUsers = {
      NOT: {
        OR: [
          { email: { startsWith: "dev-test-" } },
          { email: "dev@lynxprompt.com" },
        ],
      },
    };

    // ===== USER STATS =====
    
    // Current user counts by subscription plan (excluding test users)
    const usersByPlan = await prismaUsers.user.groupBy({
      by: ["subscriptionPlan"],
      where: excludeTestUsers,
      _count: { id: true },
    });

    const currentPlanCounts: Record<string, number> = {
      FREE: 0,
      TEAMS: 0,
    };
    usersByPlan.forEach((row) => {
      // Cast to string to handle legacy PRO/MAX values in database
      const plan = row.subscriptionPlan as string;
      // Map legacy PRO/MAX to FREE (Users) for stats
      if (plan === "FREE" || plan === "PRO" || plan === "MAX") {
        currentPlanCounts["FREE"] = (currentPlanCounts["FREE"] || 0) + row._count.id;
      } else if (plan === "TEAMS") {
        currentPlanCounts["TEAMS"] = (currentPlanCounts["TEAMS"] || 0) + row._count.id;
      } else {
        currentPlanCounts[plan] = row._count.id;
      }
    });

    // Total users
    const totalUsers = Object.values(currentPlanCounts).reduce((a, b) => a + b, 0);

    // Users created over time (for the chart) - excluding test users
    const allUsers = await prismaUsers.user.findMany({
      where: {
        createdAt: { gte: startDate },
        ...excludeTestUsers,
      },
      select: {
        id: true,
        createdAt: true,
        subscriptionPlan: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Group users by date and plan for time series
    const userTimeSeries: Record<string, Record<string, number>> = {};
    
    // Initialize all days
    for (let i = daysBack; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      userTimeSeries[dateStr] = { FREE: 0, TEAMS: 0 };
    }

    // Fill with actual data (map legacy PRO/MAX to FREE)
    allUsers.forEach((user) => {
      const dateStr = user.createdAt.toISOString().split("T")[0];
      if (userTimeSeries[dateStr]) {
        const plan = user.subscriptionPlan;
        if (plan === "TEAMS") {
          userTimeSeries[dateStr]["TEAMS"]++;
        } else {
          // Map FREE, PRO, MAX to FREE (Users tier)
          userTimeSeries[dateStr]["FREE"]++;
        }
      }
    });

    // Convert to array format for charts
    const userGrowthData = Object.entries(userTimeSeries).map(([date, counts]) => ({
      date,
      ...counts,
      total: Object.values(counts).reduce((a, b) => a + b, 0),
    }));

    // New users this period
    const newUsersThisPeriod = allUsers.length;

    // Users by role (excluding test users)
    const usersByRole = await prismaUsers.user.groupBy({
      by: ["role"],
      where: excludeTestUsers,
      _count: { id: true },
    });

    // ===== REVENUE STATS =====
    
    // Calculate estimated MRR (Monthly Recurring Revenue)
    // Note: Pro/Max plans have been deprecated - revenue now only from Teams
    
    // Teams revenue (count active team members)
    const activeTeamMembers = await prismaUsers.teamMember.count({
      where: { isActiveThisCycle: true },
    });

    // Count of free users (for display in revenue breakdown)
    const activeFreeUsers = currentPlanCounts["FREE"] || 0;

    const estimatedMRR = activeTeamMembers * PLAN_PRICES.TEAMS;

    // Blueprint purchases revenue
    const purchasesInPeriod = await prismaUsers.blueprintPurchase.aggregate({
      where: { createdAt: { gte: startDate } },
      _sum: { amount: true, platformFee: true },
      _count: { id: true },
    });

    // ===== BLUEPRINT STATS =====
    
    // Filter to exclude blueprints from test users
    const excludeTestUserBlueprints = {
      user: {
        NOT: {
          OR: [
            { email: { startsWith: "dev-test-" } },
            { email: "dev@lynxprompt.com" },
          ],
        },
      },
    };

    // Total blueprints (excluding test users)
    const totalBlueprints = await prismaUsers.userTemplate.count({
      where: excludeTestUserBlueprints,
    });
    const publicBlueprints = await prismaUsers.userTemplate.count({
      where: { visibility: "PUBLIC", ...excludeTestUserBlueprints },
    });
    const paidBlueprints = await prismaUsers.userTemplate.count({
      where: { price: { gt: 0 }, ...excludeTestUserBlueprints },
    });

    // System templates
    const systemTemplates = await prismaApp.systemTemplate.count();

    // Top downloaded blueprints (excluding test users)
    const topBlueprints = await prismaUsers.userTemplate.findMany({
      where: excludeTestUserBlueprints,
      take: 10,
      orderBy: { downloads: "desc" },
      select: {
        id: true,
        name: true,
        downloads: true,
        favorites: true,
        price: true,
        user: { select: { displayName: true, name: true } },
      },
    });

    // Downloads over time (excluding downloads by test users)
    const downloads = await prismaUsers.templateDownload.findMany({
      where: {
        createdAt: { gte: startDate },
        OR: [
          { userId: null }, // Anonymous downloads
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
      const dateStr = date.toISOString().split("T")[0];
      downloadsTimeSeries[dateStr] = 0;
    }
    downloads.forEach((d) => {
      const dateStr = d.createdAt.toISOString().split("T")[0];
      if (downloadsTimeSeries[dateStr] !== undefined) {
        downloadsTimeSeries[dateStr]++;
      }
    });

    const downloadGrowthData = Object.entries(downloadsTimeSeries).map(([date, count]) => ({
      date,
      downloads: count,
    }));

    // Platform distribution
    const platformCounts: Record<string, number> = {};
    downloads.forEach((d) => {
      if (d.platform) {
        platformCounts[d.platform] = (platformCounts[d.platform] || 0) + 1;
      }
    });
    const platformData = Object.entries(platformCounts)
      .map(([platform, count]) => ({ platform, count }))
      .sort((a, b) => b.count - a.count);

    // ===== TEAM STATS =====
    
    const totalTeams = await prismaUsers.team.count();
    const teamMembers = await prismaUsers.teamMember.count();
    let pendingInvitations = 0;
    try {
      pendingInvitations = await prismaUsers.teamInvitation.count({
        where: { status: "PENDING" as never },
      });
    } catch {
      // Enum query might fail
    }

    // ===== SUPPORT/COMMUNITY STATS =====
    
    let supportStats = {
      totalPosts: 0,
      openPosts: 0,
      resolvedPosts: 0,
      postsThisPeriod: 0,
    };

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
      supportStats = { totalPosts, openPosts, resolvedPosts, postsThisPeriod };
    } catch {
      // Support DB might not be available or enum issues
    }

    // ===== PAYOUT STATS =====
    
    let payoutTotalAmount = 0;
    let payoutTotalCount = 0;
    let pendingPayoutAmount = 0;
    let pendingPayoutCount = 0;
    try {
      const stats = await prismaUsers.payout.aggregate({
        _sum: { amount: true },
        _count: { id: true },
      });
      payoutTotalAmount = stats._sum.amount || 0;
      payoutTotalCount = stats._count.id;
      
      // Query pending payouts - use raw count to avoid enum issues
      pendingPayoutCount = await prismaUsers.payout.count({
        where: { status: "PENDING" as never },
      });
      const pendingSum = await prismaUsers.payout.findMany({
        where: { status: "PENDING" as never },
        select: { amount: true },
      });
      pendingPayoutAmount = pendingSum.reduce((sum, p) => sum + p.amount, 0);
    } catch {
      // Payout queries might fail due to enum issues
    }

    // ===== WIZARD DRAFTS STATS =====
    
    let wizardDrafts = 0;
    let recentDrafts = 0;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prismaAny = prismaUsers as any;
      if (prismaAny.wizardDraft) {
        // Exclude test users from wizard drafts
        const excludeTestUserDrafts = {
          user: {
            NOT: {
              OR: [
                { email: { startsWith: "dev-test-" } },
                { email: "dev@lynxprompt.com" },
              ],
            },
          },
        };
        wizardDrafts = await prismaAny.wizardDraft.count({
          where: excludeTestUserDrafts,
        });
        recentDrafts = await prismaAny.wizardDraft.count({
          where: { updatedAt: { gte: startDate }, ...excludeTestUserDrafts },
        });
      }
    } catch {
      // WizardDraft model may not exist yet
    }

    // ===== API TOKEN STATS =====
    
    const activeApiTokens = await prismaUsers.apiToken.count({
      where: {
        revokedAt: null,
        expiresAt: { gt: new Date() },
        user: {
          NOT: {
            OR: [
              { email: { startsWith: "dev-test-" } },
              { email: "dev@lynxprompt.com" },
            ],
          },
        },
      },
    });

    return NextResponse.json({
      period: {
        days: daysBack,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      },
      users: {
        total: totalUsers,
        byPlan: currentPlanCounts,
        byRole: Object.fromEntries(usersByRole.map((r) => [r.role, r._count.id])),
        newThisPeriod: newUsersThisPeriod,
        growthData: userGrowthData,
      },
      revenue: {
        estimatedMRR,
        estimatedMRRFormatted: `€${(estimatedMRR / 100).toFixed(2)}`,
        activeFree: activeFreeUsers,
        activeTeamSeats: activeTeamMembers,
        purchasesThisPeriod: {
          count: purchasesInPeriod._count.id,
          totalAmount: purchasesInPeriod._sum.amount || 0,
          platformFees: purchasesInPeriod._sum.platformFee || 0,
        },
      },
      blueprints: {
        total: totalBlueprints,
        public: publicBlueprints,
        paid: paidBlueprints,
        systemTemplates,
        topDownloaded: topBlueprints.map((b) => ({
          id: b.id,
          name: b.name,
          downloads: b.downloads,
          favorites: b.favorites,
          price: b.price,
          author: b.user.displayName || b.user.name || "Anonymous",
        })),
        downloadGrowthData,
        platformDistribution: platformData,
        totalDownloadsThisPeriod: downloads.length,
      },
      teams: {
        total: totalTeams,
        members: teamMembers,
        pendingInvitations,
      },
      support: supportStats,
      payouts: {
        totalPaid: payoutTotalAmount,
        totalCount: payoutTotalCount,
        pending: {
          amount: pendingPayoutAmount,
          count: pendingPayoutCount,
        },
      },
      engagement: {
        wizardDrafts,
        recentDrafts,
        activeApiTokens,
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

