import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { ensureStripe } from "@/lib/stripe";

/**
 * Helper: Get user's team membership (if any)
 */
async function getUserTeam(userId: string) {
  const membership = await prismaUsers.teamMember.findFirst({
    where: { userId },
    include: { team: { select: { id: true, name: true } } },
  });
  return membership;
}

/**
 * Helper: Check if blueprint is already purchased (individually or by team)
 */
async function checkExistingPurchase(userId: string, templateId: string, teamId?: string | null) {
  // Check individual purchase
  const individualPurchase = await prismaUsers.blueprintPurchase.findUnique({
    where: {
      userId_templateId: { userId, templateId },
    },
  });
  
  if (individualPurchase) {
    return { purchased: true, source: "individual" as const };
  }
  
  // Check team purchase
  if (teamId) {
    const teamPurchase = await prismaUsers.blueprintPurchase.findFirst({
      where: {
        teamId,
        templateId,
      },
    });
    
    if (teamPurchase) {
      return { purchased: true, source: "team" as const };
    }
  }
  
  return { purchased: false, source: null };
}

/**
 * POST /api/blueprints/purchase
 * Create a Stripe Checkout session for a paid blueprint
 * For Teams users: purchase is shared with the entire team
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

    // Check if user is part of a team
    const teamMembership = await getUserTeam(session.user.id);
    const teamId = teamMembership?.team?.id || null;
    const teamName = teamMembership?.team?.name || null;

    // Check if already purchased (individually or by team)
    const purchaseCheck = await checkExistingPurchase(session.user.id, templateId, teamId);
    
    if (purchaseCheck.purchased) {
      return NextResponse.json(
        { 
          error: purchaseCheck.source === "team" 
            ? "Your team already owns this blueprint" 
            : "Already purchased",
          alreadyOwned: true,
          source: purchaseCheck.source,
        },
        { status: 400 }
      );
    }

    // Check if user is Teams subscriber for discount
    const user = await prismaUsers.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionPlan: true, role: true },
    });
    
    // Teams users get 10% discount (also admins/superadmins)
    const isTeamsUser = user?.subscriptionPlan === "TEAMS" ||
                        user?.role === "ADMIN" || 
                        user?.role === "SUPERADMIN";
    
    // Teams subscribers get 10% discount (platform absorbs it, author still gets 70% of original)
    const TEAMS_DISCOUNT_PERCENT = 10;
    const originalPrice = template.price;
    const discountedPrice = isTeamsUser 
      ? Math.round(originalPrice * (1 - TEAMS_DISCOUNT_PERCENT / 100))
      : originalPrice;

    // Create Stripe Checkout session for one-time payment
    const stripe = ensureStripe();
    const authorName = template.user.displayName || template.user.name || "Author";
    
    // Description includes team info and discount
    let description = `Blueprint by ${authorName}`;
    if (teamName && isTeamsUser) {
      description = `Blueprint by ${authorName} (10% Teams discount, shared with ${teamName})`;
    } else if (teamName) {
      description = `Blueprint by ${authorName} (shared with ${teamName})`;
    } else if (isTeamsUser) {
      description = `Blueprint by ${authorName} (10% Teams subscriber discount applied)`;
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: template.currency.toLowerCase(),
            product_data: {
              name: template.name,
              description,
              metadata: {
                templateId: template.id,
                authorId: template.userId,
                teamId: teamId || "",
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
        teamId: teamId || "", // Include team for webhook processing
        originalPrice: originalPrice.toString(), // Store original for author share calculation
        paidPrice: discountedPrice.toString(),
        isTeamsDiscount: isTeamsUser ? "true" : "false",
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
 * Check if user has purchased a blueprint (individually or via team)
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

    // Check if user is part of a team
    const teamMembership = await getUserTeam(session.user.id);
    const teamId = teamMembership?.team?.id || null;

    // Check for purchase (individual or team)
    const purchaseCheck = await checkExistingPurchase(session.user.id, templateId, teamId);
    
    if (purchaseCheck.purchased) {
      // Get purchase date
      let purchaseDate = null;
      if (purchaseCheck.source === "individual") {
        const purchase = await prismaUsers.blueprintPurchase.findUnique({
          where: { userId_templateId: { userId: session.user.id, templateId } },
          select: { createdAt: true },
        });
        purchaseDate = purchase?.createdAt;
      } else if (purchaseCheck.source === "team" && teamId) {
        const purchase = await prismaUsers.blueprintPurchase.findFirst({
          where: { teamId, templateId },
          select: { createdAt: true },
        });
        purchaseDate = purchase?.createdAt;
      }
      
      return NextResponse.json({
        purchased: true,
        purchaseDate,
        source: purchaseCheck.source, // "individual" or "team"
        teamName: purchaseCheck.source === "team" ? teamMembership?.team?.name : null,
      });
    }

    return NextResponse.json({
      purchased: false,
      purchaseDate: null,
    });
  } catch (error) {
    console.error("Check purchase error:", error);
    return NextResponse.json({ purchased: false });
  }
}


