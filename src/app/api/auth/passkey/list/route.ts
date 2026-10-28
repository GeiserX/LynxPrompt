import { NextRequest, NextResponse } from "next/server";
import { prismaUsers } from "@/lib/db-users";
import { ENABLE_PASSKEYS } from "@/lib/feature-flags";
import { requireSession } from "@/lib/api-auth";

export async function GET(request: Request) {
  if (!ENABLE_PASSKEYS) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const auth = await requireSession(request);
    if (auth instanceof NextResponse) return auth;
    const { session } = auth;

    const authenticators = await prismaUsers.authenticator.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        credentialDeviceType: true,
        credentialBackedUp: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(authenticators);
  } catch (error) {
    console.error("List passkeys error:", error);
    return NextResponse.json(
      { error: "Failed to list passkeys" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!ENABLE_PASSKEYS) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const auth = await requireSession(request);
    if (auth instanceof NextResponse) return auth;
    const { session } = auth;

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Passkey ID required" },
        { status: 400 }
      );
    }

    // Verify the passkey belongs to the user
    const authenticator = await prismaUsers.authenticator.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!authenticator) {
      return NextResponse.json({ error: "Passkey not found" }, { status: 404 });
    }

    await prismaUsers.authenticator.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete passkey error:", error);
    return NextResponse.json(
      { error: "Failed to delete passkey" },
      { status: 500 }
    );
  }
}

