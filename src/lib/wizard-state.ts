/**
 * State of the web wizard (src/app/wizard/page.tsx): its shape, its defaults,
 * and the pure steps that move it in and out of the page (saved drafts, saved
 * preferences, repository detection, and the config handed to the generator).
 * Kept outside the page so each step can be tested on its own.
 */

/** Wizard steps in order. The page renders one screen per id, and the draft API accepts any index of this list. */
export const WIZARD_STEP_IDS = [
  "project",
  "tech",
  "repo",
  "security",
  "commands",
  "code_style",
  "ai",
  "boundaries",
  "testing",
  "static",
  "extra",
  "generate",
] as const;

export type WizardStepId = (typeof WIZARD_STEP_IDS)[number];

/** Index of the last step ("generate"). */
export const WIZARD_LAST_STEP = WIZARD_STEP_IDS.length - 1;

export type CommandsConfig = {
  build: string;
  test: string;
  lint: string;
  dev: string;
  format: string;
  typecheck: string;
  clean: string;
  preCommit: string; // husky, lefthook, etc
  additional: string[];
  savePreferences: boolean;
};

export type BoundariesConfig = {
  always: string[];
  ask: string[];
  never: string[];
  customAlways: string;
  customAsk: string;
  customNever: string;
  savePreferences: boolean;
};

export type CodeStyleConfig = {
  naming: string;
  errorHandling: string;
  errorHandlingOther: string;
  loggingConventions: string;
  loggingConventionsOther: string;
  maxFileLength: number; // max lines per file
  importOrder: string; // sorted, grouped, natural
  commentLanguage: string; // english, native, any
  docStyle: string; // jsdoc, tsdoc, pydoc, etc
  notes: string;
  savePreferences: boolean;
};

export type TestingStrategyConfig = {
  levels: string[];
  coverage: number;
  frameworks: string[];
  tddPreference: boolean; // Test-Driven Development
  snapshotTesting: boolean;
  mockStrategy: string; // minimal, comprehensive, none
  notes: string;
  savePreferences: boolean;
};

export type StaticFilesConfig = {
  funding: boolean;
  fundingYml: string;
  fundingSave: boolean;
  editorconfig: boolean;
  editorconfigCustom: string;
  editorconfigSave: boolean;
  contributing: boolean;
  contributingCustom: string;
  contributingSave: boolean;
  codeOfConduct: boolean;
  codeOfConductCustom: string;
  codeOfConductSave: boolean;
  security: boolean;
  securityCustom: string;
  securitySave: boolean;
  roadmap: boolean;
  roadmapCustom: string;
  roadmapSave: boolean;
  gitignoreMode: "generate" | "custom" | "skip";
  gitignoreCustom: string;
  gitignoreSave: boolean;
  dockerignoreMode: "generate" | "custom" | "skip";
  dockerignoreCustom: string;
  dockerignoreSave: boolean;
  licenseSave: boolean;
};

