import { NextRequest, NextResponse } from "next/server";
import { createHmac, randomBytes } from "crypto";
import { prismaUsers } from "@/lib/db-users";
import { ENABLE_SSO, ENABLE_USER_REGISTRATION } from "@/lib/feature-flags";
import { decryptSSOConfig } from "@/lib/sso-encryption";
import { emailDomain, idpFetch, resolveOidcEndpoints } from "@/lib/sso-oidc";
import {
  secureCookiesEnabled,
  sessionCookieName,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth-cookies";

const TERMS_VERSION = "2025-12";

/**
 * GET /api/auth/sso/callback/oidc
 * Handles the OIDC authorization code callback from the identity provider.
 * Validates the state parameter against the signed cookie for CSRF protection,
 * then opens a database session for the user itself: next-auth's credentials
 * flow cannot create one while session.strategy is "database".
 */
export async function GET(request: NextRequest) {
  if (!ENABLE_SSO) {
    return NextResponse.redirect(new URL("/auth/signin?error=SSODisabled", request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/auth/signin?error=SSOError&message=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(new URL("/auth/signin?error=SSOInvalidCallback", request.url));
  }

  // Validate state against signed cookie (CSRF protection)
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    return NextResponse.redirect(new URL("/auth/signin?error=ServerError", request.url));
  }

  const storedStateHash = request.cookies.get("sso_state")?.value;
  if (!storedStateHash) {
    return NextResponse.redirect(new URL("/auth/signin?error=SSOStateMissing", request.url));
  }

  const expectedHash = createHmac("sha256", secret).update(stateParam).digest("hex");
  if (storedStateHash !== expectedHash) {
    return NextResponse.redirect(new URL("/auth/signin?error=SSOStateInvalid", request.url));
  }

  // Parse state: "uuid:teamSlug:encodedCallbackUrl"
  const stateParts = stateParam.split(":");
  if (stateParts.length < 3) {
    return NextResponse.redirect(new URL("/auth/signin?error=SSOStateInvalid", request.url));
  }

  const [, teamSlug, ...callbackParts] = stateParts;
  let callbackUrl = decodeURIComponent(callbackParts.join(":")) || "/dashboard";
  if (!callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) callbackUrl = "/dashboard";

  // Find team and SSO config
  const team = await prismaUsers.team.findUnique({
    where: { slug: teamSlug },
    select: { id: true, slug: true, maxSeats: true, ssoConfig: true },
  });

  if (!team?.ssoConfig || !team.ssoConfig.enabled || team.ssoConfig.provider !== "OIDC") {
    return NextResponse.redirect(new URL("/auth/signin?error=SSONotConfigured", request.url));
  }

  let config: Record<string, unknown>;
  try {
    config = decryptSSOConfig(team.ssoConfig.config as Record<string, unknown>);
  } catch {
    return NextResponse.redirect(new URL("/auth/signin?error=SSODecryptionFailed", request.url));
  }

  const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || "https://lynxprompt.geiser.cloud";

  // One error code for every IdP failure, so the response says nothing about
  // which internal step (or host) answered.
  const providerError = () =>
    NextResponse.redirect(new URL("/auth/signin?error=SSOProviderError", request.url));

  let userInfo: Record<string, unknown>;
  try {
    const { tokenUrl, userInfoUrl } = await resolveOidcEndpoints(config);

    // Exchange authorization code for tokens
    const tokenRes = await idpFetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${baseUrl}/api/auth/sso/callback/oidc`,
        client_id: config.clientId as string,
        client_secret: config.clientSecret as string,
      }),
    });
    if (!tokenRes.ok) {
      console.error("[SSO OIDC] Token exchange failed:", tokenRes.status);
      return providerError();
    }
    const tokenData = (await tokenRes.json()) as Record<string, unknown>;
    const accessToken = tokenData.access_token;
    if (typeof accessToken !== "string" || !accessToken) {
      return providerError();
    }

    // Fetch user info
    const userInfoRes = await idpFetch(userInfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userInfoRes.ok) {
      console.error("[SSO OIDC] Userinfo request failed:", userInfoRes.status);
      return providerError();
    }
    userInfo = (await userInfoRes.json()) as Record<string, unknown>;
  } catch (err) {
    console.error("[SSO OIDC] Identity provider request failed:", (err as Error)?.message);
    return providerError();
  }

  const email = typeof userInfo.email === "string" ? userInfo.email.trim().toLowerCase() : "";
  const name = (userInfo.name as string) || (userInfo.preferred_username as string) || email;

  if (!email || userInfo.email_verified === false) {
    return NextResponse.redirect(new URL("/auth/signin?error=SSONoEmail", request.url));
  }

  // The team's IdP is trusted only for addresses on a domain the team proved
  // it owns. Without this, any team could point SSO at its own IdP, assert
  // someone else's address and sign in to that account.
  const domain = emailDomain(email);
  if (!domain || !team.ssoConfig.verifiedDomains.includes(domain)) {
    return NextResponse.redirect(new URL("/auth/signin?error=SSODomainNotVerified", request.url));
  }

  // Atomically find-or-create user and enforce seat limit in a serializable transaction
  // to prevent concurrent SSO logins from exceeding maxSeats.
  // Retry up to 3 times on serialization conflicts (Prisma P2034).
  const MAX_RETRIES = 3;
  let user: { id: string; email: string | null; name: string | null } | undefined;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    let seatLimitReached = false;
    let registrationClosed = false;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user = await prismaUsers.$transaction(async (tx: any) => {
        let u = await tx.user.findUnique({ where: { email } });

        // Same rule the other sign-in methods follow in auth.ts
        if (!u && !ENABLE_USER_REGISTRATION) {
          registrationClosed = true;
          throw new Error("REGISTRATION_DISABLED");
        }

        const existingMembership = u
          ? await tx.teamMember.findUnique({
              where: { teamId_userId: { teamId: team.id, userId: u.id } },
            })
          : null;

        if (!existingMembership) {
          const currentMembers = await tx.teamMember.count({
            where: { teamId: team.id },
          });
          if (currentMembers >= team.maxSeats) {
            seatLimitReached = true;
            throw new Error("SEAT_LIMIT_REACHED");
          }
        }

        if (!u) {
          // Signing in through the ToS notice counts as consent, as for
          // accounts the next-auth adapter creates (createUser event)
          const now = new Date();
          u = await tx.user.create({
            data: {
              email,
              name,
              termsAcceptedAt: now,
              termsVersion: TERMS_VERSION,
              privacyAcceptedAt: now,
              privacyVersion: TERMS_VERSION,
            },
          });
        }

        if (!existingMembership) {
          await tx.teamMember.create({
            data: { teamId: team.id, userId: u.id, role: "MEMBER" },
          });
        }

        return u;
      }, { isolationLevel: "Serializable" });
      break; // Success — exit retry loop
    } catch (err) {
      if (registrationClosed) {
        return NextResponse.redirect(
          new URL("/auth/signin?error=RegistrationDisabled", request.url)
        );
      }
      if (seatLimitReached) {
        return NextResponse.redirect(
          new URL("/auth/signin?error=SSOSeatLimitReached", request.url)
        );
      }
      // P2034 = serialization failure, P2002 = unique constraint (concurrent insert)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const code = (err as any)?.code;
      if ((code === "P2034" || code === "P2002") && attempt < MAX_RETRIES - 1) {
        continue;
      }
      throw err;
    }
  }

  // If we get here without user, all retries failed with serialization conflicts
  if (!user) {
    return NextResponse.redirect(
      new URL("/auth/signin?error=SSOTemporaryError", request.url)
    );
  }

  // Update last SSO sync
  await prismaUsers.teamSSOConfig.update({
    where: { id: team.ssoConfig.id },
    data: { lastSyncAt: new Date() },
  });

  // Count the sign-in as activity, as the next-auth signIn callback does
  await prismaUsers.teamMember.updateMany({
    where: { userId: user.id },
    data: { lastActiveAt: new Date(), isActiveThisCycle: true },
  });

  // Open the database session next-auth reads on every request
  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  await prismaUsers.session.create({
    data: { sessionToken, userId: user.id, expires },
  });

  const secure = secureCookiesEnabled();
  let destination = new URL(callbackUrl, baseUrl);
  if (destination.origin !== new URL(baseUrl).origin) destination = new URL("/dashboard", baseUrl);
  const response = NextResponse.redirect(destination);

  response.cookies.set(sessionCookieName(), sessionToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    expires,
  });

  // Clear the state cookie
  response.cookies.set("sso_state", "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/api/auth/sso/callback",
    maxAge: 0,
  });

  return response;
}
