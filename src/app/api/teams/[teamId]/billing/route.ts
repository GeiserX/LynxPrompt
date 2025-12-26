import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { ensureStripe, STRIPE_PRICE_IDS } from "@/lib/stripe";
import { TEAMS_MIN_SEATS, TEAMS_PRICE_PER_SEAT, calculateProratedAmount } from "@/lib/subscription";
import { z } from "zod";

// Validation schemas
const createSubscriptionSchema = z.object({
  seats: z.number().min(TEAMS_MIN_SEATS, `Minimum ${TEAMS_MIN_SEATS} seats required`),
  euDigitalContentConsent: z.boolean(),
});

const updateSeatsSchema = z.object({
  seats: z.number().min(TEAMS_MIN_SEATS, `Minimum ${TEAMS_MIN_SEATS} seats required`),
});

/**
 * Helper: Check if user is a team admin
 */
async function isTeamAdmin(userId: string, teamId: string): Promise<boolean> {
  const membership = await prismaUsers.teamMember.findUnique({
    where: {
      teamId_userId: { teamId, userId },
    },
  });
  return membership?.role === "ADMIN";
}

/**
 * GET /api/teams/[teamId]/billing - Get billing info (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;

    // Check if user is a team admin
    if (!(await isTeamAdmin(session.user.id, teamId))) {
      return NextResponse.json(
        { error: "Only team admins can view billing" },
        { status: 403 }
      );
    }

    const team = await prismaUsers.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          select: {
            isActiveThisCycle: true,
            lastActiveAt: true,
          },
        },
        billingRecords: {
          orderBy: { periodStart: "desc" },
          take: 6, // Last 6 billing periods
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Calculate active users
    const activeMembers = team.members.filter((m) => m.isActiveThisCycle).length;
    const totalMembers = team.members.length;

    // Get Stripe subscription details if exists
    let stripeSubscription = null;
    if (team.stripeSubscriptionId) {
      try {
        const stripe = ensureStripe();
        const sub = await stripe.subscriptions.retrieve(team.stripeSubscriptionId);
        stripeSubscription = {
          status: sub.status,
          currentPeriodEnd: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          quantity: sub.items.data[0]?.quantity || 0,
        };
      } catch (e) {
        console.error("Error fetching Stripe subscription:", e);
      }
    }

    // Calculate next bill estimate
    const billableSeats = Math.max(activeMembers, TEAMS_MIN_SEATS);
    const nextBillEstimate = billableSeats * TEAMS_PRICE_PER_SEAT;

    return NextResponse.json({
      billing: {
        stripeCustomerId: team.stripeCustomerId,
        stripeSubscriptionId: team.stripeSubscriptionId,
        subscription: stripeSubscription,
        maxSeats: team.maxSeats,
        totalMembers,
        activeMembers,
        billableSeats,
        nextBillEstimate,
        nextBillEstimateFormatted: `€${(nextBillEstimate / 100).toFixed(2)}`,
        billingCycleStart: team.billingCycleStart,
        aiUsageLimitPerUser: team.aiUsageLimitPerUser,
      },
      history: team.billingRecords.map((r) => ({
        id: r.id,
        periodStart: r.periodStart,
        periodEnd: r.periodEnd,
        totalSeats: r.totalSeats,
        activeSeats: r.activeSeats,
        billedSeats: r.billedSeats,
        amountBilled: r.amountBilled,
        amountFormatted: `€${(r.amountBilled / 100).toFixed(2)}`,
        creditApplied: r.creditApplied,
        creditGenerated: r.creditGenerated,
      })),
    });
  } catch (error) {
    console.error("Error fetching billing:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing information" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teams/[teamId]/billing - Create Teams subscription (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;

    // Check if user is a team admin
    if (!(await isTeamAdmin(session.user.id, teamId))) {
      return NextResponse.json(
        { error: "Only team admins can manage billing" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createSubscriptionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { seats, euDigitalContentConsent } = validation.data;

    if (!euDigitalContentConsent) {
      return NextResponse.json(
        { error: "You must consent to immediate access and waive your withdrawal right to proceed." },
        { status: 400 }
      );
    }

    const team = await prismaUsers.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "Team already has an active subscription. Use PATCH to update seats." },
        { status: 400 }
      );
    }

    const stripe = ensureStripe();

    // Get or create Stripe customer for the team
    let customerId = team.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: team.name,
        metadata: {
          teamId: team.id,
          teamSlug: team.slug,
          adminUserId: session.user.id,
        },
      });
      customerId = customer.id;
    }

    // Create checkout session for Teams subscription
    const priceId = STRIPE_PRICE_IDS.teams_seat_monthly;
    if (!priceId) {
      return NextResponse.json(
        { error: "Teams pricing is not configured" },
        { status: 500 }
      );
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: seats, // Per-seat billing with quantity
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/teams/${team.slug}/manage?billing=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/teams/${team.slug}/manage?billing=canceled`,
      metadata: {
        teamId: team.id,
        seats: seats.toString(),
        euDigitalContentConsent: "true",
        consentTimestamp: new Date().toISOString(),
      },
      subscription_data: {
        metadata: {
          teamId: team.id,
          seats: seats.toString(),
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: "required",
    });

    // Update team with customer ID and max seats
    await prismaUsers.team.update({
      where: { id: teamId },
      data: {
        stripeCustomerId: customerId,
        maxSeats: seats,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/teams/[teamId]/billing - Update seat count (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;

    // Check if user is a team admin
    if (!(await isTeamAdmin(session.user.id, teamId))) {
      return NextResponse.json(
        { error: "Only team admins can update billing" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = updateSeatsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { seats } = validation.data;

    const team = await prismaUsers.team.findUnique({
      where: { id: teamId },
      include: {
        _count: { select: { members: true } },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (!team.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "No active subscription. Use POST to create one." },
        { status: 400 }
      );
    }

    // Can't reduce seats below current member count
    if (seats < team._count.members) {
      return NextResponse.json(
        { error: `Cannot reduce seats below current member count (${team._count.members}). Remove members first.` },
        { status: 400 }
      );
    }

    const stripe = ensureStripe();

    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(team.stripeSubscriptionId);
    const subscriptionItemId = subscription.items.data[0]?.id;

    if (!subscriptionItemId) {
      return NextResponse.json(
        { error: "Subscription item not found" },
        { status: 500 }
      );
    }

    const currentSeats = subscription.items.data[0]?.quantity || TEAMS_MIN_SEATS;
    const isIncreasing = seats > currentSeats;
    const seatDifference = seats - currentSeats;

    // Calculate if this is the same day as billing cycle start
    const now = new Date();
    const cycleStart = team.billingCycleStart ? new Date(team.billingCycleStart) : new Date();
    
    // Check if same day (comparing year, month, day)
    const isSameDayAsCycleStart = 
      now.getFullYear() === cycleStart.getFullYear() &&
      now.getMonth() === cycleStart.getMonth() &&
      now.getDate() === cycleStart.getDate();

    // Determine proration behavior:
    // - Increasing seats on same day as cycle start: no proration (full price)
    // - Increasing seats mid-cycle: prorate
    // - Decreasing seats: no proration, takes effect next cycle
    let prorationBehavior: "create_prorations" | "none" | "always_invoice" = "none";
    
    if (isIncreasing) {
      if (isSameDayAsCycleStart) {
        // Same day = full price, use always_invoice to charge immediately
        prorationBehavior = "always_invoice";
      } else {
        // Mid-cycle = prorate
        prorationBehavior = "create_prorations";
      }
    }
    // Decreasing: prorationBehavior stays "none" (no refund, change takes effect at renewal)

    // Update subscription quantity
    await stripe.subscriptions.update(team.stripeSubscriptionId, {
      items: [
        {
          id: subscriptionItemId,
          quantity: seats,
        },
      ],
      proration_behavior: prorationBehavior,
      metadata: {
        ...subscription.metadata,
        seats: seats.toString(),
      },
    });

    // Update team max seats
    await prismaUsers.team.update({
      where: { id: teamId },
      data: { maxSeats: seats },
    });

    // Calculate amount for response
    let chargeAmount = 0;
    let chargeNote = "";

    if (isIncreasing) {
      if (isSameDayAsCycleStart) {
        // Full price for new seats
        chargeAmount = seatDifference * TEAMS_PRICE_PER_SEAT;
        chargeNote = "Full amount charged for new seats (same day as billing cycle start)";
      } else {
        // Calculate prorated amount
        const cycleEnd = new Date(cycleStart);
        cycleEnd.setMonth(cycleEnd.getMonth() + 1);
        
        const totalDays = Math.ceil((cycleEnd.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.ceil((cycleEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        chargeAmount = calculateProratedAmount(
          Math.max(0, daysRemaining),
          totalDays,
          seatDifference
        );
        chargeNote = `Prorated amount charged for ${daysRemaining} remaining days`;
      }
    } else {
      chargeNote = "Seat reduction will take effect at the next billing cycle. No refund for current period.";
    }

    return NextResponse.json({
      message: `Seat count updated from ${currentSeats} to ${seats}`,
      previousSeats: currentSeats,
      newSeats: seats,
      chargeAmount: isIncreasing ? chargeAmount : 0,
      chargeAmountFormatted: isIncreasing ? `€${(chargeAmount / 100).toFixed(2)}` : "€0.00",
      note: chargeNote,
      isSameDayAsCycleStart,
    });
  } catch (error) {
    console.error("Error updating seats:", error);
    return NextResponse.json(
      { error: "Failed to update seat count" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teams/[teamId]/billing - Cancel subscription (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;

    // Check if user is a team admin
    if (!(await isTeamAdmin(session.user.id, teamId))) {
      return NextResponse.json(
        { error: "Only team admins can cancel subscription" },
        { status: 403 }
      );
    }

    const team = await prismaUsers.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (!team.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "No active subscription to cancel" },
        { status: 400 }
      );
    }

    const stripe = ensureStripe();

    // Cancel at period end (don't immediately revoke access)
    await stripe.subscriptions.update(team.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({
      message: "Subscription will be canceled at the end of the current billing period",
      note: "Team members will retain access until then",
    });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}

