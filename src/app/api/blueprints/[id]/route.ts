import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTemplateById, incrementTemplateUsage } from "@/lib/data/templates";
import { prismaUsers } from "@/lib/db-users";
import { detectSensitiveData } from "@/lib/sensitive-data";

// MAX subscribers get 10% discount on paid blueprints
const MAX_DISCOUNT_PERCENT = 10;

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
    if (showcaseUrl === undefined) {
      if (id.startsWith("usr_")) {
        const realId = id.replace("usr_", "");
        const row = await prismaUsers.userTemplate.findUnique({
          where: { id: realId },
          select: { showcaseUrl: true },
        });
        showcaseUrl = row?.showcaseUrl ?? null;
      } else {
        showcaseUrl = null;
      }
    }

    const templateWithShowcase = { ...template, showcaseUrl };

    // Check if this is a paid template
    const isPaid = templateWithShowcase.price && templateWithShowcase.price > 0;
    let hasPurchased = false;
    let isMaxUser = false;
    let isOwner = false;
    let discountedPrice: number | null = null;

    const session = await getServerSession(authOptions);

    if (session?.user?.id) {
      // Check if user is the owner of this blueprint
      if (templateWithShowcase.authorId === session.user.id) {
        isOwner = true;
        hasPurchased = true; // Owners always have access
      }

      // Check user's subscription plan
      const user = await prismaUsers.user.findUnique({
        where: { id: session.user.id },
        select: { subscriptionPlan: true, role: true },
      });

      isMaxUser = user?.subscriptionPlan === "MAX" ||
                  user?.role === "ADMIN" ||
                  user?.role === "SUPERADMIN";

      // Calculate discounted price for MAX users
      if (isPaid && isMaxUser && templateWithShowcase.price) {
        discountedPrice = Math.round(
          templateWithShowcase.price * (1 - MAX_DISCOUNT_PERCENT / 100)
        );
      }

      // Check purchase only if not owner and blueprint is paid
      if (isPaid && !isOwner) {
        // Extract real template ID (remove usr_ prefix)
        const realTemplateId = id.startsWith("usr_") ? id.replace("usr_", "") : id;

        const purchase = await prismaUsers.blueprintPurchase.findUnique({
          where: {
            userId_templateId: {
              userId: session.user.id,
              templateId: realTemplateId,
            },
          },
        });

        hasPurchased = !!purchase;
      }
    }

    // If not purchased AND not owner, hide the content
    if (isPaid && !hasPurchased && !isOwner) {
      return NextResponse.json({
        ...templateWithShowcase,
        content: null, // Hide content
        isPaid: true,
        hasPurchased: false,
        isOwner: false,
        isMaxUser,
        discountedPrice,
        discountPercent: isMaxUser ? MAX_DISCOUNT_PERCENT : null,
        // Show truncated preview (first 500 chars)
        preview:
          templateWithShowcase.content?.substring(0, 500) +
          (templateWithShowcase.content && templateWithShowcase.content.length > 500
            ? "\n\n... [Purchase to view full content]"
            : ""),
      });
    }

    // Increment usage count (only for views, not just listing)
    await incrementTemplateUsage(id);

    return NextResponse.json({
      ...templateWithShowcase,
      isPaid: isPaid || false,
      hasPurchased: hasPurchased || !isPaid,
      isOwner,
      isMaxUser,
      discountedPrice: isPaid ? discountedPrice : null,
      discountPercent: isPaid && isMaxUser ? MAX_DISCOUNT_PERCENT : null,
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
 * Determine tier based on EFFECTIVE line count
 */
function determineTier(content: string): "SIMPLE" | "INTERMEDIATE" | "ADVANCED" {
  const lines = content.split("\n");
  let effectiveLines = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#") || trimmed.startsWith("//")) continue;
    if (/^#{1,6}\s*$/.test(trimmed)) continue;
    effectiveLines++;
  }
  
  if (effectiveLines <= 30) return "SIMPLE";
  if (effectiveLines <= 100) return "INTERMEDIATE";
  return "ADVANCED";
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
    if (!id.startsWith("usr_")) {
      return NextResponse.json(
        { error: "System blueprints cannot be edited" },
        { status: 403 }
      );
    }

    const realId = id.replace("usr_", "");

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
      price, 
      currency,
      showcaseUrl,
      sensitiveDataAcknowledged = false, // User acknowledged sensitive data warning
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

    if (price !== undefined) {
      // Check if user can set a price
      const user = await prismaUsers.user.findUnique({
        where: { id: session.user.id },
        select: { subscriptionPlan: true, role: true },
      });

      const isPaidUser = 
        user?.subscriptionPlan === "PRO" || 
        user?.subscriptionPlan === "MAX" ||
        user?.role === "ADMIN" ||
        user?.role === "SUPERADMIN";

      if (price !== null && price > 0) {
        if (!isPaidUser) {
          return NextResponse.json(
            { error: "Only PRO or MAX subscribers can create paid blueprints" },
            { status: 403 }
          );
        }
        const priceNum = parseInt(String(price), 10);
        if (isNaN(priceNum) || priceNum < 500) {
          return NextResponse.json(
            { error: "Minimum price is €5.00 (500 cents)" },
            { status: 400 }
          );
        }
        updateData.price = priceNum;
      } else {
        updateData.price = null;
      }
    }

    if (currency !== undefined) {
      updateData.currency = currency || "EUR";
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

    // Update the blueprint
    const updatedBlueprint = await prismaUsers.userTemplate.update({
      where: { id: realId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      blueprint: {
        id: `usr_${updatedBlueprint.id}`,
        name: updatedBlueprint.name,
        tier: updatedBlueprint.tier,
        category: updatedBlueprint.category,
      },
    });
  } catch (error) {
    console.error("Error updating blueprint:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to update blueprint: ${errorMessage}` },
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
    if (!id.startsWith("usr_")) {
      return NextResponse.json(
        { error: "System blueprints cannot be deleted" },
        { status: 403 }
      );
    }

    const realId = id.replace("usr_", "");

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

    // Check if blueprint has been purchased by another user
    const purchaseCount = await prismaUsers.blueprintPurchase.count({
      where: {
        templateId: realId,
        userId: { not: session.user.id }, // Exclude owner's own purchase if any
      },
    });

    if (purchaseCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete this blueprint as it has been purchased by other users" },
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to delete blueprint: ${errorMessage}` },
      { status: 500 }
    );
  }
}