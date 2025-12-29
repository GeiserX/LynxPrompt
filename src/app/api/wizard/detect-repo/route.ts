import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { detectGitHubRepo, parseGitHubUrl } from "@/lib/detect-repo";

/**
 * POST /api/wizard/detect-repo
 * Detects project configuration from a public GitHub repository
 * 
 * Requires: Max or Teams subscription
 * Body: { repoUrl: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check subscription tier (Max or Teams only)
    const user = await prismaUsers.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionTier: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const allowedTiers = ["MAX", "TEAMS"];
    if (!allowedTiers.includes(user.subscriptionTier || "")) {
      return NextResponse.json(
        { 
          error: "This feature requires a Max or Teams subscription",
          requiredTier: "max",
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { repoUrl } = body;

    if (!repoUrl || typeof repoUrl !== "string") {
      return NextResponse.json(
        { error: "Repository URL is required" },
        { status: 400 }
      );
    }

    // Validate it's a GitHub URL
    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return NextResponse.json(
        { 
          error: "Invalid GitHub URL. Please provide a valid GitHub repository URL.",
          example: "https://github.com/owner/repo",
        },
        { status: 400 }
      );
    }

    // Detect repository configuration
    const detected = await detectGitHubRepo(repoUrl);

    if (!detected) {
      return NextResponse.json(
        { 
          error: "Could not access repository. Make sure it's a public GitHub repository.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      detected,
    });
  } catch (error) {
    console.error("Error detecting repo:", error);
    return NextResponse.json(
      { error: "Failed to detect repository configuration" },
      { status: 500 }
    );
  }
}

