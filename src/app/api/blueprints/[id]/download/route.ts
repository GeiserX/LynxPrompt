import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { prismaApp } from "@/lib/db-app";
import { createHash } from "crypto";

// POST /api/blueprints/[id]/download - Record a blueprint download
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  try {
    const body = await request.json().catch(() => ({}));

    // Validate platform against allowlist and max length
    const ALLOWED_PLATFORMS = [
      "web", "cli", "vscode", "cursor", "windsurf", "claude_code",
      "github_copilot", "copilot", "claude", "continue", "opencode",
      "jetbrains", "neovim", "vim", "emacs", "sublime", "atom",
    ];
    let platform: string | null = null;
    if (body.platform && typeof body.platform === "string") {
      const normalized = body.platform.trim().toLowerCase().slice(0, 50);
      if (ALLOWED_PLATFORMS.includes(normalized)) {
        platform = normalized;
      }
    }

    // Determine template type from ID prefix
    const templateType = id.startsWith("sys_") ? "system" : "user";

    // Deduplicate: check for recent download from same IP + template in the last hour
    const clientIP = request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const ipHash = createHash("sha256").update(clientIP).digest("hex").substring(0, 16);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentDownload = await prismaUsers.templateDownload.findFirst({
      where: {
        templateId: id,
        templateType,
        ipHash,
        createdAt: { gte: oneHourAgo },
      },
      select: { id: true },
    });

    if (recentDownload) {
      // Already counted within the last hour - skip recording
      return NextResponse.json({ success: true });
    }

    // Record the download (can be anonymous)
    await prismaUsers.templateDownload.create({
      data: {
        userId: session?.user?.id || null,
        templateId: id,
        templateType,
        platform,
        ipHash,
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

// GET /api/blueprints/[id]/download - Get download stats
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const templateType = id.startsWith("sys_") ? "system" : "user";

  try {
    // For user blueprints, verify the requester owns it or it's public
    if (templateType === "user") {
      const template = await prismaUsers.userTemplate.findUnique({
        where: { id },
        select: { visibility: true, userId: true, teamId: true },
      });
      if (!template) {
        return NextResponse.json({ total: 0, byPlatform: {} });
      }
      if (template.visibility !== "PUBLIC") {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const isOwner = template.userId === session.user.id;
        let isTeamMember = false;
        if (template.teamId) {
          const membership = await prismaUsers.teamMember.findUnique({
            where: { teamId_userId: { teamId: template.teamId, userId: session.user.id } },
          });
          isTeamMember = !!membership;
        }
        if (!isOwner && !isTeamMember) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
    }

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