import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
}));
vi.mock("@/components/providers/feature-flags-provider", () => ({
  useFeatureFlags: () => ({ appUrl: "https://lynxprompt.example" }),
}));
vi.mock("@/components/page-header", () => ({ PageHeader: () => null }));
vi.mock("@/components/footer", () => ({ Footer: () => null }));

import TeamsPage from "@/app/teams/page";

describe("teams landing page", () => {
  it("describes teams without paid-plan or billing promises", () => {
    const { container } = render(<TeamsPage />);
    const text = container.textContent || "";

    expect(screen.getByText("Team Details")).toBeTruthy();
    expect(text).toContain("Invite people by email");
    expect(text).not.toMatch(/Priority support/i);
    expect(text).not.toMatch(/Free plan/i);
    expect(text).not.toMatch(/consume resources/i);
    expect(text).not.toMatch(/magic links/i);
  });
});
