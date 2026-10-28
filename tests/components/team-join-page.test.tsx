import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

let sessionEmail = "Invitee@Example.com";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => "/teams/join",
  useSearchParams: () => new URLSearchParams("token=tok_secret"),
}));
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { id: "u1", email: sessionEmail } }, status: "authenticated" }),
}));
vi.mock("@/components/page-header", () => ({ PageHeader: () => null }));
vi.mock("@/components/footer", () => ({ Footer: () => null }));

import JoinTeamPage from "@/app/teams/join/page";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            valid: true,
            teamName: "Acme",
            teamSlug: "acme",
            memberCount: 2,
            invitedEmail: "i***@example.com",
            role: "MEMBER",
            expiresAt: "2030-01-15T12:00:00.000Z",
          })
        )
      )
    )
  );
});

describe("team join page email check", () => {
  it("shows no mismatch warning to the invited address", async () => {
    sessionEmail = "Invitee@Example.com";
    render(<JoinTeamPage />);
    await screen.findByText("Acme");
    expect(screen.queryByText("Email mismatch")).toBeNull();
  });

  it("warns a different signed-in address", async () => {
    sessionEmail = "someone@other.com";
    render(<JoinTeamPage />);
    await screen.findByText("Acme");
    expect(screen.getByText("Email mismatch")).toBeInTheDocument();
  });
});
