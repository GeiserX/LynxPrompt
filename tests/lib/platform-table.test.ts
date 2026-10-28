import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// The web app and the CLI read one platform table (packages/shared). These
// tests check every consumer of it agrees: the web download, `lynxp wizard`,
// `lynxp convert`, and the push -> pull round trip of a file.
vi.mock("@/lib/feature-flags", () => ({
  APP_NAME: "LynxPrompt",
  APP_URL: "https://lynxprompt.com",
}));

import {
  PLATFORMS,
  COMMANDS,
  getCommandTemplateType,
  platformForBlueprintType,
} from "@/lib/platforms";
import { generateAllFiles } from "@/lib/file-generator";
import { generateConfig, type GenerateOptions } from "../../cli/src/utils/generator";
import { blueprintFilename, matchConfigFile } from "../../cli/src/utils/blueprint-files";
import { convertContent, isStructuredPlatform } from "../../cli/src/utils/convert-format";
import { adaptRulesContent } from "@/lib/file-generator";

const RULE_PLATFORMS = PLATFORMS.filter((p) => !p.isCommand);

const user = { name: "Tester", tier: "free" };
const webConfig = {
  projectName: "Demo",
  projectDescription: "A demo project",
  languages: ["typescript"],
  frameworks: [],
  additionalFeedback: "",
  isPublic: true,
  license: "mit",
  funding: false,
  cicd: [],
  aiBehaviorRules: [],
};
const cliOptions: GenerateOptions = {
  name: "Demo",
  description: "A demo project",
  stack: ["typescript"],
  platforms: [],
  persona: "fullstack",
  boundaries: "standard",
  commands: {},
};

function web(platform: string) {
  const [file] = generateAllFiles({ ...webConfig, platform } as never, user);
  return file;
}

function cli(platform: string) {
  const files = generateConfig({ ...cliOptions, platforms: [platform] });
  const [[fileName, content]] = Object.entries(files);
  return { fileName, content };
}

const hasFrontmatter = (content: string) => content.startsWith("---\n");
// Markdown rule files have "## " sections; JSON and YAML configs do not
const hasSections = (content: string) => /^## /m.test(content);
const isJson = (content: string) => {
  try {
    JSON.parse(content);
    return true;
  } catch {
    return false;
  }
};

describe("web download and lynxp wizard write the same file", () => {
  it.each(RULE_PLATFORMS.map((p) => [p.id, p.file]))("%s -> %s", (id, file) => {
    expect(web(id).fileName).toBe(file);
    expect(cli(id).fileName).toBe(file);
  });

  it.each(RULE_PLATFORMS.map((p) => [p.id, p.format]))("%s has the same format on both (%s)", (id, format) => {
    const w = web(id).content;
    const c = cli(id).content;
    expect(hasFrontmatter(c)).toBe(hasFrontmatter(w));
    expect(hasSections(c)).toBe(hasSections(w));
    expect(isJson(c)).toBe(format === "json");
    expect(isJson(w)).toBe(format === "json");
  });
});

describe("lynxp convert follows the same formats", () => {
  const source = "# Rules\n\n- Use pnpm\n";
  const cursorSource = "---\ndescription: \"x\"\nglobs: src/**\nalwaysApply: true\n---\n\n# Rules\n";

  it.each(RULE_PLATFORMS.map((p) => p.id))("%s", (id) => {
    if (getFormat(id) === "json" || getFormat(id) === "yaml") {
      // Not a rules file: convert refuses it, as the web download does
      expect(isStructuredPlatform(id)).toBe(true);
      return;
    }
    expect(isStructuredPlatform(id)).toBe(false);
    const out = convertContent(source, "universal", id);
    expect(hasFrontmatter(out)).toBe(hasFrontmatter(web(id).content));
  });

  // The web download modal re-targets a blueprint with adaptRulesContent; the
  // CLI must write the same file for the same source
  it.each(RULE_PLATFORMS.filter((p) => p.format !== "json" && p.format !== "yaml").map((p) => p.id))(
    "%s matches the web download",
    (id) => {
      for (const [from, content] of [["universal", source], ["cursor", cursorSource]]) {
        expect(convertContent(content, from, id)).toBe(adaptRulesContent(content, from, id, "AI rules for this project"));
      }
    }
  );

  function getFormat(id: string) {
    return PLATFORMS.find((p) => p.id === id)?.format;
  }
});

