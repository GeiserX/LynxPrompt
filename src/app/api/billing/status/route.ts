import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await prismaUsers.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Admins and Superadmins get MAX tier for free
    const isAdmin = user.role === "ADMIN" || user.role === "SUPERADMIN";
    const effectivePlan = isAdmin ? "max" : user.subscriptionPlan.toLowerCase();

    return NextResponse.json({
      plan: effectivePlan,
      status: isAdmin ? "active" : user.subscriptionStatus,
      currentPeriodEnd: isAdmin ? null : user.currentPeriodEnd,
      cancelAtPeriodEnd: isAdmin ? false : user.cancelAtPeriodEnd,
      hasStripeAccount: !!user.stripeCustomerId,
      hasActiveSubscription: isAdmin || !!user.stripeSubscriptionId,
      isAdmin, // Flag for UI to show "Admin" badge instead of plan
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription status" },
      { status: 500 }
    );
  }
}