export type WizardConfig = {
  projectName: string;
  projectDescription: string;
  projectType: string;
  architecturePattern: string;
  architecturePatternOther: string;
  devOS: string[]; // windows, macos, linux - multi-select
  languages: string[];
  frameworks: string[];
  databases: string[]; // preferred databases (multi-select)
  packageManager: string; // npm, yarn, pnpm, bun (JS/TS only)
  monorepoTool: string; // turborepo, nx, lerna, pnpm-workspaces (JS/TS only)
  jsRuntime: string; // node, deno, bun (JS/TS only)
  orm: string; // prisma, drizzle, typeorm, sqlalchemy, etc.
  additionalLibraries: string; // comma-separated list of additional libs not in predefined lists (e.g., Telethon, APScheduler)
  letAiDecide: boolean;
  repoHost: string;
  repoHostOther: string;
  repoUrl: string;
  exampleRepoUrl: string;
  documentationUrl: string; // external docs (Confluence, Notion, etc.)
  isPublic: boolean;
  license: string;
  licenseOther: string;
  licenseNotes: string;
  licenseSave: boolean;
  repoHosts: string[];
  multiRepoReason: string;
  funding: boolean;
  fundingYml: string;
  conventionalCommits: boolean;
  semver: boolean;
  versionTagFormat: string;
  changelogTool: string;
  dependabot: boolean;
  branchStrategy: string; // gitflow, github_flow, trunk_based, gitlab_flow
  defaultBranch: string; // main, master, develop, trunk, other
  defaultBranchOther: string; // custom branch name when defaultBranch is "other"
  allowDirectCommits: boolean; // Allow direct commits for small fixes (typos, docs, etc.)
  commitSigning: boolean; // GPG/SSH signing
  useGitWorktrees: boolean; // Use git worktrees for parallel AI agent sessions
  cicd: string[]; // multi-select CI/CD platforms
  cicdOther: string; // custom CI/CD platform when "other" is selected
  deploymentEnvironment: string[]; // "self_hosted" | "cloud"
  selfHostedTargets: string[];
  cloudTargets: string[];
  buildContainer: boolean;
  containerRegistry: string;
  containerRegistryOther: string;
  dockerImageNames: string; // comma-separated list of published image names (e.g., "user/app, user/app-viewer")
  registryUsername: string;
  aiBehaviorRules: string[];
  planModeFrequency: string; // always, complex_tasks, multi_file, new_features, on_request, never
  explanationVerbosity: string; // concise, balanced, detailed
  accessibilityFocus: boolean;
  performanceFocus: boolean;
  mcpServers: string; // Comma-separated list of MCP servers (e.g., "filesystem, github, postgres")
  attemptWorkarounds: boolean; // Whether AI should attempt workarounds when stuck
  serverAccess: boolean; // Whether project requires server login
  sshKeyPath: string; // Custom SSH key path (empty = default)
  manualDeployment: boolean; // Whether deployment is manual (no CI/CD)
  deploymentMethod: string; // portainer, docker_compose, kubernetes, bare_metal
  importantFiles: string[];
  importantFilesOther: string;
  enableAutoUpdate: boolean;
  includePersonalData: boolean;
  platform: string;
  blueprintMode: boolean; // Generate with [[VARIABLE|default]] for blueprint templates
  enableApiSync: boolean; // Auto-save as private template with API sync instructions
  preferCliSync: boolean; // Sign in with lynxp login instead of a token from an env var (default true)
  tokenEnvVar: string; // Environment variable name for API token
  additionalFeedback: string;
  commands: CommandsConfig;
  codeStyle: CodeStyleConfig;
  boundaries: BoundariesConfig;
  testing: TestingStrategyConfig;
  staticFiles: StaticFilesConfig;
  security: SecurityConfig;
};

export type SecurityConfig = {
  authProviders: string[];
  authProvidersOther: string;
  secretsManagement: string[];
  secretsManagementOther: string;
  securityTooling: string[];
  securityToolingOther: string;
  authPatterns: string[];
  authPatternsOther: string;
  dataHandling: string[];
  dataHandlingOther: string;
  compliance: string[];
  complianceOther: string;
  analytics: string[];
  analyticsOther: string;
  additionalNotes: string;
};

