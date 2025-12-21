import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

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

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Passkey ID required" }, { status: 400 });
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


