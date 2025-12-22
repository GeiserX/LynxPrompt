import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTemplateById, incrementTemplateUsage } from "@/lib/data/templates";
import { prismaUsers } from "@/lib/db-users";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = await getTemplateById(id);

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Check if this is a paid template
    const isPaid = template.price && template.price > 0;
    let hasPurchased = false;

    if (isPaid) {
      // Check if user is logged in and has purchased
      const session = await getServerSession(authOptions);
      
      if (session?.user?.id) {
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

      // If not purchased, hide the content
      if (!hasPurchased) {
        return NextResponse.json({
          ...template,
          content: null, // Hide content
          isPaid: true,
          hasPurchased: false,
          // Show truncated preview (first 500 chars)
          preview: template.content?.substring(0, 500) + (template.content && template.content.length > 500 ? "\n\n... [Purchase to view full content]" : ""),
        });
      }
    }

    // Increment usage count (only for views, not just listing)
    await incrementTemplateUsage(id);

    return NextResponse.json({
      ...template,
      isPaid: isPaid || false,
      hasPurchased: hasPurchased || !isPaid,
    });
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}
