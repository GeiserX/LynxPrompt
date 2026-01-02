import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// Base upload directory - mounted volume in production, local in dev
const UPLOAD_BASE_DIR = process.env.UPLOAD_DIR?.replace("/blog", "") || "/data/uploads";

// MIME types for images
const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string; filename: string }> }
) {
  try {
    const { teamId, filename } = await params;

    // Validate filename to prevent directory traversal
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\") ||
      teamId.includes("..") ||
      teamId.includes("/") ||
      teamId.includes("\\")
    ) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    // Construct file path
    const filepath = path.join(UPLOAD_BASE_DIR, "teams", teamId, filename);

    // Check if file exists
    if (!existsSync(filepath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Read file
    const buffer = await readFile(filepath);

    // Get content type
    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    // Return file with appropriate headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable", // Cache for 1 year (filename includes timestamp)
      },
    });
  } catch (error) {
    console.error("Error serving team logo:", error);
    return NextResponse.json(
      { error: "Failed to serve file" },
      { status: 500 }
    );
  }
}








