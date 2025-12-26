import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { detectSensitiveData, type SensitiveMatch } from "@/lib/sensitive-data";

// Blueprint type options
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
 * Determine tier based on EFFECTIVE line count
 * - Ignores empty lines
 * - Ignores lines that are only whitespace
 * - Ignores lines that are only comments (# or //)
 */
function determineTier(content: string): "SIMPLE" | "INTERMEDIATE" | "ADVANCED" {
  const lines = content.split("\n");
  let effectiveLines = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines
    if (!trimmed) continue;
    // Skip comment-only lines
    if (trimmed.startsWith("#") || trimmed.startsWith("//")) continue;
    // Skip markdown headers that are empty (like "##" with nothing after)
    if (/^#{1,6}\s*$/.test(trimmed)) continue;
    effectiveLines++;
  }
  
  if (effectiveLines <= 30) return "SIMPLE";
  if (effectiveLines <= 100) return "INTERMEDIATE";
  return "ADVANCED";
}

// GET: List blueprints with search, sort, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort") || "popular";
    const search = searchParams.get("q") || "";
    const category = searchParams.get("category");
    const tier = searchParams.get("tier");
    const tagsParam = searchParams.get("tags");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const skip = (page - 1) * limit;

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
        price: true,
        currency: true,
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

    // Check if user is MAX subscriber for discount and get purchased blueprints
    let isMaxUser = false;
    let userId: string | null = null;
    let purchasedIds: Set<string> = new Set();
    
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
      const user = await prismaUsers.user.findUnique({
        where: { id: session.user.id },
        select: { subscriptionPlan: true, role: true },
      });
      isMaxUser = user?.subscriptionPlan === "MAX" || 
                  user?.role === "ADMIN" || 
                  user?.role === "SUPERADMIN";
      
      // Get all blueprints this user has purchased
      const purchases = await prismaUsers.blueprintPurchase.findMany({
        where: { userId: session.user.id },
        select: { templateId: true },
      });
      purchasedIds = new Set(purchases.map(p => p.templateId));
    }

    // MAX subscribers get 10% discount
    const MAX_DISCOUNT_PERCENT = 10;

    // Format response
    const formattedBlueprints = blueprints.map((t) => {
      const discountedPrice = isMaxUser && t.price 
        ? Math.round(t.price * (1 - MAX_DISCOUNT_PERCENT / 100))
        : null;
      
      const isOwner = userId ? t.userId === userId : false;
      const hasPurchased = purchasedIds.has(t.id);
      
      return {
        id: `usr_${t.id}`,
        name: t.name,
        description: t.description || "",
        author: t.user?.displayName || t.user?.name || "Anonymous",
        // Show authorId if user has public profile OR if viewing own blueprint
        authorId: (t.user?.isProfilePublic || t.userId === userId) ? t.userId : undefined,
        downloads: t.downloads,
        likes: t.favorites,
        tags: t.tags || [],
        tier: t.tier,
        category: t.category || "other",
        isOfficial: t.isOfficial || false,
        aiAssisted: t.aiAssisted || false,
        price: t.price,
        discountedPrice,
        isMaxUser,
        currency: t.currency || "EUR",
        isOwner,
        hasPurchased,
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
      isPublic = true,
      visibility = "PRIVATE", // PRIVATE, TEAM, or PUBLIC
      teamId = null, // If visibility is TEAM, this should be set
      aiAssisted = false,
      price, 
      currency = "EUR",
      showcaseUrl,
      turnstileToken,
      sensitiveDataAcknowledged = false, // User acknowledged sensitive data warning
    } = body;
    
    // Validate visibility
    const validVisibilities = ["PRIVATE", "TEAM", "PUBLIC"];
    const normalizedVisibility = validVisibilities.includes(visibility) ? visibility : "PRIVATE";
    
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
    
    // For backwards compatibility: derive isPublic from visibility
    const effectiveIsPublic = normalizedVisibility === "PUBLIC" || isPublic;

    // Fetch user plan to check if turnstile verification is needed
    const user = await prismaUsers.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionPlan: true, role: true },
    });

    const isPaidUser = 
      user?.subscriptionPlan === "PRO" || 
      user?.subscriptionPlan === "MAX" ||
      user?.role === "ADMIN" ||
      user?.role === "SUPERADMIN";

    // Turnstile verification is disabled for blueprint creation
    // Only kept for sign-in flows
    // If needed in future, uncomment:
    // if (!isPaidUser && turnstileToken) {
    //   const isValid = await verifyTurnstileToken(turnstileToken);
    //   if (!isValid) {
    //     return NextResponse.json(
    //       { error: "Security verification failed. Please try again." },
    //       { status: 400 }
    //     );
    //   }
    // }

    // Check if user can create paid blueprints
    if (price !== null && price !== undefined && price > 0) {
      if (!isPaidUser) {
        return NextResponse.json(
          { error: "Only PRO or MAX subscribers can create paid blueprints. Upgrade your plan to unlock this feature." },
          { status: 403 }
        );
      }
    }

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

    // Validate type - accept old formats and normalize
    let normalizedType: BlueprintType = "CUSTOM";
    const upperType = (type || "").toUpperCase().replace(/-/g, "_");
    if (upperType.includes("CURSOR")) normalizedType = "CURSOR_RULES";
    else if (upperType.includes("CLAUDE")) normalizedType = "CLAUDE_MD";
    else if (upperType.includes("COPILOT")) normalizedType = "COPILOT_INSTRUCTIONS";
    else if (upperType.includes("WINDSURF")) normalizedType = "WINDSURF_RULES";
    else if (upperType.includes("AGENT")) normalizedType = "AGENTS_MD";

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

    // Validate price if provided (minimum €5 = 500 cents)
    let validatedPrice: number | null = null;
    if (price !== null && price !== undefined) {
      const priceNum = parseInt(String(price), 10);
      if (isNaN(priceNum) || priceNum < 500) {
        return NextResponse.json(
          { error: "Minimum price is €5.00 (500 cents)" },
          { status: 400 }
        );
      }
      validatedPrice = priceNum;
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

    // Create the blueprint
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
        price: validatedPrice,
        currency: currency || "EUR",
        showcaseUrl: validatedShowcaseUrl,
      },
    });

    return NextResponse.json({
      success: true,
      template: {
        id: blueprint.id,
        name: blueprint.name,
        tier: blueprint.tier,
        category: blueprint.category,
      },
    });
  } catch (error) {
    console.error("Error creating blueprint:", error);
    // Return more descriptive error for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to create blueprint: ${errorMessage}` },
      { status: 500 }
    );
  }
}
