import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

// Test endpoint for GlitchTip error tracking
// DELETE THIS FILE after testing!

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "exception";

  try {
    switch (type) {
      case "exception":
        throw new Error("Test exception from LynxPrompt API");

      case "message":
        Sentry.captureMessage("Test message from LynxPrompt API");
        return NextResponse.json({ success: true, type: "message" });

      case "warning":
        Sentry.captureMessage("Test warning from LynxPrompt API", "warning");
        return NextResponse.json({ success: true, type: "warning" });

      default:
        throw new Error(`Unknown test type: ${type}`);
    }
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "Error captured and sent to GlitchTip", type },
      { status: 500 }
    );
  }
}

