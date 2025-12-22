import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";

// Template type options
const TEMPLATE_TYPES = [
  "CURSORRULES",
  "CLAUDE_MD",
  "COPILOT_INSTRUCTIONS",
  "WINDSURF_RULES",
  "CUSTOM",
] as const;

type TemplateType = (typeof TEMPLATE_TYPES)[number];

// Determine tier based on line count
function determineTier(
  content: string
): "SIMPLE" | "INTERMEDIATE" | "ADVANCED" {
  const lineCount = content.split("\n").length;
  if (lineCount <= 50) return "SIMPLE";
  if (lineCount <= 200) return "INTERMEDIATE";
  return "ADVANCED";
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
    const { name, description, content, type, tags, isPublic = true } = body;

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

    if (!type || !TEMPLATE_TYPES.includes(type as TemplateType)) {
      return NextResponse.json(
        { error: "Invalid template type" },
        { status: 400 }
      );
    }

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

    // Auto-determine tier based on content length
    const tier = determineTier(content);

    // Create the template
    const template = await prismaUsers.userTemplate.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        description: description?.trim() || null,
        content: content.trim(),
        type: type as TemplateType,
        tier,
        tags: validatedTags,
        isPublic: Boolean(isPublic),
        downloads: 0,
        favorites: 0,
      },
    });

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.name,
        tier: template.tier,
      },
    });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}

