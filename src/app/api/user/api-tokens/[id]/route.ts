import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";

/**
 * DELETE /api/user/api-tokens/[id]
 * Revoke (soft delete) an API token
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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








