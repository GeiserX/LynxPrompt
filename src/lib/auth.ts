import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prismaUsers } from "@/lib/db-users";
import {
  verifyAuthenticationResponse,
  type VerifiedAuthenticationResponse,
} from "@simplewebauthn/server";

// WebAuthn configuration
const rpID = process.env.NEXTAUTH_URL
  ? new URL(process.env.NEXTAUTH_URL).hostname
  : "localhost";
const rpOrigin = process.env.NEXTAUTH_URL || "http://localhost:3000";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prismaUsers) as NextAuthOptions["adapter"],
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465, // Use SSL for port 465
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      },
      from: process.env.SMTP_FROM || "noreply@lynxprompt.com",
    }),
    // Passkey authentication provider
    CredentialsProvider({
      id: "passkey",
      name: "Passkey",
      credentials: {
        email: { label: "Email", type: "email" },
        authResponse: { label: "Auth Response", type: "text" },
        challenge: { label: "Challenge", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.authResponse || !credentials?.challenge) {
          return null;
        }

        try {
          const authResponse = JSON.parse(credentials.authResponse);
          
          // Find user and their authenticator
          const user = await prismaUsers.user.findUnique({
            where: { email: credentials.email },
            include: { authenticators: true },
          });

          if (!user || user.authenticators.length === 0) {
            return null;
          }

          // Find the authenticator used
          const authenticator = user.authenticators.find(
            (a) => a.credentialID === authResponse.id
          );

          if (!authenticator) {
            return null;
          }

          // Verify the authentication response
          const verification: VerifiedAuthenticationResponse = await verifyAuthenticationResponse({
            response: authResponse,
            expectedChallenge: credentials.challenge,
            expectedOrigin: rpOrigin,
            expectedRPID: rpID,
            authenticator: {
              credentialID: Uint8Array.from(Buffer.from(authenticator.credentialID, "base64url")),
              credentialPublicKey: authenticator.credentialPublicKey,
              counter: Number(authenticator.counter),
            },
          });

          if (!verification.verified) {
            return null;
          }

          // Update counter and last used timestamp
          await prismaUsers.authenticator.update({
            where: { id: authenticator.id },
            data: {
              counter: BigInt(verification.authenticationInfo.newCounter),
              lastUsedAt: new Date(),
            },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error("Passkey authentication error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user }) {
      // Auto-promote superadmin on first sign-in
      const superadminEmail = process.env.SUPERADMIN_EMAIL;
      if (superadminEmail && user.email === superadminEmail) {
        await prismaUsers.user.updateMany({
          where: { email: superadminEmail },
          data: { role: "SUPERADMIN" },
        });
      }
      return true;
    },
    async session({ session, user, token }) {
      if (session.user) {
        // For database sessions (OAuth, Email)
        if (user) {
          session.user.id = user.id;
          // Fetch role and profile fields from database
          const dbUser = await prismaUsers.user.findUnique({
            where: { id: user.id },
            select: {
              role: true,
              displayName: true,
              persona: true,
              skillLevel: true,
              profileCompleted: true,
            },
          });
          session.user.role = dbUser?.role || "USER";
          session.user.displayName = dbUser?.displayName || null;
          session.user.persona = dbUser?.persona || null;
          session.user.skillLevel = dbUser?.skillLevel || null;
          session.user.profileCompleted = dbUser?.profileCompleted || false;
        }
        // For JWT sessions (Passkey)
        if (token) {
          session.user.id = token.sub as string;
          session.user.role = token.role as string || "USER";
          session.user.displayName = token.displayName as string | null;
          session.user.persona = token.persona as string | null;
          session.user.skillLevel = token.skillLevel as string | null;
          session.user.profileCompleted = token.profileCompleted as boolean || false;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      // For passkey auth, we need JWT
      if (user) {
        const dbUser = await prismaUsers.user.findUnique({
          where: { id: user.id },
          select: {
            role: true,
            displayName: true,
            persona: true,
            skillLevel: true,
            profileCompleted: true,
          },
        });
        token.role = dbUser?.role || "USER";
        token.displayName = dbUser?.displayName || null;
        token.persona = dbUser?.persona || null;
        token.skillLevel = dbUser?.skillLevel || null;
        token.profileCompleted = dbUser?.profileCompleted || false;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      // Allow relative URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allow URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours - refresh session if older
  },
  // Security: Only enable debug in development
  debug: process.env.NODE_ENV === "development",
  // Security: Use secure cookies in production
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};

// Export WebAuthn config for use in API routes
export const webAuthnConfig = {
  rpID,
  rpName: "LynxPrompt",
  rpOrigin,
};
