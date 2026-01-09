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
 * Helper to strip bp_ prefix from blueprint ID
 */
function fromBlueprintId(id: string): string {
  return id.startsWith("bp_") ? id.slice(3) : id;
}

/**
 * POST /api/hierarchies/[id]/blueprints
 * Add an existing blueprint to this hierarchy
 * 
 * Body:
 * - blueprintId: string (required) - bp_xxx or just xxx
 * - repositoryPath: string (required) - path within the repository (e.g., "packages/core/AGENTS.md")
 * - parentId?: string - parent blueprint ID for nested structure
 */
export async function POST(
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

    // Check hierarchy ownership
    const hierarchy = await prismaUsers.hierarchy.findUnique({
      where: { id: hierarchyId },
      select: { userId: true, name: true },
    });

    if (!hierarchy) {
      return NextResponse.json({ error: "Hierarchy not found" }, { status: 404 });
    }

    if (hierarchy.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { blueprintId, repositoryPath, parentId } = body;

    // Validate required fields
    if (!blueprintId) {
      return NextResponse.json(
        { error: "Blueprint ID is required" },
        { status: 400 }
      );
    }

    if (!repositoryPath || typeof repositoryPath !== "string") {
      return NextResponse.json(
        { error: "Repository path is required" },
        { status: 400 }
      );
    }

    const bpId = fromBlueprintId(blueprintId);

    // Check blueprint ownership
    const blueprint = await prismaUsers.userTemplate.findUnique({
      where: { id: bpId },
      select: { userId: true, hierarchyId: true, name: true },
    });

    if (!blueprint) {
      return NextResponse.json({ error: "Blueprint not found" }, { status: 404 });
    }

    if (blueprint.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only add your own blueprints to a hierarchy" },
        { status: 403 }
      );
    }

    // Check if blueprint is already in another hierarchy
    if (blueprint.hierarchyId && blueprint.hierarchyId !== hierarchyId) {
      return NextResponse.json(
        { error: "Blueprint is already part of another hierarchy. Remove it first." },
        { status: 409 }
      );
    }

    // Validate parent if provided
    let parentBpId: string | null = null;
    if (parentId) {
      parentBpId = fromBlueprintId(parentId);
      const parent = await prismaUsers.userTemplate.findUnique({
        where: { id: parentBpId },
        select: { hierarchyId: true },
      });

      if (!parent) {
        return NextResponse.json(
          { error: "Parent blueprint not found" },
          { status: 404 }
        );
      }

      if (parent.hierarchyId !== hierarchyId) {
        return NextResponse.json(
          { error: "Parent blueprint must be in the same hierarchy" },
          { status: 400 }
        );
      }
    }

    // Update blueprint to add it to the hierarchy
    const updated = await prismaUsers.userTemplate.update({
      where: { id: bpId },
      data: {
        hierarchyId,
        repositoryPath: repositoryPath.trim(),
        parentId: parentBpId,
      },
      select: {
        id: true,
        name: true,
        type: true,
        repositoryPath: true,
        parentId: true,
        visibility: true,
      },
    });

    return NextResponse.json({
      blueprint: {
        id: `bp_${updated.id}`,
        name: updated.name,
        type: updated.type,
        repositoryPath: updated.repositoryPath,
        parentId: updated.parentId ? `bp_${updated.parentId}` : null,
        visibility: updated.visibility,
      },
      message: `Blueprint "${updated.name}" added to hierarchy "${hierarchy.name}"`,
    });
  } catch (error) {
    console.error("POST /api/hierarchies/[id]/blueprints error:", error);
    return NextResponse.json(
      { error: "Failed to add blueprint to hierarchy" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/hierarchies/[id]/blueprints
 * Remove a blueprint from this hierarchy (doesn't delete the blueprint)
 * 
 * Body:
 * - blueprintId: string (required) - bp_xxx or just xxx
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

    // Check hierarchy ownership
    const hierarchy = await prismaUsers.hierarchy.findUnique({
      where: { id: hierarchyId },
      select: { userId: true, name: true },
    });

    if (!hierarchy) {
      return NextResponse.json({ error: "Hierarchy not found" }, { status: 404 });
    }

    if (hierarchy.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { blueprintId } = body;

    if (!blueprintId) {
      return NextResponse.json(
        { error: "Blueprint ID is required" },
        { status: 400 }
      );
    }

    const bpId = fromBlueprintId(blueprintId);

    // Check blueprint is in this hierarchy
    const blueprint = await prismaUsers.userTemplate.findUnique({
      where: { id: bpId },
      select: { userId: true, hierarchyId: true, name: true },
    });

    if (!blueprint) {
      return NextResponse.json({ error: "Blueprint not found" }, { status: 404 });
    }

    if (blueprint.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (blueprint.hierarchyId !== hierarchyId) {
      return NextResponse.json(
        { error: "Blueprint is not part of this hierarchy" },
        { status: 400 }
      );
    }

    // Remove blueprint from hierarchy
    await prismaUsers.userTemplate.update({
      where: { id: bpId },
      data: {
        hierarchyId: null,
        repositoryPath: null,
        parentId: null,
      },
    });

    // Also update any children to remove their parent reference
    await prismaUsers.userTemplate.updateMany({
      where: { parentId: bpId },
      data: { parentId: null },
    });

    return NextResponse.json({
      success: true,
      message: `Blueprint "${blueprint.name}" removed from hierarchy "${hierarchy.name}"`,
    });
  } catch (error) {
    console.error("DELETE /api/hierarchies/[id]/blueprints error:", error);
    return NextResponse.json(
      { error: "Failed to remove blueprint from hierarchy" },
      { status: 500 }
    );
  }
}
