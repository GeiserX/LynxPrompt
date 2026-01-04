import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";

const CATEGORY = "blueprint_variables";

// GET /api/user/variables - Get all saved variable preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const preferences = await prismaUsers.preference.findMany({
      where: {
        userId: session.user.id,
        category: CATEGORY,
      },
      select: {
        key: true,
        value: true,
      },
    });

    // Convert to a simple key-value object
    const variables: Record<string, string> = {};
    for (const pref of preferences) {
      variables[pref.key.toUpperCase()] = pref.value;
    }

    return NextResponse.json({ variables });
  } catch (error) {
    console.error("Error fetching user variables:", error);
    return NextResponse.json(
      { error: "Failed to fetch variables" },
      { status: 500 }
    );
  }
}

// PUT /api/user/variables - Save or update a variable preference
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { key, value } = await request.json();

    if (!key || typeof key !== "string") {
      return NextResponse.json(
        { error: "Variable key is required" },
        { status: 400 }
      );
    }

    // Normalize key to uppercase
    const normalizedKey = key.toUpperCase().trim();

    // Validate key format (must match variable naming convention)
    if (!/^[A-Z_][A-Z0-9_]*$/.test(normalizedKey)) {
      return NextResponse.json(
        { error: "Invalid variable name format" },
        { status: 400 }
      );
    }

    if (value === undefined || value === null || value === "") {
      // Delete the variable if value is empty
      await prismaUsers.preference.deleteMany({
        where: {
          userId: session.user.id,
          category: CATEGORY,
          key: normalizedKey,
        },
      });

      return NextResponse.json({ success: true, deleted: true });
    }

    // Upsert the preference
    const preference = await prismaUsers.preference.upsert({
      where: {
        userId_category_key: {
          userId: session.user.id,
          category: CATEGORY,
          key: normalizedKey,
        },
      },
      update: {
        value: String(value).trim(),
        usageCount: { increment: 1 },
      },
      create: {
        userId: session.user.id,
        category: CATEGORY,
        key: normalizedKey,
        value: String(value).trim(),
        usageCount: 1,
      },
    });

    return NextResponse.json({
      success: true,
      variable: { key: preference.key, value: preference.value },
    });
  } catch (error) {
    console.error("Error saving user variable:", error);
    return NextResponse.json(
      { error: "Failed to save variable" },
      { status: 500 }
    );
  }
}

// DELETE /api/user/variables - Delete a variable preference
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { key } = await request.json();

    if (!key || typeof key !== "string") {
      return NextResponse.json(
        { error: "Variable key is required" },
        { status: 400 }
      );
    }

    const normalizedKey = key.toUpperCase().trim();

    await prismaUsers.preference.deleteMany({
      where: {
        userId: session.user.id,
        category: CATEGORY,
        key: normalizedKey,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user variable:", error);
    return NextResponse.json(
      { error: "Failed to delete variable" },
      { status: 500 }
    );
  }
}










