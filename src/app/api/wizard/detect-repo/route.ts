import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { detectRemoteRepo, detectRepoHost } from "@/lib/detect-repo";

/**
 * POST /api/wizard/detect-repo
 * Detects project configuration from a public GitHub or GitLab repository
 * 
 * Free for all authenticated users
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

    // Parse request body
    const body = await request.json();
    const { repoUrl } = body;

    if (!repoUrl || typeof repoUrl !== "string") {
      return NextResponse.json(
        { error: "Repository URL is required" },
        { status: 400 }
      );
    }

    // Check if it's a supported host
    const host = detectRepoHost(repoUrl);
    const supportedHosts = ["github", "gitlab"];
    
    if (!supportedHosts.includes(host)) {
      return NextResponse.json(
        { 
          error: `Unsupported repository host: ${host}. Currently supported: GitHub, GitLab`,
          supportedHosts,
        },
        { status: 400 }
      );
    }

    // Detect repository configuration
    const detected = await detectRemoteRepo(repoUrl);

    if (!detected) {
      return NextResponse.json(
        { 
          error: `Could not access repository. Make sure it's a public ${host === "github" ? "GitHub" : "GitLab"} repository.`,
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

