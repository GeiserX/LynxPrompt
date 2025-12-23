import { NextRequest, NextResponse } from "next/server";

// Redirect old /api/templates/[id]/download to /api/blueprints/[id]/download
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const newUrl = url.href.replace("/api/templates", "/api/blueprints");
  return NextResponse.redirect(newUrl, 308);
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const newUrl = url.href.replace("/api/templates", "/api/blueprints");
  return NextResponse.redirect(newUrl, 308);
}
