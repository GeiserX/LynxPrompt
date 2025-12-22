import { NextRequest, NextResponse } from "next/server";
import {
  trackEvent,
  type AnalyticsEvent,
  type AnalyticsEventType,
} from "@/lib/analytics/clickhouse";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

// Valid event types
const VALID_EVENT_TYPES: AnalyticsEventType[] = [
  "page_view",
  "template_view",
  "template_download",
  "template_favorite",
  "template_search",
  "wizard_step",
  "wizard_complete",
  "wizard_abandon",
  "feature_use",
  "error",
];

// Rate limiting: simple in-memory store (per IP)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 100; // 100 events per minute per IP
const RATE_LIMIT_WINDOW_MS = 60000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}, 60000);

/**
 * POST /api/analytics - Track an analytics event
 */
export async function POST(request: NextRequest) {
  try {
    // Get IP for rate limiting (Cloudflare-aware)
    const ip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Rate limit check
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const { event_type, ...eventData } = body;

    // Validate event type
    if (!event_type || !VALID_EVENT_TYPES.includes(event_type)) {
      return NextResponse.json(
        { error: "Invalid event type" },
        { status: 400 }
      );
    }

    // Get session for user ID (hashed for privacy)
    const session = await getServerSession(authOptions);
    let hashedUserId: string | undefined;
    if (session?.user?.id) {
      // Hash the user ID for privacy
      hashedUserId = crypto
        .createHash("sha256")
        .update(session.user.id + process.env.NEXTAUTH_SECRET)
        .digest("hex")
        .slice(0, 16);
    }

    // Get country from Cloudflare header
    const country = request.headers.get("cf-ipcountry") || undefined;

    // Build the event
    const event: AnalyticsEvent = {
      event_type,
      timestamp: new Date(),
      session_id: eventData.session_id,
      user_id: hashedUserId,
      page_path: sanitizePath(eventData.page_path),
      referrer: sanitizeUrl(eventData.referrer),
      template_id: eventData.template_id,
      template_name: sanitizeString(eventData.template_name, 200),
      template_category: eventData.template_category,
      platform: eventData.platform,
      search_query: sanitizeString(eventData.search_query, 200),
      search_results_count:
        parseInt(eventData.search_results_count) || undefined,
      wizard_step: eventData.wizard_step,
      wizard_step_number: parseInt(eventData.wizard_step_number) || undefined,
      feature_name: eventData.feature_name,
      error_message: sanitizeString(eventData.error_message, 500),
      user_agent: request.headers.get("user-agent") || undefined,
      country,
      properties: eventData.properties,
    };

    // Track the event (non-blocking)
    trackEvent(event);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Analytics error:", error);
    // Don't expose errors to client
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

// Sanitization helpers
function sanitizePath(path?: string): string | undefined {
  if (!path) return undefined;
  // Only allow valid URL paths
  if (!/^\/[a-zA-Z0-9\-_\/\[\]]*$/.test(path)) return undefined;
  return path.slice(0, 500);
}

function sanitizeUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    // Only allow http/https
    if (!["http:", "https:"].includes(parsed.protocol)) return undefined;
    return url.slice(0, 500);
  } catch {
    return undefined;
  }
}

function sanitizeString(
  str?: string,
  maxLen: number = 200
): string | undefined {
  if (!str) return undefined;
  // Remove any potential XSS/injection
  return str.replace(/[<>'"]/g, "").slice(0, maxLen);
}

