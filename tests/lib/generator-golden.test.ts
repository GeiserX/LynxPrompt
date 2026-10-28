import { describe, it, expect, vi } from "vitest";

// Golden output of both generators for every platform. A change to what a
// platform's file is called or contains shows up here as a snapshot diff,
// so it has to be deliberate.
vi.mock("@/lib/feature-flags", () => ({
  APP_NAME: "LynxPrompt",
  APP_URL: "https://lynxprompt.com",
}));

import { PLATFORMS } from "@/lib/platforms";
import { generateAllFiles } from "@/lib/file-generator";
import { generateConfig, type GenerateOptions } from "../../cli/src/utils/generator";

const user = { name: "Tester", tier: "free" };

const webConfig = {
  projectName: "Demo",
  projectDescription: "A demo project",
  languages: ["typescript", "python"],
  frameworks: ["nextjs"],
  databases: ["postgresql"],
  additionalFeedback: "Prefer small pull requests.",
  isPublic: true,
  license: "mit",
  funding: false,
  cicd: ["github_actions"],
  aiBehaviorRules: ["always_debug_after_build"],
  commands: { build: "npm run build", test: "npm test" },
  projectType: "opensource",
};

const cliOptions: GenerateOptions = {
  name: "Demo",
  description: "A demo project",
  stack: ["typescript", "nextjs"],
  platforms: [],
  persona: "fullstack",
  boundaries: "standard",
  commands: { build: ["npm run build"], test: ["npm test"] },
  projectType: "opensource",
  importantFiles: ["readme"],
};

// Every answer the web wizard can give, so a change to any section shows up.
const fullWebConfig = {
  ...webConfig,
  projectType: "work",
  architecturePattern: "hexagonal",
  devOS: ["macos", "windows"],
  letAiDecide: true,
  repoHost: "github",
  repoUrl: "https://github.com/acme/demo",
  exampleRepoUrl: "https://github.com/acme/example",
  documentationUrl: "https://docs.acme.test",
  licenseNotes: "Docs are CC-BY.",
  conventionalCommits: true,
  semver: true,
  versionTagFormat: "v_prefix",
  changelogTool: "changesets",
  branchStrategy: "github_flow",
  defaultBranch: "develop",
  commitSigning: true,
  useGitWorktrees: true,
  deploymentTarget: ["vercel", "kubernetes"],
  buildContainer: true,
  containerRegistry: "ghcr",
  dockerImageNames: "acme/demo, acme/demo-worker",
  funding: true,
  fundingYml: "github: [acme]",
  aiBehaviorRules: ["always_debug_after_build", "verify_work", "self_improving"],
  planModeFrequency: "complex_tasks",
  explanationVerbosity: "concise",
  accessibilityFocus: true,
  performanceFocus: true,
  attemptWorkarounds: false,
  mcpServers: "github, postgres",
  serverAccess: true,
  sshKeyPath: "~/.ssh/deploy",
  manualDeployment: true,
  deploymentMethod: "docker_compose",
  importantFiles: ["readme", "architecture_md"],
  importantFilesOther: "docs/adr",
  enableAutoUpdate: true,
  packageManager: "pnpm",
  jsRuntime: "node",
  monorepoTool: "turborepo",
  orm: "prisma",
  commands: {
    build: "npm run build", test: "npm test", lint: "npm run lint", dev: "npm run dev",
    typecheck: "npm run typecheck", format: "npm run format", preCommit: "npx lint-staged", clean: "rm -rf dist",
    additional: ["npm run db:migrate"],
  },
  boundaries: { always: ["Run tests"], ask: ["Add dependencies"], never: ["Push to main"] },
  codeStyle: {
    naming: "PascalCase", errorHandling: "result_types", loggingConventions: "structured",
    maxFileLength: 400, importOrder: "grouped", commentLanguage: "english", docStyle: "tsdoc", notes: "Prefer pure functions.",
  },
  testingStrategy: {
    levels: ["unit", "e2e", "smoke"], frameworks: ["vitest", "playwright"], coverage: 90, notes: "Mock the network.",
    tddPreference: true, snapshotTesting: true, mockStrategy: "comprehensive",
  },
  staticFiles: {
    editorconfig: true, contributing: true, contributingCustom: "# Contributing\nOpen an issue first.",
    codeOfConduct: true, security: true, roadmap: true, gitignoreMode: "generate", dockerignoreMode: "generate",
  },
  security: {
    authProviders: ["github", "google"], secretsManagement: ["env_vars", "vault"], securityTooling: ["dependabot", "codeql"],
    authPatterns: ["oauth2", "jwt"], dataHandling: ["encryption_at_rest"], compliance: ["gdpr"], analytics: ["plausible"],
    additionalNotes: "Rotate keys yearly.",
  },
};
const fullUser = { name: "Tester", displayName: "Test Author", persona: "backend_developer", skillLevel: "expert" };

// One platform per generator function.
const GENERATOR_PLATFORMS = [
  "universal", "cursor", "claude", "copilot", "windsurf", "antigravity", "aider",
  "continue", "cody", "tabnine", "supermaven", "codegpt", "void",
];

// The CLI only knows the rules platforms; command platforms are web-only here.
const RULE_PLATFORM_IDS = PLATFORMS.filter((p) => !p.isCommand).map((p) => p.id);

describe("web generator golden output", () => {
  it.each(RULE_PLATFORM_IDS)("%s", (platform) => {
    const files = generateAllFiles({ ...webConfig, platform } as never, user);
    expect(files.map((f) => ({ fileName: f.fileName, content: f.content }))).toMatchSnapshot();
  });

  it.each(GENERATOR_PLATFORMS)("%s with every answer", (platform) => {
    const files = generateAllFiles({ ...fullWebConfig, platform } as never, fullUser);
    expect(files.map((f) => ({ fileName: f.fileName, content: f.content }))).toMatchSnapshot();
  });

  it.each(["cursor", "claude"])("%s with the Cloud Sync header", (platform) => {
    const files = generateAllFiles(
      { ...webConfig, platform, enableAutoUpdate: true, preferCliSync: false } as never,
      user,
      { blueprintId: "bp_golden" },
    );
    expect(files.map((f) => ({ fileName: f.fileName, content: f.content }))).toMatchSnapshot();
  });
});

describe("cli generator golden output", () => {
  it.each([...RULE_PLATFORM_IDS, "agents"])("%s", (platform) => {
    expect(generateConfig({ ...cliOptions, platforms: [platform] })).toMatchSnapshot();
  });

  it.each(["cursor", "claude"])("%s with the Cloud Sync header", (platform) => {
    const files = generateConfig({
      ...cliOptions,
      platforms: [platform],
      enableAutoUpdate: true,
      blueprintId: "golden",
      preferCliSync: false,
    });
    expect(files).toMatchSnapshot();
  });
});
