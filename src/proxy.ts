import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rate limiting store (in-memory, per-instance)
// For production at scale, use Redis or similar
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5000; // 5000 requests per minute for general (SPAs make many requests)
const RATE_LIMIT_AUTH_MAX = 300; // 300 auth attempts per minute (session checks happen frequently)
const RATE_LIMIT_CLEANUP_INTERVAL = 5 * 60 * 1000; // Cleanup every 5 minutes

// SECURITY: Prevent memory leak by cleaning up expired rate limit entries
let lastCleanup = Date.now();
function cleanupRateLimitStore() {
  const now = Date.now();
  if (now - lastCleanup < RATE_LIMIT_CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Paths that require authentication
const protectedPaths = [
  "/dashboard",
  "/settings",
  "/api/auth/passkey/register",
  "/api/auth/passkey/list",
];

// Paths with stricter rate limiting (auth-related, but not session checks)
const authPaths = ["/api/auth/signin", "/api/auth/callback", "/api/auth/signout", "/auth/signin"];
// Session endpoint is called frequently - use general rate limit
const sessionPath = "/api/auth/session";

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || realIP || "unknown";
}

function isRateLimited(key: string, maxRequests: number): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (record.count >= maxRequests) {
    return true;
  }

  record.count++;
  return false;
}

// Content Security Policy - built dynamically based on enabled services
let cachedCSP: string | null = null;
function getCSP(): string {
  if (!cachedCSP) cachedCSP = buildCSP();
  return cachedCSP;
}

function buildCSP(): string {
  const scriptSrc = ["'self'", "'unsafe-inline'", "'unsafe-eval'"];
  const connectSrc = ["'self'"];
  const frameSrc = ["'self'"];

  // Umami analytics
  const umamiUrl = process.env.UMAMI_SCRIPT_URL || "";
  const umamiFallback = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ? "https://umami.lynxprompt.com" : "";
  const umamiOrigin = umamiUrl ? new URL(umamiUrl).origin : umamiFallback;
  if (umamiOrigin) {
    scriptSrc.push(umamiOrigin);
    connectSrc.push(umamiOrigin);
  }

  // Cloudflare Turnstile
  if (process.env.ENABLE_TURNSTILE === "true" || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    scriptSrc.push("https://challenges.cloudflare.com");
    connectSrc.push("https://challenges.cloudflare.com");
    frameSrc.push("https://challenges.cloudflare.com");
  }

  // Cloudflare Insights (always include if in production)
  if (process.env.NODE_ENV === "production") {
    scriptSrc.push("https://static.cloudflareinsights.com");
    connectSrc.push("https://cloudflareinsights.com");
  }

  // Sentry/GlitchTip
  const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (sentryDsn) {
    try {
      const sentryOrigin = new URL(sentryDsn).origin;
      connectSrc.push(sentryOrigin);
    } catch {}
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://avatars.githubusercontent.com https://lh3.googleusercontent.com https://*.gravatar.com https://gravatar.com",
    "font-src 'self' data:",
    `connect-src ${connectSrc.join(" ")}`,
    `frame-src ${frameSrc.join(" ")}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

// Security headers
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Enable XSS filter
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );

  // Content Security Policy
  response.headers.set("Content-Security-Policy", getCSP());

  // HSTS (only in production with HTTPS)
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIP = getClientIP(request);

  // SECURITY: Periodically clean up expired rate limit entries
  cleanupRateLimitStore();

  // Rate limiting
  // Session endpoint uses general rate limit (called frequently for session checks)
  const isSessionPath = pathname === sessionPath;
  const isAuthPath = !isSessionPath && authPaths.some((p) => pathname.startsWith(p));
  const rateLimitKey = `${clientIP}:${isAuthPath ? "auth" : "general"}`;
  const maxRequests = isAuthPath
    ? RATE_LIMIT_AUTH_MAX
    : RATE_LIMIT_MAX_REQUESTS;

  if (isRateLimited(rateLimitKey, maxRequests)) {
    // Return JSON for API routes, HTML for page routes
    if (pathname.startsWith("/api/")) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests. Please slow down." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
            "X-RateLimit-Limit": maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
    // HTML response for page routes
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Slow Down - LynxPrompt</title>
  <style>
    body { min-height: 100vh; background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%); font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; margin: 0; }
    .container { text-align: center; padding: 2rem; }
    .code { font-size: 5rem; font-weight: 900; background: linear-gradient(135deg, #fbbf24, #f97316); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    h1 { color: #fff; margin: 0.5rem 0; }
    p { color: #94a3b8; margin-bottom: 1.5rem; }
    .btn { display: inline-block; padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #fbbf24, #f97316); color: #0f172a; font-weight: 600; border-radius: 0.5rem; text-decoration: none; }
    .timer { color: #64748b; font-size: 0.875rem; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="code">429</div>
    <h1>Slow down!</h1>
    <p>You're making requests too quickly. Please wait a moment.</p>
    <a href="/" class="btn" onclick="location.reload(); return false;">Try Again</a>
    <p class="timer">Auto-refresh in <span id="cd">10</span>s</p>
  </div>
  <script>let s=10;setInterval(()=>{s--;document.getElementById('cd').textContent=s;if(s<=0)location.reload();},1000);</script>
</body>
</html>`;
    return new NextResponse(html, {
      status: 429,
      headers: {
        "Content-Type": "text/html",
        "Retry-After": "60",
        "X-RateLimit-Limit": maxRequests.toString(),
        "X-RateLimit-Remaining": "0",
      },
    });
  }

  // Check protected paths
  // Note: With database sessions, we check for the session cookie existence
  // The actual session validation happens in the page/API route via useSession() or getServerSession()
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected) {
    // Check for session cookie (works with database sessions)
    const sessionCookie =
      request.cookies.get("__Secure-next-auth.session-token") ||
      request.cookies.get("next-auth.session-token");

    if (!sessionCookie?.value) {
      // Redirect to sign in
      const signInUrl = new URL("/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Add security headers to response
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    // Match all paths except static files and _next
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

