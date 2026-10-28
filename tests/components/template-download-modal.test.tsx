import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import JSZip from "jszip";

// A session the test controls. next-auth keeps the same object between renders
// and hands out a new one (same user) when it refetches the session.
let session: { user: Record<string, string> } | null = null;
const signIn = (user: Record<string, string>) => {
  session = { user };
};
const refetchSession = () => {
  session = session ? { user: { ...session.user } } : null;
};
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: session, status: session ? "authenticated" : "unauthenticated" }),
}));

vi.mock("@/lib/feature-flags", () => ({
  APP_NAME: "LynxPrompt",
  APP_URL: "https://lynxprompt.com",
}));

import { TemplateDownloadModal } from "@/components/template-download-modal";

type Download = { name: string; content: string };

async function blobText(blob: Blob): Promise<string> {
  if (typeof blob.text === "function") return blob.text();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsText(blob);
  });
}

let blobs: Blob[] = [];
let names: string[] = [];

async function lastDownload(): Promise<Download> {
  await waitFor(() => expect(names.length).toBeGreaterThan(0));
  return { name: names[names.length - 1], content: await blobText(blobs[blobs.length - 1]) };
}

async function lastZip(): Promise<Record<string, string>> {
  await waitFor(() => expect(names.length).toBeGreaterThan(0));
  const blob = blobs[blobs.length - 1];
  const buffer = await new Promise<ArrayBuffer>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.readAsArrayBuffer(blob);
  });
  const zip = await JSZip.loadAsync(buffer);
  const files: Record<string, string> = {};
  for (const [name, entry] of Object.entries(zip.files)) {
    if (!entry.dir) files[name] = await entry.async("string");
  }
  return files;
}

function platformButton(name: string) {
  const button = screen.queryByText(name, { exact: true })?.closest("button");
  return button ?? null;
}

beforeEach(() => {
  session = null;
  blobs = [];
  names = [];
  (URL as unknown as { createObjectURL: unknown }).createObjectURL = vi.fn((b: Blob) => {
    blobs.push(b);
    return "blob:test";
  });
  (URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    names.push(this.download);
  });
  vi.spyOn(global, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    if (url.includes("/api/user/variables")) {
      return new Response(JSON.stringify({ variables: {} }), { status: 200 });
    }
    return new Response("{}", { status: 200 });
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

const cursorRules = '---\ndescription: "Rules"\nglobs: src/**\nalwaysApply: true\n---\n\n# Team rules\nUse tabs.\n';

describe("TemplateDownloadModal: the file matches the chosen platform", () => {
  it("downloads Cursor rules for Claude Code as Markdown without Cursor frontmatter", async () => {
    render(
      <TemplateDownloadModal
        isOpen
        onClose={() => {}}
        template={{ name: "Team rules", content: cursorRules, targetPlatform: "CURSOR_MDC" }}
      />
    );
    fireEvent.click(platformButton("Claude Code")!);
    fireEvent.click(screen.getByRole("button", { name: /Download/ }));
    const { name, content } = await lastDownload();
    expect(name).toBe("CLAUDE.md");
    expect(content).toBe("# Team rules\nUse tabs.\n");
  });

  it("downloads Cursor rules as a real .mdc file with their frontmatter", async () => {
    render(
      <TemplateDownloadModal
        isOpen
        onClose={() => {}}
        template={{ name: "Team rules", content: cursorRules, targetPlatform: "CURSOR_MDC" }}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Download/ }));
    const { name, content } = await lastDownload();
    expect(name).toBe("project.mdc");
    expect(content).toBe(cursorRules);
  });

  it("adds Cursor frontmatter when Markdown is downloaded for Cursor", async () => {
    render(
      <TemplateDownloadModal
        isOpen
        onClose={() => {}}
        template={{ name: "Team rules", content: "# Team rules\n", targetPlatform: "AGENTS_MD" }}
      />
    );
    fireEvent.click(platformButton("Cursor")!);
    fireEvent.click(screen.getByRole("button", { name: /Download/ }));
    const { name, content } = await lastDownload();
    expect(name).toBe("project.mdc");
    expect(content.startsWith('---\ndescription: "Team rules"\nalwaysApply: true\n---\n')).toBe(true);
  });

  it("offers no JSON/YAML config or command targets for Markdown content", () => {
    render(
      <TemplateDownloadModal
        isOpen
        onClose={() => {}}
        template={{ name: "Team rules", content: "# Team rules\n", targetPlatform: "AGENTS_MD" }}
      />
    );
    const showAll = screen.queryByRole("button", { name: /Show all/ });
    if (showAll) fireEvent.click(showAll);
    expect(platformButton("Sourcegraph Cody")).toBeNull();
    expect(platformButton("Tabnine")).toBeNull();
    expect(platformButton("Cursor Command")).toBeNull();
    expect(platformButton("Kiro")).not.toBeNull();
  });
});