describe("lynxp push then lynxp pull lands on the same file", () => {
  it.each(RULE_PLATFORMS.map((p) => [p.id, p.file]))("%s (%s)", (_id, file) => {
    const match = matchConfigFile(file);
    expect(match).not.toBeNull();
    // A CUSTOM blueprint keeps its repository path, so pull writes it back there
    if (match!.type !== "CUSTOM") {
      expect(blueprintFilename({ type: match!.type })).toBe(file);
    }
    expect(blueprintFilename({ type: match!.type, repository_path: file })).toBe(file);
  });

  it.each(COMMANDS.map((c) => [c.id, `${c.directory}/deploy-app${c.extension}`]))("%s (%s)", (id, file) => {
    const type = getCommandTemplateType(id)!;
    expect(matchConfigFile(file)?.type).toBe(type);
    expect(blueprintFilename({ type, name: "Deploy App" })).toBe(file);
  });

  it("finds config files in subfolders and with Windows separators", () => {
    expect(matchConfigFile("packages/api/AGENTS.md")?.type).toBe("AGENTS_MD");
    expect(matchConfigFile("packages\\api\\.cursor\\rules\\api.mdc")?.type).toBe("CURSOR_RULES");
    expect(matchConfigFile("apps/web/.github/copilot-instructions.md")?.type).toBe("COPILOT_INSTRUCTIONS");
    expect(matchConfigFile("README.md")).toBeNull();
  });

  it("still recognises the paths older CLI versions wrote", () => {
    expect(matchConfigFile(".zed/instructions.md")?.type).toBe("ZED_INSTRUCTIONS");
    expect(matchConfigFile(".idx/rules/project.mdc")?.type).toBe("IDX_CONFIG");
    expect(matchConfigFile(".roo/rules/project.mdc")?.type).toBe("ROO_RULES");
    expect(matchConfigFile(".kilocode/rules/project.mdc")?.type).toBe("KILOCODE_RULES");
    expect(matchConfigFile(".copilot/prompts/review.md")?.type).toBe("COPILOT_PROMPT");
    expect(matchConfigFile("AIDER.md")?.type).toBe("AIDER_MD");
    expect(matchConfigFile(".cursorrules")?.type).toBe("CURSORRULES");
  });
});

describe("every blueprint type of the database has a home", () => {
  const schema = readFileSync(join(__dirname, "../../prisma/schema-users.prisma"), "utf-8");
  const enumBody = schema.match(/enum TemplateType \{([\s\S]*?)\}/)![1];
  const types = enumBody
    .split("\n")
    .map((l) => l.replace(/\/\/.*/, "").trim())
    .filter(Boolean);
  // Not AI rule files: static files and the catch-all
  const NOT_RULES = new Set([
    "LICENSE", "FUNDING", "GITIGNORE", "README", "CONTRIBUTING", "CODE_OF_CONDUCT", "SECURITY",
    "DOCKERFILE", "DOCKER_COMPOSE", "GITHUB_ACTIONS", "GITLAB_CI", "EDITORCONFIG", "PRETTIER",
    "ESLINT", "PRE_COMMIT", "CUSTOM",
    // Skill folders and MCP configs: not one platform's file (see blueprint-files tests)
    "AGENT_SKILL", "MCP_CONFIG", "AGENT_DEFINITION",
  ]);

  it("parses the enum", () => {
    expect(types).toContain("AGENTS_MD");
    expect(types.length).toBeGreaterThan(40);
  });

  it.each(types.filter((t) => !NOT_RULES.has(t)))("%s maps to a platform and a file", (type) => {
    const platform = platformForBlueprintType(type);
    expect(platform).toBeDefined();
    expect(PLATFORMS.some((p) => p.id === platform)).toBe(true);
    expect(blueprintFilename({ type, name: "x" })).not.toBe("ai-config.md");
  });

  it("every platform's blueprintType is a real enum value", () => {
    for (const p of PLATFORMS) {
      if (p.blueprintType) expect(types).toContain(p.blueprintType);
    }
  });
});

describe("Devin", () => {
  // Devin reads every Markdown file in .devin/rules/; a rule there needs
  // Windsurf-style frontmatter to apply to every request
  const ALWAYS_ON = "---\ntrigger: always_on\n---\n";

  it("is generated as an always-on rule in .devin/rules/ by the web and the CLI", () => {
    expect(web("devin").fileName).toBe(".devin/rules/project.md");
    expect(web("devin").content.startsWith(ALWAYS_ON)).toBe(true);
    expect(cli("devin").fileName).toBe(".devin/rules/project.md");
    expect(cli("devin").content.startsWith(ALWAYS_ON)).toBe(true);
  });

  it("is a conversion target with the same frontmatter", () => {
    expect(convertContent("# Rules\n", "universal", "devin")).toBe(`${ALWAYS_ON}\n# Rules\n`);
  });

  it("any rule file in .devin/rules/ is pushed and pulled back to its path", () => {
    expect(matchConfigFile(".devin/rules/testing.md")).toEqual({ type: "CUSTOM", label: "Devin Rules" });
    expect(blueprintFilename({ type: "CUSTOM", repository_path: ".devin/rules/testing.md" })).toBe(".devin/rules/testing.md");
  });
});
