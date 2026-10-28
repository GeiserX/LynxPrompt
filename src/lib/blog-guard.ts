import { NextResponse } from "next/server";
import { envBool } from "@/lib/feature-flags";

// The blog pages 404 when ENABLE_BLOG is off; its API must too. With the blog
// off the entrypoint never migrates the blog database, so nothing may query it.
export function blogDisabled(): NextResponse | null {
  if (envBool("ENABLE_BLOG", false)) return null;
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