export function createDefaultWizardConfig(): WizardConfig {
  return {
    projectName: "",
    projectDescription: "",
    projectType: "leisure",
    architecturePattern: "",
    architecturePatternOther: "",
    devOS: ["linux"],
    languages: [],
    frameworks: [],
    databases: [],
    packageManager: "",
    monorepoTool: "",
    jsRuntime: "",
    orm: "",
    additionalLibraries: "",
    letAiDecide: false,
    repoHost: "github",
    repoHostOther: "",
    repoUrl: "",
    exampleRepoUrl: "",
    documentationUrl: "",
    isPublic: true,
    license: "mit",
    licenseOther: "",
    licenseNotes: "",
    licenseSave: false,
    repoHosts: [],
    multiRepoReason: "",
    funding: false,
    fundingYml: "",
    conventionalCommits: true,
    semver: true,
    versionTagFormat: "v_prefix",
    changelogTool: "manual",
    dependabot: true,
    branchStrategy: "github_flow",
    defaultBranch: "main",
    defaultBranchOther: "",
    allowDirectCommits: false,
    commitSigning: false,
    useGitWorktrees: true, // Default to yes for parallel AI sessions
    cicd: [],
    cicdOther: "",
    deploymentEnvironment: [],
    selfHostedTargets: [],
    cloudTargets: [],
    buildContainer: false,
    containerRegistry: "",
    containerRegistryOther: "",
    dockerImageNames: "",
    registryUsername: "",
    aiBehaviorRules: ["always_debug_after_build", "check_logs_after_build", "run_tests_before_commit", "follow_existing_patterns", "ask_before_large_refactors", "verify_work"],
    planModeFrequency: "complex_tasks",
    explanationVerbosity: "balanced",
    accessibilityFocus: false,
    performanceFocus: false,
    mcpServers: "",
    attemptWorkarounds: true,
    serverAccess: false,
    sshKeyPath: "",
    manualDeployment: false,
    deploymentMethod: "",
    importantFiles: [],
    importantFilesOther: "",
    enableAutoUpdate: false,
    includePersonalData: true,
    platform: "universal",
    blueprintMode: false,
    enableApiSync: false,
    preferCliSync: true, // Default to CLI (recommended, no token in file)
    tokenEnvVar: "LYNXPROMPT_API_TOKEN",
    additionalFeedback: "",
    commands: { build: "", test: "", lint: "", dev: "", format: "", typecheck: "", clean: "", preCommit: "", additional: [], savePreferences: false },
    codeStyle: { naming: "language_default", errorHandling: "", errorHandlingOther: "", loggingConventions: "", loggingConventionsOther: "", maxFileLength: 300, importOrder: "", commentLanguage: "", docStyle: "", notes: "", savePreferences: false },
    boundaries: { always: [], ask: [], never: [], customAlways: "", customAsk: "", customNever: "", savePreferences: false },
    testing: { levels: [], coverage: 80, frameworks: [], tddPreference: false, snapshotTesting: false, mockStrategy: "minimal", notes: "", savePreferences: false },
    staticFiles: {
      funding: false,
      fundingYml: "",
      fundingSave: false,
      editorconfig: false,
      editorconfigCustom: "",
      editorconfigSave: false,
      contributing: false,
      contributingCustom: "",
      contributingSave: false,
      codeOfConduct: false,
      codeOfConductCustom: "",
      codeOfConductSave: false,
      security: false,
      securityCustom: "",
      securitySave: false,
      roadmap: true,
      roadmapCustom: "",
      roadmapSave: false,
      gitignoreMode: "skip",
      gitignoreCustom: "",
      gitignoreSave: false,
      dockerignoreMode: "skip",
      dockerignoreCustom: "",
      dockerignoreSave: false,
      licenseSave: false,
    },
    security: {
      authProviders: [],
      authProvidersOther: "",
      secretsManagement: ["env_vars"],  // Default to environment variables
      secretsManagementOther: "",
      securityTooling: ["dependabot", "renovate"],  // Default recommended tools
      securityToolingOther: "",
      authPatterns: [],
      authPatternsOther: "",
      dataHandling: ["encryption_at_rest", "encryption_in_transit"],  // Default recommended
      dataHandlingOther: "",
      compliance: [],
      complianceOther: "",
      analytics: [],
      analyticsOther: "",
      additionalNotes: "",
    },
  };
}

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Lay `saved` over `defaults` key by key. Values whose kind does not match the
// default (a missing object, null, a string where a list belongs) fall back to
// the default, so the page never reads a field that is not there.
function mergeOver(defaults: PlainObject, saved: PlainObject): PlainObject {
  const merged: PlainObject = { ...defaults };
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined || value === null) continue;
    const fallback = defaults[key];
    if (fallback === undefined) {
      merged[key] = value;
    } else if (isPlainObject(fallback)) {
      if (isPlainObject(value)) merged[key] = mergeOver(fallback, value);
    } else if (Array.isArray(fallback)) {
      if (Array.isArray(value)) merged[key] = value;
      else if (typeof value === "string" && value) merged[key] = [value];
    } else if (typeof value === typeof fallback) {
      merged[key] = value;
    }
  }
  return merged;
}

/**
 * Turn a stored config (a draft, or the guest state kept across sign-in) into
 * a complete WizardConfig. Drafts saved by older versions lack fields added
 * since, and the page reads those fields directly.
 */
export function mergeWizardConfig(saved: unknown): WizardConfig {
  const defaults = createDefaultWizardConfig();
  if (!isPlainObject(saved)) return defaults;
  return mergeOver(defaults as unknown as PlainObject, saved) as unknown as WizardConfig;
}

// Split a comma-separated free-text answer into its items.
function commaItems(value: string | undefined): string[] {
  return (value || "").split(",").map((item) => item.trim()).filter(Boolean);
}

