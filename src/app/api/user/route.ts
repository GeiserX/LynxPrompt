import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { requirePasskeyVerified } from "@/lib/passkey-session";
import { deleteAccount, teamsBlockingDeletion } from "@/lib/account-deletion";

/**
 * DELETE /api/user - Delete the signed-in user's account and its data.
 * Body: { confirm } with the account's email (or "DELETE" for an account
 * without one), so a stray request cannot delete an account.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const passkeyBlock = await requirePasskeyVerified(request, userId);
    if (passkeyBlock) return passkeyBlock;

    const user = await prismaUsers.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const confirm = typeof body?.confirm === "string" ? body.confirm.trim().toLowerCase() : "";
    const expected = user.email ? user.email.trim().toLowerCase() : "delete";
    if (confirm !== expected) {
      return NextResponse.json(
        { error: user.email ? "Type your email address to confirm" : 'Type "DELETE" to confirm' },
        { status: 400 }
      );
    }

    const blocking = await teamsBlockingDeletion(userId);
    if (blocking.length > 0) {
      return NextResponse.json(
        {
          error: `You are the only admin of ${blocking.join(", ")}. Make another member an admin, or remove the other members, before deleting your account.`,
          teams: blocking,
        },
        { status: 409 }
      );
    }

    await deleteAccount(userId);
    console.log(`[Account] User ${userId} deleted their account`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