describe("TemplateDownloadModal: typed values survive re-initialisation", () => {
  const template = { name: "Vars", content: "Hi [[NAME|x]] from [[CITY]]", targetPlatform: "AGENTS_MD" };

  it("keeps typed values when the session object is refreshed", async () => {
    signIn({ name: "Ana" });
    const { rerender } = render(<TemplateDownloadModal isOpen onClose={() => {}} template={template} />);
    const city = await screen.findByPlaceholderText("Enter city");
    fireEvent.change(city, { target: { value: "Murcia" } });
    expect(city).toHaveValue("Murcia");

    // next-auth refetch: same user, new session object
    refetchSession();
    rerender(<TemplateDownloadModal isOpen onClose={() => {}} template={template} />);
    expect(screen.getByPlaceholderText("Enter city")).toHaveValue("Murcia");
  });

  it("keeps the other typed values after saving one variable", async () => {
    signIn({ name: "Ana" });
    render(<TemplateDownloadModal isOpen onClose={() => {}} template={template} />);
    fireEvent.change(await screen.findByPlaceholderText("Enter city"), { target: { value: "Murcia" } });
    fireEvent.change(screen.getByPlaceholderText("x"), { target: { value: "Bea" } });

    const saveButtons = screen.getAllByRole("button", { name: /Save/ });
    await act(async () => {
      fireEvent.click(saveButtons[0]);
    });
    await waitFor(() => expect(screen.getAllByText("✓ Saved").length).toBeGreaterThan(0));
    expect(screen.getByPlaceholderText("Enter city")).toHaveValue("Murcia");
    expect(screen.getByPlaceholderText("x")).toHaveValue("Bea");
  });
});

describe("TemplateDownloadModal: Clone & Edit", () => {
  const template = { id: "bp_1", name: "Vars", content: "Hi [[NAME|x]]", targetPlatform: "AGENTS_MD" };

  it("clones for a viewer who does not own the blueprint", () => {
    const onCloneToEdit = vi.fn();
    const onClose = vi.fn();
    render(<TemplateDownloadModal isOpen onClose={onClose} template={template} onCloneToEdit={onCloneToEdit} />);
    const clone = screen.getByText(/Clone & Edit/);
    expect(clone.closest("a")).toBeNull();
    fireEvent.click(clone);
    expect(onCloneToEdit).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalled();
  });

  it("links the owner straight to the editor", () => {
    render(<TemplateDownloadModal isOpen onClose={() => {}} template={template} isOwner onCloneToEdit={vi.fn()} />);
    const link = screen.getByText(/Edit blueprint/).closest("a");
    expect(link).toHaveAttribute("href", "/blueprints/bp_1/edit");
  });
});

