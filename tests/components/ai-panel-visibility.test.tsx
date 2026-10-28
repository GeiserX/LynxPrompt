import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

// The AI panel must follow the instance's ENABLE_AI flag only. Billing was
// removed, so /api/billing/status always reports plan "free"; a plan check
// would hide the panel from everyone.

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { id: "user_1" } }, status: "authenticated" }),
}));

// One router object for every render, like Next's, so effects that depend on it
// do not re-run on each render.
const router = { push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: "bp_1" }),
}));

let enableAI = true;
vi.mock("@/components/providers/feature-flags-provider", () => ({
  useFeatureFlags: () => ({ enableAI, enableTurnstile: false, appUrl: "https://lynxprompt.com" }),
}));

vi.mock("@/components/logo", () => ({ Logo: () => null }));
vi.mock("@/components/footer", () => ({ Footer: () => null }));
vi.mock("@/components/user-menu", () => ({ UserMenu: () => null }));
vi.mock("@/components/theme-toggle", () => ({ ThemeToggle: () => null }));
vi.mock("@/components/turnstile", () => ({ Turnstile: () => null }));
vi.mock("@/components/code-editor", () => ({ CodeEditor: () => null }));

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  enableAI = true;
  vi.spyOn(global, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    if (url.includes("/api/billing/status")) {
      return json({ plan: "free", isAdmin: false, isTeamsUser: false, team: null, teams: [] });
    }
    if (url.includes("/api/blueprints/bp_1")) {
      return json({ isOwner: true, name: "Mine", content: "# AGENTS.md", tags: [] });
    }
    return json({});
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function renderPage(Page: React.ComponentType) {
  await act(async () => {
    render(<Page />);
  });
  // let the data fetches settle
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("AI edit panel visibility", () => {
  it("shows on the edit page when AI is enabled, for a plan-free user", async () => {
    const { default: EditPage } = await import("@/app/blueprints/[id]/edit/page");
    await renderPage(EditPage);
    expect(await screen.findByText("AI-Powered Editing")).toBeInTheDocument();
  });

  it("shows on the create page when AI is enabled, for a plan-free user", async () => {
    const { default: CreatePage } = await import("@/app/blueprints/create/page");
    await renderPage(CreatePage);
    expect(await screen.findByText("AI-Powered Editing")).toBeInTheDocument();
  });

  it("stays hidden when AI is disabled on the instance", async () => {
    enableAI = false;
    const { default: EditPage } = await import("@/app/blueprints/[id]/edit/page");
    await renderPage(EditPage);
    await screen.findByDisplayValue("Mine");
    expect(screen.queryByText("AI-Powered Editing")).not.toBeInTheDocument();
  });
});
