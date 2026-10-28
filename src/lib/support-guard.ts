import { NextResponse } from "next/server";
import { envBool } from "@/lib/feature-flags";

// The support forum pages 404 when ENABLE_SUPPORT_FORUM is off; its API must too.
export function supportForumDisabled(): NextResponse | null {
  if (envBool("ENABLE_SUPPORT_FORUM", false)) return null;
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
