import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { ensureStripe, STRIPE_PRICE_IDS } from "@/lib/stripe";
import { z } from "zod";

const MIN_SEATS = 3;

// Validation schema for team creation
const createTeamSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, {
    message: "Slug must be lowercase alphanumeric with hyphens only",
  }),
  interval: z.enum(["monthly", "annual"]).optional().default("monthly"),
  seats: z.number().min(MIN_SEATS, `Minimum ${MIN_SEATS} seats required`).optional().default(MIN_SEATS),
});

/**
 * GET /api/teams - List teams the user belongs to
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberships = await prismaUsers.teamMember.findMany({
      where: { userId: session.user.id },
      include: {
        team: {
          include: {
            _count: {
              select: { members: true },
            },
          },
        },
      },
    });

    const teams = memberships.map((m) => ({
      id: m.team.id,
      name: m.team.name,
      slug: m.team.slug,
      role: m.role,
      memberCount: m.team._count.members,
      joinedAt: m.joinedAt,
      billingCycleStart: m.team.billingCycleStart,
      maxSeats: m.team.maxSeats,
    }));

    return NextResponse.json({ teams });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teams - Create a new team (redirects to Stripe checkout)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createTeamSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { name, slug, interval, seats } = validation.data;

    // Check if user is already in a team
    const existingMembership = await prismaUsers.teamMember.findFirst({
      where: { userId: session.user.id },
      include: { team: true },
    });

    if (existingMembership) {
      return NextResponse.json(
        { 
          error: `You are already a member of "${existingMembership.team.name}". Leave that team first to create a new one.`,
          existingTeam: existingMembership.team.slug,
        },
        { status: 409 }
      );
    }

    // Check if slug is already taken
    const existingTeam = await prismaUsers.team.findUnique({
      where: { slug },
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: "Team URL is already taken. Please choose a different one." },
        { status: 409 }
      );
    }

    // Get or create Stripe customer
    const stripe = ensureStripe();
    let stripeCustomerId = await prismaUsers.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true },
    }).then(u => u?.stripeCustomerId);

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name || undefined,
        metadata: {
          userId: session.user.id,
        },
      });
      stripeCustomerId = customer.id;

      await prismaUsers.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId },
      });
    }

    // Determine price ID based on interval
    const priceId = interval === "annual" 
      ? STRIPE_PRICE_IDS.teams_seat_annual 
      : STRIPE_PRICE_IDS.teams_seat_monthly;

    if (!priceId) {
      return NextResponse.json(
        { error: "Teams pricing not configured. Please contact support." },
        { status: 500 }
      );
    }

    // Create Stripe checkout session for Teams subscription
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: seats,
        },
      ],
      subscription_data: {
        metadata: {
          teamName: name,
          teamSlug: slug,
          creatorUserId: session.user.id,
          type: "teams",
          seats: seats.toString(),
        },
      },
      metadata: {
        teamName: name,
        teamSlug: slug,
        creatorUserId: session.user.id,
        type: "teams",
        seats: seats.toString(),
      },
      success_url: `${process.env.NEXTAUTH_URL}/teams/${slug}?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/teams?cancelled=true`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Failed to create team. Please try again." },
      { status: 500 }
    );
  }
}

