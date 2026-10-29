import { describe, it, expect } from "vitest";
import { parseMarkdownSections, mergeSectionsByStrategy } from "../../cli/src/utils/markdown-sections";
import { convertContent, isStructuredPlatform, platformForPath } from "../../cli/src/utils/convert-format";

const withFence = `# Project

Intro text.

## Setup

\`\`\`bash
# install deps
npm install
\`\`\`

## Rules

- Be kind
`;

describe("cli merge sections", () => {
  it("does not split a code fence at a # comment", () => {
    const sections = parseMarkdownSections(withFence, "a.md");
    expect(sections.map((s) => s.title)).toEqual(["Project", "Setup", "Rules"]);
    expect(sections[1].content).toContain("# install deps\nnpm install\n```");
  });

  it("smart merge keeps source order, heading levels and every fence closed", () => {
    const a = parseMarkdownSections(withFence, "a.md");
    const b = parseMarkdownSections("## Testing\n\nA much longer section about testing that would sort first by length.\n", "b.md");
    const out = mergeSectionsByStrategy([a, b], "smart");

    expect(out.indexOf("# Project")).toBeLessThan(out.indexOf("## Setup"));
    expect(out.indexOf("## Setup")).toBeLessThan(out.indexOf("## Rules"));
    expect(out.indexOf("## Rules")).toBeLessThan(out.indexOf("## Testing"));
    expect(out).toMatch(/^# Project$/m);
    expect((out.match(/```/g) || []).length % 2).toBe(0);
  });

  it("smart merge drops only exact duplicates", () => {
    const a = parseMarkdownSections("## Rules\n\n- one\n", "a.md");
    const b = parseMarkdownSections("## Rules\n\n- one\n\n## Rules\n\n- two\n", "b.md");
    const out = mergeSectionsByStrategy([a, b], "smart");
    expect(out.match(/## Rules/g)?.length).toBe(2);
    expect(out).toContain("- two");
  });
});

describe("cli convert content", () => {
  const source = `---
description: "API rules"
globs: ["src/api/**"]
alwaysApply: false
---

# My API Rules

- **Never** log tokens
${Array.from({ length: 25 }, (_, i) => `- rule ${i + 1}`).join("\n")}
`;
  const body = source.slice(source.indexOf("# My API Rules"));

  it("keeps Cursor's own frontmatter for Cursor and Firebender", () => {
    expect(convertContent(source, "cursor", "cursor")).toBe(source);
    expect(convertContent(source, "cursor", "firebender")).toBe(source);
  });

  it("adds Cursor frontmatter to Markdown converted for Cursor", () => {
    expect(convertContent(body, "agents", "cursor")).toBe(
      `---\ndescription: "AI rules for this project"\nalwaysApply: true\n---\n\n${body}`
    );
  });

  // .cursorrules, Copilot, Cline, Goose and the rest read Markdown: the rules
  // are copied as written, with no heading or emphasis lost
  it.each(["cursor_legacy", "copilot", "cline", "goose", "tabnine", "claude", "codex"])(
    "copies the rules unchanged for %s",
    (target) => {
      expect(convertContent(source, "cursor", target)).toBe(body);
      expect(convertContent(body, "agents", target)).toBe(body);
    }
  );

  it("swaps the frontmatter for Kiro, Augment, Devin Desktop and Trae", () => {
    expect(convertContent(source, "cursor", "kiro")).toBe(`---\ninclusion: always\n---\n\n${body}`);
    expect(convertContent(source, "cursor", "windsurf")).toBe(`---\ntrigger: always_on\n---\n\n${body}`);
    expect(convertContent(source, "cursor", "trae")).toBe(`---\nalwaysApply: true\n---\n\n${body}`);
    expect(convertContent(source, "cursor", "augment")).toBe(
      `---\ntype: always_apply\ndescription: "AI rules for this project"\n---\n\n${body}`
    );
  });

  it("copies a command unchanged", () => {
    expect(convertContent(source, "cursor-command", "claude-command")).toBe(source);
    expect(convertContent(source, "cursor-command", "kiro-prompt")).toBe(source);
  });

  it("writes a command for Gemini CLI as TOML, backslashes and quotes kept", () => {
    const command = '---\ndescription: Deploy the app\n---\n\nRun C:\\deploy and say "done".\n';
    expect(convertContent(command, "cursor-command", "gemini-command")).toBe(
      "description = \"Deploy the app\"\nprompt = '''\nRun C:\\deploy and say \"done\".\n'''\n"
    );
    // A prompt holding ''' falls back to an escaped basic string
    expect(convertContent("a ''' b \\ c\n", "cursor-command", "gemini-command")).toBe(
      'prompt = """\na \'\'\' b \\\\ c\n"""\n'
    );
  });

  it("reads a Gemini CLI TOML command back to a Markdown command", () => {
    const toml = "description = \"Deploy it\"\nprompt = '''\nRun the deploy.\n'''\n";
    expect(convertContent(toml, "gemini-command", "claude-command")).toBe(
      "---\ndescription: Deploy it\n---\n\nRun the deploy.\n"
    );
    expect(convertContent('prompt = """\nSay "hi".\n"""\n', "gemini-command", "cursor-command")).toBe('Say "hi".\n');
    // Indentation is kept, and a description YAML would read as another type is quoted
    expect(convertContent('description = "true"\nprompt = """\n  indented\n"""\n', "gemini-command", "claude-command")).toBe(
      '---\ndescription: "true"\n---\n\n  indented\n'
    );
    // TOML to TOML stays as it is, never wrapped in a second prompt
    expect(convertContent(toml, "gemini-command", "gemini-command")).toBe(toml);
  });

  it("round-trips a command through Gemini CLI's TOML", () => {
    const md = '---\ndescription: Deploy the app\n---\n\nRun C:\\deploy and say "done".\n';
    const toml = convertContent(md, "cursor-command", "gemini-command");
    expect(convertContent(toml, "gemini-command", "claude-command")).toBe(md);
  });

  it("treats JSON and YAML configs as no rules file", () => {
    // Aider's file is its YAML config, which lists AGENTS.md
    expect(isStructuredPlatform("aider")).toBe(true);
    for (const id of ["universal", "cursor", "windsurf", "tabnine", "kiro", "cursor_legacy", "codex", "unknown"]) {
      expect(isStructuredPlatform(id)).toBe(false);
    }
  });
});

describe("cli convert source detection", () => {
  it("knows a rules file by its tool's folder, whatever its name", () => {
    expect(platformForPath(".cursor/rules/api.mdc")).toBe("cursor");
    expect(platformForPath("./.kiro/steering/style.md")).toBe("kiro");
    expect(platformForPath("repo\\.augment\\rules\\x.md")).toBe("augment");
  });

  it("knows a tool's own file and a config file", () => {
    expect(platformForPath(".aider.conf.yml")).toBe("aider");
    expect(platformForPath("sub/.windsurfrules")).toBe("windsurf");
    expect(platformForPath(".windsurf/rules/style.md")).toBe("windsurf");
    expect(platformForPath("WARP.md")).toBe("warp");
    expect(platformForPath(".junie/guidelines.md")).toBe("junie");
    expect(platformForPath(".tabnine/guidelines/style.md")).toBe("tabnine");
    // Retired tools' configs belong to no platform
    expect(platformForPath(".continue/config.json")).toBeUndefined();
  });

  it("reads any other .mdc file as a Cursor rule and keeps its frontmatter", () => {
    const rule = `---\nglobs: ["src/api/**"]\nalwaysApply: false\n---\n\n# API\n`;
    for (const path of ["api.mdc", "backup/api.mdc", "x/.cursor/rules-old/a.mdc"]) {
      const from = platformForPath(path);
      expect(from).toBe("cursor");
      expect(convertContent(rule, from!, "cursor")).toBe(rule);
      expect(convertContent(rule, from!, "firebender")).toBe(rule);
    }
    expect(platformForPath(".firebender/rules/a.mdc")).toBe("firebender");
  });

  it("claims no file it does not know", () => {
    expect(platformForPath("notes/rules.md")).toBeUndefined();
    expect(platformForPath("my.rules")).toBeUndefined();
  });
});
