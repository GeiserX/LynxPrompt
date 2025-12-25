import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider, {
  SendVerificationRequestParams,
} from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prismaUsers } from "@/lib/db-users";
import {
  verifyAuthenticationResponse,
  type VerifiedAuthenticationResponse,
} from "@simplewebauthn/server";
import { createTransport } from "nodemailer";

// Custom email template for magic links
async function sendVerificationRequest(
  params: SendVerificationRequestParams
): Promise<void> {
  const { identifier: email, url, provider } = params;
  const { host } = new URL(url);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transport = createTransport(provider.server as any);

  const result = await transport.sendMail({
    to: email,
    from: `"LynxPrompt" <${provider.from}>`,
    subject: `Sign in to LynxPrompt`,
    text: text({ url, host }),
    html: html({ url, host, email }),
  });

  const failed = result.rejected.filter(Boolean);
  if (failed.length) {
    throw new Error(`Email(s) (${failed.join(", ")}) could not be sent`);
  }
}

function html({
  url,
  host,
  email,
}: {
  url: string;
  host: string;
  email: string;
}) {
  const escapedEmail = `${email.replace(/\./g, "&#8203;.")}`;
  const escapedHost = `${host.replace(/\./g, "&#8203;.")}`;

  // Email-safe design: Uses colors that work well in BOTH light and dark modes
  // No media queries (unreliable in email clients), just solid colors that pop
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Sign in to LynxPrompt</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #1a1a2e;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #1a1a2e;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 520px; border-collapse: collapse; background-color: #16213e; border-radius: 16px; overflow: hidden;">
          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); padding: 32px 40px; text-align: center;">
              <table role="presentation" style="display: inline-table; border-collapse: collapse;">
                <tr>
                  <td style="vertical-align: middle; padding-right: 10px;">
                    <img src="https://lynxprompt.com/lynxprompt.png" alt="LynxPrompt" width="44" height="44" style="display: block;" />
                  </td>
                  <td style="vertical-align: middle;">
                    <span style="font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                      <span style="color: #ffffff;">Lynx</span><span style="color: #fcd34d;">Prompt</span>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main content -->
          <tr>
            <td style="padding: 40px 32px;">
              <h1 style="margin: 0 0 20px 0; font-size: 26px; font-weight: 700; color: #ffffff; text-align: center;">
                Sign in to LynxPrompt
              </h1>
              
              <p style="margin: 0 0 8px 0; font-size: 16px; line-height: 26px; color: #cbd5e1; text-align: center;">
                Click the button below to sign in
              </p>
              <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 26px; color: #cbd5e1; text-align: center;">
                to your account at <strong style="color: #ffffff;">${escapedHost}</strong>
              </p>
              
              <!-- CTA Button - High contrast purple/pink that stands out -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 0;">
                    <a href="${url}" target="_blank" style="display: inline-block; padding: 16px 40px; background-color: #a855f7; color: #ffffff; text-decoration: none; font-size: 17px; font-weight: 700; border-radius: 10px; border: 2px solid #c084fc;">
                      Sign in to LynxPrompt →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 28px 0 0 0; font-size: 14px; line-height: 22px; color: #94a3b8; text-align: center;">
                This link expires in 24 hours and can only be used once.
              </p>
              
              <!-- Divider -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 28px 0;">
                <tr>
                  <td style="border-top: 1px solid #334155;"></td>
                </tr>
              </table>
              
              <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b; text-align: center;">
                Didn't request this? You can safely ignore this email.
              </p>
              
              <p style="margin: 0; font-size: 13px; color: #64748b; text-align: center;">
                Requested for: <span style="color: #94a3b8;">${escapedEmail}</span>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #0f172a; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                © 2025 LynxPrompt by <a href="https://geiser.cloud" style="color: #a855f7; text-decoration: none;">Geiser Cloud</a>
              </p>
              <p style="margin: 6px 0 0 0; font-size: 12px; color: #475569;">
                AI IDE Configuration Generator
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

function text({ url, host }: { url: string; host: string }) {
  return `Sign in to LynxPrompt (${host})\n\nClick here to sign in:\n${url}\n\nThis link expires in 24 hours and can only be used once.\n\nIf you didn't request this email, you can safely ignore it.`;
}

// WebAuthn configuration
const rpID = process.env.NEXTAUTH_URL
  ? new URL(process.env.NEXTAUTH_URL).hostname
  : "localhost";
const rpOrigin = process.env.NEXTAUTH_URL || "http://localhost:3000";

