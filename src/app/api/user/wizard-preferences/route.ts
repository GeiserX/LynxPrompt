import { NextResponse } from "next/server";
import { canPerform, requireSession, requireUser } from "@/lib/api-auth";
import { prismaUsers } from "@/lib/db-users";

// Limits for one save. Values hold whole custom files (CONTRIBUTING, .gitignore).
const MAX_PREFERENCES_PER_REQUEST = 100;
const MAX_NAME_LENGTH = 100;
const MAX_VALUE_LENGTH = 50_000;

type IncomingPreference = {
  category: string;
  key: string;
  value: string;
  isDefault?: boolean;
};

// Returns the preference with its value as a string, undefined when it carries no
// value (nothing to save), or null when it breaks the limits.
function normalisePreference(raw: unknown): IncomingPreference | null | undefined {
  if (!raw || typeof raw !== "object") return null;
  const { category, key, value, isDefault } = raw as Record<string, unknown>;
  const validName = (v: unknown): v is string =>
    typeof v === "string" && v.length > 0 && v.length <= MAX_NAME_LENGTH;
  if (!validName(category) || !validName(key)) return null;
  if (value === undefined || value === null) return undefined;
  // The wizard sends some flags as booleans; the column is text.
  if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") return null;
  const text = String(value);
  if (text.length > MAX_VALUE_LENGTH) return null;
  return { category, key, value: text, isDefault: isDefault === true };
}

// GET - Fetch all wizard preferences for the user
export async function GET(request: Request) {
  try {
    const auth = await requireSession(request);
    if (auth instanceof NextResponse) return auth;
    const { session } = auth;

    // Exclude blueprint_variables category - those are managed separately via /api/user/variables
    // and displayed in the "Saved Variables" section, not "Wizard Preferences"
    const preferences = await prismaUsers.preference.findMany({
      where: { 
        userId: session.user.id,
        category: { not: "blueprint_variables" },
      },
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
    // Support both session auth (browser) and Bearer token auth (CLI)
    const auth = await requireUser(req);
    if (auth instanceof NextResponse) return auth;

    // Wizard defaults feed blueprint generation: any write-scoped token may save them
    if (!canPerform(auth, "profile:write", "blueprints:write")) {
      return NextResponse.json(
        { error: "This API token is read-only for this resource" },
        { status: 403 }
      );
    }

    const userId = auth.user.id;
    const body = await req.json();

    // Accept both formats: { preferences: [...] } or just [...]
    let rawPreferences: unknown[];

    if (Array.isArray(body)) {
      // Direct array format (from wizard's saveToProfileImmediately)
      rawPreferences = body;
    } else if (body?.preferences && Array.isArray(body.preferences)) {
      // Object format with preferences property
      rawPreferences = body.preferences;
    } else {
      return NextResponse.json({ error: "Invalid preferences format" }, { status: 400 });
    }

    if (rawPreferences.length === 0) {
      return NextResponse.json({ saved: 0 });
    }

    if (rawPreferences.length > MAX_PREFERENCES_PER_REQUEST) {
      return NextResponse.json(
        { error: `At most ${MAX_PREFERENCES_PER_REQUEST} preferences per request` },
        { status: 400 }
      );
    }

    const normalised = rawPreferences.map(normalisePreference);
    if (normalised.some((p) => p === null)) {
      return NextResponse.json(
        {
          error: `Each preference needs a category and key of at most ${MAX_NAME_LENGTH} characters and a value of at most ${MAX_VALUE_LENGTH} characters`,
        },
        { status: 400 }
      );
    }

    const preferences = normalised.filter((p): p is IncomingPreference => !!p);

    // Upsert each preference
    const results = await Promise.all(
      preferences.map((pref) =>
        prismaUsers.preference.upsert({
          where: {
            userId_category_key: {
              userId,
              category: pref.category,
              key: pref.key,
            },
          },
          create: {
            userId,
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
    console.error("[wizard-preferences POST] Error saving wizard preferences:", error);
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
  }
}

// DELETE - Remove a specific preference
export async function DELETE(req: Request) {
  try {
    const auth = await requireSession(req);
    if (auth instanceof NextResponse) return auth;
    const { session } = auth;

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















