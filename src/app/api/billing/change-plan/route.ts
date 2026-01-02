import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureStripe, getPriceIdForPlan, getPlanFromPriceId, getIntervalFromPriceId, type SubscriptionPlan } from "@/lib/stripe";
import { prismaUsers } from "@/lib/db-users";

/**
 * Change subscription plan (upgrade or downgrade)
 * 
 * Upgrade (Pro → Max):
 * - Immediate effect with prorated credit applied
 * - Unused Pro credit goes toward Max payment
 * 
 * Downgrade (Max → Pro):
 * - Takes effect at end of current billing period
 * - User keeps Max access until then
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { plan, euDigitalContentConsent } = (await request.json()) as { 
      plan: SubscriptionPlan;
      euDigitalContentConsent?: boolean;
    };

    // Plan changes are no longer supported as we only have Users (free) and Teams
    // This endpoint is kept for backwards compatibility but will always fail
    return NextResponse.json(
      { error: "Plan changes are no longer supported. Please contact support to modify your subscription." },
      { status: 400 }
    );

    // Legacy validation (unreachable code, kept for reference)
    if (!plan || plan !== "teams") {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }

    const stripe = ensureStripe();

    // Get user with subscription info
    const user = await prismaUsers.user.findUnique({
      where: { id: session.user.id },
      select: {
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        subscriptionPlan: true,
        role: true,
      },
    });

    if (!user?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "No active subscription found. Please subscribe first." },
        { status: 400 }
      );
    }

    // Get current subscription from Stripe
    const subscriptionResponse = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    const subscription = subscriptionResponse as unknown as { 
      status: string; 
      current_period_end: number;
      items: { data: Array<{ id: string; price: { id: string } }> };
      metadata: Record<string, string>;
      cancel_at_period_end: boolean;
    };

    if (subscription.status !== "active" && subscription.status !== "trialing") {
      return NextResponse.json(
        { error: "Subscription is not active" },
        { status: 400 }
      );
    }

    // Get current plan and interval from subscription
    const currentPriceId = subscription.items.data[0]?.price?.id;
    const currentPlan = currentPriceId ? getPlanFromPriceId(currentPriceId) : "free";
    const currentInterval = currentPriceId ? getIntervalFromPriceId(currentPriceId) : "monthly";

    if (currentPlan === plan) {
      return NextResponse.json(
        { error: "You are already on this plan" },
        { status: 400 }
      );
    }

    if (currentPlan === "free") {
      return NextResponse.json(
        { error: "Cannot change from free plan. Please subscribe first." },
        { status: 400 }
      );
    }

    // Keep the same billing interval when changing plans
    const newPriceId = getPriceIdForPlan(plan, currentInterval);
    if (!newPriceId) {
      return NextResponse.json(
        { error: "Target plan price not configured" },
        { status: 500 }
      );
    }

    // Determine if this is an upgrade or downgrade
    const planOrder: Record<string, number> = { free: 0, pro: 1, max: 2, teams: 3 };
    const isUpgrade = planOrder[plan] > planOrder[currentPlan];

    if (isUpgrade) {
      // EU Digital Content Directive: require consent for upgrades (gaining new digital content)
      if (!euDigitalContentConsent) {
        return NextResponse.json(
          { error: "You must consent to immediate access and waive your withdrawal right to proceed with the upgrade." },
          { status: 400 }
        );
      }

      // UPGRADE: Immediate with proration
      // Stripe will calculate unused credit from current plan and apply toward new plan
      await stripe.subscriptions.update(
        user.stripeSubscriptionId,
        {
          items: [
            {
              id: subscription.items.data[0].id,
              price: newPriceId,
            },
          ],
          // Prorate: charge difference immediately, credit unused portion
          proration_behavior: "create_prorations",
          // Clear any pending cancellation
          cancel_at_period_end: false,
          metadata: {
            ...subscription.metadata,
            plan: plan,
            // EU Digital Content Directive consent tracking for upgrade
            euDigitalContentConsent: "true",
            upgradeConsentTimestamp: new Date().toISOString(),
          },
        }
      );

      return NextResponse.json({
        success: true,
        type: "upgrade",
        message: `Upgraded to ${plan.toUpperCase()} immediately`,
        newPlan: plan,
        effectiveNow: true,
      });
    } else {
      // DOWNGRADE: Store pending change, apply on next billing cycle
      // The webhook will apply the actual change when invoice.payment_succeeded fires
      
      // Store the pending downgrade in subscription metadata
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        metadata: {
          ...subscription.metadata,
          scheduledDowngrade: plan,
          scheduledDowngradePrice: newPriceId,
        },
      });

      // Also store in database for reference
      await prismaUsers.user.update({
        where: { id: session.user.id },
        data: {
          // Keep current plan, mark pending change
          // subscriptionPlan stays the same until renewal
        },
      });

      // Calculate when the change takes effect
      const periodEnd = new Date(subscription.current_period_end * 1000);

      return NextResponse.json({
        success: true,
        type: "downgrade",
        message: `Scheduled downgrade to ${plan.toUpperCase()} at end of billing period`,
        newPlan: plan,
        effectiveNow: false,
        effectiveDate: periodEnd.toISOString(),
        currentPlanUntil: periodEnd.toISOString(),
      });
    }
  } catch (error) {
    console.error("Error changing subscription plan:", error);
    
    // Handle specific Stripe errors
    if (error instanceof Error) {
      if (error.message.includes("No such subscription")) {
        return NextResponse.json(
          { error: "Subscription not found. It may have been canceled." },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to change subscription plan" },
      { status: 500 }
    );
  }
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


