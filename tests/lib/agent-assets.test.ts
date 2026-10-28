import { describe, it, expect } from "vitest";
import {
  SKILL_DIRECTORIES,
  skillFiles,
  subagentFiles,
  skillNameProblem,
  checkSkillContent,
  subagentToCodexToml,
  agentAssetFiles,
} from "../../packages/shared/src/agent-assets";
import * as platforms from "../../packages/shared/src/platforms";

const SPEC_SKILL = "---\nname: release-notes\ndescription: Write release notes\n---\n\nRead the changelog.\n";
const CLAUDE_SKILL =
  "---\nname: release-notes\ndescription: Write release notes\nwhen_to_use: before a tag\nmodel: opus\nmetadata:\n  author: team\n---\n\nRead the changelog.\n";

describe("skill folders", () => {
  it("lists .agents/skills first and .claude/skills second, and keeps every tool's folder for push", () => {
    expect(SKILL_DIRECTORIES.slice(0, 2)).toEqual([".agents/skills", ".claude/skills"]);
    for (const dir of [".kiro/skills", ".firebender/skills", ".junie/skills", ".qwen/skills", ".tabnine/agent/skills", ".github/skills", ".grok/skills"]) {
      expect(SKILL_DIRECTORIES).toContain(dir);
    }
  });

  it("is still exported from the platform table", () => {
    expect(platforms.SKILL_DIRECTORIES).toBe(SKILL_DIRECTORIES);
    expect(platforms.skillFolder({ content: SPEC_SKILL })).toBe("release-notes");
    expect(platforms.SKILL_BLUEPRINT_TYPE).toBe("AGENT_SKILL");
  });
});

describe("skillFiles", () => {
  it("writes .agents/skills and .claude/skills by default, Kiro and Firebender only when picked", () => {
    expect(skillFiles({ content: SPEC_SKILL }).map((f) => f.path)).toEqual([
      ".agents/skills/release-notes/SKILL.md",
      ".claude/skills/release-notes/SKILL.md",
    ]);
    expect(skillFiles({ content: SPEC_SKILL }, ["kiro", "firebender"]).map((f) => f.path)).toEqual([
      ".agents/skills/release-notes/SKILL.md",
      ".claude/skills/release-notes/SKILL.md",
      ".kiro/skills/release-notes/SKILL.md",
      ".firebender/skills/release-notes/SKILL.md",
    ]);
  });

  it("leaves a spec-only skill unchanged in every copy", () => {
    for (const f of skillFiles({ content: SPEC_SKILL }, ["kiro"])) {
      expect(f.content).toBe(SPEC_SKILL);
      expect(f.full).toBe(true);
    }
  });

  it("keeps Claude-only fields in the .claude copy only", () => {
    const [shared, claude] = skillFiles({ content: CLAUDE_SKILL });
    expect(claude.content).toBe(CLAUDE_SKILL);
    expect(claude.full).toBe(true);
    expect(shared.full).toBe(false);
    expect(shared.content).toBe(
      "---\nname: release-notes\ndescription: Write release notes\nmetadata:\n  author: team\n---\n\nRead the changelog.\n"
    );
  });

  it("sets the name to the folder and fills a missing description", () => {
    const [shared] = skillFiles({ name: "PDF Tools", description: "Fill PDF forms", content: "Use pdftk." });
    expect(shared.path).toBe(".agents/skills/pdf-tools/SKILL.md");
    expect(shared.content).toBe('---\nname: pdf-tools\ndescription: "Fill PDF forms"\n---\nUse pdftk.');
  });
});

describe("skill names", () => {
  it("follows the Agent Skills format", () => {
    expect(skillNameProblem("pdf-tools")).toBeNull();
    expect(skillNameProblem("a".repeat(64))).toBeNull();
    expect(skillNameProblem("")).not.toBeNull();
    expect(skillNameProblem("a".repeat(65))).not.toBeNull();
    expect(skillNameProblem("PDF-Tools")).not.toBeNull();
    expect(skillNameProblem("-pdf")).not.toBeNull();
    expect(skillNameProblem("pdf-")).not.toBeNull();
    expect(skillNameProblem("pdf--tools")).not.toBeNull();
    expect(skillNameProblem("pdf_tools")).not.toBeNull();
  });

  it("checks the frontmatter name and its folder", () => {
    expect(checkSkillContent(SPEC_SKILL)).toBeNull();
    expect(checkSkillContent("No frontmatter at all")).toBeNull();
    expect(checkSkillContent("---\nname: Release Notes\n---\nx")).toMatch(/Release Notes/);
    expect(checkSkillContent(SPEC_SKILL, ".claude/skills/release-notes/SKILL.md")).toBeNull();
    expect(checkSkillContent(SPEC_SKILL, ".claude/skills/notes/SKILL.md")).toMatch(/folder name "notes"/);
  });
});

const AGENT =
  "---\nname: code-reviewer\ndescription: Reviews diffs for bugs\ntools: Read, Grep\nmodel: sonnet\n---\n\nYou review code.\nQuote the line.\n";

describe("subagentFiles", () => {
  it("writes .claude/agents as written and .agents/agents with name and description", () => {
    const files = subagentFiles({ content: AGENT });
    expect(files.map((f) => f.path)).toEqual([".claude/agents/code-reviewer.md", ".agents/agents/code-reviewer.md"]);
    expect(files[0].content).toBe(AGENT);
    expect(files[1].content).toBe("---\nname: code-reviewer\ndescription: Reviews diffs for bugs\n---\n\nYou review code.\nQuote the line.\n");
  });

  it("adds Copilot and Codex only when picked", () => {
    const files = subagentFiles({ content: AGENT }, ["copilot", "codex"]);
    expect(files.map((f) => f.path)).toEqual([
      ".claude/agents/code-reviewer.md",
      ".agents/agents/code-reviewer.md",
      ".github/agents/code-reviewer.agent.md",
      ".codex/agents/code-reviewer.toml",
    ]);
    expect(files[3].content).toBe(
      "name = \"code-reviewer\"\ndescription = \"Reviews diffs for bugs\"\ndeveloper_instructions = '''\nYou review code.\nQuote the line.\n'''\n"
    );
  });

  it("dispatches by blueprint type", () => {
    expect(agentAssetFiles({ type: "AGENT_DEFINITION", content: AGENT })).toHaveLength(2);
    expect(agentAssetFiles({ type: "AGENT_SKILL", content: SPEC_SKILL })).toHaveLength(2);
    expect(agentAssetFiles({ type: "AGENTS_MD", content: "# Rules" })).toEqual([]);
  });
});

describe("subagentToCodexToml", () => {
  it("falls back to an escaped basic string when the body holds ''' or control characters", () => {
    const toml = subagentToCodexToml("---\ndescription: say \"hi\"\n---\nUse ''' and a\u0001bell", "x");
    expect(toml).toBe(
      'name = "x"\ndescription = "say \\"hi\\""\ndeveloper_instructions = "Use \'\'\' and a\\u0001bell"\n'
    );
  });

  it("uses the blueprint description when the file has none", () => {
    expect(subagentToCodexToml("Just instructions", "helper", "Helps")).toBe(
      "name = \"helper\"\ndescription = \"Helps\"\ndeveloper_instructions = '''\nJust instructions\n'''\n"
    );
  });
});
