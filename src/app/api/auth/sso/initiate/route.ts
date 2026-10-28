import { NextRequest, NextResponse } from "next/server";
import { prismaUsers } from "@/lib/db-users";
import { ENABLE_SSO } from "@/lib/feature-flags";
import { decryptSSOConfig } from "@/lib/sso-encryption";
import { createHmac } from "crypto";
import { secureCookiesEnabled } from "@/lib/auth-cookies";
import { resolveOidcEndpoints } from "@/lib/sso-oidc";

/**
 * POST /api/auth/sso/initiate - Initiate SSO authentication
 */
export async function POST(request: NextRequest) {
  if (!ENABLE_SSO) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { teamSlug, callbackUrl: rawCallbackUrl } = await request.json();

    // Validate callbackUrl: only allow relative paths or same-origin URLs
    let callbackUrl = "/dashboard";
    if (rawCallbackUrl && typeof rawCallbackUrl === "string") {
      const trimmed = rawCallbackUrl.trim();
      if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
        // Relative path - allowed
        callbackUrl = trimmed;
      } else {
        try {
          const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || "https://lynxprompt.com";
          const parsed = new URL(trimmed);
          const origin = new URL(appUrl);
          if (parsed.origin === origin.origin) {
            callbackUrl = parsed.pathname + parsed.search + parsed.hash;
          }
          // Otherwise, keep default /dashboard
        } catch {
          // Invalid URL, keep default /dashboard
        }
      }
    }

    if (!teamSlug) {
      return NextResponse.json(
        { error: "Team slug is required" },
        { status: 400 }
      );
    }

    // Find team and SSO config
    const team = await prismaUsers.team.findUnique({
      where: { slug: teamSlug },
      include: {
        ssoConfig: true,
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    if (!team.ssoConfig) {
      return NextResponse.json(
        { error: "SSO is not configured for this team" },
        { status: 400 }
      );
    }

    if (!team.ssoConfig.enabled) {
      return NextResponse.json(
        { error: "SSO is disabled for this team" },
        { status: 400 }
      );
    }

    // SAML and LDAP never had a sign-in flow; a configuration saved with one
    // before they were refused signs nobody in
    if (team.ssoConfig.provider !== "OIDC") {
      return NextResponse.json(
        { error: "This team's SSO provider is not supported. Ask a team admin to set up OpenID Connect." },
        { status: 400 }
      );
    }

    const config = decryptSSOConfig(team.ssoConfig.config as Record<string, unknown>);

    const clientId = config.clientId as string;
    let authUrl: URL;
    try {
      // https only, so a stored javascript: URL can never reach the browser
      authUrl = new URL((await resolveOidcEndpoints(config)).authorizationUrl);
    } catch {
      return NextResponse.json(
        { error: "Could not reach the team's identity provider" },
        { status: 502 }
      );
    }
    const scopes = (config.scopes as string[]) || ["openid", "profile", "email"];

    // Generate state and nonce for CSRF protection
    const state = crypto.randomUUID();
    const nonce = crypto.randomUUID();

    const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || "https://lynxprompt.com";
    const ourCallbackUrl = `${baseUrl}/api/auth/sso/callback/oidc`;

    // Embed teamSlug and callbackUrl in state (signed via cookie)
    const statePayload = `${state}:${teamSlug}:${encodeURIComponent(callbackUrl || "/dashboard")}`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: ourCallbackUrl,
      response_type: "code",
      scope: scopes.join(" "),
      state: statePayload,
      nonce: nonce,
    });

    // Sign the state with NEXTAUTH_SECRET and store in httpOnly cookie
    const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Server misconfiguration: auth secret not set" },
        { status: 500 }
      );
    }
    const stateHash = createHmac("sha256", secret).update(statePayload).digest("hex");

    params.forEach((value, key) => authUrl.searchParams.set(key, value));

    const response = NextResponse.json({
      redirectUrl: authUrl.toString(),
      provider: "OIDC",
    });

    // Set signed state cookie (expires in 10 minutes)
    response.cookies.set("sso_state", stateHash, {
      httpOnly: true,
      secure: secureCookiesEnabled(),
      sameSite: "lax",
      path: "/api/auth/sso/callback",
      maxAge: 600,
    });

    return response;
  } catch (error) {
    console.error("SSO initiation error:", error);
    return NextResponse.json(
      { error: "Failed to initiate SSO authentication" },
      { status: 500 }
    );
  }
}
