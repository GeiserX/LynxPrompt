import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ensureStripe } from "@/lib/stripe";
import { prismaUsers } from "@/lib/db-users";
import { ENABLE_STRIPE } from "@/lib/feature-flags";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!ENABLE_STRIPE) {
    return NextResponse.json(
      { error: "Payments are not enabled on this instance" },
      { status: 404 }
    );
  }

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
        if (session.metadata?.type === "blueprint_purchase") {
          await handleBlueprintPurchase(session);
        }
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

const PLATFORM_OWNER_EMAIL = "dev@lynxprompt.com";

async function handleBlueprintPurchase(session: Stripe.Checkout.Session) {
  const { templateId, userId, originalPrice, paidPrice, isMaxDiscount, currency, teamId } = session.metadata || {};

  const price = originalPrice || session.metadata?.price;
  const actualPaid = paidPrice || price;

  if (!templateId || !userId || !price || !actualPaid) {
    console.error("Missing metadata in blueprint purchase session");
    return;
  }

  const originalPriceInCents = parseInt(price, 10);
  const paidPriceInCents = parseInt(actualPaid, 10);
  
  const template = await prismaUsers.userTemplate.findUnique({
    where: { id: templateId },
    select: { 
      user: { select: { email: true } },
      currentVersion: true,
      publishedVersion: true,
    },
  });
  
  const isPlatformOwnerTemplate = template?.user?.email === PLATFORM_OWNER_EMAIL;
  
  const authorShare = isPlatformOwnerTemplate ? 0 : Math.floor(originalPriceInCents * 0.7);
  const platformFee = paidPriceInCents - authorShare;

  const purchaseVersion = template?.publishedVersion || template?.currentVersion || 1;
  
  const versionRecord = await prismaUsers.userTemplateVersion.findUnique({
    where: {
      templateId_version: {
        templateId,
        version: purchaseVersion,
      },
    },
    select: { id: true },
  });

  try {
    const purchaseData: {
      userId: string;
      templateId: string;
      amount: number;
      currency: string;
      stripePaymentId: string;
      authorShare: number;
      platformFee: number;
      teamId?: string;
      versionId?: string;
      versionNumber?: number;
    } = {
      userId,
      templateId,
      amount: paidPriceInCents,
      currency: currency || "EUR",
      stripePaymentId: session.payment_intent as string,
      authorShare,
      platformFee,
      versionId: versionRecord?.id || undefined,
      versionNumber: purchaseVersion,
    };
    
    if (teamId) {
      purchaseData.teamId = teamId;
    }
    
    await prismaUsers.blueprintPurchase.create({
      data: purchaseData,
    });

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
    if ((error as { code?: string }).code === "P2002") {
      console.log(`Duplicate purchase attempt for ${templateId} by ${userId}`);
    } else {
      throw error;
    }
  }
}
