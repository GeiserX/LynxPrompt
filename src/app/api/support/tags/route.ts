import { NextResponse } from "next/server";
import { prismaSupport } from "@/lib/db-support";
import { supportForumDisabled } from "@/lib/support-guard";

// Public endpoint - no auth required
export async function GET() {
  const disabled = supportForumDisabled();
  if (disabled) return disabled;

  try {
    const tags = await prismaSupport.supportTag.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}

