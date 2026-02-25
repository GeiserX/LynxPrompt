import { NextResponse } from "next/server";
import { ENABLE_FEDERATION, APP_NAME, APP_URL } from "@/lib/feature-flags";
import { prismaUsers } from "@/lib/db-users";
import packageJson from "../../../../package.json";

export async function GET() {
  if (!ENABLE_FEDERATION) {
    return NextResponse.json({ error: "Federation disabled" }, { status: 404 });
  }

  const publicBlueprintCount = await prismaUsers.userTemplate.count({
    where: { OR: [{ visibility: "PUBLIC" }, { isPublic: true }] },
  });

  return NextResponse.json({
    name: APP_NAME,
    domain: new URL(APP_URL).host,
    version: packageJson.version,
    federation: true,
    api: `${APP_URL}/api/v1`,
    publicBlueprints: publicBlueprintCount,
  });
}
