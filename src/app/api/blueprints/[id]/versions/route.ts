import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { BLUEPRINT_ACCESS_SELECT, isOwnerOrTeamMember } from "@/lib/blueprint-access";

// GET /api/blueprints/[id]/versions - Get version history for a blueprint
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Only user templates have versions
    if (!id.startsWith("bp_")) {
      return NextResponse.json({
        versions: [],
        totalVersions: 0,
      });
    }

    const realId = id.replace("bp_", "");

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

    // The owner and the blueprint's team see every version
    const hasFullAccess = await isOwnerOrTeamMember(blueprint, session?.user?.id);

    // For non-owners, only show published versions of public blueprints
    const whereClause: { templateId: string; isPublished?: boolean } = {
      templateId: realId,
    };

    if (!hasFullAccess) {
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

    if (!id.startsWith("bp_")) {
      return NextResponse.json(
        { error: "System blueprints don't have versions" },
        { status: 400 }
      );
    }

    const realId = id.replace("bp_", "");

    // Check access
    const blueprint = await prismaUsers.userTemplate.findUnique({
      where: { id: realId },
      select: BLUEPRINT_ACCESS_SELECT,
    });

    if (!blueprint) {
      return NextResponse.json(
        { error: "Blueprint not found" },
        { status: 404 }
      );
    }

    const session = await getServerSession(authOptions);
    // Same rule as the version list above: the owner and the blueprint's team
    // see every version, everyone else only published versions of public ones
    const hasFullAccess = await isOwnerOrTeamMember(blueprint, session?.user?.id);

    if (!hasFullAccess && !blueprint.isPublic) {
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

    // Outsiders can only see published versions
    if (!hasFullAccess && !version.isPublished) {
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








// DELETE /api/blueprints/[id]/versions - Delete one old version
// Body: { versionNumber }. Owner only. An old version keeps whatever its
// content held, such as a secret removed in a later edit, so the owner needs
// a way to remove it. The current version is the blueprint's content and
// cannot be deleted here.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id.startsWith("bp_")) {
      return NextResponse.json(
        { error: "System blueprints don't have versions" },
        { status: 400 }
      );
    }
    const realId = id.replace("bp_", "");

    const body = await request.json().catch(() => ({}));
    const versionNumber = body?.versionNumber;
    if (!Number.isInteger(versionNumber) || versionNumber < 1) {
      return NextResponse.json({ error: "versionNumber is required" }, { status: 400 });
    }

    const blueprint = await prismaUsers.userTemplate.findUnique({
      where: { id: realId },
      select: { userId: true, currentVersion: true, publishedVersion: true },
    });
    // Same answer for a missing blueprint and someone else's
    if (!blueprint || blueprint.userId !== session.user.id) {
      return NextResponse.json({ error: "Blueprint not found" }, { status: 404 });
    }

    if (versionNumber === blueprint.currentVersion) {
      return NextResponse.json(
        { error: "The current version cannot be deleted. Edit the blueprint instead." },
        { status: 400 }
      );
    }

    const deleted = await prismaUsers.$transaction(async (tx) => {
      const { count } = await tx.userTemplateVersion.deleteMany({
        where: { templateId: realId, version: versionNumber },
      });
      if (count === 0) return false;

      // publishedVersion must name a version that still exists
      if (blueprint.publishedVersion === versionNumber) {
        const latestPublished = await tx.userTemplateVersion.findFirst({
          where: { templateId: realId, isPublished: true },
          orderBy: { version: "desc" },
          select: { version: true },
        });
        await tx.userTemplate.update({
          where: { id: realId },
          data: { publishedVersion: latestPublished?.version ?? null },
        });
      }
      return true;
    });

    if (!deleted) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blueprint version:", error);
    return NextResponse.json(
      { error: "Failed to delete version" },
      { status: 500 }
    );
  }
}
