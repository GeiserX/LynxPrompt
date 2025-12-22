import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureStripe, getPriceIdForPlan, type SubscriptionPlan } from "@/lib/stripe";
import { prismaUsers } from "@/lib/db-users";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { plan, euDigitalContentConsent } = (await request.json()) as { 
      plan: SubscriptionPlan;
      euDigitalContentConsent?: boolean;
    };

    if (!plan || (plan !== "pro" && plan !== "max")) {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }

    // EU Digital Content Directive compliance
    // User must consent to immediate access and waive 14-day withdrawal right
    if (!euDigitalContentConsent) {
      return NextResponse.json(
        { error: "You must consent to immediate access and waive your withdrawal right to proceed." },
        { status: 400 }
      );
    }

    const priceId = getPriceIdForPlan(plan);
    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe price not configured for this plan" },
        { status: 500 }
      );
    }

    const stripe = ensureStripe();

    // Get or create Stripe customer
    const user = await prismaUsers.user.findUnique({
      where: { id: session.user.id },
      select: { 
        stripeCustomerId: true, 
        stripeSubscriptionId: true,
        subscriptionStatus: true,
        email: true, 
        name: true 
      },
    });

    // If user already has an active subscription, they should use plan change API
    if (user?.stripeSubscriptionId && 
        (user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing")) {
      return NextResponse.json(
        { 
          error: "You already have an active subscription. Use the change plan option instead.",
          hasActiveSubscription: true,
          redirectTo: "/api/billing/change-plan"
        },
        { status: 400 }
      );
    }

    let customerId = user?.stripeCustomerId;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: user?.name || undefined,
        metadata: {
          userId: session.user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to database
      await prismaUsers.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create Stripe Checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/settings?tab=billing&success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/settings?tab=billing&canceled=true`,
      metadata: {
        userId: session.user.id,
        plan: plan,
        // EU Digital Content Directive consent tracking
        euDigitalContentConsent: "true",
        consentTimestamp: new Date().toISOString(),
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          plan: plan,
          euDigitalContentConsent: "true",
          consentTimestamp: new Date().toISOString(),
        },
      },
      // Allow promotion codes
      allow_promotion_codes: true,
      // Collect billing address for VAT
      billing_address_collection: "required",
      // Automatic tax calculation (if configured)
      automatic_tax: { enabled: false }, // Enable when Stripe Tax is configured
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}