// Swap the "other" choice of a multi-select for the text the user typed in
// its box, or drop it when the box is empty.
function withOther(items: string[] | undefined, other: string | undefined): string[] {
  return (items || []).flatMap((item) => (item === "other" ? commaItems(other) : [item]));
}

/** The config the file generator reads, built from the wizard state. */
export function buildGeneratorConfig(config: WizardConfig) {
  const environments = config.deploymentEnvironment || [];
  const security = config.security;
  return {
    // Project basics
    projectName: config.projectName,
    projectDescription: config.projectDescription,
    projectType: config.projectType,
    architecturePattern: config.architecturePattern,
    architecturePatternOther: config.architecturePatternOther,
    devOS: config.devOS,

    // Tech stack
    languages: config.languages,
    // Libraries typed by hand are listed with the picked frameworks
    frameworks: [...config.frameworks, ...commaItems(config.additionalLibraries)],
    databases: config.databases,
    letAiDecide: config.letAiDecide,
    packageManager: config.packageManager,
    jsRuntime: config.jsRuntime,
    monorepoTool: config.monorepoTool,
    orm: config.orm,

    // Repository
    repoHost: config.repoHost,
    repoHostOther: config.repoHostOther,
    repoHosts: config.repoHosts,
    multiRepoReason: config.multiRepoReason,
    repoUrl: config.repoUrl,
    exampleRepoUrl: config.exampleRepoUrl,
    documentationUrl: config.documentationUrl,
    isPublic: config.isPublic,

    // License
    license: config.license,
    licenseOther: config.licenseOther,
    licenseNotes: config.licenseNotes,

    // Git workflow
    conventionalCommits: config.conventionalCommits,
    semver: config.semver,
    dependabot: config.dependabot,
    allowDirectCommits: config.allowDirectCommits,
    useGitWorktrees: config.useGitWorktrees,
    branchStrategy: config.branchStrategy,
    defaultBranch: config.defaultBranch === "other" ? config.defaultBranchOther.trim() : config.defaultBranch,
    commitSigning: config.commitSigning,
    versionTagFormat: config.versionTagFormat,
    changelogTool: config.changelogTool,

    // CI/CD & Deployment. The target lists stay filled when the user unticks
    // their environment, so only the ticked environments count.
    cicd: withOther(config.cicd, config.cicdOther),
    deploymentTarget: [
      ...(environments.includes("self_hosted") ? config.selfHostedTargets : []),
      ...(environments.includes("cloud") ? config.cloudTargets : []),
    ],
    deploymentEnvironment: config.deploymentEnvironment,
    buildContainer: config.buildContainer,
    containerRegistry: config.containerRegistry,
    customRegistry: config.containerRegistryOther,
    dockerImageNames: config.dockerImageNames,

    // Funding
    funding: config.funding,
    fundingYml: config.fundingYml,

    // Security step, with each "other" choice replaced by what the user typed
    security: {
      ...security,
      authProviders: withOther(security.authProviders, security.authProvidersOther),
      secretsManagement: withOther(security.secretsManagement, security.secretsManagementOther),
      securityTooling: withOther(security.securityTooling, security.securityToolingOther),
      authPatterns: withOther(security.authPatterns, security.authPatternsOther),
      dataHandling: withOther(security.dataHandling, security.dataHandlingOther),
      compliance: withOther(security.compliance, security.complianceOther),
      analytics: withOther(security.analytics, security.analyticsOther),
    },

    // AI behavior
    aiBehaviorRules: config.aiBehaviorRules,
    planModeFrequency: config.planModeFrequency,
    explanationVerbosity: config.explanationVerbosity,
    accessibilityFocus: config.accessibilityFocus,
    performanceFocus: config.performanceFocus,
    mcpServers: config.mcpServers,
    attemptWorkarounds: config.attemptWorkarounds,
    serverAccess: config.serverAccess,
    sshKeyPath: config.sshKeyPath,
    manualDeployment: config.manualDeployment,
    deploymentMethod: config.deploymentMethod,
    importantFiles: config.importantFiles,
    importantFilesOther: config.importantFilesOther,
    enableAutoUpdate: config.enableAutoUpdate || config.enableApiSync,
    preferCliSync: config.preferCliSync,
    tokenEnvVar: config.tokenEnvVar,
    includePersonalData: config.includePersonalData,

    // Platform & output
    platform: config.platform,
    platforms: [config.platform],
    blueprintMode: config.blueprintMode,
    additionalFeedback: config.additionalFeedback,

    // Commands
    commands: config.commands,

    // Code style. "Other" logging conventions are the text the user typed.
    codeStyle: {
      ...config.codeStyle,
      loggingConventions:
        config.codeStyle.loggingConventions === "other"
          ? config.codeStyle.loggingConventionsOther.trim()
          : config.codeStyle.loggingConventions,
    },

    // Boundaries, with the comma-separated custom entries of each list
    boundaries: {
      always: [...config.boundaries.always, ...commaItems(config.boundaries.customAlways)],
      ask: [...config.boundaries.ask, ...commaItems(config.boundaries.customAsk)],
      never: [...config.boundaries.never, ...commaItems(config.boundaries.customNever)],
    },

    // Testing strategy
    testingStrategy: {
      levels: config.testing.levels,
      coverage: config.testing.coverage,
      frameworks: config.testing.frameworks,
      notes: config.testing.notes,
      tddPreference: config.testing.tddPreference,
      snapshotTesting: config.testing.snapshotTesting,
      mockStrategy: config.testing.mockStrategy,
    },

    // Static files
    staticFiles: {
      funding: config.funding || config.staticFiles.funding,
      fundingYml: config.staticFiles.fundingYml || config.fundingYml,
      editorconfig: config.staticFiles.editorconfig,
      editorconfigCustom: config.staticFiles.editorconfigCustom,
      contributing: config.staticFiles.contributing,
      contributingCustom: config.staticFiles.contributingCustom,
      codeOfConduct: config.staticFiles.codeOfConduct,
      codeOfConductCustom: config.staticFiles.codeOfConductCustom,
      security: config.staticFiles.security,
      securityCustom: config.staticFiles.securityCustom,
      roadmap: config.staticFiles.roadmap,
      roadmapCustom: config.staticFiles.roadmapCustom,
      gitignoreMode: config.staticFiles.gitignoreMode,
      gitignoreCustom: config.staticFiles.gitignoreCustom,
      dockerignoreMode: config.buildContainer ? (config.staticFiles.dockerignoreMode === "skip" ? "generate" : config.staticFiles.dockerignoreMode) : config.staticFiles.dockerignoreMode,
      dockerignoreCustom: config.staticFiles.dockerignoreCustom,
      license: config.license,
    },
  };
}

