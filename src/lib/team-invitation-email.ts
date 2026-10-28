import { createTransport } from "nodemailer";
import { APP_NAME, APP_URL } from "@/lib/feature-flags";

/** The link an invitee opens to accept a team invitation. */
export function teamInvitationLink(token: string): string {
  return `${APP_URL.replace(/\/+$/, "")}/teams/join?token=${encodeURIComponent(token)}`;
}

/** True when the instance has an SMTP server to send mail through. */
export function teamInvitationEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Mail a team invitation through the same SMTP settings the sign-in link uses.
 * Returns false when SMTP is not configured or the send fails, so the caller
 * can still hand the link to the admin to share by hand.
 */
export async function sendTeamInvitationEmail(params: {
  to: string;
  teamName: string;
  inviterName: string | null;
  link: string;
  expiresAt: Date;
}): Promise<boolean> {
  if (!teamInvitationEmailConfigured()) return false;

  const { to, teamName, inviterName, link, expiresAt } = params;
  const port = Number(process.env.SMTP_PORT) || 587;
  const transport = createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    ...(process.env.SMTP_USER
      ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } }
      : {}),
  });

  const from = process.env.SMTP_FROM || `noreply@${new URL(APP_URL).hostname}`;
  const who = inviterName ? `${inviterName} invited you` : "You are invited";
  const expires = expiresAt.toUTCString();

  try {
    const result = await transport.sendMail({
      to,
      from: `"${APP_NAME}" <${from}>`,
      subject: `Join ${teamName} on ${APP_NAME}`,
      text: `${who} to join the team ${teamName} on ${APP_NAME}.\n\nAccept the invitation:\n${link}\n\nSign in with ${to} to accept. The invitation expires on ${expires}.\n`,
      html: `<p>${escapeHtml(who)} to join the team <strong>${escapeHtml(teamName)}</strong> on ${escapeHtml(APP_NAME)}.</p>
<p><a href="${escapeHtml(link)}">Accept the invitation</a></p>
<p>Sign in with ${escapeHtml(to)} to accept. The invitation expires on ${escapeHtml(expires)}.</p>
<p style="color:#666;font-size:12px">If you did not expect this, you can ignore this email.</p>`,
    });
    const rejected = (result.rejected || []).filter(Boolean);
    if (rejected.length) {
      console.error(`[Teams] Invitation email rejected for ${rejected.length} recipient(s)`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[Teams] Failed to send invitation email:", error);
    return false;
  }
}
