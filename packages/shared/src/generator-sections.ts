/**
 * Lines for wizard answers that the Markdown and MDC generators in
 * generator.ts share: AGENTS.md (and the files built from it) and the
 * Cursor rules (and the files built from those). Each helper returns Markdown
 * bullet lines, or an empty list when the user gave no answer.
 */

export interface SectionConfig {
  packageManager?: string;
  jsRuntime?: string;
  monorepoTool?: string;
  orm?: string;
  commands?: { typecheck?: string; format?: string; preCommit?: string; clean?: string };
  codeStyle?: { maxFileLength?: number; importOrder?: string; commentLanguage?: string; docStyle?: string };
  testingStrategy?: { tddPreference?: boolean; snapshotTesting?: boolean; mockStrategy?: string };
  branchStrategy?: string;
  defaultBranch?: string;
  allowDirectCommits?: boolean;
  commitSigning?: boolean;
  versionTagFormat?: string;
  changelogTool?: string;
  buildContainer?: boolean;
  dockerImageNames?: string;
  planModeFrequency?: string;
  explanationVerbosity?: string;
  accessibilityFocus?: boolean;
  performanceFocus?: boolean;
  mcpServers?: string;
  serverAccess?: boolean;
  sshKeyPath?: string;
  manualDeployment?: boolean;
  deploymentMethod?: string;
}

const label = (labels: Record<string, string>, value: string) => labels[value] || value;

const PACKAGE_MANAGERS: Record<string, string> = { npm: "npm", yarn: "Yarn", pnpm: "pnpm", bun: "Bun" };
const JS_RUNTIMES: Record<string, string> = { node: "Node.js", deno: "Deno", bun: "Bun" };
const MONOREPO_TOOLS: Record<string, string> = {
  turborepo: "Turborepo",
  nx: "Nx",
  lerna: "Lerna",
  pnpm_workspaces: "pnpm Workspaces",
};

/** Package manager, runtime, monorepo tool and ORM, for the Technology Stack section. */
export function toolingLines(config: SectionConfig): string[] {
  const lines: string[] = [];
  if (config.packageManager) lines.push(`- **Package manager**: ${label(PACKAGE_MANAGERS, config.packageManager)}. Use it for every install and script.`);
  if (config.jsRuntime) lines.push(`- **Runtime**: ${label(JS_RUNTIMES, config.jsRuntime)}`);
  if (config.monorepoTool) lines.push(`- **Monorepo tool**: ${label(MONOREPO_TOOLS, config.monorepoTool)}`);
  if (config.orm) lines.push(`- **ORM / database toolkit**: ${config.orm}`);
  return lines;
}

/** Type check, format, pre-commit and clean commands, for the Commands section. */
export function extraCommandLines(config: SectionConfig): string[] {
  const commands = config.commands || {};
  const lines: string[] = [];
  if (commands.typecheck) lines.push(`- **Type check**: \`${commands.typecheck}\``);
  if (commands.format) lines.push(`- **Format**: \`${commands.format}\``);
  if (commands.preCommit) lines.push(`- **Pre-commit hooks**: \`${commands.preCommit}\``);
  if (commands.clean) lines.push(`- **Clean**: \`${commands.clean}\``);
  return lines;
}

const IMPORT_ORDERS: Record<string, string> = {
  grouped: "group imports: external packages, then internal modules, then relative paths",
  sorted: "sort imports alphabetically",
  natural: "leave imports in the order they are written",
};
const DOC_STYLES: Record<string, string> = {
  jsdoc: "JSDoc",
  tsdoc: "TSDoc",
  pydoc: "Python docstrings",
  godoc: "Go doc comments",
  rustdoc: "Rust doc comments (///)",
  javadoc: "Javadoc",
  xmldoc: "C# XML doc comments",
};
// The wizard's file length slider starts here; only a changed value is written.
const DEFAULT_MAX_FILE_LENGTH = 300;

