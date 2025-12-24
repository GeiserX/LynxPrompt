import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";

const MINIMUM_PAYOUT = 1000; // €10.00 in cents

// GET /api/seller/payout-request - Get payout history
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payouts = await prismaUsers.payout.findMany({
      where: { userId: session.user.id },
      orderBy: { requestedAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ payouts });
  } catch (error) {
    console.error("Error fetching payout history:", error);
    return NextResponse.json(
      { error: "Failed to fetch payout history" },
      { status: 500 }
    );
  }
}

// POST /api/seller/payout-request - Request a payout
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's PayPal email
    const user = await prismaUsers.user.findUnique({
      where: { id: userId },
      select: { paypalEmail: true },
    });

    if (!user?.paypalEmail) {
      return NextResponse.json(
        { error: "Please configure your PayPal email in payout settings first" },
        { status: 400 }
      );
    }

    // Calculate available balance
    const [salesData, pendingPayouts, completedPayouts] = await Promise.all([
      prismaUsers.blueprintPurchase.aggregate({
        where: {
          template: { userId },
        },
        _sum: { authorShare: true },
      }),
      prismaUsers.payout.aggregate({
        where: {
          userId,
          status: { in: ["PENDING", "PROCESSING"] },
        },
        _sum: { amount: true },
      }),
      prismaUsers.payout.aggregate({
        where: {
          userId,
          status: "COMPLETED",
        },
        _sum: { amount: true },
      }),
    ]);

    const totalEarnings = salesData._sum.authorShare || 0;
    const pendingAmount = pendingPayouts._sum.amount || 0;
    const completedAmount = completedPayouts._sum.amount || 0;
    const availableBalance = totalEarnings - pendingAmount - completedAmount;

    // Check minimum payout
    if (availableBalance < MINIMUM_PAYOUT) {
      return NextResponse.json(
        {
          error: `Minimum payout is €${(MINIMUM_PAYOUT / 100).toFixed(2)}. Your available balance is €${(availableBalance / 100).toFixed(2)}.`,
        },
        { status: 400 }
      );
    }

    // Check if there's already a pending payout
    const existingPending = await prismaUsers.payout.findFirst({
      where: {
        userId,
        status: { in: ["PENDING", "PROCESSING"] },
      },
    });

    if (existingPending) {
      return NextResponse.json(
        { error: "You already have a pending payout request. Please wait for it to be processed." },
        { status: 400 }
      );
    }

    // Create payout request
    const payout = await prismaUsers.payout.create({
      data: {
        userId,
        amount: availableBalance,
        currency: "EUR",
        paypalEmail: user.paypalEmail,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      message: "Payout request submitted successfully",
      payout: {
        id: payout.id,
        amount: payout.amount,
        currency: payout.currency,
        status: payout.status,
        requestedAt: payout.requestedAt,
      },
    });
  } catch (error) {
    console.error("Error creating payout request:", error);
    return NextResponse.json(
      { error: "Failed to create payout request" },
      { status: 500 }
    );
  }
}

