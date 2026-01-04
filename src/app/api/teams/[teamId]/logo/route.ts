import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync, readdirSync } from "fs";
import path from "path";

// Base upload directory - mounted volume in production, local in dev
const UPLOAD_BASE_DIR = process.env.UPLOAD_DIR?.replace("/blog", "") || "/data/uploads";

// Allowed image types
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB for team logos

// Get team's upload directory
function getTeamUploadDir(teamId: string): string {
  return path.join(UPLOAD_BASE_DIR, "teams", teamId);
}

// Generate unique filename
function generateFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `logo-${timestamp}-${random}${ext}`;
}

// Check if user is team admin
async function isTeamAdmin(userId: string, teamId: string): Promise<boolean> {
  const membership = await prismaUsers.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  return membership?.role === "ADMIN";
}

// POST /api/teams/[teamId]/logo - Upload team logo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;

    // Check if user is team admin
    if (!(await isTeamAdmin(session.user.id, teamId))) {
      return NextResponse.json(
        { error: "Only team admins can upload logos" },
        { status: 403 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    // Get team's upload directory
    const teamUploadDir = getTeamUploadDir(teamId);

    // Ensure team's upload directory exists
    if (!existsSync(teamUploadDir)) {
      await mkdir(teamUploadDir, { recursive: true });
    }

    // Delete old logo files (keep the directory clean)
    try {
      const existingFiles = readdirSync(teamUploadDir);
      for (const f of existingFiles) {
        if (f.startsWith("logo-")) {
          await unlink(path.join(teamUploadDir, f));
        }
      }
    } catch {
      // Ignore errors when cleaning old files
    }

    // Generate unique filename and save
    const filename = generateFilename(file.name);
    const filepath = path.join(teamUploadDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Generate the URL path
    const url = `/api/teams/logo/${teamId}/${filename}`;

    // Update team's logo in database
    await prismaUsers.team.update({
      where: { id: teamId },
      data: { logo: url },
    });

    return NextResponse.json({ url, filename }, { status: 201 });
  } catch (error) {
    console.error("Error uploading team logo:", error);
    return NextResponse.json(
      { error: "Failed to upload logo" },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[teamId]/logo - Remove team logo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;

    // Check if user is team admin
    if (!(await isTeamAdmin(session.user.id, teamId))) {
      return NextResponse.json(
        { error: "Only team admins can delete logos" },
        { status: 403 }
      );
    }

    const teamUploadDir = getTeamUploadDir(teamId);

    // Delete all logo files
    if (existsSync(teamUploadDir)) {
      try {
        const existingFiles = readdirSync(teamUploadDir);
        for (const f of existingFiles) {
          if (f.startsWith("logo-")) {
            await unlink(path.join(teamUploadDir, f));
          }
        }
      } catch {
        // Ignore errors
      }
    }

    // Clear team's logo in database
    await prismaUsers.team.update({
      where: { id: teamId },
      data: { logo: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting team logo:", error);
    return NextResponse.json(
      { error: "Failed to delete logo" },
      { status: 500 }
    );
  }
}










