import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { id: "user_1" } }),
}));

vi.mock("@/lib/auth", () => ({ authOptions: {} }));

vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    userTemplate: { findUnique: mockFindUnique, update: mockUpdate },
    userTemplateVersion: { create: vi.fn().mockResolvedValue({}) },
  },
}));

async function update(body: Record<string, unknown>) {
  const { PUT } = await import("@/app/api/blueprints/[id]/route");
  return PUT(
    new Request("https://lynxprompt.com/api/blueprints/bp_tpl_1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: "bp_tpl_1" }) }
  );
}

function written() {
  expect(mockUpdate).toHaveBeenCalledTimes(1);
  return mockUpdate.mock.calls[0][0].data;
}

// The wizard overwrites a Cloud Sync blueprint with the file it just made;
// `lynxp pull` then writes the blueprint to its stored repository path.
describe("PUT /api/blueprints/[id] repository path", () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
    mockUpdate.mockReset();
    mockFindUnique.mockResolvedValue({
      userId: "user_1",
      currentVersion: 1,
      content: "# Old\n\nOld instructions for the project.",
      isPublic: false,
      teamId: null,
    });
    mockUpdate.mockImplementation(async ({ data }) => ({ id: "tpl_1", ...data }));
  });

  it("stores the path of the file the wizard overwrote it with", async () => {
    const response = await update({
      content: "# Gemini\n\nNew instructions for the project.",
      type: "GEMINI_MD",
      repositoryPath: "GEMINI.md",
    });
    expect(response.status).toBe(200);
    expect(written().repositoryPath).toBe("GEMINI.md");
  });

  it("keeps the path inside the repository", async () => {
    await update({ repositoryPath: "../outside/AGENTS.md" });
    expect(written().repositoryPath).toBeNull();
  });

  it("leaves the stored path alone when the edit does not send one", async () => {
    await update({ name: "Renamed blueprint" });
    expect(written()).not.toHaveProperty("repositoryPath");
  });
});
