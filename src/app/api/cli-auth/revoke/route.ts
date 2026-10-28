import { NextRequest, NextResponse } from "next/server";
import { prismaUsers } from "@/lib/db-users";
import { validateApiToken } from "@/lib/api-tokens";

/**
 * POST /api/cli-auth/revoke
 * Revoke the API token that authenticates this request.
 *
 * `lynxp logout` calls it so the token stops working on the server, not only
 * on the machine that held it.
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const tokenData = await validateApiToken(request.headers.get("authorization"));
    if (!tokenData) {
      return NextResponse.json(
        { error: "Invalid or missing API token" },
        { status: 401 }
      );
    }

    await prismaUsers.apiToken.update({
      where: { id: tokenData.tokenId },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CLI token revoke error:", error);
    return NextResponse.json(
      { error: "Failed to revoke token" },
      { status: 500 }
    );
  }
}
