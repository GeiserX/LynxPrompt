import { NextResponse } from "next/server";

// Liveness: answers as long as the server process does, without touching a
// database. A database outage should take the pod out of the Service through
// /api/health (readiness), not restart a process that is otherwise fine.
export function GET() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
