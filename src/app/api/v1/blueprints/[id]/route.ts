import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prismaUsers } from "@/lib/db-users";
import { contentChecksum } from "@/lib/content-checksum";
import { APP_URL } from "@/lib/feature-flags";
import {
  validateApiToken,
  checkTokenExpiration,
  hasPermission,
  toBlueprintApiId,
  fromBlueprintApiId,
  toHierarchyApiId,
} from "@/lib/api-tokens";
import { canEditBlueprint, canReadBlueprint, isOwnerOrTeamMember } from "@/lib/blueprint-access";
import { publicRepositoryPath } from "@/lib/repository-path";
import {
  checkBlueprintContent,
  normalizeBlueprintType,
  retiredTypeError,
  skillContentError,
  resolveBlueprintTeamId,
} from "@/lib/blueprint-rules";

// If-None-Match may list several tags, or "*"; tags compare weakly (RFC 9110 13.1.2)
function ifNoneMatchHits(header: string | null, etag: string): boolean {
  if (!header) return false;
  const bare = (tag: string) => tag.trim().replace(/^W\//, "");
  return header.split(",").some((tag) => tag.trim() === "*" || bare(tag) === bare(etag));
}

/**
 * GET /api/v1/blueprints/[id]
 * Get a single blueprint with full content. Sends an ETag and answers
 * If-None-Match with 304 when the blueprint has not changed.
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
          message: `Your API token has expired. Please generate a new token at ${APP_URL}/settings?tab=api-tokens`,
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

    // Check permission
    if (!hasPermission(tokenData.role, "blueprints:read")) {
      return NextResponse.json(
        { error: "Token does not have blueprints:read permission" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const blueprintId = fromBlueprintApiId(id);

    // Fetch blueprint
    const blueprint = await prismaUsers.userTemplate.findUnique({
      where: { id: blueprintId },
      select: {
        id: true,
        userId: true,
        name: true,
        description: true,
        content: true,
        type: true,
        tier: true,
        category: true,
        tags: true,
        visibility: true,
        isPublic: true,
        teamId: true,
        variables: true,
        downloads: true,
        favorites: true,
        aiAssisted: true,
        showcaseUrl: true,
        createdAt: true,
        updatedAt: true,
        // Hierarchy fields
        hierarchyId: true,
        parentId: true,
        repositoryPath: true,
      },
    });

    if (!blueprint) {
      return NextResponse.json(
        { error: "Blueprint not found" },
        { status: 404 }
      );
    }

    // Public blueprints, your own, and your teams' blueprints are readable
    if (!(await canReadBlueprint(blueprint, tokenData.userId))) {
      return NextResponse.json(
        { error: "Forbidden - you don't have access to this blueprint" },
        { status: 403 }
      );
    }

    const body = JSON.stringify({
      blueprint: {
        id: toBlueprintApiId(blueprint.id),
        name: blueprint.name,
        description: blueprint.description,
        content: blueprint.content,
        type: blueprint.type,
        tier: blueprint.tier,
        category: blueprint.category,
        tags: blueprint.tags,
        visibility: blueprint.visibility,
        variables: blueprint.variables,
        downloads: blueprint.downloads,
        favorites: blueprint.favorites,
        ai_assisted: blueprint.aiAssisted,
        showcase_url: blueprint.showcaseUrl,
        created_at: blueprint.createdAt.toISOString(),
        updated_at: blueprint.updatedAt.toISOString(),
        // Hierarchy fields
        hierarchy_id: blueprint.hierarchyId ? toHierarchyApiId(blueprint.hierarchyId) : null,
        parent_id: blueprint.parentId ? toBlueprintApiId(blueprint.parentId) : null,
        // In full only for the owner and the team: its folders can name the
        // owner's projects (see publicRepositoryPath)
        repository_path: (await isOwnerOrTeamMember(blueprint, tokenData.userId))
          ? blueprint.repositoryPath
          : publicRepositoryPath(blueprint.repositoryPath),
        content_checksum: contentChecksum(blueprint.content),
      },
    });

    // A client that already holds this exact response (sync, editors polling
    // for changes) gets a 304 with no body. Checked only after the token and
    // access checks above, so a 304 never answers for a blueprint the caller
    // cannot read.
    const etag = `W/"${createHash("sha256").update(body).digest("hex").slice(0, 32)}"`;
    const headers = {
      ETag: etag,
      // The answer depends on the token, so shared caches must not keep it
      "Cache-Control": "private, no-cache",
      Vary: "Authorization",
    };
    if (ifNoneMatchHits(request.headers.get("if-none-match"), etag)) {
      return new NextResponse(null, { status: 304, headers });
    }
    return new NextResponse(body, {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API v1 GET /blueprints/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/blueprints/[id]
 * Update a blueprint
 * 
 * Body (all optional):
 * - name?: string
 * - content?: string
 * - description?: string
 * - type?: string
 * - category?: string
 * - tags?: string[]
 * - visibility?: "PRIVATE" | "TEAM" | "PUBLIC"
 * - expected_checksum?: string (for optimistic locking - if provided, must match current checksum)
 */
export async function PUT(
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
          message: `Your API token has expired. Please generate a new token at ${APP_URL}/settings?tab=api-tokens`,
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

    // Check permission
    if (!hasPermission(tokenData.role, "blueprints:write")) {
      return NextResponse.json(
        { error: "Token does not have blueprints:write permission" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const blueprintId = fromBlueprintApiId(id);

    // Check ownership first and get current checksum for optimistic locking
    const existing = await prismaUsers.userTemplate.findUnique({
      where: { id: blueprintId },
      select: {
        userId: true,
        content: true,
        contentChecksum: true,
        isPublic: true,
        visibility: true,
        teamId: true,
        currentVersion: true,
        type: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Blueprint not found" },
        { status: 404 }
      );
    }

    if (!(await canEditBlueprint(existing, tokenData.userId))) {
      return NextResponse.json(
        { error: "Forbidden - you don't own this blueprint or admin its team" },
        { status: 403 }
      );
    }

    const body = await request.json();
    // Support base64-encoded content to bypass WAF false positives on markdown/code blocks
    const decodedContent = body.content_base64
      ? Buffer.from(body.content_base64, "base64").toString("utf-8")
      : body.content;
    const {
      name,
      description,
      type,
      category,
      tags,
      visibility,
      expected_checksum,
      team_id,
      sensitive_data_acknowledged = false,
    } = body;
    const content = decodedContent;

    // Optimistic locking: if expected_checksum is provided, verify it matches.
    // Compare against the checksum of the content as stored now, not the
    // contentChecksum column: rows written before every route kept that
    // column up to date can hold a stale value or none at all.
    const currentChecksum = contentChecksum(existing.content);
    if (expected_checksum && expected_checksum !== currentChecksum) {
      return NextResponse.json(
        {
          error: "Conflict - blueprint has been modified",
          message: "The blueprint has been modified since you last pulled it. Pull the latest version and try again, or use force=true to overwrite.",
          current_checksum: currentChecksum,
          expected_checksum: expected_checksum,
        },
        { status: 409 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 3) {
        return NextResponse.json(
          { error: "Name must be at least 3 characters" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (content !== undefined) {
      if (typeof content !== "string" || content.trim().length < 10) {
        return NextResponse.json(
          { error: "Content must be at least 10 characters" },
          { status: 400 }
        );
      }
      // Stored as sent, so a pulled file keeps its final newline
      updateData.content = content;

      // Recalculate tier based on word count
      const wordCount = content.split(/\s+/).filter(Boolean).length;

      if (wordCount > 2500) updateData.tier = "SUPERLONG";
      else if (wordCount > 800) updateData.tier = "LONG";
      else if (wordCount > 200) updateData.tier = "INTERMEDIATE";
      else updateData.tier = "SHORT";

      // Update checksum
      updateData.contentChecksum = contentChecksum(content);
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (type !== undefined) {
      updateData.type = normalizeBlueprintType(type);
      // An old blueprint keeps its retired type; none may move into one
      const retiredError =
        updateData.type !== existing.type ? retiredTypeError(updateData.type as string) : null;
      if (retiredError) {
        return NextResponse.json({ error: retiredError }, { status: 400 });
      }
    }

    if (category !== undefined) {
      updateData.category = category;
    }

    if (tags !== undefined) {
      const validatedTags: string[] = [];
      if (Array.isArray(tags)) {
        for (const tag of tags.slice(0, 10)) {
          if (typeof tag === "string" && tag.trim().length > 0 && tag.trim().length <= 30) {
            validatedTags.push(tag.trim().toLowerCase());
          }
        }
      }
      updateData.tags = validatedTags;
    }

    if (visibility !== undefined) {
      const validVisibilities = ["PRIVATE", "TEAM", "PUBLIC"];
      const normalizedVisibility = validVisibilities.includes(visibility.toUpperCase())
        ? visibility.toUpperCase()
        : "PRIVATE";
      updateData.visibility = normalizedVisibility;
      updateData.isPublic = normalizedVisibility === "PUBLIC";

      // A TEAM blueprint needs a team, or no teammate can ever see it
      if (normalizedVisibility === "TEAM" && (team_id || !existing.teamId)) {
        const team = await resolveBlueprintTeamId(tokenData.userId, team_id);
        if (!team.ok) {
          return NextResponse.json({ error: team.error }, { status: team.status });
        }
        updateData.teamId = team.teamId;
      }
      // A private blueprint keeps no team, same as one created private
      if (normalizedVisibility === "PRIVATE") {
        updateData.teamId = null;
      }
    }

    if (updateData.content !== undefined || updateData.type !== undefined) {
      const skillError = skillContentError(
        (updateData.type as string | undefined) ?? existing.type,
        typeof updateData.content === "string" ? updateData.content : existing.content
      );
      if (skillError) {
        return NextResponse.json({ error: skillError }, { status: 400 });
      }
    }

    const willBePublic =
      updateData.isPublic !== undefined ? Boolean(updateData.isPublic) : existing.isPublic;
    const newContent =
      typeof updateData.content === "string" ? updateData.content : existing.content;
    if (updateData.content !== undefined || willBePublic !== existing.isPublic) {
      const contentCheck = checkBlueprintContent(newContent, {
        willBePublic,
        sensitiveDataAcknowledged: sensitive_data_acknowledged === true,
        type: (updateData.type as string | undefined) ?? existing.type,
      });
      if (!contentCheck.ok) {
        return NextResponse.json(contentCheck.body, { status: contentCheck.status });
      }
    }

    // Every content change gets a version, so CLI edits can be reverted.
    // Whitespace at the ends is not a change: rows stored trimmed get their
    // final newline back on the next push without a new version.
    const contentChanged =
      typeof updateData.content === "string" &&
      updateData.content.trim() !== existing.content.trim();
    const newVersion = existing.currentVersion + 1;
    if (contentChanged) {
      updateData.currentVersion = newVersion;
      if (willBePublic) {
        updateData.publishedVersion = newVersion;
      }
    }

    // Update blueprint
    const blueprint = await prismaUsers.userTemplate.update({
      where: { id: blueprintId },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        content: true,
        type: true,
        tier: true,
        category: true,
        tags: true,
        visibility: true,
        createdAt: true,
        updatedAt: true,
        hierarchyId: true,
        parentId: true,
        repositoryPath: true,
      },
    });

    if (contentChanged) {
      await prismaUsers.userTemplateVersion.create({
        data: {
          templateId: blueprintId,
          version: newVersion,
          content: newContent,
          variables: undefined,
          changelog: "Updated via API",
          isPublished: willBePublic,
          createdBy: tokenData.userId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      blueprint: {
        id: toBlueprintApiId(blueprint.id),
        name: blueprint.name,
        description: blueprint.description,
        content: blueprint.content,
        type: blueprint.type,
        tier: blueprint.tier,
        category: blueprint.category,
        tags: blueprint.tags,
        visibility: blueprint.visibility,
        created_at: blueprint.createdAt.toISOString(),
        updated_at: blueprint.updatedAt.toISOString(),
        hierarchy_id: blueprint.hierarchyId ? toHierarchyApiId(blueprint.hierarchyId) : null,
        parent_id: blueprint.parentId ? toBlueprintApiId(blueprint.parentId) : null,
        repository_path: blueprint.repositoryPath,
        content_checksum: contentChecksum(blueprint.content),
      },
    });
  } catch (error) {
    console.error("API v1 PUT /blueprints/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/blueprints/[id]
 * Delete a blueprint
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
          message: `Your API token has expired. Please generate a new token at ${APP_URL}/settings?tab=api-tokens`,
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

    // Check permission
    if (!hasPermission(tokenData.role, "blueprints:write")) {
      return NextResponse.json(
        { error: "Token does not have blueprints:write permission" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const blueprintId = fromBlueprintApiId(id);

    // Check ownership first
    const existing = await prismaUsers.userTemplate.findUnique({
      where: { id: blueprintId },
      select: { userId: true, name: true, visibility: true, teamId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Blueprint not found" },
        { status: 404 }
      );
    }

    if (!(await canEditBlueprint(existing, tokenData.userId))) {
      return NextResponse.json(
        { error: "Forbidden - you don't own this blueprint or admin its team" },
        { status: 403 }
      );
    }

    // Favorites and downloads point at the blueprint by a plain id with no
    // foreign key, so remove them with it. Versions cascade in the schema.
    // Download rows keep the id as the client sent it (bp_ prefix), favorites
    // keep the bare id; match both forms for downloads.
    await prismaUsers.$transaction([
      prismaUsers.templateDownload.deleteMany({
        where: { templateId: { in: [blueprintId, toBlueprintApiId(blueprintId)] }, templateType: "user" },
      }),
      prismaUsers.templateFavorite.deleteMany({ where: { templateId: blueprintId, templateType: "user" } }),
      prismaUsers.userTemplate.delete({ where: { id: blueprintId } }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Blueprint "${existing.name}" deleted successfully`,
    });
  } catch (error) {
    console.error("API v1 DELETE /blueprints/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
