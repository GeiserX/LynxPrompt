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
        await handleCheckoutCompleted(session);
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

  // Get current period end from the first subscription item or subscription level
  const currentPeriodEnd = subscription.items?.data[0]?.current_period_end 
    ?? (subscription as unknown as { current_period_end?: number }).current_period_end;

  await prismaUsers.user.update({
    where: { id: user.id },
    data: {
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      subscriptionPlan: planMap[plan] || "FREE",
      subscriptionStatus: subscription.status,
      currentPeriodEnd: currentPeriodEnd 
        ? new Date(currentPeriodEnd * 1000) 
        : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  console.log(`Updated subscription for user ${user.id}: ${plan} (${subscription.status})`);
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

  const user = await prismaUsers.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (user && user.subscriptionStatus === "past_due") {
    await prismaUsers.user.update({
      where: { id: user.id },
      data: { subscriptionStatus: "active" },
    });
    console.log(`Payment succeeded for user ${user.id}`);
  }
}

