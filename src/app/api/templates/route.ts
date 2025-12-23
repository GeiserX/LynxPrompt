import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { verifyTurnstileToken } from "@/lib/turnstile";

// Template type options
const TEMPLATE_TYPES = [
  "CURSOR_RULES",
  "CLAUDE_MD",
  "COPILOT_INSTRUCTIONS",
  "WINDSURF_RULES",
  "AGENTS_MD",
  "CUSTOM",
] as const;

type TemplateType = (typeof TEMPLATE_TYPES)[number];

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

// GET: List templates with search, sort, and pagination
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

    // Fetch templates with pagination
    const templates = await prismaUsers.userTemplate.findMany({
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

    // Get popular tags from ALL public templates (for the filter sidebar)
    const allTemplates = await prismaUsers.userTemplate.findMany({
      where: { isPublic: true },
      select: { tags: true },
    });
    
    // Count tag frequency
    const tagCounts: Record<string, number> = {};
    for (const t of allTemplates) {
      for (const tag of t.tags || []) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
    
    // Sort by frequency and get top 20
    const popularTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag]) => tag);

    // Check if user is MAX subscriber for discount
    let isMaxUser = false;
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      const user = await prismaUsers.user.findUnique({
        where: { id: session.user.id },
        select: { subscriptionPlan: true, role: true },
      });
      isMaxUser = user?.subscriptionPlan === "MAX" || 
                  user?.role === "ADMIN" || 
                  user?.role === "SUPERADMIN";
    }

    // MAX subscribers get 10% discount
    const MAX_DISCOUNT_PERCENT = 10;

    // Format response
    const formattedTemplates = templates.map((t) => {
      const discountedPrice = isMaxUser && t.price 
        ? Math.round(t.price * (1 - MAX_DISCOUNT_PERCENT / 100))
        : null;
      
      return {
        id: `usr_${t.id}`,
        name: t.name,
        description: t.description || "",
        author: t.user?.displayName || t.user?.name || "Anonymous",
        authorId: t.user?.isProfilePublic ? t.userId : undefined,
        downloads: t.downloads,
        likes: t.favorites,
        tags: t.tags || [],
        tier: t.tier,
        category: t.category || "other",
        isOfficial: t.isOfficial || false,
        price: t.price,
        discountedPrice,
        isMaxUser,
        currency: t.currency || "EUR",
      };
    });

    return NextResponse.json({
      templates: formattedTemplates,
      popularTags,
      total,
      hasMore: skip + templates.length < total,
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates", templates: [], popularTags: [], total: 0, hasMore: false },
      { status: 500 }
    );
  }
}

// POST: Create a new user template
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
      price, 
      currency = "EUR",
      turnstileToken,
    } = body;

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

    // Verify turnstile for FREE users
    if (!isPaidUser && turnstileToken) {
      const isValid = await verifyTurnstileToken(turnstileToken);
      if (!isValid) {
        return NextResponse.json(
          { error: "Security verification failed. Please try again." },
          { status: 400 }
        );
      }
    } else if (!isPaidUser && process.env.TURNSTILE_SECRET_KEY) {
      // Require turnstile for FREE users if configured
      return NextResponse.json(
        { error: "Security verification required." },
        { status: 400 }
      );
    }

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
    let normalizedType: TemplateType = "CUSTOM";
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

    // Create the template
    const template = await prismaUsers.userTemplate.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        description: description?.trim() || null,
        content: content.trim(),
        type: normalizedType,
        category: normalizedCategory,
        tier,
        tags: validatedTags,
        isPublic: Boolean(isPublic),
        downloads: 0,
        favorites: 0,
        price: validatedPrice,
        currency: currency || "EUR",
      },
    });

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.name,
        tier: template.tier,
        category: template.category,
      },
    });
  } catch (error) {
    console.error("Error creating template:", error);
    // Return more descriptive error for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to create template: ${errorMessage}` },
      { status: 500 }
    );
  }
}
