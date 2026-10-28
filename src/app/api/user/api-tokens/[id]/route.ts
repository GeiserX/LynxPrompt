import { NextRequest, NextResponse } from "next/server";
import { prismaUsers } from "@/lib/db-users";
import { requireSession } from "@/lib/api-auth";

/**
 * DELETE /api/user/api-tokens/[id]
 * Revoke (soft delete) an API token
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSession(request);
    if (auth instanceof NextResponse) return auth;
    const { session } = auth;

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Token ID is required" }, { status: 400 });
    }

    // Find the token and verify ownership
    const token = await prismaUsers.apiToken.findUnique({
      where: { id },
      select: { userId: true, revokedAt: true },
    });

    if (!token) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    if (token.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (token.revokedAt) {
      return NextResponse.json({ error: "Token already revoked" }, { status: 400 });
    }

    // Soft delete by setting revokedAt
    await prismaUsers.apiToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "Token revoked successfully",
    });
  } catch (error) {
    console.error("Error revoking API token:", error);
    return NextResponse.json(
      { error: "Failed to revoke API token" },
      { status: 500 }
    );
  }
}














