import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";

// GET /api/seller/payout-settings - Get current payout settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prismaUsers.user.findUnique({
      where: { id: session.user.id },
      select: { paypalEmail: true },
    });

    return NextResponse.json({
      paypalEmail: user?.paypalEmail || null,
    });
  } catch (error) {
    console.error("Error fetching payout settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch payout settings" },
      { status: 500 }
    );
  }
}

// PUT /api/seller/payout-settings - Update payout settings
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paypalEmail } = await req.json();

    // Basic email validation
    if (paypalEmail && typeof paypalEmail === "string") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(paypalEmail)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }
    }

    const user = await prismaUsers.user.update({
      where: { id: session.user.id },
      data: {
        paypalEmail: paypalEmail?.trim() || null,
      },
      select: { paypalEmail: true },
    });

    return NextResponse.json({
      paypalEmail: user.paypalEmail,
      message: "Payout settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating payout settings:", error);
    return NextResponse.json(
      { error: "Failed to update payout settings" },
      { status: 500 }
    );
  }
}

