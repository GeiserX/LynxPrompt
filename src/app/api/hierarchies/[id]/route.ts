import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";

/**
 * Helper to strip ha_ prefix from hierarchy ID
 */
function fromHierarchyId(id: string): string {
  return id.startsWith("ha_") ? id.slice(3) : id;
}

/**
 * GET /api/hierarchies/[id]
 * Get a specific hierarchy with its blueprints
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const hierarchyId = fromHierarchyId(id);

    const hierarchy = await prismaUsers.hierarchy.findUnique({
      where: { id: hierarchyId },
      include: {
        blueprints: {
          orderBy: { repositoryPath: "asc" },
          select: {
            id: true,
            name: true,
            type: true,
            repositoryPath: true,
            parentId: true,
            visibility: true,
            downloads: true,
            favorites: true,
            createdAt: true,
          },
        },
      },
    });

    if (!hierarchy) {
      return NextResponse.json({ error: "Hierarchy not found" }, { status: 404 });
    }

    if (hierarchy.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      hierarchy: {
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
          repositoryPath: bp.repositoryPath,
          parentId: bp.parentId ? `bp_${bp.parentId}` : null,
          visibility: bp.visibility,
          downloads: bp.downloads,
          favorites: bp.favorites,
          createdAt: bp.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/hierarchies/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch hierarchy" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/hierarchies/[id]
 * Update a hierarchy (name, description)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const hierarchyId = fromHierarchyId(id);

    // Check ownership
    const hierarchy = await prismaUsers.hierarchy.findUnique({
      where: { id: hierarchyId },
      select: { userId: true },
    });

    if (!hierarchy) {
      return NextResponse.json({ error: "Hierarchy not found" }, { status: 404 });
    }

    if (hierarchy.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description } = body;

    // Build update data
    const updateData: { name?: string; description?: string | null } = {};
    
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2) {
        return NextResponse.json(
          { error: "Name must be at least 2 characters" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }
    
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updated = await prismaUsers.hierarchy.update({
      where: { id: hierarchyId },
      data: updateData,
    });

    return NextResponse.json({
      hierarchy: {
        id: `ha_${updated.id}`,
        name: updated.name,
        description: updated.description,
        repositoryRoot: updated.repositoryRoot,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error("PATCH /api/hierarchies/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update hierarchy" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/hierarchies/[id]
 * Delete a hierarchy (unlinks blueprints but doesn't delete them)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const hierarchyId = fromHierarchyId(id);

    // Check ownership
    const hierarchy = await prismaUsers.hierarchy.findUnique({
      where: { id: hierarchyId },
      select: { userId: true, name: true, _count: { select: { blueprints: true } } },
    });

    if (!hierarchy) {
      return NextResponse.json({ error: "Hierarchy not found" }, { status: 404 });
    }

    if (hierarchy.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Unlink all blueprints first (set hierarchyId to null)
    await prismaUsers.userTemplate.updateMany({
      where: { hierarchyId },
      data: { hierarchyId: null, parentId: null },
    });

    // Delete hierarchy
    await prismaUsers.hierarchy.delete({
      where: { id: hierarchyId },
    });

    return NextResponse.json({
      success: true,
      message: `Hierarchy "${hierarchy.name}" deleted. ${hierarchy._count.blueprints} blueprint(s) unlinked.`,
    });
  } catch (error) {
    console.error("DELETE /api/hierarchies/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete hierarchy" },
      { status: 500 }
    );
  }
}
