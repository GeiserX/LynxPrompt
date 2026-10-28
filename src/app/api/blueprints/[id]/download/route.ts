import { NextRequest, NextResponse } from "next/server";
import { prismaUsers } from "@/lib/db-users";
import { prismaApp } from "@/lib/db-app";
import { hashIP } from "@/lib/ip-hash";
import { getClientIP } from "@/lib/client-ip";
import { BLUEPRINT_ACCESS_SELECT, canReadBlueprint, canReadTemplate } from "@/lib/blueprint-access";
import { COMMANDS, MCP_CONFIGS, PLATFORMS } from "@/lib/platforms";
import { getVerifiedSession, requireSession } from "@/lib/api-auth";

// Every platform id from platforms.ts, plus "command-<platform>" for slash
// command exports, "skill" for Agent Skills and the MCP target ids (what
// template-download-modal.tsx sends)
const ALLOWED_PLATFORMS = new Set<string>([
  ...PLATFORMS.map((p) => p.id),
  ...COMMANDS.map((c) => `command-${c.platformId}`),
  "skill",
  ...MCP_CONFIGS.map((c) => c.id),
]);

// POST /api/blueprints/[id]/download - Record a blueprint download
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getVerifiedSession(request);
  const { id: rawId } = await params;

  try {
    const body = await request.json().catch(() => ({}));

    // Validate platform against the platform ids the download modal sends
    let platform: string | null = null;
    if (body.platform && typeof body.platform === "string") {
      const normalized = body.platform.trim().toLowerCase().slice(0, 50);
      if (ALLOWED_PLATFORMS.has(normalized)) {
        platform = normalized;
      }
    }

    // Determine template type from ID prefix and strip prefix for DB queries
    const templateType = rawId.startsWith("sys_") ? "system" : "user";
    const dbId = rawId.startsWith("bp_") ? rawId.slice(3)
      : rawId.startsWith("sys_") ? rawId.slice(4)
      : rawId;

    // Only count downloads of a template that exists and the caller can read
    if (!(await canReadTemplate(templateType, dbId, session?.user?.id))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Deduplicate: check for recent download from same IP + template in the last hour
    const clientIP = getClientIP(request);
    const ipHash = hashIP(clientIP);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentDownload = await prismaUsers.templateDownload.findFirst({
      where: {
        templateId: rawId,
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
        templateId: rawId,
        templateType,
        platform,
        ipHash,
      },
    });

    // Increment downloads count on template — use dbId (without prefix)
    if (templateType === "system") {
      await prismaApp.systemTemplate.update({
        where: { id: dbId },
        data: { downloads: { increment: 1 } },
      });
    } else {
      await prismaUsers.userTemplate.update({
        where: { id: dbId },
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
  const { id: rawId } = await params;
  const templateType = rawId.startsWith("sys_") ? "system" : "user";
  const dbId = rawId.startsWith("bp_") ? rawId.slice(3)
    : rawId.startsWith("sys_") ? rawId.slice(4)
    : rawId;

  try {
    // For user blueprints, the stats follow the same read rule as the blueprint
    if (templateType === "user") {
      const template = await prismaUsers.userTemplate.findUnique({
        where: { id: dbId },
        select: BLUEPRINT_ACCESS_SELECT,
      });
      if (!template) {
        return NextResponse.json({ total: 0, byPlatform: {} });
      }
      if (!template.isPublic) {
        const auth = await requireSession(request);
        if (auth instanceof NextResponse) return auth;
        const { session } = auth;
        if (!(await canReadBlueprint(template, session.user.id))) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
    }

    // Get total downloads — templateDownload stores the raw ID (with bp_ prefix)
    const downloadCount = await prismaUsers.templateDownload.count({
      where: {
        templateId: rawId,
        templateType,
      },
    });

    // Get downloads by platform
    const platformStats = await prismaUsers.templateDownload.groupBy({
      by: ["platform"],
      where: {
        templateId: rawId,
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