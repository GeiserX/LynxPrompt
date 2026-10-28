import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  useParams: () => ({ slug: "acme" }),
  usePathname: () => "/teams/acme",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { id: "u_admin", email: "admin@example.com" } }, status: "authenticated" }),
}));
vi.mock("@/components/page-header", () => ({ PageHeader: () => null }));
vi.mock("@/components/footer", () => ({ Footer: () => null }));
vi.mock("@/components/sso-config", () => ({ SSOConfigPanel: () => null }));

import TeamManagementPage from "@/app/teams/[slug]/page";

const future = "2030-01-15T12:00:00.000Z";

function json(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status }));
}

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock.mockImplementation((url: string, init?: RequestInit) => {
    const method = init?.method || "GET";
    if (url === "/api/billing/status") {
      return json({ isTeamsUser: true, teams: [{ id: "team_1", slug: "acme", role: "ADMIN" }] });
    }
    if (url === "/api/teams/team_1" && method === "GET") {
      return json({ team: { id: "team_1", name: "Acme", slug: "acme", maxSeats: 5, createdAt: future } });
    }
    if (url === "/api/teams/team_1/members" && method === "GET") {
      return json({
        members: [
          { id: "m_admin", role: "ADMIN", isActiveThisCycle: true, user: { id: "u_admin", email: "admin@example.com", name: "Admin" } },
          { id: "m_bob", role: "MEMBER", isActiveThisCycle: false, user: { id: "u_bob", email: "bob@example.com", name: "Bob" } },
        ],
      });
    }
    if (url === "/api/teams/team_1/invitations" && method === "GET") {
      return json({
        invitations: [
          { id: "inv_1", email: "new@example.com", role: "MEMBER", status: "PENDING", token: "tok_secret", expiresAt: future, createdAt: future },
          { id: "inv_2", email: "gone@example.com", role: "MEMBER", status: "REVOKED", token: "tok_old", expiresAt: future, createdAt: future },
        ],
      });
    }
    return json({ message: "ok" });
  });
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("confirm", vi.fn(() => true));
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  });
});

function calls(method: string) {
  return fetchMock.mock.calls.filter(([, init]) => (init?.method || "GET") === method);
}

describe("team management page", () => {
  it("copies a join link built from the invitation token and shows a real expiry date", async () => {
    render(<TeamManagementPage />);
    await screen.findByText("new@example.com");

    expect(screen.queryByText(/Invalid Date/)).toBeNull();
    // Only pending invitations are listed
    expect(screen.queryByText("gone@example.com")).toBeNull();

    fireEvent.click(screen.getByText("Copy Link"));
    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `${window.location.origin}/teams/join?token=tok_secret`
      )
    );
  });

  it("revokes a pending invitation", async () => {
    render(<TeamManagementPage />);
    await screen.findByText("new@example.com");
    fireEvent.click(screen.getByLabelText("Revoke invitation"));
    await waitFor(() => expect(calls("DELETE").length).toBe(1));
    expect(calls("DELETE")[0][0]).toBe("/api/teams/team_1/invitations?invitationId=inv_1");
  });

  it("promotes a member to admin", async () => {
    render(<TeamManagementPage />);
    await screen.findByText("bob@example.com");
    fireEvent.click(screen.getByLabelText("Make admin"));
    await waitFor(() => expect(calls("PATCH").length).toBe(1));
    const [url, init] = calls("PATCH")[0];
    expect(url).toBe("/api/teams/team_1/members");
    expect(JSON.parse(init.body)).toEqual({ memberId: "m_bob", role: "ADMIN" });
  });

  it("lets the signed-in member leave the team", async () => {
    render(<TeamManagementPage />);
    await screen.findByText("bob@example.com");
    fireEvent.click(screen.getByTitle("Leave team"));
    await waitFor(() => expect(calls("DELETE").length).toBe(1));
    expect(calls("DELETE")[0][0]).toBe("/api/teams/team_1/members?memberId=m_admin");
  });

  it("deletes the team only after the slug is typed", async () => {
    const prompt = vi.fn(() => "wrong");
    vi.stubGlobal("prompt", prompt);
    render(<TeamManagementPage />);
    await screen.findByText("bob@example.com");

    fireEvent.click(screen.getByText("Delete team"));
    expect(calls("DELETE").length).toBe(0);

    prompt.mockReturnValue("acme");
    fireEvent.click(screen.getByText("Delete team"));
    await waitFor(() => expect(calls("DELETE").length).toBe(1));
    expect(calls("DELETE")[0][0]).toBe("/api/teams/team_1");
  });

  it("saves a new seat count", async () => {
    render(<TeamManagementPage />);
    await screen.findByText("bob@example.com");
    fireEvent.change(screen.getByLabelText("Seat count"), { target: { value: "8" } });
    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(calls("PATCH").length).toBe(1));
    const [url, init] = calls("PATCH")[0];
    expect(url).toBe("/api/teams/team_1");
    expect(JSON.parse(init.body)).toEqual({ maxSeats: 8 });
  });
});
