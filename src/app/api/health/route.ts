import { NextResponse } from "next/server";
import { prismaUsers } from "@/lib/db-users";
import packageJson from "../../../../package.json";

const APP_VERSION: string = packageJson.version;
const APP_REVISION: string = process.env.APP_REVISION ?? "unknown";

export async function GET() {
  try {
    await prismaUsers.$queryRaw`SELECT 1`;
    return NextResponse.json(
      {
        status: "ok",
        db: "connected",
        version: APP_VERSION,
        revision: APP_REVISION,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        status: "error",
        db: "disconnected",
        version: APP_VERSION,
        revision: APP_REVISION,
      },
      { status: 503 }
    );
  }
}
