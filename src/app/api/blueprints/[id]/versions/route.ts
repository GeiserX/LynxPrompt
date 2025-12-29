import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";

// GET /api/blueprints/[id]/versions - Get version history for a blueprint
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Only user templates have versions
    if (!id.startsWith("usr_")) {
      return NextResponse.json({
        versions: [],
        totalVersions: 0,
      });
    }

    const realId = id.replace("usr_", "");

    // Check if blueprint exists and if user has access
    const blueprint = await prismaUsers.userTemplate.findUnique({
      where: { id: realId },
      select: { 
        userId: true, 
        isPublic: true, 
        currentVersion: true,
        publishedVersion: true,
        visibility: true,
        teamId: true,
      },
    });

    if (!blueprint) {
      return NextResponse.json(
        { error: "Blueprint not found" },
        { status: 404 }
      );
    }

    const session = await getServerSession(authOptions);
    const isOwner = session?.user?.id === blueprint.userId;

    // Check team access
    let hasTeamAccess = false;
    if (session?.user?.id && blueprint.teamId) {
      const membership = await prismaUsers.teamMember.findFirst({
        where: {
          teamId: blueprint.teamId,
          userId: session.user.id,
        },
      });
      hasTeamAccess = !!membership;
    }

    // For non-owners, only show published versions of public blueprints
    const whereClause: { templateId: string; isPublished?: boolean } = {
      templateId: realId,
    };

    if (!isOwner && !hasTeamAccess) {
      if (!blueprint.isPublic) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }
      whereClause.isPublished = true;
    }

    // Fetch versions
    const versions = await prismaUsers.userTemplateVersion.findMany({
      where: whereClause,
      orderBy: { version: "desc" },
      select: {
        id: true,
        version: true,
        changelog: true,
        isPublished: true,
        createdAt: true,
        createdBy: true,
      },
    });

    return NextResponse.json({
      versions,
      totalVersions: versions.length,
      currentVersion: blueprint.currentVersion,
      publishedVersion: blueprint.publishedVersion,
      isOwner,
    });
  } catch (error) {
    console.error("Error fetching blueprint versions:", error);
    return NextResponse.json(
      { error: "Failed to fetch versions" },
      { status: 500 }
    );
  }
}

// GET specific version content
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { versionNumber } = await request.json();

    if (!id.startsWith("usr_")) {
      return NextResponse.json(
        { error: "System blueprints don't have versions" },
        { status: 400 }
      );
    }

    const realId = id.replace("usr_", "");

    // Check access
    const blueprint = await prismaUsers.userTemplate.findUnique({
      where: { id: realId },
      select: { userId: true, isPublic: true, price: true, teamId: true },
    });

    if (!blueprint) {
      return NextResponse.json(
        { error: "Blueprint not found" },
        { status: 404 }
      );
    }

    const session = await getServerSession(authOptions);
    const isOwner = session?.user?.id === blueprint.userId;

    // Check if user has purchased (for paid blueprints)
    let hasPurchased = false;
    if (session?.user?.id && blueprint.price && !isOwner) {
      const purchase = await prismaUsers.blueprintPurchase.findFirst({
        where: {
          OR: [
            { userId: session.user.id, templateId: realId },
            ...(blueprint.teamId ? [{ teamId: blueprint.teamId, templateId: realId }] : []),
          ],
        },
      });
      hasPurchased = !!purchase;
    }

    // Access control
    if (!isOwner && blueprint.price && !hasPurchased) {
      return NextResponse.json(
        { error: "Purchase required to view version content" },
        { status: 403 }
      );
    }

    if (!isOwner && !blueprint.isPublic && !hasPurchased) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Fetch specific version
    const version = await prismaUsers.userTemplateVersion.findUnique({
      where: {
        templateId_version: {
          templateId: realId,
          version: versionNumber,
        },
      },
      select: {
        id: true,
        version: true,
        content: true,
        changelog: true,
        isPublished: true,
        createdAt: true,
      },
    });

    if (!version) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }

    // Non-owners can only see published versions
    if (!isOwner && !version.isPublished) {
      return NextResponse.json(
        { error: "This version is not published" },
        { status: 403 }
      );
    }

    return NextResponse.json(version);
  } catch (error) {
    console.error("Error fetching version content:", error);
    return NextResponse.json(
      { error: "Failed to fetch version content" },
      { status: 500 }
    );
  }
}






