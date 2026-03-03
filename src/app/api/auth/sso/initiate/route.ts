import { NextRequest, NextResponse } from "next/server";
import { prismaUsers } from "@/lib/db-users";
import { ENABLE_SSO } from "@/lib/feature-flags";
import { decryptSSOConfig } from "@/lib/sso-encryption";

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

    const ssoConfig = team.ssoConfig;
    const config = decryptSSOConfig(ssoConfig.config as Record<string, unknown>);

    // Handle based on SSO provider
    switch (ssoConfig.provider) {
      case "SAML": {
        // TODO: Implement SAML flow
        // 1. Generate AuthnRequest XML
        // 2. Sign the request if required
        // 3. Encode and build redirect URL
        // 4. Return redirectUrl to IdP SSO endpoint
        
        // For now, return a placeholder error
        return NextResponse.json(
          { 
            error: "SAML SSO authentication is being configured. Please contact your administrator.",
            provider: "SAML",
            hint: "SAML integration requires server-side configuration. Check back soon.",
          },
          { status: 501 }
        );
      }

      case "OIDC": {
        // TODO: Implement OIDC flow
        // 1. Build authorization URL with:
        //    - client_id
        //    - redirect_uri (our callback)
        //    - response_type=code
        //    - scope=openid profile email
        //    - state (CSRF protection)
        //    - nonce
        // 2. Store state in session/cookie for verification
        // 3. Return redirectUrl to authorization endpoint

        const issuer = config.issuer as string;
        const clientId = config.clientId as string;
        const authUrl = (config.authorizationUrl as string) || `${issuer}/authorize`;
        const scopes = (config.scopes as string[]) || ["openid", "profile", "email"];
        
        // Generate state for CSRF protection
        const state = crypto.randomUUID();
        const nonce = crypto.randomUUID();
        
        // Store state for verification (in production, use secure session storage)
        // For now, we'll include it in the callback URL for demo purposes
        const ourCallbackUrl = `${process.env.NEXTAUTH_URL || process.env.APP_URL || 'https://lynxprompt.com'}/api/auth/sso/callback/oidc`;
        
        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: ourCallbackUrl,
          response_type: "code",
          scope: scopes.join(" "),
          state: `${state}:${teamSlug}:${encodeURIComponent(callbackUrl || '/dashboard')}`,
          nonce: nonce,
        });

        return NextResponse.json({
          redirectUrl: `${authUrl}?${params.toString()}`,
          provider: "OIDC",
        });
      }

      case "LDAP": {
        // LDAP requires username/password - return form requirement
        // The actual authentication happens on form submission
        return NextResponse.json({
          provider: "LDAP",
          requiresCredentials: true,
          message: "Please enter your LDAP credentials",
          formAction: `/api/auth/sso/ldap/authenticate`,
          teamSlug,
          callbackUrl,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown SSO provider: ${ssoConfig.provider}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("SSO initiation error:", error);
    return NextResponse.json(
      { error: "Failed to initiate SSO authentication" },
      { status: 500 }
    );
  }
}







