// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/feature-flags", () => ({
  APP_NAME: "LynxPrompt",
  APP_URL: "https://lynxprompt.com",
}));

vi.mock("@/lib/platforms", () => ({
  PLATFORM_FILES: {
    cursor: ".cursor/rules/",
    claude: "CLAUDE.md",
    copilot: ".github/copilot-instructions.md",
    windsurf: ".windsurfrules",
    universal: "AGENTS.md",
    antigravity: "GEMINI.md",
    aider: "AIDER.md",
    continue: ".continue/config.json",
    cody: ".cody/config.json",
    tabnine: ".tabnine.yaml",
    supermaven: ".supermaven/config.json",
    codegpt: ".codegpt/config.json",
    void: ".void/config.json",
    zed: ".zed/instructions.md",
    cline: ".clinerules",
    goose: ".goosehints",
    amazonq: ".amazonq/rules/",
    roocode: ".roo/rules/",
    warp: "WARP.md",
    "gemini-cli": "GEMINI.md",
    trae: ".trae/rules/",
    firebase: ".idx/",
    augment: ".augment/rules/",
    kilocode: ".kilocode/rules/",
    junie: ".junie/guidelines.md",
    kiro: ".kiro/steering/",
    openhands: ".openhands/microagents/repo.md",
    crush: "CRUSH.md",
    opencode: "opencode.json",
    firebender: "firebender.json",
  },
  getPlatform: (id: string) => ({ id, name: id, file: `.${id}` }),
}));

import {
  generateAllFiles,
  generateConfigFiles,
  downloadZip,
  downloadConfigFile,
} from "@/lib/file-generator";

const baseUser = {
  name: "Test User",
  displayName: "Test User",
  email: "test@test.com",
  tier: "max" as const,
  skillLevel: "intermediate",
  persona: null,
  subscriptionPlan: "MAX",
};

const baseConfig = {
  projectName: "TestProject",
  projectDescription: "A test project",
  languages: ["typescript"] as string[],
  frameworks: ["nextjs"] as string[],
  additionalFeedback: "",
  isPublic: true,
  repoUrl: "https://github.com/test/repo",
  repoHost: "github",
  license: "mit",
  funding: false,
  cicd: ["github_actions"],
  aiBehaviorRules: [] as string[],
};

// ============================================================================
// generateConfigFiles (lines 4538-4548)
// ============================================================================
describe("generateConfigFiles", () => {
  it("returns a Blob with content for valid config", async () => {
    const blob = await generateConfigFiles(
      {
        ...baseConfig,
        platform: "cursor",
      },
      baseUser
    );
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });

  it("returns empty blob when no files generated (unknown platform)", async () => {
    const blob = await generateConfigFiles(
      {
        ...baseConfig,
        platform: "nonexistent-platform-xyz",
      } as any,
      baseUser
    );
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBe(0);
  });
});

// ============================================================================
// downloadZip (lines 4552-4563)
// ============================================================================
describe("downloadZip", () => {
  let mockElement;

  beforeEach(() => {
    mockElement = {
      href: "",
      download: "",
      click: vi.fn(),
    };
    vi.spyOn(document, "createElement").mockReturnValue(mockElement as any);
    vi.spyOn(document.body, "appendChild").mockImplementation(() => mockElement as any);
    vi.spyOn(document.body, "removeChild").mockImplementation(() => mockElement as any);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  it("creates a download link and triggers click", () => {
    const blob = new Blob(["test content"], { type: "text/plain" });
    downloadZip(blob, "my-project");

    expect(document.createElement).toHaveBeenCalledWith("a");
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(mockElement.click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test-url");
  });

  it("uses default fileName when no files array provided", () => {
    const blob = new Blob(["test content"], { type: "text/plain" });
    downloadZip(blob, "my-project");

    expect(mockElement.download).toBe("ai-config.md");
  });

  it("uses fileName from files array when provided via arguments", () => {
    const blob = new Blob(["test content"], { type: "text/plain" });
    const files = [{ fileName: "CLAUDE.md", content: "test", platform: "claude" }];
    // downloadZip reads files from arguments[2]
    downloadZip(blob, "my-project", files as any);

    expect(mockElement.download).toBe("CLAUDE.md");
  });
});

// ============================================================================
// downloadConfigFile (lines 4567-4578)
// ============================================================================
describe("downloadConfigFile", () => {
  let mockElement;

  beforeEach(() => {
    mockElement = {
      href: "",
      download: "",
      click: vi.fn(),
    };
    vi.spyOn(document, "createElement").mockReturnValue(mockElement as any);
    vi.spyOn(document.body, "appendChild").mockImplementation(() => mockElement as any);
    vi.spyOn(document.body, "removeChild").mockImplementation(() => mockElement as any);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test-url-2");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  it("downloads file with name from files array", () => {
    const blob = new Blob(["content"], { type: "text/plain" });
    const files = [{ fileName: "CLAUDE.md", content: "content", platform: "claude" }];
    downloadConfigFile(blob, files);

    expect(document.createElement).toHaveBeenCalledWith("a");
    expect(mockElement.download).toBe("CLAUDE.md");
    expect(mockElement.click).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test-url-2");
  });

  it("uses fallback filename when files array is empty", () => {
    const blob = new Blob(["content"], { type: "text/plain" });
    downloadConfigFile(blob, []);

    expect(mockElement.download).toBe("ai-config.md");
    expect(mockElement.click).toHaveBeenCalled();
  });

  it("uses fallback when first file has no fileName", () => {
    const blob = new Blob(["content"], { type: "text/plain" });
    downloadConfigFile(blob, [{ content: "test", platform: "cursor" }] as any);

    expect(mockElement.download).toBe("ai-config.md");
  });
});
