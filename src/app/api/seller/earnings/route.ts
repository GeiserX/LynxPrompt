import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";

// GET /api/seller/earnings - Get seller earnings summary
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all purchases of user's templates (earnings from sales)
    const [salesData, pendingPayouts, completedPayouts, user] = await Promise.all([
      // Total sales earnings from user's templates
      prismaUsers.blueprintPurchase.aggregate({
        where: {
          template: {
            userId: userId,
          },
        },
        _sum: {
          authorShare: true,
        },
        _count: true,
      }),
      // Pending payout requests
      prismaUsers.payout.aggregate({
        where: {
          userId,
          status: { in: ["PENDING", "PROCESSING"] },
        },
        _sum: {
          amount: true,
        },
        _count: true,
      }),
      // Completed payouts
      prismaUsers.payout.aggregate({
        where: {
          userId,
          status: "COMPLETED",
        },
        _sum: {
          amount: true,
        },
        _count: true,
      }),
      // Get user's payout settings
      prismaUsers.user.findUnique({
        where: { id: userId },
        select: { paypalEmail: true },
      }),
    ]);

    const totalEarnings = salesData._sum.authorShare || 0;
    const totalSales = salesData._count || 0;
    const pendingPayoutAmount = pendingPayouts._sum.amount || 0;
    const completedPayoutAmount = completedPayouts._sum.amount || 0;
    const availableBalance = totalEarnings - pendingPayoutAmount - completedPayoutAmount;

    return NextResponse.json({
      totalEarnings, // Total earned in cents (all time)
      totalSales, // Number of sales
      availableBalance, // Balance available for payout in cents
      pendingPayoutAmount, // Amount in pending payouts
      completedPayoutAmount, // Amount already paid out
      paypalEmail: user?.paypalEmail || null,
      minimumPayout: 1000, // €10.00 minimum payout in cents
      currency: "EUR",
    });
  } catch (error) {
    console.error("Error fetching earnings:", error);
    return NextResponse.json(
      { error: "Failed to fetch earnings" },
      { status: 500 }
    );
  }
}

