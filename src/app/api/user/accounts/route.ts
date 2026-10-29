import { NextResponse } from "next/server";
import { prismaUsers } from "@/lib/db-users";
import { requireSession } from "@/lib/api-auth";
import { envBool } from "@/lib/feature-flags";

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

    const { accountId, provider } = await request.json();

    if (!accountId && !provider) {
      return NextResponse.json(
        { error: "accountId is required" },
        { status: 400 }
      );
    }

    // Unlink one account by id. A provider alone (older pages) is taken only
    // when it names a single account: a user can link two GitHub accounts.
    const accounts = await prismaUsers.account.findMany({
      where: { userId: session.user.id },
      select: { id: true, provider: true },
    });
    const matches = accounts.filter((account) =>
      accountId ? account.id === accountId : account.provider === provider
    );
    if (matches.length === 0) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    if (matches.length > 1) {
      return NextResponse.json(
        { error: "Several accounts of this provider are linked; choose one by accountId" },
        { status: 400 }
      );
    }
    const target = matches[0];

    // A verified email is a way back in only while magic links are on
    const user = await prismaUsers.user.findUnique({
      where: { id: session.user.id },
      select: { emailVerified: true },
    });
    const canUseEmail = !!user?.emailVerified && envBool("ENABLE_EMAIL_AUTH", true);

    // Keep at least one way to sign in after the unlink
    if (accounts.length - 1 === 0 && !canUseEmail) {
      return NextResponse.json(
        {
          error:
            "Cannot unlink your only authentication method. Add another method first.",
        },
        { status: 400 }
      );
    }

    await prismaUsers.account.delete({ where: { id: target.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unlink account error:", error);
    return NextResponse.json(
      { error: "Failed to unlink account" },
      { status: 500 }
    );
  }
}

