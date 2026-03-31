import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prismaUsers } from "@/lib/db-users";
import { ENABLE_SSO } from "@/lib/feature-flags";
import { decryptSSOConfig } from "@/lib/sso-encryption";

/**
 * GET /api/auth/sso/callback/oidc
 * Handles the OIDC authorization code callback from the identity provider.
 * Validates the state parameter against the signed cookie for CSRF protection.
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
  const callbackUrl = decodeURIComponent(callbackParts.join(":")) || "/dashboard";

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

  const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || "https://lynxprompt.com";
  const tokenUrl = (config.tokenUrl as string) || `${config.issuer}/token`;
  const userInfoUrl = (config.userInfoUrl as string) || `${config.issuer}/userinfo`;

  // Exchange authorization code for tokens
  let tokenData: Record<string, unknown>;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${baseUrl}/api/auth/sso/callback/oidc`,
        client_id: config.clientId as string,
        client_secret: config.clientSecret as string,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!tokenRes.ok) {
      console.error("[SSO OIDC] Token exchange failed:", tokenRes.status);
      return NextResponse.redirect(new URL("/auth/signin?error=SSOTokenExchangeFailed", request.url));
    }

    tokenData = await tokenRes.json();
  } catch {
    return NextResponse.redirect(new URL("/auth/signin?error=SSOTokenExchangeFailed", request.url));
  }

  const accessToken = tokenData.access_token as string;
  if (!accessToken) {
    return NextResponse.redirect(new URL("/auth/signin?error=SSONoAccessToken", request.url));
  }

  // Fetch user info
  let userInfo: Record<string, unknown>;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const userInfoRes = await fetch(userInfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!userInfoRes.ok) {
      return NextResponse.redirect(new URL("/auth/signin?error=SSOUserInfoFailed", request.url));
    }

    userInfo = await userInfoRes.json();
  } catch {
    return NextResponse.redirect(new URL("/auth/signin?error=SSOUserInfoFailed", request.url));
  }

  const email = (userInfo.email as string)?.toLowerCase();
  const name = (userInfo.name as string) || (userInfo.preferred_username as string) || email;

  if (!email) {
    return NextResponse.redirect(new URL("/auth/signin?error=SSONoEmail", request.url));
  }

  // Validate email domain against allowed domains
  const allowedDomains = team.ssoConfig.allowedDomains;
  if (allowedDomains.length > 0) {
    const emailDomain = email.split("@")[1];
    if (!allowedDomains.includes(emailDomain)) {
      return NextResponse.redirect(new URL("/auth/signin?error=SSODomainNotAllowed", request.url));
    }
  }

  // Check if user already exists and is already a team member
  let user = await prismaUsers.user.findUnique({ where: { email } });
  let existingMembership = user
    ? await prismaUsers.teamMember.findUnique({
        where: { teamId_userId: { teamId: team.id, userId: user.id } },
      })
    : null;

  // If user is not already a member, enforce seat limit BEFORE creating anything
  if (!existingMembership) {
    const currentMembers = await prismaUsers.teamMember.count({
      where: { teamId: team.id },
    });
    if (currentMembers >= team.maxSeats) {
      return NextResponse.redirect(
        new URL("/auth/signin?error=SSOSeatLimitReached", request.url)
      );
    }
  }

  // Safe to create user now — seat limit already verified
  if (!user) {
    user = await prismaUsers.user.create({
      data: {
        email,
        name,
      },
    });
  }

  // Create membership if needed
  if (!existingMembership) {
    await prismaUsers.teamMember.create({
      data: {
        teamId: team.id,
        userId: user.id,
        role: "MEMBER",
      },
    });
  }

  // Update last SSO sync
  await prismaUsers.teamSSOConfig.update({
    where: { id: team.ssoConfig.id },
    data: { lastSyncAt: new Date() },
  });

  // Redirect to the SSO sign-in completion page
  // This page triggers NextAuth signIn() with the SSO credentials
  const completeUrl = new URL("/auth/sso-complete", baseUrl);
  completeUrl.searchParams.set("userId", user.id);
  completeUrl.searchParams.set("email", email);
  completeUrl.searchParams.set("teamId", team.id);
  completeUrl.searchParams.set("callbackUrl", callbackUrl);
  // Sign the params to prevent tampering
  const signData = `${user.id}:${email}:${team.id}`;
  const signature = createHmac("sha256", secret).update(signData).digest("hex");
  completeUrl.searchParams.set("sig", signature);

  const response = NextResponse.redirect(completeUrl);

  // Clear the state cookie
  response.cookies.set("sso_state", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/auth/sso/callback",
    maxAge: 0,
  });

  return response;
}
