import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTemplateById, incrementTemplateUsage } from "@/lib/data/templates";
import { prismaUsers } from "@/lib/db-users";

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

    // Check if this is a paid template
    const isPaid = template.price && template.price > 0;
    let hasPurchased = false;
    let isMaxUser = false;
    let discountedPrice: number | null = null;

    const session = await getServerSession(authOptions);

    if (session?.user?.id) {
      // Check user's subscription plan
      const user = await prismaUsers.user.findUnique({
        where: { id: session.user.id },
        select: { subscriptionPlan: true, role: true },
      });

      isMaxUser = user?.subscriptionPlan === "MAX" ||
                  user?.role === "ADMIN" ||
                  user?.role === "SUPERADMIN";

      // Calculate discounted price for MAX users
      if (isPaid && isMaxUser && template.price) {
        discountedPrice = Math.round(template.price * (1 - MAX_DISCOUNT_PERCENT / 100));
      }

      if (isPaid) {
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

    // If not purchased, hide the content
    if (isPaid && !hasPurchased) {
      return NextResponse.json({
        ...template,
        content: null, // Hide content
        isPaid: true,
        hasPurchased: false,
        isMaxUser,
        discountedPrice,
        discountPercent: isMaxUser ? MAX_DISCOUNT_PERCENT : null,
        // Show truncated preview (first 500 chars)
        preview: template.content?.substring(0, 500) + (template.content && template.content.length > 500 ? "\n\n... [Purchase to view full content]" : ""),
      });
    }

    // Increment usage count (only for views, not just listing)
    await incrementTemplateUsage(id);

    return NextResponse.json({
      ...template,
      isPaid: isPaid || false,
      hasPurchased: hasPurchased || !isPaid,
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