import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";

interface DailyDownloads {
  date: string;
  downloads: number;
  ownDownloads: number;
}

interface PlatformStat {
  platform: string;
  count: number;
}

interface BlueprintPerformance {
  id: string;
  name: string;
  downloads: number;
  favorites: number;
}

interface ActivityHeatmap {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  hour: number; // 0-23
  count: number;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all user's template IDs for filtering downloads
    const userTemplates = await prismaUsers.userTemplate.findMany({
      where: { userId },
      select: { id: true, name: true, downloads: true, favorites: true },
    });
    const userTemplateIds = userTemplates.map((t) => t.id);

    // Get all downloads related to this user (last 90 days for more data)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const downloads = await prismaUsers.templateDownload.findMany({
      where: {
        OR: [
          { userId }, // Downloads by this user
          {
            templateId: { in: userTemplateIds.map((id) => `usr_${id}`) },
            templateType: "user",
          }, // Downloads of user's templates
        ],
        createdAt: { gte: ninetyDaysAgo },
      },
      select: {
        id: true,
        templateId: true,
        templateType: true,
        platform: true,
        createdAt: true,
        userId: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Process downloads over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyDownloadsMap = new Map<string, DailyDownloads>();

    // Initialize all 30 days with zero values
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      dailyDownloadsMap.set(dateStr, {
        date: dateStr,
        downloads: 0,
        ownDownloads: 0,
      });
    }

    // Fill in actual download counts
    downloads
      .filter((d) => d.createdAt >= thirtyDaysAgo)
      .forEach((download) => {
        const dateStr = download.createdAt.toISOString().split("T")[0];
        const entry = dailyDownloadsMap.get(dateStr);
        if (entry) {
          // Check if this is a download of user's own template
          const templateIdWithoutPrefix = download.templateId.replace(
            /^usr_/,
            ""
          );
          const isOwnTemplate = userTemplateIds.includes(
            templateIdWithoutPrefix
          );

          if (isOwnTemplate && download.userId !== userId) {
            // Someone else downloaded user's template
            entry.downloads += 1;
          } else if (download.userId === userId) {
            // User downloaded something
            entry.ownDownloads += 1;
          }
        }
      });

    const dailyDownloads: DailyDownloads[] = Array.from(
      dailyDownloadsMap.values()
    );

    // Process platform distribution
    const platformMap = new Map<string, number>();
    downloads.forEach((d) => {
      if (d.platform) {
        const platform = d.platform;
        platformMap.set(platform, (platformMap.get(platform) || 0) + 1);
      }
    });

    const platformStats: PlatformStat[] = Array.from(platformMap.entries())
      .map(([platform, count]) => ({ platform, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6); // Top 6 platforms

    // Blueprint performance (user's templates)
    const blueprintPerformance: BlueprintPerformance[] = userTemplates
      .map((t) => ({
        id: t.id,
        name: t.name.length > 20 ? t.name.substring(0, 20) + "..." : t.name,
        downloads: t.downloads,
        favorites: t.favorites,
      }))
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, 8); // Top 8 blueprints

    // Activity heatmap (day of week x hour)
    const heatmapMap = new Map<string, number>();

    // Initialize all cells
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        heatmapMap.set(`${day}-${hour}`, 0);
      }
    }

    // Fill with actual data
    downloads.forEach((d) => {
      const date = new Date(d.createdAt);
      const day = date.getUTCDay();
      const hour = date.getUTCHours();
      const key = `${day}-${hour}`;
      heatmapMap.set(key, (heatmapMap.get(key) || 0) + 1);
    });

    const activityHeatmap: ActivityHeatmap[] = Array.from(
      heatmapMap.entries()
    ).map(([key, count]) => {
      const [day, hour] = key.split("-").map(Number);
      return { dayOfWeek: day, hour, count };
    });

    // Calculate summary stats
    const totalDownloadsReceived = downloads.filter((d) => {
      const templateIdWithoutPrefix = d.templateId.replace(/^usr_/, "");
      return (
        userTemplateIds.includes(templateIdWithoutPrefix) &&
        d.userId !== userId
      );
    }).length;

    const totalDownloadsMade = downloads.filter(
      (d) => d.userId === userId
    ).length;

    return NextResponse.json({
      dailyDownloads,
      platformStats,
      blueprintPerformance,
      activityHeatmap,
      summary: {
        totalDownloadsReceived,
        totalDownloadsMade,
        topPlatform:
          platformStats.length > 0 ? platformStats[0].platform : null,
        mostActiveDay: getMostActiveDay(activityHeatmap),
      },
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}

function getMostActiveDay(heatmap: ActivityHeatmap[]): string {
  const dayTotals = new Map<number, number>();

  heatmap.forEach((h) => {
    dayTotals.set(h.dayOfWeek, (dayTotals.get(h.dayOfWeek) || 0) + h.count);
  });

  let maxDay = 0;
  let maxCount = 0;
  dayTotals.forEach((count, day) => {
    if (count > maxCount) {
      maxCount = count;
      maxDay = day;
    }
  });

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[maxDay];
}







