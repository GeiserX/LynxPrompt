import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { WIZARD_STEP_IDS, createDefaultWizardConfig } from "@/lib/wizard-state";
import { PLATFORMS } from "@/lib/platforms";

const { searchParams } = vi.hoisted(() => ({ searchParams: { value: new URLSearchParams() } }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => "/wizard",
  useSearchParams: () => searchParams.value,
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { id: "u1", name: "Dev", displayName: "Dev", profileCompleted: true } },
    status: "authenticated",
  }),
}));

vi.mock("@/components/providers/feature-flags-provider", () => ({
  useFeatureFlags: () => ({ appUrl: "https://lynxprompt.com", enableAI: false }),
}));
vi.mock("@/components/page-header", () => ({ PageHeader: () => null }));
vi.mock("@/components/ai-edit-panel", () => ({ AiEditPanel: () => null }));
vi.mock("@/components/code-editor", () => ({ CodeEditor: () => null }));
vi.mock("@/components/logo", () => ({ Logo: () => null }));

import WizardPage from "@/app/wizard/page";

type Route = { body: unknown; delayMs?: number };

function mockApi(routes: Record<string, Route>) {
  vi.spyOn(global, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    const route = Object.entries(routes).find(([path]) => url.startsWith(path))?.[1];
    if (!route) return new Response("{}", { status: 404 });
    if (route.delayMs) await new Promise((r) => setTimeout(r, route.delayMs));
    return new Response(JSON.stringify(route.body), { status: 200 });
  });
}

const savedPrefs = { codeStyle: { notes: { value: "notes from saved preferences" } } };

describe("wizard page: resuming a draft", () => {
  beforeEach(() => {
    searchParams.value = new URLSearchParams("draft=d1");
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps the draft's values when saved preferences arrive after it", async () => {
    const config = createDefaultWizardConfig();
    config.codeStyle = { ...config.codeStyle, notes: "notes from the draft" };
    mockApi({
      "/api/wizard/drafts/d1": { body: { id: "d1", name: "Draft", step: 5, config } },
      "/api/user/wizard-preferences": { body: savedPrefs, delayMs: 50 },
    });

    render(<WizardPage />);
    expect(await screen.findByDisplayValue("notes from the draft")).toBeInTheDocument();
    // Let the slower preferences response land, then check it changed nothing.
    await new Promise((r) => setTimeout(r, 150));
    expect(screen.queryByDisplayValue("notes from saved preferences")).toBeNull();
    expect(screen.getByDisplayValue("notes from the draft")).toBeInTheDocument();
  });

  it("opens a draft saved before the Security step existed", async () => {
    // Shape of an older draft: no security block, partial nested objects.
    const oldConfig = {
      projectName: "legacy-app",
      languages: ["go"],
      frameworks: [],
      commands: { build: "go build" },
      staticFiles: { contributing: true },
    };
    mockApi({
      "/api/wizard/drafts/d1": { body: { id: "d1", name: "Old", step: 3, config: oldConfig } },
      "/api/user/wizard-preferences": { body: {} },
    });
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<WizardPage />);
    await waitFor(() => expect(screen.getAllByText(/Secrets Management/i).length).toBeGreaterThan(0));
    expect(errors.mock.calls.flat().join(" ")).not.toMatch(/Cannot read properties of undefined/);
  });
});

describe("wizard page: a draft for a retired tool", () => {
  beforeEach(() => {
    searchParams.value = new URLSearchParams("draft=d1");
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
    vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => {}, removeItem: () => {} });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("shows the tool that replaced the draft's retired one as selected", async () => {
    const config = { ...createDefaultWizardConfig(), platform: "amazonq" };
    mockApi({
      "/api/wizard/drafts/d1": {
        body: { id: "d1", name: "Old", step: WIZARD_STEP_IDS.length - 1, config },
      },
      "/api/user/wizard-preferences": { body: {} },
    });

    const { container } = render(<WizardPage />);
    // Text queries: role queries over the whole wizard run out of memory in jsdom
    await screen.findByText("Several Tools (.zip)");
    // Kiro replaced Amazon Q; its tile is selected, though it sits past the first four
    const kiro = PLATFORMS.find((p) => p.id === "kiro")!;
    const tiles = [...container.querySelectorAll("button")].filter((b) =>
      b.textContent?.startsWith(`${kiro.icon}${kiro.name}`)
    );
    expect(tiles.length).toBe(1);
    expect(tiles[0].className).toContain("ring-1");
  });
});

describe("wizard page: no plans", () => {
  beforeEach(() => {
    searchParams.value = new URLSearchParams();
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
    vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => {}, removeItem: () => {} });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("never asks for a billing plan and lets every step be opened", async () => {
    mockApi({ "/api/user/wizard-preferences": { body: {} } });

    render(<WizardPage />);
    const step = await screen.findByRole("button", { name: /Static Files/ });
    await waitFor(() =>
      expect(vi.mocked(fetch).mock.calls.map(([u]) => String(u))).toContain("/api/user/wizard-preferences"),
    );
    expect(vi.mocked(fetch).mock.calls.map(([u]) => String(u)).filter((u) => u.includes("billing"))).toEqual([]);
    expect(step).toBeEnabled();
  });
});
