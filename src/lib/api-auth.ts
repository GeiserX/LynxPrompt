/**
 * Unified authentication for API routes
 * Supports both browser sessions (via NextAuth) and CLI/API tokens (Bearer)
 *
 * Routes call requireSession (browser only) or requireUser (browser or token).
 * Both answer 401 without a login, and 403 when a session that still owes its
 * passkey check tries to write, so a magic link or OAuth login alone cannot
 * change anything for a user who turned passkeys on.
 */

import { NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sessionCookieName } from "@/lib/auth-cookies";
import { getPasskeyStatus } from "@/lib/passkey-session";
import { validateApiToken, hasPermission } from "@/lib/api-tokens";
import type { ApiTokenRole } from "@/generated/prisma-users/enums";
import { prismaUsers } from "@/lib/db-users";

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  name: string | null;
  role?: string;
}

export interface AuthResult {
  user: AuthenticatedUser;
  source: "session" | "token";
  tokenId?: string;
  /** Scope of the API token; set only when source is "token" */
  tokenRole?: ApiTokenRole;
}

type TokenAction = Parameters<typeof hasPermission>[1];

/**
 * Whether the request may perform any of the given actions.
 * Browser sessions act as the user; API tokens only within their role.
 */
export function canPerform(auth: AuthResult, ...actions: TokenAction[]): boolean {
  if (auth.source === "session") return true;
  if (!auth.tokenRole) return false;
  return actions.some((action) => hasPermission(auth.tokenRole!, action));
}

/**
 * Authenticate a request using either session or Bearer token
 * Returns null if not authenticated
 */
export async function authenticateRequest(request: Request): Promise<AuthResult | null> {
  // First, try session-based auth (for browser requests)
  const session = await getServerSession(authOptions);
  
  if (session?.user?.id) {
    // Get full user details from database
    const user = await prismaUsers.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
    
    if (user) {
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        source: "session",
      };
    }
  }
  
  // If no session, try Bearer token auth (for CLI/API requests)
  const authHeader = request.headers.get("Authorization");
  
  if (authHeader) {
    const tokenResult = await validateApiToken(authHeader);
    
    if (tokenResult) {
      return {
        user: {
          id: tokenResult.user.id,
          email: tokenResult.user.email,
          name: tokenResult.user.name,
        },
        source: "token",
        tokenId: tokenResult.tokenId,
        tokenRole: tokenResult.role,
      };
    }
  }
  
  return null;
}

export interface SessionAuth {
  session: Session;
  userId: string;
  /** False while a user with passkeys has not proven one in this session */
  passkeyVerified: boolean;
}

export interface RequireOptions {
  /** Let an unverified session write: only for the steps of signing in */
  allowUnverified?: boolean;
}

const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function sessionTokenOf(request: Request): string | undefined {
  const name = sessionCookieName();
  for (const part of (request.headers.get("cookie") ?? "").split(";")) {
    const eq = part.indexOf("=");
    if (eq !== -1 && part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return undefined;
}

/**
 * Whether the session passed its passkey check, or the 403 to send when it
 * has not and the request writes. Errors propagate so routes fail closed.
 */
async function passkeyGate(
  request: Request,
  userId: string,
  options: RequireOptions
): Promise<boolean | NextResponse> {
  const status = await getPasskeyStatus(userId, sessionTokenOf(request));
  const verified = !status.required || status.verified;
  if (!verified && !options.allowUnverified && !READ_METHODS.has(request.method)) {
    return NextResponse.json(
      { error: "Passkey verification required", passkeyRequired: true },
      { status: 403 }
    );
  }
  return verified;
}

function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * Require a signed-in browser session.
 * Returns the session, or the response the route must send.
 */
export async function requireSession(
  request: Request,
  options: RequireOptions = {}
): Promise<SessionAuth | NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  const gate = await passkeyGate(request, session.user.id, options);
  if (gate instanceof NextResponse) return gate;

  return { session, userId: session.user.id, passkeyVerified: gate };
}

/**
 * Require a browser session or an API token. Check what a token may do with
 * canPerform. A token counts as passkey-verified: minting one requires it.
 * Returns the caller, or the response the route must send.
 */
export async function requireUser(
  request: Request,
  options: RequireOptions = {}
): Promise<(AuthResult & { passkeyVerified: boolean }) | NextResponse> {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorized();
  if (auth.source === "token") return { ...auth, passkeyVerified: true };

  const gate = await passkeyGate(request, auth.user.id, options);
  if (gate instanceof NextResponse) return gate;

  return { ...auth, passkeyVerified: gate };
}
