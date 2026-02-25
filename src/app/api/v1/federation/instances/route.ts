import { NextRequest, NextResponse } from "next/server";
import { envBool, APP_NAME, APP_URL } from "@/lib/feature-flags";
import { isSelfRegistry } from "@/lib/federation";
import { prismaApp } from "@/lib/db-app";
import { prismaUsers } from "@/lib/db-users";
import packageJson from "../../../../../../package.json";

export async function GET(request: NextRequest) {
  if (!envBool("ENABLE_FEDERATION", true)) {
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

  if (isSelfRegistry()) {
    let publicBlueprintCount = 0;
    try {
      publicBlueprintCount = await prismaUsers.userTemplate.count({
        where: { OR: [{ visibility: "PUBLIC" }, { isPublic: true }] },
      });
    } catch {
      // DB may not have the columns yet
    }

    const selfInstance = {
      id: "registry",
      domain: new URL(APP_URL).host,
      name: APP_NAME,
      version: packageJson.version,
      logoUrl: null,
      publicBlueprintCount,
      lastSeenAt: new Date(),
      registeredAt: new Date("2025-12-01"),
    };

    return NextResponse.json({ instances: [selfInstance, ...instances] });
  }

  return NextResponse.json({ instances });
}
