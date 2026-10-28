import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  useParams: () => ({ id: "bp_tpl_1" }),
  usePathname: () => "/blueprints/bp_tpl_1/edit",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next-auth/react", () => ({
  useSession: () => ({ status: "authenticated", data: { user: { id: "user_1" } } }),
}));
vi.mock("@/components/providers/feature-flags-provider", () => ({
  useFeatureFlags: () => ({ enableAI: false }),
}));
vi.mock("@/components/logo", () => ({ Logo: () => null }));
vi.mock("@/components/footer", () => ({ Footer: () => null }));
vi.mock("@/components/user-menu", () => ({ UserMenu: () => null }));
vi.mock("@/components/theme-toggle", () => ({ ThemeToggle: () => null }));
vi.mock("@/components/code-editor", () => ({ CodeEditor: () => null }));
vi.mock("@/components/ai-edit-panel", () => ({ AiEditPanel: () => null }));

function blueprint(type: string) {
  return {
    id: "bp_tpl_1",
    name: "My AI Config",
    description: "",
    content: "# AGENTS.md\n\nUse pnpm and keep functions small.",
    type,
    category: "other",
    tags: [],
    isPublic: false,
    isOwner: true,
    currentVersion: 1,
  };
}

async function renderWith(type: string) {
  vi.spyOn(global, "fetch").mockResolvedValue(
    new Response(JSON.stringify(blueprint(type)), { status: 200 })
  );
  const { default: EditBlueprintPage } = await import("@/app/blueprints/[id]/edit/page");
  render(<EditBlueprintPage />);
  return waitFor(() => screen.getByLabelText(/Origin Format/) as HTMLSelectElement);
}

describe("Edit blueprint page type", () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it("loads the blueprint's own type instead of CURSOR_RULES", async () => {
    const select = await renderWith("AGENTS_MD");
    await waitFor(() => expect(select.value).toBe("AGENTS_MD"));
  });

  it("keeps a type the list does not offer", async () => {
    const select = await renderWith("WARP_MD");
    await waitFor(() => expect(select.value).toBe("WARP_MD"));
  });
});