export type WizardPreference = { category: string; key: string; value: string; isDefault?: boolean };

/** Preferences to store for the "save as my default" boxes the user ticked. */
export function buildPreferencesPayload(config: WizardConfig): WizardPreference[] {
  const payload: WizardPreference[] = [];
  if (config.commands.savePreferences) {
    payload.push(
      { category: "commands", key: "build", value: config.commands.build },
      { category: "commands", key: "test", value: config.commands.test },
      { category: "commands", key: "lint", value: config.commands.lint },
      { category: "commands", key: "dev", value: config.commands.dev },
    );
  }
  if (config.staticFiles.licenseSave) {
    payload.push(
      { category: "repo", key: "license", value: config.license, isDefault: true },
      { category: "repo", key: "host", value: config.repoHost },
      { category: "repo", key: "isPublic", value: String(config.isPublic) },
    );
  }
  if (config.codeStyle.savePreferences) {
    payload.push(
      { category: "codeStyle", key: "naming", value: config.codeStyle.naming },
      { category: "codeStyle", key: "notes", value: config.codeStyle.notes },
    );
  }
  if (config.testing.savePreferences) {
    payload.push(
      { category: "testing", key: "levels", value: config.testing.levels.join(",") },
      { category: "testing", key: "coverage", value: String(config.testing.coverage) },
      { category: "testing", key: "frameworks", value: config.testing.frameworks.join(",") },
      { category: "testing", key: "notes", value: config.testing.notes },
    );
  }
  // Save each static file individually based on its save flag
  if (config.staticFiles.editorconfigSave) {
    payload.push(
      { category: "static", key: "editorconfig", value: String(config.staticFiles.editorconfig) },
      { category: "static", key: "editorconfigCustom", value: config.staticFiles.editorconfigCustom || "" },
    );
  }
  if (config.staticFiles.contributingSave) {
    payload.push(
      { category: "static", key: "contributing", value: String(config.staticFiles.contributing) },
      { category: "static", key: "contributingCustom", value: config.staticFiles.contributingCustom || "" },
    );
  }
  if (config.staticFiles.codeOfConductSave) {
    payload.push(
      { category: "static", key: "codeOfConduct", value: String(config.staticFiles.codeOfConduct) },
      { category: "static", key: "codeOfConductCustom", value: config.staticFiles.codeOfConductCustom || "" },
    );
  }
  if (config.staticFiles.securitySave) {
    payload.push(
      { category: "static", key: "security", value: String(config.staticFiles.security) },
      { category: "static", key: "securityCustom", value: config.staticFiles.securityCustom || "" },
    );
  }
  if (config.staticFiles.gitignoreSave) {
    payload.push(
      { category: "static", key: "gitignoreMode", value: config.staticFiles.gitignoreMode },
      { category: "static", key: "gitignoreCustom", value: config.staticFiles.gitignoreCustom || "" },
    );
  }
  if (config.staticFiles.dockerignoreSave) {
    payload.push(
      { category: "static", key: "dockerignoreMode", value: config.staticFiles.dockerignoreMode },
      { category: "static", key: "dockerignoreCustom", value: config.staticFiles.dockerignoreCustom || "" },
    );
  }
  if (config.boundaries.savePreferences) {
    payload.push(
      { category: "boundaries", key: "always", value: config.boundaries.always.join(",") },
      { category: "boundaries", key: "ask", value: config.boundaries.ask.join(",") },
      { category: "boundaries", key: "never", value: config.boundaries.never.join(",") },
      { category: "boundaries", key: "customAlways", value: config.boundaries.customAlways },
      { category: "boundaries", key: "customAsk", value: config.boundaries.customAsk },
      { category: "boundaries", key: "customNever", value: config.boundaries.customNever },
    );
  }
  if (config.staticFiles.roadmapSave) {
    payload.push(
      { category: "static", key: "roadmap", value: String(config.staticFiles.roadmap) },
      { category: "static", key: "roadmapCustom", value: config.staticFiles.roadmapCustom || "" },
    );
  }
  if (config.staticFiles.fundingSave) {
    // Only save the FUNDING.yml content, no separate boolean flag needed
    payload.push(
      { category: "static", key: "FUNDING.yml", value: config.staticFiles.fundingYml || config.fundingYml || "" },
    );
  }
  if (config.staticFiles.licenseSave) {
    // Save license to general category (appears in General section of wizard preferences)
    payload.push(
      { category: "general", key: "license", value: config.license, isDefault: true },
    );
  }
  return payload;
}

