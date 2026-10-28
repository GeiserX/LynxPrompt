import { NextRequest, NextResponse } from "next/server";
import { prismaUsers } from "@/lib/db-users";
import { requireSession } from "@/lib/api-auth";

/**
 * GET /api/user/preferences
 * Get user preferences by category (optional filter)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession(request);
    if (auth instanceof NextResponse) return auth;
    const { session } = auth;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (category) {
      where.category = category;
    }

    const preferences = await prismaUsers.preference.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    // Group by category
    const grouped = preferences.reduce((acc, pref) => {
      if (!acc[pref.category]) {
        acc[pref.category] = {};
      }
      acc[pref.category][pref.key] = {
        value: pref.value,
        isDefault: pref.isDefault,
        usageCount: pref.usageCount,
      };
      return acc;
    }, {} as Record<string, Record<string, { value: string; isDefault: boolean; usageCount: number }>>);

    return NextResponse.json({ preferences: grouped });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/preferences
 * Save or update a user preference
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(request);
    if (auth instanceof NextResponse) return auth;
    const { session } = auth;

    const { category, key, value, isDefault } = await request.json();

    if (!category || !key || value === undefined) {
      return NextResponse.json(
        { error: "Category, key, and value are required" },
        { status: 400 }
      );
    }

    // Valid categories
    const validCategories = ["license", "funding", "variables", "settings"];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    // Enforce value size limit (10KB)
    const MAX_VALUE_LENGTH = 10240;
    const stringifiedValue = typeof value === "string" ? value : JSON.stringify(value);
    if (stringifiedValue.length > MAX_VALUE_LENGTH) {
      return NextResponse.json(
        { error: `Value too large. Maximum size is ${MAX_VALUE_LENGTH} characters.` },
        { status: 400 }
      );
    }

    // Upsert the preference
    const preference = await prismaUsers.preference.upsert({
      where: {
        userId_category_key: {
          userId: session.user.id,
          category,
          key,
        },
      },
      update: {
        value: typeof value === "string" ? value : JSON.stringify(value),
        isDefault: Boolean(isDefault),
        usageCount: { increment: 1 },
      },
      create: {
        userId: session.user.id,
        category,
        key,
        value: typeof value === "string" ? value : JSON.stringify(value),
        isDefault: Boolean(isDefault),
        usageCount: 1,
      },
    });

    return NextResponse.json({ success: true, preference });
  } catch (error) {
    console.error("Error saving preference:", error);
    return NextResponse.json(
      { error: "Failed to save preference" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/preferences
 * Delete a user preference
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireSession(request);
    if (auth instanceof NextResponse) return auth;
    const { session } = auth;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const key = searchParams.get("key");

    if (!category || !key) {
      return NextResponse.json(
        { error: "Category and key are required" },
        { status: 400 }
      );
    }

    await prismaUsers.preference.delete({
      where: {
        userId_category_key: {
          userId: session.user.id,
          category,
          key,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting preference:", error);
    return NextResponse.json(
      { error: "Failed to delete preference" },
      { status: 500 }
    );
  }
}

