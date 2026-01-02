import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureStripe, getPlanFromPriceId, getIntervalFromPriceId } from "@/lib/stripe";
import { prismaUsers } from "@/lib/db-users";

/**
 * Change subscription plan (DEPRECATED)
 * 
 * This endpoint was used for upgrading/downgrading between Pro and Max plans.
 * Since January 2026, we only have Users (free) and Teams plans, so plan
 * changes are no longer supported via API. Users should contact support.
 */
export async function POST() {
  // Plan changes are no longer supported as we only have Users (free) and Teams
  // This endpoint is kept for backwards compatibility but will always return an error
  return NextResponse.json(
    { error: "Plan changes are no longer supported. Please contact support to modify your subscription." },
    { status: 400 }
  );
}

/**
 * GET: Check current plan and any pending changes
 */
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
        stripeSubscriptionId: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
      },
    });

    if (!user?.stripeSubscriptionId) {
      return NextResponse.json({
        currentPlan: user?.subscriptionPlan?.toLowerCase() || "free",
        status: user?.subscriptionStatus || null,
        pendingChange: null,
      });
    }

    const stripe = ensureStripe();
    const subscriptionResponse = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    const subscription = subscriptionResponse as unknown as {
      status: string;
      current_period_end: number;
      items: { data: Array<{ price: { id: string } }> };
      metadata?: Record<string, string>;
      cancel_at_period_end: boolean;
    };

    // Check for scheduled changes
    const scheduledDowngrade = subscription.metadata?.scheduledDowngrade;
    const currentPriceId = subscription.items.data[0]?.price?.id;
    const currentPlan = currentPriceId ? getPlanFromPriceId(currentPriceId) : "free";
    const interval = currentPriceId ? getIntervalFromPriceId(currentPriceId) : "monthly";

    return NextResponse.json({
      currentPlan,
      interval,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      pendingChange: scheduledDowngrade || null,
    });
  } catch (error) {
    console.error("Error getting subscription info:", error);
    return NextResponse.json(
      { error: "Failed to get subscription info" },
      { status: 500 }
    );
  }
}
