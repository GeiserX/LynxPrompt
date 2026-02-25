import { NextResponse } from "next/server";
import { prismaUsers } from "@/lib/db-users";

export async function GET() {
  try {
    await prismaUsers.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "connected" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "error", db: "disconnected" }, { status: 503 });
  }
}