function splitList(value: unknown, fallback: string[]): string[] {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "string") return value.split(",").filter(Boolean);
  return Array.isArray(value) ? value : fallback;
}

/**
 * Lay the user's saved preferences (the /api/user/wizard-preferences response)
 * over the current wizard config.
 */
export function applyPreferences(prev: WizardConfig, data: unknown): WizardConfig {
  // API returns an object grouped by category/key. Flatten it for easy use.
  const prefsArray: Array<{ category: string; key: string; value: any }> = [];
  if (Array.isArray(data)) {
    data.forEach((pref: any) => prefsArray.push(pref));
  } else if (data && typeof data === "object") {
    Object.entries(data).forEach(([category, entries]) => {
      if (entries && typeof entries === "object") {
        Object.entries(entries as Record<string, any>).forEach(([key, val]) => {
          prefsArray.push({
            category,
            key,
            value: (val as any)?.value ?? (val as any),
          });
        });
      }
    });
  }

  const byCategory: Record<string, Record<string, any>> = {};
  prefsArray.forEach((pref: any) => {
    if (!byCategory[pref.category]) byCategory[pref.category] = {};
    byCategory[pref.category][pref.key] = pref.value;
  });
  return {
    ...prev,
    commands: {
      ...prev.commands,
      build: byCategory.commands?.build ?? prev.commands.build,
      test: byCategory.commands?.test ?? prev.commands.test,
      lint: byCategory.commands?.lint ?? prev.commands.lint,
      dev: byCategory.commands?.dev ?? prev.commands.dev,
    },
    codeStyle: {
      ...prev.codeStyle,
      naming: byCategory.codeStyle?.naming ?? prev.codeStyle.naming,
      notes: byCategory.codeStyle?.notes ?? prev.codeStyle.notes,
    },
    boundaries: {
      ...prev.boundaries,
      always: splitList(byCategory.boundaries?.always, prev.boundaries.always),
      ask: splitList(byCategory.boundaries?.ask, prev.boundaries.ask),
      never: splitList(byCategory.boundaries?.never, prev.boundaries.never),
      customAlways: byCategory.boundaries?.customAlways ?? prev.boundaries.customAlways,
      customAsk: byCategory.boundaries?.customAsk ?? prev.boundaries.customAsk,
      customNever: byCategory.boundaries?.customNever ?? prev.boundaries.customNever,
    },
    testing: {
      ...prev.testing,
      levels: byCategory.testing?.levels 
        ? (typeof byCategory.testing.levels === 'string' 
            ? byCategory.testing.levels.split(',').filter(Boolean) 
            : byCategory.testing.levels)
        : prev.testing.levels,
      coverage: byCategory.testing?.coverage 
        ? (typeof byCategory.testing.coverage === 'string' 
            ? parseInt(byCategory.testing.coverage, 10) 
            : byCategory.testing.coverage)
        : prev.testing.coverage,
      frameworks: byCategory.testing?.frameworks 
        ? (typeof byCategory.testing.frameworks === 'string' 
            ? byCategory.testing.frameworks.split(',').filter(Boolean) 
            : byCategory.testing.frameworks)
        : prev.testing.frameworks,
      notes: byCategory.testing?.notes ?? prev.testing.notes,
    },
    staticFiles: {
      ...prev.staticFiles,
      // Support both new key "FUNDING.yml" and legacy "fundingYml"
      funding: (byCategory.static?.["FUNDING.yml"] || byCategory.static?.fundingYml) ? true : prev.staticFiles.funding,
      fundingYml: byCategory.static?.["FUNDING.yml"] ?? byCategory.static?.fundingYml ?? prev.staticFiles.fundingYml,
      fundingSave: (byCategory.static?.["FUNDING.yml"] || byCategory.static?.fundingYml) ? true : prev.staticFiles.fundingSave,
      editorconfig: byCategory.static?.editorconfig !== undefined
        ? (typeof byCategory.static.editorconfig === 'string' 
            ? byCategory.static.editorconfig === 'true' 
            : Boolean(byCategory.static.editorconfig))
        : prev.staticFiles.editorconfig,
      editorconfigCustom: byCategory.static?.editorconfigCustom ?? prev.staticFiles.editorconfigCustom,
      editorconfigSave: byCategory.static?.editorconfigCustom ? true : prev.staticFiles.editorconfigSave,
      contributing: byCategory.static?.contributing !== undefined
        ? (typeof byCategory.static.contributing === 'string' 
            ? byCategory.static.contributing === 'true' 
            : Boolean(byCategory.static.contributing))
        : prev.staticFiles.contributing,
      contributingCustom: byCategory.static?.contributingCustom ?? prev.staticFiles.contributingCustom,
      contributingSave: byCategory.static?.contributingCustom ? true : prev.staticFiles.contributingSave,
      codeOfConduct: byCategory.static?.codeOfConduct !== undefined
        ? (typeof byCategory.static.codeOfConduct === 'string' 
            ? byCategory.static.codeOfConduct === 'true' 
            : Boolean(byCategory.static.codeOfConduct))
        : prev.staticFiles.codeOfConduct,
      codeOfConductCustom: byCategory.static?.codeOfConductCustom ?? prev.staticFiles.codeOfConductCustom,
      codeOfConductSave: byCategory.static?.codeOfConductCustom ? true : prev.staticFiles.codeOfConductSave,
      security: byCategory.static?.security !== undefined
        ? (typeof byCategory.static.security === 'string' 
            ? byCategory.static.security === 'true' 
            : Boolean(byCategory.static.security))
        : prev.staticFiles.security,
      securityCustom: byCategory.static?.securityCustom ?? prev.staticFiles.securityCustom,
      securitySave: byCategory.static?.securityCustom ? true : prev.staticFiles.securitySave,
      roadmap: byCategory.static?.roadmap !== undefined
        ? (typeof byCategory.static.roadmap === 'string'
            ? byCategory.static.roadmap === 'true'
            : Boolean(byCategory.static.roadmap))
        : prev.staticFiles.roadmap,
      roadmapCustom: byCategory.static?.roadmapCustom ?? prev.staticFiles.roadmapCustom,
      roadmapSave: byCategory.static?.roadmapCustom ? true : prev.staticFiles.roadmapSave,
      gitignoreMode: byCategory.static?.gitignoreMode ?? prev.staticFiles.gitignoreMode,
      gitignoreCustom: byCategory.static?.gitignoreCustom ?? prev.staticFiles.gitignoreCustom,
      gitignoreSave: byCategory.static?.gitignoreCustom ? true : prev.staticFiles.gitignoreSave,
      dockerignoreMode: byCategory.static?.dockerignoreMode ?? prev.staticFiles.dockerignoreMode,
      dockerignoreCustom: byCategory.static?.dockerignoreCustom ?? prev.staticFiles.dockerignoreCustom,
      dockerignoreSave: byCategory.static?.dockerignoreCustom ? true : prev.staticFiles.dockerignoreSave,
      // licenseSave is now determined by whether license is in general
      licenseSave: byCategory.general?.license ? true : prev.staticFiles.licenseSave,
    },
    // Load license from general (new) or repo (legacy)
    license: byCategory.general?.license ?? byCategory.repo?.license ?? prev.license,
    repoHost: byCategory.repo?.host ?? prev.repoHost,
    isPublic: byCategory.repo?.isPublic !== undefined
      ? (typeof byCategory.repo.isPublic === 'string' 
          ? byCategory.repo.isPublic === 'true' 
          : Boolean(byCategory.repo.isPublic))
      : prev.isPublic,
  };
}

