/**
 * Unified authentication for API routes
 * Supports both browser sessions (via NextAuth) and CLI/API tokens (Bearer)
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { validateApiToken } from "@/lib/api-tokens";
import { prismaUsers } from "@/lib/db-users";

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  name: string | null;
  subscriptionPlan: string;
  role?: string;
}

export interface AuthResult {
  user: AuthenticatedUser;
  source: "session" | "token";
  tokenId?: string;
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
        subscriptionPlan: true,
        role: true,
      },
    });
    
    if (user) {
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          subscriptionPlan: user.subscriptionPlan || "FREE",
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
          subscriptionPlan: tokenResult.user.subscriptionPlan || "FREE",
        },
        source: "token",
        tokenId: tokenResult.tokenId,
      };
    }
  }
  
  return null;
}

/**
 * Check if user has Max or Teams subscription (or admin role)
 */
export function isMaxOrTeams(user: AuthenticatedUser): boolean {
  return (
    user.subscriptionPlan === "MAX" ||
    user.subscriptionPlan === "TEAMS" ||
    user.role === "ADMIN" ||
    user.role === "SUPERADMIN"
  );
}

