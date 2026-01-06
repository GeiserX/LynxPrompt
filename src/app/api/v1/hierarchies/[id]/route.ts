import { NextRequest, NextResponse } from "next/server";
import { prismaUsers } from "@/lib/db-users";
import {
  validateApiToken,
  checkTokenExpiration,
  hasPermission,
  canUseApi,
  toHierarchyApiId,
  fromHierarchyApiId,
  toBlueprintApiId,
} from "@/lib/api-tokens";

/**
 * GET /api/v1/hierarchies/[id]
 * Get a hierarchy with all its blueprints (tree structure)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");
    
    // Check for expired token first
    const expirationCheck = await checkTokenExpiration(authHeader);
    if (expirationCheck.isExpired) {
      return NextResponse.json(
        {
          error: "Token expired",
          expired_at: expirationCheck.expiredAt?.toISOString(),
          message: "Your API token has expired. Please generate a new token at https://lynxprompt.com/settings?tab=api-tokens",
        },
        { status: 401 }
      );
    }

    // Validate token
    const tokenData = await validateApiToken(authHeader);
    if (!tokenData) {
      return NextResponse.json(
        { error: "Invalid or missing API token" },
        { status: 401 }
      );
    }

    // Check subscription
    if (!canUseApi(tokenData.user.subscriptionPlan)) {
      return NextResponse.json(
        { error: "API access requires a subscription" },
        { status: 403 }
      );
    }

    // Check permission
    if (!hasPermission(tokenData.role, "blueprints:read")) {
      return NextResponse.json(
        { error: "Token does not have blueprints:read permission" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const hierarchyId = fromHierarchyApiId(id);

    // Fetch hierarchy with all blueprints
    const hierarchy = await prismaUsers.hierarchy.findUnique({
      where: { id: hierarchyId },
      include: {
        blueprints: {
          orderBy: { repositoryPath: "asc" },
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            tier: true,
            repositoryPath: true,
            parentId: true,
            contentChecksum: true,
            visibility: true,
            downloads: true,
            favorites: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!hierarchy) {
      return NextResponse.json(
        { error: "Hierarchy not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (hierarchy.userId !== tokenData.userId) {
      return NextResponse.json(
        { error: "Forbidden - you don't own this hierarchy" },
        { status: 403 }
      );
    }

    // Build tree structure
    const rootBlueprints: typeof hierarchy.blueprints = [];
    const childrenMap = new Map<string, typeof hierarchy.blueprints>();

    for (const bp of hierarchy.blueprints) {
      if (!bp.parentId) {
        rootBlueprints.push(bp);
      } else {
        const children = childrenMap.get(bp.parentId) || [];
        children.push(bp);
        childrenMap.set(bp.parentId, children);
      }
    }

    // Define explicit return type to avoid recursive inference issue
    interface FormattedBlueprint {
      id: string;
      name: string;
      description: string | null;
      type: string;
      tier: string;
      repository_path: string | null;
      parent_id: string | null;
      content_checksum: string | null;
      visibility: string;
      downloads: number;
      favorites: number;
      created_at: string;
      updated_at: string;
      children: FormattedBlueprint[];
    }

    // Format blueprint for response
    const formatBlueprint = (bp: typeof hierarchy.blueprints[0]): FormattedBlueprint => ({
      id: toBlueprintApiId(bp.id),
      name: bp.name,
      description: bp.description,
      type: bp.type,
      tier: bp.tier,
      repository_path: bp.repositoryPath,
      parent_id: bp.parentId ? toBlueprintApiId(bp.parentId) : null,
      content_checksum: bp.contentChecksum,
      visibility: bp.visibility,
      downloads: bp.downloads,
      favorites: bp.favorites,
      created_at: bp.createdAt.toISOString(),
      updated_at: bp.updatedAt.toISOString(),
      children: (childrenMap.get(bp.id) || []).map(formatBlueprint),
    });

    return NextResponse.json({
      hierarchy: {
        id: toHierarchyApiId(hierarchy.id),
        name: hierarchy.name,
        description: hierarchy.description,
        repository_root: hierarchy.repositoryRoot,
        created_at: hierarchy.createdAt.toISOString(),
        updated_at: hierarchy.updatedAt.toISOString(),
      },
      // Flat list of all blueprints
      blueprints: hierarchy.blueprints.map(bp => ({
        id: toBlueprintApiId(bp.id),
        name: bp.name,
        description: bp.description,
        type: bp.type,
        tier: bp.tier,
        repository_path: bp.repositoryPath,
        parent_id: bp.parentId ? toBlueprintApiId(bp.parentId) : null,
        content_checksum: bp.contentChecksum,
        visibility: bp.visibility,
        downloads: bp.downloads,
        favorites: bp.favorites,
        created_at: bp.createdAt.toISOString(),
        updated_at: bp.updatedAt.toISOString(),
      })),
      // Tree structure for easier traversal
      tree: rootBlueprints.map(formatBlueprint),
      total_blueprints: hierarchy.blueprints.length,
    });
  } catch (error) {
    console.error("API v1 GET /hierarchies/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/hierarchies/[id]
 * Update hierarchy name or description
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");
    
    // Check for expired token first
    const expirationCheck = await checkTokenExpiration(authHeader);
    if (expirationCheck.isExpired) {
      return NextResponse.json(
        {
          error: "Token expired",
          expired_at: expirationCheck.expiredAt?.toISOString(),
          message: "Your API token has expired. Please generate a new token at https://lynxprompt.com/settings?tab=api-tokens",
        },
        { status: 401 }
      );
    }

    // Validate token
    const tokenData = await validateApiToken(authHeader);
    if (!tokenData) {
      return NextResponse.json(
        { error: "Invalid or missing API token" },
        { status: 401 }
      );
    }

    // Check subscription
    if (!canUseApi(tokenData.user.subscriptionPlan)) {
      return NextResponse.json(
        { error: "API access requires a subscription" },
        { status: 403 }
      );
    }

    // Check permission
    if (!hasPermission(tokenData.role, "blueprints:write")) {
      return NextResponse.json(
        { error: "Token does not have blueprints:write permission" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const hierarchyId = fromHierarchyApiId(id);

    // Parse body
    const body = await request.json();
    const { name, description } = body;

    // Validate at least one field is provided
    if (!name && description === undefined) {
      return NextResponse.json(
        { error: "At least one field (name or description) is required" },
        { status: 400 }
      );
    }

    // Check ownership
    const hierarchy = await prismaUsers.hierarchy.findUnique({
      where: { id: hierarchyId },
      select: { userId: true, name: true },
    });

    if (!hierarchy) {
      return NextResponse.json(
        { error: "Hierarchy not found" },
        { status: 404 }
      );
    }

    if (hierarchy.userId !== tokenData.userId) {
      return NextResponse.json(
        { error: "Forbidden - you don't own this hierarchy" },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: { name?: string; description?: string | null } = {};
    if (name) {
      if (typeof name !== "string" || name.length < 1 || name.length > 100) {
        return NextResponse.json(
          { error: "Name must be a string between 1 and 100 characters" },
          { status: 400 }
        );
      }
      updateData.name = name;
    }
    if (description !== undefined) {
      if (description !== null && (typeof description !== "string" || description.length > 500)) {
        return NextResponse.json(
          { error: "Description must be a string of max 500 characters or null" },
          { status: 400 }
        );
      }
      updateData.description = description;
    }

    // Update hierarchy
    const updated = await prismaUsers.hierarchy.update({
      where: { id: hierarchyId },
      data: updateData,
    });

    return NextResponse.json({
      hierarchy: {
        id: toHierarchyApiId(updated.id),
        name: updated.name,
        description: updated.description,
        repository_root: updated.repositoryRoot,
        created_at: updated.createdAt.toISOString(),
        updated_at: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("API v1 PATCH /hierarchies/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/hierarchies/[id]
 * Delete a hierarchy (unlinks blueprints but doesn't delete them)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");
    
    // Check for expired token first
    const expirationCheck = await checkTokenExpiration(authHeader);
    if (expirationCheck.isExpired) {
      return NextResponse.json(
        {
          error: "Token expired",
          expired_at: expirationCheck.expiredAt?.toISOString(),
          message: "Your API token has expired. Please generate a new token at https://lynxprompt.com/settings?tab=api-tokens",
        },
        { status: 401 }
      );
    }

    // Validate token
    const tokenData = await validateApiToken(authHeader);
    if (!tokenData) {
      return NextResponse.json(
        { error: "Invalid or missing API token" },
        { status: 401 }
      );
    }

    // Check subscription
    if (!canUseApi(tokenData.user.subscriptionPlan)) {
      return NextResponse.json(
        { error: "API access requires a subscription" },
        { status: 403 }
      );
    }

    // Check permission
    if (!hasPermission(tokenData.role, "blueprints:write")) {
      return NextResponse.json(
        { error: "Token does not have blueprints:write permission" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const hierarchyId = fromHierarchyApiId(id);

    // Check ownership
    const hierarchy = await prismaUsers.hierarchy.findUnique({
      where: { id: hierarchyId },
      select: { userId: true, name: true, _count: { select: { blueprints: true } } },
    });

    if (!hierarchy) {
      return NextResponse.json(
        { error: "Hierarchy not found" },
        { status: 404 }
      );
    }

    if (hierarchy.userId !== tokenData.userId) {
      return NextResponse.json(
        { error: "Forbidden - you don't own this hierarchy" },
        { status: 403 }
      );
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
    console.error("API v1 DELETE /hierarchies/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

