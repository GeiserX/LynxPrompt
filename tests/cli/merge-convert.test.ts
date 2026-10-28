import { describe, it, expect } from "vitest";
import { parseMarkdownSections, mergeSectionsByStrategy } from "../../cli/src/utils/markdown-sections";
import { parseMarkdownConfig, generateTargetContent } from "../../cli/src/utils/convert-format";

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

  it("keeps the title and one frontmatter block for Cursor", () => {
    const out = generateTargetContent(parseMarkdownConfig(source), "cursor");
    expect(out).toContain("# My API Rules");
    expect(out.match(/^---$/gm)?.length).toBe(2);
    expect(out).toContain('globs: ["src/api/**"]');
  });

  it("keeps bold text for Windsurf, Cline and Goose", () => {
    for (const target of ["windsurf", "cline", "goose"]) {
      const out = generateTargetContent(parseMarkdownConfig(source), target);
      expect(out).toContain("- **Never** log tokens");
      expect(out).not.toContain("alwaysApply");
    }
  });

  // Aider's file is CONVENTIONS.md (Markdown), not the .aider.conf.yml settings file
  it("keeps every Aider convention as Markdown", () => {
    const out = generateTargetContent(parseMarkdownConfig(source), "aider");
    expect(out).toContain("- rule 25");
    expect(out).toContain("# My API Rules");
    expect(out).not.toContain("alwaysApply");
    expect(out).not.toContain("conventions:");
  });

  it("writes Kiro and Augment frontmatter", () => {
    expect(generateTargetContent(parseMarkdownConfig(source), "kiro")).toMatch(/^---\ninclusion: always\n---\n\n# My API Rules/);
    expect(generateTargetContent(parseMarkdownConfig(source), "augment")).toMatch(/^---\ntype: always_apply\n---\n\n# My API Rules/);
  });
});
