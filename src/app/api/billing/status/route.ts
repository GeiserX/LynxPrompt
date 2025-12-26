import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { ensureStripe, getPlanFromPriceId, getIntervalFromPriceId } from "@/lib/stripe";

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
        subscriptionInterval: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        teamMemberships: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
                slug: true,
                stripeSubscriptionId: true,
                billingCycleStart: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is part of a team
    const teamMembership = user.teamMemberships[0];
    const isTeamsUser = user.subscriptionPlan === "TEAMS" || !!teamMembership;
    
    // Admins and Superadmins get MAX tier for free
    const isAdmin = user.role === "ADMIN" || user.role === "SUPERADMIN";
    
    // Determine effective plan
    let effectivePlan: string;
    if (isAdmin) {
      effectivePlan = "max";
    } else if (isTeamsUser) {
      effectivePlan = "teams";
    } else {
      effectivePlan = user.subscriptionPlan.toLowerCase();
    }

    // Check for pending changes if user has active subscription
    let pendingChange: string | null = null;
    let actualCurrentPlan = effectivePlan;
    let billingInterval: "monthly" | "annual" = (user.subscriptionInterval as "monthly" | "annual") || "monthly";
    
    // For non-Teams, non-Admin users with Stripe subscription
    if (!isAdmin && !isTeamsUser && user.stripeSubscriptionId) {
      try {
        const stripe = ensureStripe();
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        // Get the currently active plan and interval from Stripe
        const currentPriceId = subscription.items.data[0]?.price?.id;
        if (currentPriceId) {
          actualCurrentPlan = getPlanFromPriceId(currentPriceId);
          billingInterval = getIntervalFromPriceId(currentPriceId);
        }

        // Check for scheduled downgrade in metadata
        if (subscription.metadata?.scheduledDowngrade) {
          pendingChange = subscription.metadata.scheduledDowngrade;
        }
      } catch (stripeError) {
        // If we can't reach Stripe, just use the DB values
        console.error("Error fetching subscription from Stripe:", stripeError);
      }
    }

    // Teams users are considered active if they're part of a team (billing is handled at team level)
    const hasActiveSubscription = isAdmin || isTeamsUser || (!!user.stripeSubscriptionId && 
      (user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing"));

    return NextResponse.json({
      plan: actualCurrentPlan,
      interval: billingInterval,
      status: isAdmin || isTeamsUser ? "active" : user.subscriptionStatus,
      currentPeriodEnd: isAdmin ? null : (isTeamsUser ? teamMembership?.team?.billingCycleStart : user.currentPeriodEnd),
      cancelAtPeriodEnd: isAdmin || isTeamsUser ? false : user.cancelAtPeriodEnd,
      hasStripeAccount: !!user.stripeCustomerId,
      hasActiveSubscription,
      isAdmin, // Flag for UI to show "Admin" badge instead of plan
      isTeamsUser, // Flag for UI to show "Teams" badge
      pendingChange, // For showing scheduled downgrades
      isAnnual: billingInterval === "annual", // Convenience flag for UI
      // Teams-specific data
      team: isTeamsUser && teamMembership ? {
        id: teamMembership.team.id,
        name: teamMembership.team.name,
        slug: teamMembership.team.slug,
        role: teamMembership.role,
      } : null,
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription status" },
      { status: 500 }
    );
  }
}