describe("TemplateDownloadModal: Agent Skills and MCP servers", () => {
  const mcp = JSON.stringify({ mcpServers: { github: { command: "npx", args: ["-y", "github-mcp"] }, docs: { url: "https://docs.example/mcp" } } });

  it("rewrites an MCP config for VS Code's file and key", async () => {
    render(
      <TemplateDownloadModal isOpen onClose={() => {}} template={{ name: "Team MCP", content: mcp, targetPlatform: "MCP_CONFIG" }} />
    );
    expect(platformButton("Claude Code")).not.toBeNull();
    fireEvent.click(platformButton("VS Code (Copilot)")!);
    fireEvent.click(screen.getByRole("button", { name: /Download/ }));
    const { name, content } = await lastDownload();
    expect(name).toBe("mcp.json");
    expect(JSON.parse(content)).toEqual({
      servers: {
        github: { type: "stdio", command: "npx", args: ["-y", "github-mcp"] },
        docs: { type: "http", url: "https://docs.example/mcp" },
      },
    });
  });

  it("downloads a skill as a .zip with the .agents/skills and .claude/skills copies, with no rule platforms offered", async () => {
    const skill = "---\nname: release-notes\ndescription: Write release notes\nmodel: opus\n---\n\nRead the changelog.\n";
    render(
      <TemplateDownloadModal isOpen onClose={() => {}} template={{ name: "Team Release Helper", content: skill, targetPlatform: "AGENT_SKILL" }} />
    );
    expect(platformButton("Cursor")).toBeNull();
    expect(screen.getByText(".agents/skills/release-notes/SKILL.md")).toBeTruthy();
    expect(screen.getByText(".claude/skills/release-notes/SKILL.md")).toBeTruthy();
    expect(screen.queryByText(".kiro/skills/release-notes/SKILL.md")).toBeNull();
    fireEvent.click(screen.getByLabelText("Kiro"));
    expect(screen.getByText(".kiro/skills/release-notes/SKILL.md")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Download/ }));
    const files = await lastZip();
    expect(names[names.length - 1]).toBe("release-notes-skill.zip");
    expect(Object.keys(files).sort()).toEqual([
      ".agents/skills/release-notes/SKILL.md",
      ".claude/skills/release-notes/SKILL.md",
      ".kiro/skills/release-notes/SKILL.md",
    ]);
    expect(files[".claude/skills/release-notes/SKILL.md"]).toBe(skill);
    expect(files[".agents/skills/release-notes/SKILL.md"]).toBe(
      "---\nname: release-notes\ndescription: Write release notes\n---\n\nRead the changelog.\n"
    );
  });

  it("downloads a subagent for Claude Code and .agents/agents, and as Codex TOML when picked", async () => {
    const agent = "---\nname: reviewer\ndescription: Reviews diffs\ntools: Read\n---\nReview the diff.\n";
    render(
      <TemplateDownloadModal isOpen onClose={() => {}} template={{ name: "Reviewer", content: agent, targetPlatform: "AGENT_DEFINITION" }} />
    );
    expect(platformButton("Cursor")).toBeNull();
    fireEvent.click(screen.getByLabelText("OpenAI Codex"));
    fireEvent.click(screen.getByRole("button", { name: /Download/ }));
    const files = await lastZip();
    expect(names[names.length - 1]).toBe("reviewer-subagent.zip");
    expect(files[".claude/agents/reviewer.md"]).toBe(agent);
    expect(files[".agents/agents/reviewer.md"]).toBe("---\nname: reviewer\ndescription: Reviews diffs\n---\nReview the diff.\n");
    expect(files[".codex/agents/reviewer.toml"]).toBe(
      "name = \"reviewer\"\ndescription = \"Reviews diffs\"\ndeveloper_instructions = '''\nReview the diff.\n'''\n"
    );
    expect(files[".github/agents/reviewer.agent.md"]).toBeUndefined();
  });

  it("downloads a subagent stored as Codex TOML alone, at its own path", async () => {
    const toml = "name = \"reviewer\"\ndescription = \"Reviews diffs\"\ndeveloper_instructions = \"Review the diff.\"\n";
    render(
      <TemplateDownloadModal
        isOpen
        onClose={() => {}}
        template={{
          name: "Reviewer",
          content: toml,
          targetPlatform: "AGENT_DEFINITION",
          repositoryPath: ".codex/agents/reviewer.toml",
        }}
      />
    );
    expect(screen.queryByLabelText("OpenAI Codex")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Download/ }));
    expect(await lastZip()).toEqual({ ".codex/agents/reviewer.toml": toml });
  });
});
