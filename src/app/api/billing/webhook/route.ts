import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ensureStripe, getPlanFromPriceId, getIntervalFromPriceId } from "@/lib/stripe";
import { prismaUsers } from "@/lib/db-users";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const stripe = ensureStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // Handle blueprint purchases (one-time payments)
        if (session.metadata?.type === "blueprint_purchase") {
          await handleBlueprintPurchase(session);
        } else {
          // Handle subscription checkout
          await handleCheckoutCompleted(session);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        // Check if this is a Teams subscription (has teamId in metadata)
        if (subscription.metadata?.teamId) {
          await handleTeamsSubscriptionChange(subscription);
        } else {
          await handleSubscriptionChange(subscription);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        // Check if this is a Teams subscription
        if (subscription.metadata?.teamId) {
          await handleTeamsSubscriptionDeleted(subscription);
        } else {
          await handleSubscriptionDeleted(subscription);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Check if this is a Teams checkout
  if (session.metadata?.type === "teams") {
    await handleTeamsCheckoutCompleted(session);
    return;
  }

  const userId = session.metadata?.userId;
  if (!userId) {
    console.error("No userId in checkout session metadata");
    return;
  }

  // Subscription will be updated by subscription.created/updated webhook
  console.log(`Checkout completed for user ${userId}`);
}

async function handleTeamsCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { teamName, teamSlug, creatorUserId } = session.metadata || {};
  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  if (!teamName || !teamSlug || !creatorUserId) {
    console.error("Missing team metadata in checkout session", session.metadata);
    return;
  }

  // Check if team already exists (in case of duplicate webhook)
  const existingTeam = await prismaUsers.team.findUnique({
    where: { slug: teamSlug },
  });

  if (existingTeam) {
    console.log(`Team ${teamSlug} already exists, skipping creation`);
    return;
  }

  // Get subscription details for billing info
  const stripe = ensureStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  // Get the interval from the subscription
  const interval = subscription.items.data[0]?.plan?.interval === "year" ? "annual" : "monthly";

  // Create the team
  const team = await prismaUsers.team.create({
    data: {
      name: teamName,
      slug: teamSlug,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      subscriptionInterval: interval,
      maxSeats: subscription.items.data[0]?.quantity || 3,
      billingCycleStart: new Date(),
      members: {
        create: {
          userId: creatorUserId,
          role: "ADMIN",
          isActiveThisCycle: true,
          lastActiveAt: new Date(),
        },
      },
    },
  });

  // Update the subscription metadata with the team ID
  await stripe.subscriptions.update(subscriptionId, {
    metadata: {
      teamId: team.id,
      teamSlug: team.slug,
    },
  });

  // Update the creator's subscription plan to TEAMS
  await prismaUsers.user.update({
    where: { id: creatorUserId },
    data: {
      subscriptionPlan: "TEAMS",
    },
  });

  console.log(`Team "${teamName}" created successfully with ID ${team.id}`);
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  const customerId = subscription.customer as string;

  // Find user by customer ID or metadata
  const user = await prismaUsers.user.findFirst({
    where: userId ? { id: userId } : { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error(`User not found for subscription ${subscription.id}`);
    return;
  }

  // Get the plan and interval from the first subscription item
  const priceId = subscription.items.data[0]?.price?.id;
  const plan = priceId ? getPlanFromPriceId(priceId) : "free";
  const interval = priceId ? getIntervalFromPriceId(priceId) : "monthly";

  // Map subscription status
  type SubscriptionPlan = "FREE" | "PRO" | "MAX";
  const planMap: Record<string, SubscriptionPlan> = {
    free: "FREE",
    pro: "PRO",
    max: "MAX",
  };

  // Get current period end - cast to access the property
  const sub = subscription as unknown as { current_period_end?: number };
  const currentPeriodEnd = sub.current_period_end;

  // Determine effective plan based on subscription status
  // If subscription is not active/trialing, user should be on FREE
  const isActiveSubscription = 
    subscription.status === "active" || 
    subscription.status === "trialing";
  
  const effectivePlan: SubscriptionPlan = isActiveSubscription 
    ? (planMap[plan] || "FREE") 
    : "FREE";

  await prismaUsers.user.update({
    where: { id: user.id },
    data: {
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      subscriptionPlan: effectivePlan,
      subscriptionStatus: subscription.status,
      subscriptionInterval: interval,
      currentPeriodEnd: currentPeriodEnd 
        ? new Date(currentPeriodEnd * 1000) 
        : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  console.log(`Updated subscription for user ${user.id}: ${effectivePlan} ${interval} (status: ${subscription.status})`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const user = await prismaUsers.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error(`User not found for customer ${customerId}`);
    return;
  }

  await prismaUsers.user.update({
    where: { id: user.id },
    data: {
      subscriptionPlan: "FREE",
      subscriptionStatus: "canceled",
      stripeSubscriptionId: null,
      cancelAtPeriodEnd: false,
    },
  });

  console.log(`Subscription deleted for user ${user.id}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const user = await prismaUsers.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (user) {
    await prismaUsers.user.update({
      where: { id: user.id },
      data: { subscriptionStatus: "past_due" },
    });
    console.log(`Payment failed for user ${user.id}`);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const inv = invoice as unknown as { subscription?: string; billing_reason?: string };
  const subscriptionId = inv.subscription;

  const user = await prismaUsers.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) return;

  // Update status if was past_due
  if (user.subscriptionStatus === "past_due") {
    await prismaUsers.user.update({
      where: { id: user.id },
      data: { subscriptionStatus: "active" },
    });
    console.log(`Payment succeeded for user ${user.id}`);
  }

  // Check for scheduled downgrade on renewal invoices
  if (subscriptionId && inv.billing_reason === "subscription_cycle") {
    try {
      const stripe = ensureStripe();
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      const scheduledDowngrade = subscription.metadata?.scheduledDowngrade;
      const scheduledDowngradePrice = subscription.metadata?.scheduledDowngradePrice;
      
      if (scheduledDowngrade && scheduledDowngradePrice) {
        // Apply the downgrade now
        await stripe.subscriptions.update(subscriptionId, {
          items: [
            {
              id: subscription.items.data[0].id,
              price: scheduledDowngradePrice,
            },
          ],
          proration_behavior: "none", // Already at new billing cycle
          metadata: {
            ...subscription.metadata,
            scheduledDowngrade: null,
            scheduledDowngradePrice: null,
            plan: scheduledDowngrade,
          },
        });

        // Update database
        type SubscriptionPlan = "FREE" | "PRO" | "MAX";
        const planMap: Record<string, SubscriptionPlan> = {
          pro: "PRO",
          max: "MAX",
          free: "FREE",
        };
        
        await prismaUsers.user.update({
          where: { id: user.id },
          data: {
            subscriptionPlan: planMap[scheduledDowngrade] || "PRO",
          },
        });

        console.log(`Applied scheduled downgrade to ${scheduledDowngrade} for user ${user.id}`);
      }
    } catch (error) {
      console.error("Error applying scheduled downgrade:", error);
    }
  }
}

// Platform owner email - payments go directly to the platform's Stripe account
const PLATFORM_OWNER_EMAIL = "dev@lynxprompt.com";

async function handleBlueprintPurchase(session: Stripe.Checkout.Session) {
  const { templateId, userId, originalPrice, paidPrice, isMaxDiscount, currency, teamId } = session.metadata || {};

  // Backwards compatibility with old purchases that only have 'price'
  const price = originalPrice || session.metadata?.price;
  const actualPaid = paidPrice || price;

  if (!templateId || !userId || !price || !actualPaid) {
    console.error("Missing metadata in blueprint purchase session");
    return;
  }

  const originalPriceInCents = parseInt(price, 10);
  const paidPriceInCents = parseInt(actualPaid, 10);
  
  // Check if the template belongs to the platform owner
  // For platform owner blueprints, all revenue stays with platform (no payout needed)
  const template = await prismaUsers.userTemplate.findUnique({
    where: { id: templateId },
    select: { user: { select: { email: true } } },
  });
  
  const isPlatformOwnerTemplate = template?.user?.email === PLATFORM_OWNER_EMAIL;
  
  // Author gets 70% of ORIGINAL price, UNLESS it's the platform owner's template
  // Platform owner's revenue goes directly to Stripe (no payout needed)
  const authorShare = isPlatformOwnerTemplate ? 0 : Math.floor(originalPriceInCents * 0.7);
  // Platform fee is what's left from what was paid
  const platformFee = paidPriceInCents - authorShare;

  try {
    // Create purchase record - if teamId is present, this is a team purchase
    const purchaseData: {
      userId: string;
      templateId: string;
      amount: number;
      currency: string;
      stripePaymentId: string;
      authorShare: number;
      platformFee: number;
      teamId?: string;
    } = {
      userId,
      templateId,
      amount: paidPriceInCents, // What was actually paid
      currency: currency || "EUR",
      stripePaymentId: session.payment_intent as string,
      authorShare, // 70% of original price
      platformFee, // Remaining (20% if discounted, 30% if not)
    };
    
    // If purchased by a team member, add teamId (makes it available to entire team)
    if (teamId) {
      purchaseData.teamId = teamId;
    }
    
    await prismaUsers.blueprintPurchase.create({
      data: purchaseData,
    });

    // Update template revenue with original price (for author earnings tracking)
    await prismaUsers.userTemplate.update({
      where: { id: templateId },
      data: {
        totalRevenue: { increment: originalPriceInCents },
        downloads: { increment: 1 },
      },
    });

    const teamInfo = teamId ? ` (team: ${teamId})` : "";
    console.log(`Blueprint purchase: ${templateId} by ${userId}${teamInfo} - paid: ${paidPriceInCents} cents, original: ${originalPriceInCents} cents (author: ${authorShare}, platform: ${platformFee}, max discount: ${isMaxDiscount === "true"})`);
  } catch (error) {
    // Handle duplicate purchase (race condition)
    if ((error as { code?: string }).code === "P2002") {
      console.log(`Duplicate purchase attempt for ${templateId} by ${userId}`);
    } else {
      throw error;
    }
  }
}

/**
 * Handle Teams subscription changes
 */
async function handleTeamsSubscriptionChange(subscription: Stripe.Subscription) {
  const teamId = subscription.metadata?.teamId;
  const customerId = subscription.customer as string;

  // Find team by teamId or customer ID
  const team = await prismaUsers.team.findFirst({
    where: teamId ? { id: teamId } : { stripeCustomerId: customerId },
  });

  if (!team) {
    console.error(`Team not found for subscription ${subscription.id}`);
    return;
  }

  // Get seat count from subscription
  const seatCount = subscription.items.data[0]?.quantity || 3;
  
  // Get current period info
  const sub = subscription as unknown as { current_period_start?: number; current_period_end?: number };
  const billingCycleStart = sub.current_period_start 
    ? new Date(sub.current_period_start * 1000) 
    : null;

  await prismaUsers.team.update({
    where: { id: team.id },
    data: {
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      maxSeats: seatCount,
      billingCycleStart,
    },
  });

  // If subscription became active, mark team members as TEAMS plan
  if (subscription.status === "active") {
    const members = await prismaUsers.teamMember.findMany({
      where: { teamId: team.id },
      select: { userId: true },
    });
    
    // Update all team members to TEAMS plan
    await prismaUsers.user.updateMany({
      where: { id: { in: members.map(m => m.userId) } },
      data: { subscriptionPlan: "TEAMS" },
    });
    
    console.log(`Team ${team.id} activated: ${members.length} members upgraded to TEAMS plan`);
  }

  console.log(`Updated Teams subscription for team ${team.id}: ${seatCount} seats (status: ${subscription.status})`);
}

/**
 * Handle Teams subscription deletion
 */
async function handleTeamsSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const team = await prismaUsers.team.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!team) {
    console.error(`Team not found for customer ${customerId}`);
    return;
  }

  // Get all team members
  const members = await prismaUsers.teamMember.findMany({
    where: { teamId: team.id },
    select: { userId: true },
  });

  // Downgrade all team members to FREE plan
  await prismaUsers.user.updateMany({
    where: { id: { in: members.map(m => m.userId) } },
    data: { subscriptionPlan: "FREE" },
  });

  await prismaUsers.team.update({
    where: { id: team.id },
    data: {
      stripeSubscriptionId: null,
      billingCycleStart: null,
    },
  });

  console.log(`Teams subscription canceled for team ${team.id}: ${members.length} members downgraded to FREE`);
}




