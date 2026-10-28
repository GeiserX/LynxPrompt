import { describe, it, expect, vi } from "vitest";
import { parse as parseYaml } from "yaml";

// Every file both generators write must still parse as what its name says
// when the user's answers hold the characters that break YAML and JSON:
// quotes, ": ", " #", backslashes, newlines and a "---" line. A tool that
// cannot parse its config ignores the rules without telling anyone.
vi.mock("@/lib/feature-flags", () => ({
  APP_NAME: "LynxPrompt",
  APP_URL: "https://lynxprompt.com",
}));

import { PLATFORMS } from "@/lib/platforms";
import { generateAllFiles } from "@/lib/file-generator";
import { generateConfig, type GenerateOptions } from "../../cli/src/utils/generator";

const NAME = `Demo "app": #1 \\ 'x'`;
const DESCRIPTION = `Ships fast: no "breaks" # here\\n\nSecond line\n---\nkey: value`;
const NOTES = `Prefer "small" PRs: always. # not a comment\n---\nC:\\tools\\make.exe`;

const webConfig = {
  projectName: NAME,
  projectDescription: DESCRIPTION,
  languages: ["typescript"],
  frameworks: ["nextjs"],
  databases: ["postgresql"],
  cicd: ["github_actions"],
  aiBehaviorRules: ["always_debug_after_build"],
  additionalFeedback: NOTES,
  isPublic: true,
  license: "mit",
  funding: true,
  fundingYml: `github: [demo]`,
  commands: { build: `npm run "build"`, test: "npm test -- --grep 'a: b'" },
  projectType: "opensource",
};

const cliOptions: GenerateOptions = {
  name: NAME,
  description: DESCRIPTION,
  stack: ["typescript", "nextjs"],
  platforms: [],
  persona: "fullstack",
  boundaries: "standard",
  commands: { build: [`npm run "build"`], test: ["npm test -- --grep 'a: b'"] },
  projectType: "opensource",
  extraNotes: NOTES,
  includeFunding: true,
  staticFiles: ["funding"],
};

const RULE_PLATFORM_IDS = PLATFORMS.filter((p) => !p.isCommand).map((p) => p.id);

function frontmatter(content: string): string | null {
  if (!content.startsWith("---\n")) return null;
  const end = content.indexOf("\n---\n", 4);
  return end === -1 ? content.slice(4) : content.slice(4, end);
}

function expectParses(fileName: string, content: string) {
  if (fileName.endsWith(".json")) {
    expect(() => JSON.parse(content), fileName).not.toThrow();
    expect(typeof JSON.parse(content), fileName).toBe("object");
    return;
  }
  if (/\.ya?ml$/.test(fileName)) {
    const doc = parseYaml(content, { uniqueKeys: true });
    // A YAML file that is all comments is a valid empty config
    expect(doc === null || typeof doc === "object", fileName).toBe(true);
    return;
  }
  const head = frontmatter(content);
  if (fileName.endsWith(".mdc")) {
    expect(head, `${fileName} has no frontmatter`).not.toBeNull();
  }
  if (head !== null) {
    const doc = parseYaml(head, { uniqueKeys: true });
    expect(doc, `${fileName} frontmatter`).toBeTypeOf("object");
    expect(doc, `${fileName} frontmatter`).not.toBeNull();
  }
}

describe("web generator output parses", () => {
  it.each(RULE_PLATFORM_IDS)("%s", (platform) => {
    const files = generateAllFiles({ ...webConfig, platform } as never, { name: "Tester" });
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) expectParses(file.fileName, file.content);
  });
});

describe("cli generator output parses", () => {
  it.each([...RULE_PLATFORM_IDS, "agents"])("%s", (platform) => {
    const files = generateConfig({ ...cliOptions, platforms: [platform] });
    expect(Object.keys(files).length).toBeGreaterThan(0);
    for (const [fileName, content] of Object.entries(files)) expectParses(fileName, content);
  });
});

describe("the parse check itself", () => {
  it.each([
    ["x.json", `{"name": "a "quoted" name"}`],
    ["x.yaml", `name: a: b`],
    ["x.mdc", "# no frontmatter"],
    ["x.mdc", `---\ndescription: a: b\n---\n# body`],
    ["x.md", `---\ndescription: "unterminated\n---\n`],
  ])("rejects a broken %s", (fileName, content) => {
    expect(() => expectParses(fileName, content)).toThrow();
  });
});
