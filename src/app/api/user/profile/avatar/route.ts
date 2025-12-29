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
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB for profile pictures

// Get user's profile upload directory
function getUserUploadDir(userId: string): string {
  return path.join(UPLOAD_BASE_DIR, "profiles", userId);
}

// Generate unique filename
function generateFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `avatar-${timestamp}-${random}${ext}`;
}

// POST /api/user/profile/avatar - Upload profile image
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 2MB" },
        { status: 400 }
      );
    }

    // Get user's upload directory
    const userUploadDir = getUserUploadDir(userId);

    // Ensure user's upload directory exists
    if (!existsSync(userUploadDir)) {
      await mkdir(userUploadDir, { recursive: true });
    }

    // Delete old avatar files (keep the directory clean)
    try {
      const existingFiles = readdirSync(userUploadDir);
      for (const f of existingFiles) {
        if (f.startsWith("avatar-")) {
          await unlink(path.join(userUploadDir, f));
        }
      }
    } catch {
      // Ignore errors when cleaning old files
    }

    // Generate unique filename and save
    const filename = generateFilename(file.name);
    const filepath = path.join(userUploadDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Generate the URL path (will be served by /api/user/profile/avatar/[filename])
    const url = `/api/user/profile/avatar/${userId}/${filename}`;

    // Update user's image in database
    await prismaUsers.user.update({
      where: { id: userId },
      data: { image: url },
    });

    return NextResponse.json({ url, filename }, { status: 201 });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    );
  }
}

// DELETE /api/user/profile/avatar - Remove profile image
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userUploadDir = getUserUploadDir(userId);

    // Delete all avatar files
    if (existsSync(userUploadDir)) {
      try {
        const existingFiles = readdirSync(userUploadDir);
        for (const f of existingFiles) {
          if (f.startsWith("avatar-")) {
            await unlink(path.join(userUploadDir, f));
          }
        }
      } catch {
        // Ignore errors
      }
    }

    // Clear user's image in database
    await prismaUsers.user.update({
      where: { id: userId },
      data: { image: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting avatar:", error);
    return NextResponse.json(
      { error: "Failed to delete avatar" },
      { status: 500 }
    );
  }
}






