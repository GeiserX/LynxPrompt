import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockSendMail = vi.fn();
const mockCreateTransport = vi.fn((..._args: unknown[]) => ({ sendMail: mockSendMail }));

vi.mock("nodemailer", () => ({
  createTransport: (...args: unknown[]) => mockCreateTransport(...args),
}));
vi.mock("@/lib/feature-flags", () => ({
  APP_NAME: "TestApp",
  APP_URL: "https://lp.example.com/",
}));

import {
  sendTeamInvitationEmail,
  teamInvitationLink,
} from "@/lib/team-invitation-email";
import { maskEmail } from "@/lib/mask-email";

const base = {
  to: "new@example.com",
  teamName: "<Acme & Co>",
  inviterName: null,
  link: "https://lp.example.com/teams/join?token=tok",
  expiresAt: new Date("2030-01-01T00:00:00Z"),
};

describe("team invitation email", () => {
  const saved = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SMTP_HOST = "smtp.example.com";
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_FROM;
  });

  afterEach(() => {
    process.env = { ...saved };
  });

  it("builds the join link from APP_URL without a double slash", () => {
    expect(teamInvitationLink("tok")).toBe("https://lp.example.com/teams/join?token=tok");
  });

  it("escapes the team name in the HTML body and skips auth without SMTP_USER", async () => {
    mockSendMail.mockResolvedValue({ rejected: [] });
    expect(await sendTeamInvitationEmail(base)).toBe(true);
    const transportOpts = mockCreateTransport.mock.calls[0][0] as Record<string, unknown>;
    expect(transportOpts.auth).toBeUndefined();
    const mail = mockSendMail.mock.calls[0][0];
    expect(mail.html).toContain("&lt;Acme &amp; Co&gt;");
    expect(mail.html).not.toContain("<Acme");
    expect(mail.from).toBe('"TestApp" <noreply@lp.example.com>');
  });

  it("uses SMTP auth and port 465 as secure when set", async () => {
    process.env.SMTP_USER = "u";
    process.env.SMTP_PASSWORD = "p";
    process.env.SMTP_PORT = "465";
    mockSendMail.mockResolvedValue({ rejected: [] });
    await sendTeamInvitationEmail({ ...base, inviterName: "Ada" });
    expect(mockCreateTransport.mock.calls[0][0]).toMatchObject({
      port: 465,
      secure: true,
      auth: { user: "u", pass: "p" },
    });
    expect(mockSendMail.mock.calls[0][0].text).toContain("Ada invited you");
  });

  it("returns false when the recipient is rejected", async () => {
    mockSendMail.mockResolvedValue({ rejected: ["new@example.com"] });
    expect(await sendTeamInvitationEmail(base)).toBe(false);
  });

  it("returns false when the send throws", async () => {
    mockSendMail.mockRejectedValue(new Error("connection refused"));
    expect(await sendTeamInvitationEmail(base)).toBe(false);
  });

  it("returns false without touching SMTP when SMTP_HOST is unset", async () => {
    delete process.env.SMTP_HOST;
    expect(await sendTeamInvitationEmail(base)).toBe(false);
    expect(mockCreateTransport).not.toHaveBeenCalled();
  });
});

describe("maskEmail", () => {
  it("masks and lowercases", () => {
    expect(maskEmail(" Invitee@Example.com ")).toBe("i***@example.com");
  });
  it("hides a malformed address entirely", () => {
    expect(maskEmail("not-an-email")).toBe("***");
  });
});
