import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { prismaApp } from "@/lib/db-app";

// POST /api/templates/[id]/download - Record a template download
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  try {
    const body = await request.json().catch(() => ({}));
    const platform = body.platform || null;

    // Determine template type from ID prefix
    const templateType = id.startsWith("sys_") ? "system" : "user";

    // Record the download (can be anonymous)
    await prismaUsers.templateDownload.create({
      data: {
        userId: session?.user?.id || null,
        templateId: id,
        templateType,
        platform,
      },
    });

    // Increment downloads count on template
    if (templateType === "system") {
      await prismaApp.systemTemplate.update({
        where: { id },
        data: { downloads: { increment: 1 } },
      });
    } else {
      await prismaUsers.userTemplate.update({
        where: { id },
        data: { downloads: { increment: 1 } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording download:", error);
    // Don't fail the download just because tracking failed
    return NextResponse.json({ success: true });
  }
}

// GET /api/templates/[id]/download - Get download stats
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const templateType = id.startsWith("sys_") ? "system" : "user";

  try {
    // Get total downloads
    const downloadCount = await prismaUsers.templateDownload.count({
      where: {
        templateId: id,
        templateType,
      },
    });

    // Get downloads by platform
    const platformStats = await prismaUsers.templateDownload.groupBy({
      by: ["platform"],
      where: {
        templateId: id,
        templateType,
      },
      _count: true,
    });

    return NextResponse.json({
      total: downloadCount,
      byPlatform: platformStats.reduce(
        (acc, stat) => {
          if (stat.platform) {
            acc[stat.platform] = stat._count;
          }
          return acc;
        },
        {} as Record<string, number>
      ),
    });
  } catch (error) {
    console.error("Error fetching download stats:", error);
    return NextResponse.json({ total: 0, byPlatform: {} });
  }
}

