import { NextResponse } from "next/server";
import { prismaSupport } from "@/lib/db-support";

// Public endpoint - no auth required
export async function GET() {
  try {
    const categories = await prismaSupport.supportCategory.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

