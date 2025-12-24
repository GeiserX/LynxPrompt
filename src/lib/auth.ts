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

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to LynxPrompt</title>
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    @media (prefers-color-scheme: dark) {
      body, table, td {
        background-color: #0f172a !important;
        color: #e5e7eb !important;
      }
      a { color: #c4b5fd !important; }
      .card {
        background-color: #111827 !important;
        color: #e5e7eb !important;
      }
      .muted { color: #cbd5e1 !important; }
      .divider { border-top: 1px solid #1f2937 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" class="card" style="width: 100%; max-width: 560px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); padding: 32px 40px; border-radius: 12px 12px 0 0; text-align: center;">
              <table role="presentation" style="display: inline-table; border-collapse: collapse;">
                <tr>
                  <td style="vertical-align: middle; padding-right: 8px;">
                    <img src="https://lynxprompt.com/lynxprompt.png" alt="LynxPrompt" style="height: 40px; width: auto;" />
                  </td>
                  <td style="vertical-align: middle;">
                    <span style="font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">
                      <span style="color: #ffffff;">Lynx</span><span style="color: #fce7f3;">Prompt</span>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main content -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #18181b; text-align: center;">
                Sign in to LynxPrompt
              </h1>
              
              <p class="muted" style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #52525b; text-align: center;">
                Click the button below to sign in to your account at <strong>${escapedHost}</strong>
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 14px rgba(147, 51, 234, 0.4);">
                      Sign in to LynxPrompt
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 20px; color: #71717a; text-align: center;">
                This link will expire in 24 hours and can only be used once.
              </p>
              
              <!-- Divider -->
              <hr class="divider" style="margin: 32px 0; border: none; border-top: 1px solid #e4e4e7;" />
              
              <p class="muted" style="margin: 0 0 8px 0; font-size: 13px; color: #a1a1aa; text-align: center;">
                If you didn't request this email, you can safely ignore it.
              </p>
              
              <p class="muted" style="margin: 0; font-size: 13px; color: #a1a1aa; text-align: center;">
                Requested for: ${escapedEmail}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #fafafa; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                © 2025 LynxPrompt by <a href="https://geiser.cloud" style="color: #9333ea; text-decoration: none;">Geiser Cloud</a>
              </p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #a1a1aa;">
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
              authenticator: {
                credentialID: Uint8Array.from(
                  Buffer.from(authenticator.credentialID, "base64url")
                ),
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
              },
            });
            session.user.role = dbUser?.role || "USER";
            session.user.displayName = dbUser?.displayName || null;
            session.user.persona = dbUser?.persona || null;
            session.user.skillLevel = dbUser?.skillLevel || null;
            session.user.profileCompleted = dbUser?.profileCompleted || false;
          } catch (error) {
            // Log but don't fail the session - use defaults
            console.error("Error fetching user details for session:", error);
            session.user.role = "USER";
            session.user.displayName = null;
            session.user.persona = null;
            session.user.skillLevel = null;
            session.user.profileCompleted = false;
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
