import { NextResponse } from "next/server";
import { prismaApp } from "@/lib/db-app";
import { prismaUsers } from "@/lib/db-users";
import packageJson from "../../../../package.json";

const APP_VERSION: string = packageJson.version;
const APP_REVISION: string = process.env.APP_REVISION ?? "unknown";

// Readiness: the app needs both the users database (sessions, accounts) and
// the app database (blueprints, teams, wizard). Each one is a separate server
// connection, so one can be down while the other answers.
export async function GET() {
  try {
    await Promise.all([
      prismaUsers.$queryRaw`SELECT 1`,
      prismaApp.$queryRaw`SELECT 1`,
    ]);
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
