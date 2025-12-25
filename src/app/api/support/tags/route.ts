import { NextResponse } from "next/server";
import { prismaSupport } from "@/lib/db-support";

// Public endpoint - no auth required
export async function GET() {
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

