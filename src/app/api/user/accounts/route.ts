import { NextResponse } from "next/server";
import { prismaUsers } from "@/lib/db-users";
import { requireSession } from "@/lib/api-auth";

// GET linked accounts
export async function GET(request: Request) {
  try {
    const auth = await requireSession(request);
    if (auth instanceof NextResponse) return auth;
    const { session } = auth;

    // Fetch accounts with stored provider details
    const accounts = await prismaUsers.account.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        provider: true,
        providerAccountId: true,
        providerEmail: true,
        providerUsername: true,
      },
    });

    // Also get the user's email for display
    const user = await prismaUsers.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, emailVerified: true },
    });

    return NextResponse.json({
      accounts,
      email: user?.email,
      emailVerified: !!user?.emailVerified,
    });
  } catch (error) {
    console.error("Get accounts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

// DELETE - Unlink an account
export async function DELETE(request: Request) {
  try {
    const auth = await requireSession(request);
    if (auth instanceof NextResponse) return auth;
    const { session } = auth;

    const { provider } = await request.json();

    if (!provider) {
      return NextResponse.json(
        { error: "Provider is required" },
        { status: 400 }
      );
    }

    // Count total accounts to ensure user has at least one way to log in
    const accountCount = await prismaUsers.account.count({
      where: { userId: session.user.id },
    });

    // Check if user has an email verified (for magic link fallback)
    const user = await prismaUsers.user.findUnique({
      where: { id: session.user.id },
      select: { emailVerified: true },
    });

    const hasVerifiedEmail = !!user?.emailVerified;

    // Can't unlink if it's the only account and no verified email
    if (accountCount <= 1 && !hasVerifiedEmail) {
      return NextResponse.json(
        {
          error:
            "Cannot unlink your only authentication method. Add another method first.",
        },
        { status: 400 }
      );
    }

    // Delete the account link
    await prismaUsers.account.deleteMany({
      where: {
        userId: session.user.id,
        provider,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unlink account error:", error);
    return NextResponse.json(
      { error: "Failed to unlink account" },
      { status: 500 }
    );
  }
}

