import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTemplateById, incrementTemplateUsage } from "@/lib/data/templates";
import { prismaUsers } from "@/lib/db-users";
import { detectSensitiveData } from "@/lib/sensitive-data";

// GET /api/blueprints/[id] - Get blueprint details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = await getTemplateById(id);

    if (!template) {
      return NextResponse.json(
        { error: "Blueprint not found" },
        { status: 404 }
      );
    }

    // Ensure showcaseUrl is always returned (even if older codepaths didn't include it)
    // This fixes cases where the URL exists in Postgres but isn't serialized to clients.
    let showcaseUrl: string | null | undefined = (template as any).showcaseUrl;
    let currentVersion = 1;
    let publishedVersion: number | null = null;
    
    if (id.startsWith("bp_")) {
      const realId = id.replace("bp_", "");
      const row = await prismaUsers.userTemplate.findUnique({
        where: { id: realId },
        select: { showcaseUrl: true, currentVersion: true, publishedVersion: true },
      });
      if (showcaseUrl === undefined) {
        showcaseUrl = row?.showcaseUrl ?? null;
      }
      currentVersion = row?.currentVersion ?? 1;
      publishedVersion = row?.publishedVersion ?? null;
    } else {
      if (showcaseUrl === undefined) {
        showcaseUrl = null;
      }
    }

    const templateWithShowcase = { ...template, showcaseUrl, currentVersion, publishedVersion };

    let isOwner = false;

    const session = await getServerSession(authOptions);

    if (session?.user?.id) {
      if (templateWithShowcase.authorId === session.user.id) {
        isOwner = true;
      }
    }

    // Increment usage count (only for views, not just listing)
    await incrementTemplateUsage(id);

    return NextResponse.json({
      ...templateWithShowcase,
      isOwner,
    });
  } catch (error) {
    console.error("Error fetching blueprint:", error);
    return NextResponse.json(
      { error: "Failed to fetch blueprint" },
      { status: 500 }
    );
  }
}

// Blueprint type options for validation
const BLUEPRINT_TYPES = [
  "AGENTS_MD",
  "CLAUDE_MD",
  "COPILOT_INSTRUCTIONS",
  "WINDSURF_RULES",
  "CLINE_RULES",
  "CODEX_MD",
  "CURSOR_RULES",
  "CURSORRULES", // Legacy - backwards compat
  "CUSTOM",
] as const;

type BlueprintType = (typeof BLUEPRINT_TYPES)[number];

/**
 * Determine tier based on total word count (all content including comments/headers).
 */
function determineTier(content: string): "SHORT" | "INTERMEDIATE" | "LONG" | "SUPERLONG" {
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  
  if (wordCount <= 200) return "SHORT";
  if (wordCount <= 800) return "INTERMEDIATE";
  if (wordCount <= 2500) return "LONG";
  return "SUPERLONG";
}

