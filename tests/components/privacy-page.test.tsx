import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("@/components/page-header", () => ({ PageHeader: () => null }));
vi.mock("@/components/footer", () => ({ Footer: () => null }));

import PrivacyPage from "@/app/privacy/page";

// The policy must say what the app does: accounts are deleted from Settings,
// not on request only, and avatars can come from Gravatar.
describe("privacy page", () => {
  const text = () => (render(<PrivacyPage />).container.textContent || "").replace(/\s+/g, " ");

  it("says users delete their own account in Settings, and what stays", () => {
    const page = text();
    expect(page).toContain("delete your account at any time in Settings (Security, Delete account)");
    expect(page).toContain("including the ones you shared with a team");
    expect(page).toMatch(/support forum posts and comments keep their text but lose your name/);
    expect(page).not.toMatch(/If you request account deletion/);
  });

  it("names Gravatar and the email hash it receives", () => {
    const page = text();
    expect(page).toContain("Gravatar (Automattic)");
    expect(page).toContain("An MD5 hash of your email address");
    expect(page).toContain("Public profiles and the support forum never use Gravatar");
    // Only an account created through GitHub or Google gets the provider's
    // picture; linking a provider later does not, so the page must not promise it.
    expect(page).toContain(
      "Upload a profile picture in Settings. An account created through GitHub or Google uses that provider's picture instead."
    );
    expect(page).not.toMatch(/or sign in with GitHub or Google/);
  });
});
