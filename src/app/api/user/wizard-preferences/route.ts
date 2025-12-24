import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";

// GET - Fetch all wizard preferences for the user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await prismaUsers.preference.findMany({
      where: { userId: session.user.id },
    });

    // Convert to a structured object
    const prefs: Record<string, Record<string, { value: string; isDefault: boolean }>> = {};
    
    for (const pref of preferences) {
      if (!prefs[pref.category]) {
        prefs[pref.category] = {};
      }
      prefs[pref.category][pref.key] = {
        value: pref.value,
        isDefault: pref.isDefault,
      };
    }

    return NextResponse.json(prefs);
  } catch (error) {
    console.error("Error fetching wizard preferences:", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

// POST - Save wizard preferences
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // Accept both formats: { preferences: [...] } or just [...]
    let preferences: Array<{
      category: string;
      key: string;
      value: string;
      isDefault?: boolean;
    }>;
    
    if (Array.isArray(body)) {
      // Direct array format (from wizard's saveToProfileImmediately)
      preferences = body;
    } else if (body?.preferences && Array.isArray(body.preferences)) {
      // Object format with preferences property
      preferences = body.preferences;
    } else {
      return NextResponse.json({ error: "Invalid preferences format" }, { status: 400 });
    }

    if (preferences.length === 0) {
      return NextResponse.json({ saved: 0 });
    }

    // Upsert each preference
    const results = await Promise.all(
      preferences.map((pref) =>
        prismaUsers.preference.upsert({
          where: {
            userId_category_key: {
              userId: session.user.id,
              category: pref.category,
              key: pref.key,
            },
          },
          create: {
            userId: session.user.id,
            category: pref.category,
            key: pref.key,
            value: pref.value,
            isDefault: pref.isDefault ?? false,
          },
          update: {
            value: pref.value,
            isDefault: pref.isDefault ?? false,
            usageCount: { increment: 1 },
          },
        })
      )
    );

    return NextResponse.json({ saved: results.length });
  } catch (error) {
    console.error("Error saving wizard preferences:", error);
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
  }
}

// DELETE - Remove a specific preference
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const key = searchParams.get("key");

    if (!category || !key) {
      return NextResponse.json({ error: "Missing category or key" }, { status: 400 });
    }

    await prismaUsers.preference.deleteMany({
      where: {
        userId: session.user.id,
        category,
        key,
      },
    });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Error deleting preference:", error);
    return NextResponse.json({ error: "Failed to delete preference" }, { status: 500 });
  }
}















