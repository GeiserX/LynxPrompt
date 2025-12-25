import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ensureStripe, getPlanFromPriceId } from "@/lib/stripe";
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
        await handleSubscriptionChange(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
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
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error("No userId in checkout session metadata");
    return;
  }

  // Subscription will be updated by subscription.created/updated webhook
  console.log(`Checkout completed for user ${userId}`);
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

  // Get the plan from the first subscription item
  const priceId = subscription.items.data[0]?.price?.id;
  const plan = priceId ? getPlanFromPriceId(priceId) : "free";

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
      currentPeriodEnd: currentPeriodEnd 
        ? new Date(currentPeriodEnd * 1000) 
        : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  console.log(`Updated subscription for user ${user.id}: ${effectivePlan} (status: ${subscription.status})`);
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
  const { templateId, userId, originalPrice, paidPrice, isMaxDiscount, currency } = session.metadata || {};

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
    // Create purchase record
    await prismaUsers.blueprintPurchase.create({
      data: {
        userId,
        templateId,
        amount: paidPriceInCents, // What was actually paid
        currency: currency || "EUR",
        stripePaymentId: session.payment_intent as string,
        authorShare, // 70% of original price
        platformFee, // Remaining (20% if discounted, 30% if not)
      },
    });

    // Update template revenue with original price (for author earnings tracking)
    await prismaUsers.userTemplate.update({
      where: { id: templateId },
      data: {
        totalRevenue: { increment: originalPriceInCents },
        downloads: { increment: 1 },
      },
    });

    console.log(`Blueprint purchase: ${templateId} by ${userId} - paid: ${paidPriceInCents} cents, original: ${originalPriceInCents} cents (author: ${authorShare}, platform: ${platformFee}, max discount: ${isMaxDiscount === "true"})`);
  } catch (error) {
    // Handle duplicate purchase (race condition)
    if ((error as { code?: string }).code === "P2002") {
      console.log(`Duplicate purchase attempt for ${templateId} by ${userId}`);
    } else {
      throw error;
    }
  }
}