// PUT /api/blueprints/[id] - Update blueprint (owner only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Only user templates can be edited
    if (!id.startsWith("bp_")) {
      return NextResponse.json(
        { error: "System blueprints cannot be edited" },
        { status: 403 }
      );
    }

    const realId = id.replace("bp_", "");

    // Check if user owns this blueprint
    const existingBlueprint = await prismaUsers.userTemplate.findUnique({
      where: { id: realId },
      select: { userId: true, currentVersion: true, content: true, isPublic: true },
    });

    if (!existingBlueprint) {
      return NextResponse.json(
        { error: "Blueprint not found" },
        { status: 404 }
      );
    }

    if (existingBlueprint.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only edit your own blueprints" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      content, 
      type, 
      category,
      tags, 
      isPublic, 
      showcaseUrl,
      sensitiveDataAcknowledged = false, // User acknowledged sensitive data warning
      publishNewVersion = false, // If true, create a new version
      changelog, // Optional changelog for new version
    } = body;

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 3) {
        return NextResponse.json(
          { error: "Title must be at least 3 characters" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (content !== undefined) {
      if (typeof content !== "string" || content.trim().length < 10) {
        return NextResponse.json(
          { error: "Content must be at least 10 characters" },
          { status: 400 }
        );
      }
      updateData.content = content.trim();
      // Re-calculate tier when content changes
      updateData.tier = determineTier(content);
    }

    if (type !== undefined) {
      let normalizedType: BlueprintType = "CUSTOM";
      const upperType = (type || "").toUpperCase().replace(/-/g, "_");
      if (upperType.includes("CURSOR")) normalizedType = "CURSOR_RULES";
      else if (upperType.includes("CLAUDE")) normalizedType = "CLAUDE_MD";
      else if (upperType.includes("COPILOT")) normalizedType = "COPILOT_INSTRUCTIONS";
      else if (upperType.includes("WINDSURF")) normalizedType = "WINDSURF_RULES";
      else if (upperType.includes("AGENT")) normalizedType = "AGENTS_MD";
      updateData.type = normalizedType;
    }

    if (category !== undefined) {
      const validCategories = ["web", "fullstack", "devops", "mobile", "saas", "data", "api", "other"];
      updateData.category = validCategories.includes(category) ? category : "other";
    }

    if (tags !== undefined && Array.isArray(tags)) {
      const validatedTags: string[] = [];
      for (const tag of tags.slice(0, 10)) {
        if (typeof tag === "string" && tag.trim().length > 0 && tag.trim().length <= 30) {
          validatedTags.push(tag.trim().toLowerCase());
        }
      }
      updateData.tags = validatedTags;
    }

    if (isPublic !== undefined) {
      updateData.isPublic = Boolean(isPublic);
    }

    if (showcaseUrl !== undefined) {
      if (showcaseUrl && typeof showcaseUrl === "string" && showcaseUrl.trim()) {
        const trimmedUrl = showcaseUrl.trim();
        const candidate = /^https?:\/\//i.test(trimmedUrl)
          ? trimmedUrl
          : `https://${trimmedUrl}`;
        try {
          const url = new URL(candidate);
          updateData.showcaseUrl =
            url.protocol === "http:" || url.protocol === "https:"
              ? candidate
              : null;
        } catch {
          // Invalid URL, set to null
          updateData.showcaseUrl = null;
        }
      } else {
        updateData.showcaseUrl = null;
      }
    }

    // Check for sensitive data in public blueprints
    // Use the new content if provided, otherwise check if making existing content public
    const contentToCheck = content?.trim() || (await prismaUsers.userTemplate.findUnique({
      where: { id: realId },
      select: { content: true },
    }))?.content;

    const willBePublic = isPublic !== undefined ? Boolean(isPublic) : (await prismaUsers.userTemplate.findUnique({
      where: { id: realId },
      select: { isPublic: true },
    }))?.isPublic;

    if (willBePublic && contentToCheck && !sensitiveDataAcknowledged) {
      const sensitiveMatches = detectSensitiveData(contentToCheck);
      if (sensitiveMatches.length > 0) {
        return NextResponse.json(
          {
            error: "Sensitive data detected",
            requiresAcknowledgment: true,
            sensitiveData: sensitiveMatches,
            message: `Found ${sensitiveMatches.length} potential sensitive item(s). Please review and confirm you want to proceed.`,
          },
          { status: 409 } // Conflict - requires user action
        );
      }
    }

    // Check if content changed and if we should create a new version
    const contentChanged = content !== undefined && content.trim() !== existingBlueprint.content;
    const shouldCreateVersion = publishNewVersion && contentChanged;
    
    // Calculate new version number
    const newVersion = shouldCreateVersion ? existingBlueprint.currentVersion + 1 : existingBlueprint.currentVersion;
    
    // Add version info to update data if creating new version
    if (shouldCreateVersion) {
      updateData.currentVersion = newVersion;
      // If making public, also update publishedVersion
      const willBePublic = isPublic !== undefined ? Boolean(isPublic) : existingBlueprint.isPublic;
      if (willBePublic) {
        updateData.publishedVersion = newVersion;
      }
    }

    // Update the blueprint
    const updatedBlueprint = await prismaUsers.userTemplate.update({
      where: { id: realId },
      data: updateData,
    });

    // Create new version record if content changed and publishNewVersion is true
    if (shouldCreateVersion) {
      await prismaUsers.userTemplateVersion.create({
        data: {
          templateId: realId,
          version: newVersion,
          content: content.trim(),
          variables: undefined,
          changelog: changelog || null,
          isPublished: Boolean(updateData.isPublic ?? existingBlueprint.isPublic),
          createdBy: session.user.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      blueprint: {
        id: `bp_${updatedBlueprint.id}`,
        name: updatedBlueprint.name,
        tier: updatedBlueprint.tier,
        category: updatedBlueprint.category,
        version: newVersion,
        versionCreated: shouldCreateVersion,
      },
    });
  } catch (error) {
    console.error("Error updating blueprint:", error);
    return NextResponse.json(
      { error: "Failed to update blueprint. Please try again." },
      { status: 500 }
    );
  }
}

// DELETE /api/blueprints/[id] - Delete blueprint (owner only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Only user templates can be deleted
    if (!id.startsWith("bp_")) {
      return NextResponse.json(
        { error: "System blueprints cannot be deleted" },
        { status: 403 }
      );
    }

    const realId = id.replace("bp_", "");

    // Check if user owns this blueprint
    const existingBlueprint = await prismaUsers.userTemplate.findUnique({
      where: { id: realId },
      select: { userId: true },
    });

    if (!existingBlueprint) {
      return NextResponse.json(
        { error: "Blueprint not found" },
        { status: 404 }
      );
    }

    if (existingBlueprint.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only delete your own blueprints" },
        { status: 403 }
      );
    }

    // Delete the blueprint
    await prismaUsers.userTemplate.delete({
      where: { id: realId },
    });

    return NextResponse.json({
      success: true,
      message: "Blueprint deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting blueprint:", error);
    return NextResponse.json(
      { error: "Failed to delete blueprint. Please try again." },
      { status: 500 }
    );
  }
}