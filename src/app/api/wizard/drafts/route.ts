import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";

// GET /api/wizard/drafts - List user's drafts
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const drafts = await prismaUsers.wizardDraft.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        step: true,
        createdAt: true,
        updatedAt: true,
        // Include a summary of the config for display
        config: true,
      },
    });

    // Transform to include summary info from config
    const draftsWithSummary = drafts.map((draft) => {
      const config = draft.config as Record<string, unknown>;
      return {
        id: draft.id,
        name: draft.name,
        step: draft.step,
        createdAt: draft.createdAt,
        updatedAt: draft.updatedAt,
        // Extract summary fields for preview
        projectName: config.projectName || "Untitled",
        projectType: config.projectType,
        languages: config.languages || [],
        frameworks: config.frameworks || [],
        platform: config.platform,
      };
    });

    return NextResponse.json(draftsWithSummary);
  } catch (error) {
    console.error("Error fetching drafts:", error);
    return NextResponse.json(
      { error: "Failed to fetch drafts" },
      { status: 500 }
    );
  }
}

// POST /api/wizard/drafts - Create or update a draft
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, step, config } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Draft name is required" },
        { status: 400 }
      );
    }

    if (typeof step !== "number" || step < 0 || step > 10) {
      return NextResponse.json(
        { error: "Invalid step number" },
        { status: 400 }
      );
    }

    if (!config || typeof config !== "object") {
      return NextResponse.json(
        { error: "Config is required" },
        { status: 400 }
      );
    }

    // Check draft limit (max 10 drafts per user)
    const existingCount = await prismaUsers.wizardDraft.count({
      where: { userId: session.user.id },
    });

    if (!id && existingCount >= 10) {
      return NextResponse.json(
        { error: "Maximum 10 drafts allowed. Please delete some to create new ones." },
        { status: 400 }
      );
    }

    let draft;

    if (id) {
      // Update existing draft
      const existing = await prismaUsers.wizardDraft.findFirst({
        where: { id, userId: session.user.id },
      });

      if (!existing) {
        return NextResponse.json(
          { error: "Draft not found" },
          { status: 404 }
        );
      }

      draft = await prismaUsers.wizardDraft.update({
        where: { id },
        data: {
          name: name.trim(),
          step,
          config,
        },
      });
    } else {
      // Create new draft
      draft = await prismaUsers.wizardDraft.create({
        data: {
          userId: session.user.id,
          name: name.trim(),
          step,
          config,
        },
      });
    }

    return NextResponse.json({
      id: draft.id,
      name: draft.name,
      step: draft.step,
      updatedAt: draft.updatedAt,
    });
  } catch (error) {
    console.error("Error saving draft:", error);
    return NextResponse.json(
      { error: "Failed to save draft" },
      { status: 500 }
    );
  }
}








