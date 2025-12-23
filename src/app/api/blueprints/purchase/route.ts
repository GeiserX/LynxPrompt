import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { ensureStripe } from "@/lib/stripe";

/**
 * POST /api/blueprints/purchase
 * Create a Stripe Checkout session for a paid blueprint
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

    const { templateId } = await request.json();

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    // Get the template
    const template = await prismaUsers.userTemplate.findUnique({
      where: { id: templateId },
      include: { user: { select: { displayName: true, name: true } } },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Blueprint not found" },
        { status: 404 }
      );
    }

    if (!template.price) {
      return NextResponse.json(
        { error: "This blueprint is free" },
        { status: 400 }
      );
    }

    // Check if already purchased
    const existingPurchase = await prismaUsers.blueprintPurchase.findUnique({
      where: {
        userId_templateId: {
          userId: session.user.id,
          templateId,
        },
      },
    });

    if (existingPurchase) {
      return NextResponse.json(
        { error: "Already purchased", alreadyOwned: true },
        { status: 400 }
      );
    }

    // Check if user is MAX subscriber for discount
    const user = await prismaUsers.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionPlan: true, role: true },
    });
    
    const isMaxUser = user?.subscriptionPlan === "MAX" || 
                      user?.role === "ADMIN" || 
                      user?.role === "SUPERADMIN";
    
    // MAX subscribers get 10% discount (platform absorbs it, author still gets 70% of original)
    const MAX_DISCOUNT_PERCENT = 10;
    const originalPrice = template.price;
    const discountedPrice = isMaxUser 
      ? Math.round(originalPrice * (1 - MAX_DISCOUNT_PERCENT / 100))
      : originalPrice;

    // Create Stripe Checkout session for one-time payment
    const stripe = ensureStripe();
    const authorName = template.user.displayName || template.user.name || "Author";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: template.currency.toLowerCase(),
            product_data: {
              name: template.name,
              description: isMaxUser 
                ? `Blueprint by ${authorName} (10% Max subscriber discount applied)`
                : `Blueprint by ${authorName}`,
              metadata: {
                templateId: template.id,
                authorId: template.userId,
              },
            },
            unit_amount: discountedPrice, // Charge discounted price
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "blueprint_purchase",
        templateId: template.id,
        userId: session.user.id,
        authorId: template.userId,
        originalPrice: originalPrice.toString(), // Store original for author share calculation
        paidPrice: discountedPrice.toString(),
        isMaxDiscount: isMaxUser ? "true" : "false",
        currency: template.currency,
      },
      success_url: `${process.env.NEXTAUTH_URL}/blueprints/${templateId}?purchased=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/blueprints/${templateId}?canceled=true`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Blueprint purchase error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/blueprints/purchase?templateId=xxx
 * Check if user has purchased a blueprint
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ purchased: false });
    }

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("templateId");

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    const purchase = await prismaUsers.blueprintPurchase.findUnique({
      where: {
        userId_templateId: {
          userId: session.user.id,
          templateId,
        },
      },
    });

    return NextResponse.json({
      purchased: !!purchase,
      purchaseDate: purchase?.createdAt || null,
    });
  } catch (error) {
    console.error("Check purchase error:", error);
    return NextResponse.json({ purchased: false });
  }
}

