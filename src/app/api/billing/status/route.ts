import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { ensureStripe, getPlanFromPriceId } from "@/lib/stripe";

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

    // Check for pending changes if user has active subscription
    let pendingChange: string | null = null;
    let actualCurrentPlan = effectivePlan;
    
    if (!isAdmin && user.stripeSubscriptionId) {
      try {
        const stripe = ensureStripe();
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        // Get the currently active plan from Stripe
        const currentPriceId = subscription.items.data[0]?.price?.id;
        if (currentPriceId) {
          actualCurrentPlan = getPlanFromPriceId(currentPriceId);
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

    return NextResponse.json({
      plan: actualCurrentPlan,
      status: isAdmin ? "active" : user.subscriptionStatus,
      currentPeriodEnd: isAdmin ? null : user.currentPeriodEnd,
      cancelAtPeriodEnd: isAdmin ? false : user.cancelAtPeriodEnd,
      hasStripeAccount: !!user.stripeCustomerId,
      hasActiveSubscription: isAdmin || (!!user.stripeSubscriptionId && 
        (user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing")),
      isAdmin, // Flag for UI to show "Admin" badge instead of plan
      pendingChange, // For showing scheduled downgrades
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription status" },
      { status: 500 }
    );
  }
}