export const authOptions: NextAuthOptions = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prismaUsers as any) as NextAuthOptions["adapter"],
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
      maxAge: 24 * 60 * 60, // 24 hours token validity
      sendVerificationRequest,
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
        if (
          !credentials?.email ||
          !credentials?.authResponse ||
          !credentials?.challenge
        ) {
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
          const verification: VerifiedAuthenticationResponse =
            await verifyAuthenticationResponse({
              response: authResponse,
              expectedChallenge: credentials.challenge,
              expectedOrigin: rpOrigin,
              expectedRPID: rpID,
              credential: {
                id: authenticator.credentialID,
                publicKey: authenticator.credentialPublicKey,
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
    async signIn({ user, account, profile }) {
      // Auto-promote superadmin on first sign-in
      const superadminEmail = process.env.SUPERADMIN_EMAIL;
      if (superadminEmail && user.email === superadminEmail) {
        await prismaUsers.user.updateMany({
          where: { email: superadminEmail },
          data: { role: "SUPERADMIN" },
        });
      }
      
      // Auto-accept terms for existing users who haven't accepted yet
      // (They agreed by signing in with the ToS notice displayed on signin page)
      // Note: New users get terms set in createUser event
      if (user.id) {
        const dbUser = await prismaUsers.user.findUnique({
          where: { id: user.id },
          select: { termsAcceptedAt: true },
        });
        
        if (!dbUser?.termsAcceptedAt) {
          const now = new Date();
          await prismaUsers.user.update({
            where: { id: user.id },
            data: {
              termsAcceptedAt: now,
              termsVersion: "2025-12",
              privacyAcceptedAt: now,
              privacyVersion: "2025-12",
            },
          });
          console.log(`[Auth] Terms auto-accepted for existing user ${user.id} (agreed via signin page notice)`);
        }
      }
      
      // Backfill provider details for existing accounts that don't have them
      // This handles accounts created before we started storing provider details
      if (account && profile && (account.provider === "github" || account.provider === "google")) {
        try {
          const existingAccount = await prismaUsers.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
            select: { providerEmail: true, providerUsername: true },
          });
          
          // Only update if details are missing
          if (existingAccount && (!existingAccount.providerEmail && !existingAccount.providerUsername)) {
            let providerEmail: string | null = null;
            let providerUsername: string | null = null;
            
            if (account.provider === "github") {
              providerUsername = (profile as { login?: string }).login || null;
              providerEmail = (profile as { email?: string }).email || null;
            } else if (account.provider === "google") {
              providerEmail = (profile as { email?: string }).email || null;
            }
            
            if (providerEmail || providerUsername) {
              await prismaUsers.account.update({
                where: {
                  provider_providerAccountId: {
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                  },
                },
                data: { providerEmail, providerUsername },
              });
              console.log(`[Auth] Backfilled provider details for ${account.provider}: email=${providerEmail}, username=${providerUsername}`);
            }
          }
        } catch (error) {
          // Don't fail sign-in if backfill fails
          console.error(`[Auth] Failed to backfill provider details:`, error);
        }
      }
      
      return true;
    },
    async session({ session, user, token }) {
      if (session.user) {
        // For database sessions (OAuth, Email)
        if (user) {
          session.user.id = user.id;
          // Fetch role and profile fields from database
          // Wrap in try-catch to prevent session failures on DB issues
          try {
            const dbUser = await prismaUsers.user.findUnique({
              where: { id: user.id },
              select: {
                role: true,
                displayName: true,
                persona: true,
                skillLevel: true,
                profileCompleted: true,
                authenticators: { select: { id: true } },
              },
            });
            session.user.role = dbUser?.role || "USER";
            session.user.displayName = dbUser?.displayName || null;
            session.user.persona = dbUser?.persona || null;
            session.user.skillLevel = dbUser?.skillLevel || null;
            session.user.profileCompleted = dbUser?.profileCompleted || false;
            
            // Check if user has passkeys and if verification is needed
            const hasPasskeys = (dbUser?.authenticators?.length ?? 0) > 0;
            session.user.hasPasskeys = hasPasskeys;
            
            // If user has passkeys, check if this session is verified
            if (hasPasskeys) {
              // We need to check the session record for passkeyVerified
              // This is a bit tricky - we don't have the session token here
              // So we'll add a flag that middleware can use to check
              session.user.requiresPasskeyCheck = true;
            } else {
              session.user.requiresPasskeyCheck = false;
            }
          } catch (error) {
            // Log but don't fail the session - use defaults
            console.error("Error fetching user details for session:", error);
            session.user.role = "USER";
            session.user.displayName = null;
            session.user.persona = null;
            session.user.skillLevel = null;
            session.user.profileCompleted = false;
            session.user.hasPasskeys = false;
            session.user.requiresPasskeyCheck = false;
          }
        }
        // For JWT sessions (Passkey)
        if (token && !user) {
          session.user.id = token.sub as string;
          session.user.role = (token.role as string) || "USER";
          session.user.displayName = (token.displayName as string) || null;
          session.user.persona = (token.persona as string) || null;
          session.user.skillLevel = (token.skillLevel as string) || null;
          session.user.profileCompleted =
            (token.profileCompleted as boolean) || false;
          // Passkey login sessions are already verified
          session.user.hasPasskeys = true;
          session.user.requiresPasskeyCheck = false;
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
  events: {
    // Log consent when new user is created
    // By signing in with the ToS notice displayed, they agree to the terms
    async createUser({ user }) {
      const now = new Date();
      const termsVersion = "2025-12";
      const privacyVersion = "2025-12";
      
      await prismaUsers.user.update({
        where: { id: user.id },
        data: {
          termsAcceptedAt: now,
          termsVersion: termsVersion,
          privacyAcceptedAt: now,
          privacyVersion: privacyVersion,
        },
      });
      
      console.log(`[Auth] New user ${user.id} created with terms v${termsVersion} accepted at ${now.toISOString()}`);
    },
    // Store provider-specific identifiers when account is linked
    async linkAccount({ account, profile }) {
      let providerEmail: string | null = null;
      let providerUsername: string | null = null;

      // Extract provider-specific identifiers from OAuth profile
      if (account.provider === "github" && profile) {
        // GitHub profile has 'login' as username
        providerUsername = (profile as { login?: string }).login || null;
        // GitHub may also have email
        providerEmail = (profile as { email?: string }).email || null;
      } else if (account.provider === "google" && profile) {
        // Google profile has email
        providerEmail = (profile as { email?: string }).email || null;
      }

      // Update the account with provider details
      if (providerEmail || providerUsername) {
        await prismaUsers.account.update({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
          data: {
            providerEmail,
            providerUsername,
          },
        });
        console.log(`[Auth] Stored provider details for ${account.provider}: email=${providerEmail}, username=${providerUsername}`);
      }
    },
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours - refresh session if older
  },
  // Disable debug in production
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