/** What /api/wizard/detect-repo returns for a repository. */
export type DetectedRepo = {
  name: string | null;
  description: string | null;
  stack: string[];
  databases: string[];
  commands: { build?: string; test?: string; lint?: string; dev?: string };
  license: string | null;
  repoHost: string;
  cicd: string | null;
  hasDocker: boolean;
  containerRegistry: string | null;
  testFramework: string | null;
  existingFiles: string[];
  isOpenSource: boolean;
  projectType: string | null;
};

const DETECTABLE_LANGUAGES = ["javascript", "typescript", "python", "go", "rust", "java", "csharp", "ruby", "php", "swift", "kotlin", "cpp"];
const DETECTABLE_FRAMEWORKS = ["nextjs", "react", "vue", "angular", "svelte", "express", "fastapi", "django", "flask", "nestjs", "nuxt", "remix", "astro", "hono", "fastify"];

/**
 * Fill the wizard from a detected repository. A field the detection found
 * nothing for keeps what the user already chose.
 */
export function applyDetectedRepo(
  prev: WizardConfig,
  detected: DetectedRepo,
  repoUrl: string,
): { config: WizardConfig; detectedFields: Set<string> } {
  const languages = detected.stack.filter((s) => DETECTABLE_LANGUAGES.includes(s));
  const frameworks = detected.stack.filter((s) => DETECTABLE_FRAMEWORKS.includes(s));

  const detectedFields = new Set<string>();
  if (detected.name) detectedFields.add("projectName");
  if (detected.description) detectedFields.add("projectDescription");
  if (languages.length > 0) detectedFields.add("languages");
  if (frameworks.length > 0) detectedFields.add("frameworks");
  if (detected.databases?.length > 0) detectedFields.add("databases");
  if (detected.license) detectedFields.add("license");
  if (detected.cicd) detectedFields.add("cicd");
  if (detected.isOpenSource) detectedFields.add("projectType");
  if (detected.hasDocker) detectedFields.add("buildContainer");
  if (detected.containerRegistry) detectedFields.add("containerRegistry");
  if (detected.repoHost) detectedFields.add("repoHost");

  return {
    detectedFields,
    config: {
      ...prev,
      projectName: detected.name || prev.projectName,
      projectDescription: detected.description || prev.projectDescription,
      languages: languages.length > 0 ? languages : prev.languages,
      frameworks: frameworks.length > 0 ? frameworks : prev.frameworks,
      databases: detected.databases?.length ? detected.databases : prev.databases,
      license: detected.license || prev.license,
      cicd: detected.cicd ? [detected.cicd] : prev.cicd,
      projectType: detected.isOpenSource ? "open_source" : prev.projectType,
      buildContainer: detected.hasDocker || prev.buildContainer,
      containerRegistry: detected.containerRegistry || prev.containerRegistry,
      repoHost: detected.repoHost || prev.repoHost,
      repoUrl: prev.repoUrl || repoUrl,
    },
  };
}
