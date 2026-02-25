import { NextRequest, NextResponse } from "next/server";
import { ENABLE_FEDERATION } from "@/lib/feature-flags";
import { prismaApp } from "@/lib/db-app";

export async function GET(request: NextRequest) {
  if (!ENABLE_FEDERATION) {
    return NextResponse.json({ error: "Federation disabled" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("active") === "true";

  const where: Record<string, unknown> = { verified: true };

  if (activeOnly) {
    where.lastSeenAt = { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) };
  }

  const instances = await prismaApp.federatedInstance.findMany({
    where,
    select: {
      id: true,
      domain: true,
      name: true,
      version: true,
      logoUrl: true,
      publicBlueprintCount: true,
      lastSeenAt: true,
      registeredAt: true,
    },
    orderBy: { registeredAt: "asc" },
  });

  return NextResponse.json({ instances });
}
