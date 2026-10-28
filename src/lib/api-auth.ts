/**
 * Unified authentication for API routes
 * Supports both browser sessions (via NextAuth) and CLI/API tokens (Bearer)
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