/** File length, import order, comment language and doc style, for the Code Style section. */
export function extraCodeStyleLines(config: SectionConfig): string[] {
  const style = config.codeStyle || {};
  const lines: string[] = [];
  if (style.maxFileLength && style.maxFileLength !== DEFAULT_MAX_FILE_LENGTH) {
    lines.push(`- **File length**: keep files under ${style.maxFileLength} lines; split larger ones`);
  }
  if (style.importOrder) lines.push(`- **Imports**: ${label(IMPORT_ORDERS, style.importOrder)}`);
  if (style.commentLanguage) lines.push(`- **Comment language**: write code comments in ${style.commentLanguage.replace(/_/g, " ")}`);
  if (style.docStyle) lines.push(`- **Documentation comments**: ${label(DOC_STYLES, style.docStyle)}`);
  return lines;
}

const MOCK_STRATEGIES: Record<string, string> = {
  minimal: "mock only external dependencies",
  comprehensive: "mock collaborators so each unit is tested in isolation",
  none: "avoid mocks; test against real implementations",
};

/** True when the user asked for TDD, snapshot tests or a non-default mock strategy. */
export function hasExtraTesting(config: SectionConfig): boolean {
  const testing = config.testingStrategy || {};
  return Boolean(testing.tddPreference || testing.snapshotTesting || (testing.mockStrategy && testing.mockStrategy !== "minimal"));
}

/** TDD, snapshot tests and mock strategy, for the Testing section. */
export function extraTestingLines(config: SectionConfig): string[] {
  const testing = config.testingStrategy || {};
  const lines: string[] = [];
  if (testing.tddPreference) lines.push("- **Test-driven development**: write a failing test first, then the code that makes it pass");
  if (testing.snapshotTesting) lines.push("- **Snapshot tests**: use snapshot tests for stable output such as rendered components");
  if (testing.mockStrategy) lines.push(`- **Mocking**: ${label(MOCK_STRATEGIES, testing.mockStrategy)}`);
  return lines;
}

const BRANCH_STRATEGIES: Record<string, string> = {
  none: "no branches: commit directly to the default branch",
  github_flow: "GitHub Flow: short-lived feature branches merged into the default branch through pull requests",
  gitflow: "Gitflow: develop, feature, release and hotfix branches",
  trunk_based: "trunk-based: very short-lived branches merged into the trunk often",
  gitlab_flow: "GitLab Flow: feature branches plus environment branches (staging, production)",
  release_flow: "Release Flow: topic branches into the default branch, plus release branches",
};
const VERSION_TAG_FORMATS: Record<string, string> = {
  v_prefix: "`v1.2.3`",
  no_prefix: "`1.2.3`",
  package_prefix: "`@package/v1.2.3`",
  date_based: "date-based, such as `2024.01.15`",
  custom: "the project's own format",
};
const CHANGELOG_TOOLS: Record<string, string> = {
  manual: "written by hand",
  conventional_changelog: "generated from commits with Conventional Changelog",
  release_please: "managed by Release Please",
  semantic_release: "managed by semantic-release",
  changesets: "managed with Changesets",
  github_releases: "kept in GitHub Releases",
  keep_a_changelog: "kept in the Keep a Changelog format",
  other: "kept with the project's own tooling",
};

/** Branching, commit and release rules, for a Git Workflow section. */
export function gitWorkflowLines(config: SectionConfig): string[] {
  const lines: string[] = [];
  const branch = config.defaultBranch || "main";
  if (config.branchStrategy) lines.push(`- **Branching**: ${label(BRANCH_STRATEGIES, config.branchStrategy)}`);
  if (config.defaultBranch) lines.push(`- **Default branch**: \`${branch}\``);
  if (config.branchStrategy !== "none") {
    lines.push(
      config.allowDirectCommits
        ? `- Direct commits to \`${branch}\` are fine for small fixes (typos, docs); everything else goes through a branch`
        : `- Never commit directly to \`${branch}\`; work on a branch and open a pull request`,
    );
  }
  if (config.commitSigning) lines.push("- Sign every commit (GPG or SSH)");
  if (config.versionTagFormat) lines.push(`- **Version tags**: ${label(VERSION_TAG_FORMATS, config.versionTagFormat)}`);
  if (config.changelogTool) lines.push(`- **Changelog**: ${label(CHANGELOG_TOOLS, config.changelogTool)}`);
  return lines;
}

/** Published image names, for the CI/CD section of a project that builds containers. */
export function dockerImageLines(config: SectionConfig): string[] {
  if (!config.buildContainer) return [];
  const images = (config.dockerImageNames || "").split(",").map((i) => i.trim()).filter(Boolean);
  if (images.length === 0) return [];
  return ["- **Published images**:", ...images.map((image) => `  - \`${image}\``)];
}

