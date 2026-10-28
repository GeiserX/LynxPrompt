import { NextRequest, NextResponse } from "next/server";
import { posix as posixPath } from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { detectSensitiveData, type SensitiveMatch } from "@/lib/sensitive-data";
import { normalizeBlueprintType } from "@/lib/blueprint-rules";
import { contentChecksum } from "@/lib/content-checksum";
import { parsePage } from "@/lib/pagination";
import { checkBlueprintLineCount, BLUEPRINT_LIMITS } from "@/lib/subscription";

/**
 * Determine tier based on total word count (all content including comments/headers).
 */
function sanitizeRepositoryPath(input: string | null | undefined): string | null {
  if (!input?.trim()) return null;
  const normalized = posixPath.normalize(input.trim()).replace(/^[/\\]+/, "");
  if (normalized.startsWith("..") || normalized.includes("/..")) return null;
  return normalized || null;
}

function determineTier(content: string): "SHORT" | "INTERMEDIATE" | "LONG" | "SUPERLONG" {
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  
  if (wordCount <= 200) return "SHORT";
  if (wordCount <= 800) return "INTERMEDIATE";
  if (wordCount <= 2500) return "LONG";
  return "SUPERLONG";
}

// GET: List blueprints with search, sort, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Special case: check if user owns a blueprint with a specific name
    const checkOwned = searchParams.get("checkOwned") === "true";
    const nameToCheck = searchParams.get("name");
    
    if (checkOwned && nameToCheck) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ existingId: null });
      }
      
      const existing = await prismaUsers.userTemplate.findFirst({
        where: {
          userId: session.user.id,
          name: nameToCheck,
        },
        select: { id: true },
      });
      
      return NextResponse.json({ existingId: existing?.id || null });
    }
    
    const sort = searchParams.get("sort") || "popular";
    const search = searchParams.get("q") || "";
    const category = searchParams.get("category");
    const tier = searchParams.get("tier");
    const typeFilter = searchParams.get("type"); // "configs" or "commands"
    const tagsParam = searchParams.get("tags");
    const { limit, skip } = parsePage(searchParams, 12);

    // Build sort order
    let orderBy: Record<string, "asc" | "desc"> = {};
    switch (sort) {
      case "popular":
        orderBy = { downloads: "desc" };
        break;
      case "recent":
        orderBy = { createdAt: "desc" };
        break;
      case "downloads":
        orderBy = { downloads: "desc" };
        break;
      case "favorites":
        orderBy = { favorites: "desc" };
        break;
      default:
        orderBy = { downloads: "desc" };
    }

    // Build where clause
    const where: Record<string, unknown> = {
      isPublic: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { hasSome: [search.toLowerCase()] } },
      ];
    }

    // Filter by real category (web, devops, saas, etc.)
    if (category && category !== "all") {
      where.category = category;
    }

    // Filter by tier
    if (tier && tier !== "all") {
      where.tier = tier;
    }

    // Filter by tags
    if (tagsParam) {
      const tagsList = tagsParam.split(",").map(t => t.trim().toLowerCase());
      where.tags = { hasSome: tagsList };
    }

    // Filter by type (configs vs commands)
    const COMMAND_TYPES = [
      "CURSOR_COMMAND", "CLAUDE_COMMAND", "WINDSURF_WORKFLOW", 
      "COPILOT_PROMPT", "CONTINUE_PROMPT", "OPENCODE_COMMAND"
    ];
    if (typeFilter === "commands") {
      where.type = { in: COMMAND_TYPES };
    } else if (typeFilter === "configs") {
      where.type = { notIn: COMMAND_TYPES };
    }

    // Get total count for pagination
    const total = await prismaUsers.userTemplate.count({ where });

    // Fetch blueprints with pagination
    const blueprints = await prismaUsers.userTemplate.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        tier: true,
        category: true,
        tags: true,
        downloads: true,
        favorites: true,
        isOfficial: true,
        aiAssisted: true,
        createdAt: true,
        userId: true,
        user: {
          select: {
            name: true,
            displayName: true,
            isProfilePublic: true,
          },
        },
      },
    });

    // Get popular tags from ALL public blueprints (for the filter sidebar)
    const allBlueprints = await prismaUsers.userTemplate.findMany({
      where: { isPublic: true },
      select: { tags: true },
    });
    
    // Count tag frequency
    const tagCounts: Record<string, number> = {};
    for (const t of allBlueprints) {
      for (const tag of t.tags || []) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
    
    // Sort by frequency and get top 20
    const popularTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag]) => tag);

    let userId: string | null = null;
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
    }

    // Format response
    const formattedBlueprints = blueprints.map((t) => {
      
      const isOwner = userId ? t.userId === userId : false;
      
      return {
        id: `bp_${t.id}`,
        name: t.name,
        description: t.description || "",
        author: t.user?.displayName || t.user?.name || "Anonymous",
        authorId: (t.user?.isProfilePublic || t.userId === userId) ? t.userId : undefined,
        downloads: t.downloads,
        likes: t.favorites,
        tags: t.tags || [],
        tier: t.tier,
        type: t.type,
        category: t.category || "other",
        isOfficial: t.isOfficial || false,
        aiAssisted: t.aiAssisted || false,
        isOwner,
      };
    });

    return NextResponse.json({
      templates: formattedBlueprints,
      popularTags,
      total,
      hasMore: skip + blueprints.length < total,
    });
  } catch (error) {
    console.error("Error fetching blueprints:", error);
    return NextResponse.json(
      { error: "Failed to fetch blueprints", templates: [], popularTags: [], total: 0, hasMore: false },
      { status: 500 }
    );
  }
}

