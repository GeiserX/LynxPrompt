import { describe, it, expect } from "vitest";
import { publicRepositoryPath } from "@/lib/repository-path";
import { COMMANDS, PLATFORMS } from "../../packages/shared/src/platforms";
import { blueprintFilename, matchConfigFile } from "../../cli/src/utils/blueprint-files";

// What a reader who is not the owner sees of a blueprint's repository path:
// never the owner's folders, always enough of the tool's path for `lynxp pull`
// and the web download to put the file where its tool reads it

describe("publicRepositoryPath", () => {
  it("drops the owner's folders and keeps the tool's path", () => {
    expect(publicRepositoryPath("clients/acme-secret/CRUSH.md")).toBe("CRUSH.md");
    expect(publicRepositoryPath("clients/acme-secret/.gemini/commands/deploy.toml")).toBe(".gemini/commands/deploy.toml");
    expect(publicRepositoryPath("clients/acme-secret/.junie/AGENTS.md")).toBe(".junie/AGENTS.md");
    expect(publicRepositoryPath("clients/acme-secret/.cursor/rules/sub/style.mdc")).toBe(".cursor/rules/style.mdc");
    expect(publicRepositoryPath("clients\\acme-secret\\.tabnine\\guidelines\\project.md")).toBe(".tabnine/guidelines/project.md");
    expect(publicRepositoryPath("clients/acme-secret/.warp/.mcp.json")).toBe(".warp/.mcp.json");
    expect(publicRepositoryPath("clients/acme-secret/.codex/agents/reviewer.toml")).toBe(".codex/agents/reviewer.toml");
  });

  it("hides a path no tool reads", () => {
    expect(publicRepositoryPath("clients/acme-secret/notes.md")).toBeNull();
    expect(publicRepositoryPath("clients/acme-secret/.gemini/commands/readme.txt")).toBeNull();
    expect(publicRepositoryPath(null)).toBeNull();
  });

  // Every file push stores as CUSTOM (no blueprint type) pulls back to its tool's
  // path for a reader, instead of the fallback ai-config.md
  const customPaths = [
    ...COMMANDS.map((c) => `${c.directory}/x${c.extension}`),
    ...PLATFORMS.filter((p) => !p.isCommand).flatMap((p) => [
      p.file,
      ...(p.rulesDirectory ? [`${p.rulesDirectory}x.md`] : []),
      ...(p.otherFiles ?? []).map((f) => (f.endsWith("/") ? `${f}x.md` : f)),
    ]),
  ].filter((p) => matchConfigFile(p)?.type === "CUSTOM");

  it("keeps the tool path of every CUSTOM file push stores", () => {
    expect(customPaths).toContain(".gemini/commands/x.toml");
    expect(customPaths).toContain("CRUSH.md");
    for (const toolPath of customPaths) {
      const seen = publicRepositoryPath(`clients/acme-secret/${toolPath}`);
      expect(seen, toolPath).toBe(toolPath);
      expect(blueprintFilename({ type: "CUSTOM", repository_path: seen })).toBe(toolPath);
    }
  });
});