const PLAN_MODES: Record<string, string> = {
  always: "**Always plan first**: think through the approach before any change",
  complex_tasks: "**Plan first** for complex, multi-step or risky changes",
  multi_file: "**Plan first** when a change spans several files",
  new_features: "**Plan first** when building a new feature",
  on_request: "Plan only when asked to",
  never: "Skip planning and go straight to the implementation",
};
const VERBOSITY: Record<string, string> = {
  concise: "**Explanations**: concise, to the point",
  balanced: "**Explanations**: clear, with enough context to follow the reasoning",
  detailed: "**Explanations**: detailed, walking through the reasoning",
};

/** Planning, explanation length and focus areas, for the AI behaviour section. */
export function aiPreferenceLines(config: SectionConfig): string[] {
  const lines: string[] = [];
  if (config.planModeFrequency) lines.push(`- ${label(PLAN_MODES, config.planModeFrequency)}`);
  if (config.explanationVerbosity) lines.push(`- ${label(VERBOSITY, config.explanationVerbosity)}`);
  if (config.accessibilityFocus) lines.push("- **Accessibility**: follow WCAG; use semantic markup, labels, keyboard access and enough contrast");
  if (config.performanceFocus) lines.push("- **Performance**: keep an eye on load time, memory and needless work; measure before optimising");
  return lines;
}

/** The MCP servers the developer has, as a section under the given heading. */
export function mcpServerSection(config: SectionConfig, heading: string): string[] {
  const servers = (config.mcpServers || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (servers.length === 0) return [];
  return [
    heading,
    "",
    "The developer has these MCP (Model Context Protocol) servers available. Use them when relevant:",
    "",
    ...servers.map((server) => `- ${server}`),
    "",
  ];
}

const DEPLOYMENT_METHODS: Record<string, string> = {
  portainer: "Portainer (GitOps stacks)",
  docker_compose: "Docker Compose (manual)",
  kubernetes: "Kubernetes (kubectl apply)",
  bare_metal: "Bare metal (direct deployment)",
};

/** Server access and manual deployment, as a section under the given heading. */
export function infrastructureSection(config: SectionConfig, heading: string): string[] {
  if (!config.serverAccess && !config.manualDeployment) return [];
  const lines = [heading, ""];
  if (config.serverAccess) {
    const keyInfo = config.sshKeyPath ? `SSH key: \`${config.sshKeyPath}\`` : "SSH key in default location (~/.ssh/)";
    lines.push(`- **Server access**: via SSH. ${keyInfo}`);
  }
  if (config.manualDeployment) {
    lines.push(
      config.deploymentMethod
        ? `- **Deployment**: ${label(DEPLOYMENT_METHODS, config.deploymentMethod)}`
        : "- **Deployment**: manual, not through CI/CD",
    );
  }
  lines.push("");
  return lines;
}

export const AUTH_PROVIDER_LABELS: Record<string, string> = {
  email_password: "Email/Password", google: "Google", github: "GitHub", gitlab: "GitLab",
  microsoft: "Microsoft", apple: "Apple", facebook: "Facebook", twitter: "Twitter/X",
  linkedin: "LinkedIn", discord: "Discord", slack: "Slack", twitch: "Twitch", spotify: "Spotify",
  magic_link: "Magic Link", sms_otp: "SMS OTP", passkeys: "Passkeys/WebAuthn",
  saml_sso: "SAML SSO", oidc_generic: "Generic OIDC", ldap: "LDAP/AD",
};

export const COMPLIANCE_LABELS: Record<string, string> = {
  gdpr: "GDPR", ccpa: "CCPA", hipaa: "HIPAA", soc2: "SOC 2",
  pci_dss: "PCI-DSS", iso27001: "ISO 27001", fedramp: "FedRAMP",
};

export const ANALYTICS_LABELS: Record<string, string> = {
  google_analytics: "Google Analytics", plausible: "Plausible", posthog: "PostHog",
  mixpanel: "Mixpanel", amplitude: "Amplitude", segment: "Segment",
  umami: "Umami", matomo: "Matomo", none: "No Analytics (Privacy-first)",
};