// POST: Create a new blueprint
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      content, 
      type, 
      category = "other",
      tags, 
      isPublic, // DEPRECATED: only read when visibility is absent
      visibility, // PRIVATE, TEAM, or PUBLIC
      teamId = null, // If visibility is TEAM, this should be set
      aiAssisted = false,
      showcaseUrl,
      turnstileToken,
      sensitiveDataAcknowledged = false, // User acknowledged sensitive data warning
      // Hierarchy fields for monorepo AGENTS.md support
      hierarchyId = null, // Hierarchy ID (ha_xxx)
      repositoryRoot = null, // Repository identifier; finds or creates the caller's hierarchy
      parentId = null, // Parent blueprint ID for nested AGENTS.md
      repositoryPath = null, // Relative path within repo (e.g., "packages/core/AGENTS.md")
    } = body;
    
    // Validate visibility. A caller that still sends only the deprecated
    // isPublic flag publishes with it; anything else unrecognised is private.
    const validVisibilities = ["PRIVATE", "TEAM", "PUBLIC"];
    const normalizedVisibility = validVisibilities.includes(visibility)
      ? visibility
      : isPublic === true
        ? "PUBLIC"
        : "PRIVATE";
    
    // If visibility is TEAM, verify user belongs to the team
    if (normalizedVisibility === "TEAM" && teamId) {
      const membership = await prismaUsers.teamMember.findUnique({
        where: {
          teamId_userId: { teamId, userId: session.user.id },
        },
      });
      if (!membership) {
        return NextResponse.json(
          { error: "You are not a member of this team" },
          { status: 403 }
        );
      }
    }
    
    // isPublic mirrors visibility and never disagrees with it
    const effectiveIsPublic = normalizedVisibility === "PUBLIC";

    // Validation
    if (!name || typeof name !== "string" || name.trim().length < 3) {
      return NextResponse.json(
        { error: "Title must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string" || content.trim().length < 10) {
      return NextResponse.json(
        { error: "Content must be at least 10 characters" },
        { status: 400 }
      );
    }

    // Check line count limit (all tiers)
    const lineCheck = checkBlueprintLineCount(content);
    if (!lineCheck.valid) {
      return NextResponse.json(
        { 
          error: `Blueprint exceeds maximum line limit. Your blueprint has ${lineCheck.lineCount.toLocaleString()} lines, but the maximum is ${lineCheck.maxLines.toLocaleString()} lines.` 
        },
        { status: 400 }
      );
    }

    const maxBlueprints = BLUEPRINT_LIMITS.MAX_COUNT;

    // Count user's existing blueprints
    const existingBlueprintCount = await prismaUsers.userTemplate.count({
      where: { userId: session.user.id },
    });

    if (existingBlueprintCount >= maxBlueprints) {
      return NextResponse.json(
        { 
          error: `You have reached the maximum number of blueprints (${maxBlueprints.toLocaleString()}). Contact the administrator for a higher limit.`,
          limit: maxBlueprints,
          current: existingBlueprintCount,
        },
        { status: 403 }
      );
    }

    // Validate type - accept exact type or normalize from old formats
    const normalizedType = normalizeBlueprintType(type);

    // Validate category
    const validCategories = ["web", "fullstack", "devops", "mobile", "saas", "data", "api", "other"];
    const normalizedCategory = validCategories.includes(category) ? category : "other";

    // Validate tags (optional, max 10 tags, each max 30 chars)
    const validatedTags: string[] = [];
    if (tags && Array.isArray(tags)) {
      for (const tag of tags.slice(0, 10)) {
        if (
          typeof tag === "string" &&
          tag.trim().length > 0 &&
          tag.trim().length <= 30
        ) {
          validatedTags.push(tag.trim().toLowerCase());
        }
      }
    }

    // Auto-determine tier based on EFFECTIVE content lines
    const tier = determineTier(content);

    // Check for sensitive data in public blueprints
    // Only block if user hasn't acknowledged the warning
    if (effectiveIsPublic && !sensitiveDataAcknowledged) {
      const sensitiveMatches = detectSensitiveData(content);
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

    // Validate showcaseUrl if provided
    // Accept common user input like "github.com/user/repo" by prepending https://
    let validatedShowcaseUrl: string | null = null;
    if (showcaseUrl && typeof showcaseUrl === "string" && showcaseUrl.trim()) {
      const trimmedUrl = showcaseUrl.trim();
      const candidate = /^https?:\/\//i.test(trimmedUrl)
        ? trimmedUrl
        : `https://${trimmedUrl}`;
      try {
        const url = new URL(candidate);
        if (url.protocol === "http:" || url.protocol === "https:") {
          validatedShowcaseUrl = candidate;
        }
      } catch {
        // Invalid URL, ignore it
      }
    }

    // Validate parentId if provided - must be owned by the same user
    let validatedParentId: string | null = null;
    if (parentId && typeof parentId === "string") {
      const parentBlueprint = await prismaUsers.userTemplate.findFirst({
        where: {
          id: parentId,
          userId: session.user.id,
        },
        select: { id: true },
      });
      if (parentBlueprint) {
        validatedParentId = parentBlueprint.id;
      }
    }

    // Link to a hierarchy only the caller owns. An explicit hierarchyId must be
    // theirs; otherwise a repositoryRoot finds or creates their hierarchy for it.
    let validatedHierarchyId: string | null = null;
    if (typeof hierarchyId === "string" && hierarchyId.trim()) {
      const rawHierarchyId = hierarchyId.trim();
      const hierarchy = await prismaUsers.hierarchy.findFirst({
        where: {
          id: rawHierarchyId.startsWith("ha_") ? rawHierarchyId.slice(3) : rawHierarchyId,
          userId: session.user.id,
        },
        select: { id: true },
      });
      validatedHierarchyId = hierarchy?.id ?? null;
    } else if (typeof repositoryRoot === "string" && repositoryRoot.trim()) {
      const root = repositoryRoot.trim();
      const hierarchy = await prismaUsers.hierarchy.upsert({
        where: { userId_repositoryRoot: { userId: session.user.id, repositoryRoot: root } },
        update: {},
        create: { userId: session.user.id, repositoryRoot: root, name: root },
        select: { id: true },
      });
      validatedHierarchyId = hierarchy.id;
    }

    // Create the blueprint and its version 1 in one write
    const blueprint = await prismaUsers.userTemplate.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        description: description?.trim() || null,
        content: content.trim(),
        type: normalizedType,
        category: normalizedCategory,
        tier,
        tags: validatedTags,
        isPublic: effectiveIsPublic,
        visibility: normalizedVisibility as "PRIVATE" | "TEAM" | "PUBLIC",
        teamId: normalizedVisibility === "TEAM" ? teamId : null,
        aiAssisted: Boolean(aiAssisted),
        downloads: 0,
        favorites: 0,
        showcaseUrl: validatedShowcaseUrl,
        currentVersion: 1,
        publishedVersion: effectiveIsPublic ? 1 : null, // Set publishedVersion if public
        // Hierarchy fields
        hierarchyId: validatedHierarchyId,
        parentId: validatedParentId,
        repositoryPath: sanitizeRepositoryPath(repositoryPath) || null,
        contentChecksum: contentChecksum(content),
        versions: {
          create: {
            version: 1,
            content: content.trim(),
            variables: undefined,
            changelog: "Initial version",
            isPublished: effectiveIsPublic,
            createdBy: session.user.id,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      template: {
        id: blueprint.id,
        name: blueprint.name,
        tier: blueprint.tier,
        category: blueprint.category,
        version: 1,
        // Hierarchy info
        hierarchyId: blueprint.hierarchyId,
        parentId: blueprint.parentId,
        repositoryPath: blueprint.repositoryPath,
      },
    });
  } catch (error) {
    console.error("Error creating blueprint:", error);
    return NextResponse.json(
      { error: "Failed to create blueprint. Please try again." },
      { status: 500 }
    );
  }
}
