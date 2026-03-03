import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

let cachedContent: string | null = null;

export async function GET() {
  if (!cachedContent) {
    try {
      cachedContent = readFileSync(
        join(process.cwd(), "public", ".well-known", "security.txt"),
        "utf-8"
      );
    } catch {
      return new NextResponse("security.txt not found", { status: 404 });
    }
  }

  return new NextResponse(cachedContent, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
