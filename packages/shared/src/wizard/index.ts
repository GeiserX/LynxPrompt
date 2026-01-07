// Types
export * from "./types.js";

// Tech Stack
export { LANGUAGES, LANGUAGE_IDS } from "./languages.js";
export { FRAMEWORKS, FRAMEWORK_IDS } from "./frameworks.js";
export { DATABASES, DATABASE_IDS, getDatabasesByCategory } from "./databases.js";
export { PACKAGE_MANAGERS, MONOREPO_TOOLS, JS_RUNTIMES, ORM_OPTIONS, getOrmsByLanguage } from "./tech-stack.js";

// Project
export { PROJECT_TYPES, ARCHITECTURE_PATTERNS, DEV_OS_OPTIONS } from "./project-types.js";

// Repository
export {
  REPO_HOSTS,
  CICD_OPTIONS,
  LICENSES,
  BRANCH_STRATEGIES,
  DEFAULT_BRANCHES,
  SELF_HOSTED_TARGETS,
  CLOUD_TARGETS,
  DEPLOYMENT_TARGETS,
  CONTAINER_REGISTRIES,
  VERSION_TAG_FORMATS,
  CHANGELOG_OPTIONS,
  VPN_OPTIONS,
  GITOPS_TOOLS,
} from "./repository.js";

// AI Behavior
export { AI_BEHAVIOR_RULES, IMPORTANT_FILES, PLAN_MODE_FREQUENCY } from "./ai-behavior.js";

// Security
export {
  AUTH_PROVIDERS,
  SECRETS_MANAGEMENT_OPTIONS,
  SECURITY_TOOLING_OPTIONS,
  AUTH_PATTERNS_OPTIONS,
  DATA_HANDLING_OPTIONS,
  COMPLIANCE_OPTIONS,
  ANALYTICS_OPTIONS,
} from "./security.js";

// Code Style
export {
  NAMING_CONVENTIONS,
  ERROR_HANDLING_PATTERNS,
  LOGGING_OPTIONS,
  BOUNDARY_OPTIONS,
} from "./code-style.js";

// Testing
export { TEST_LEVELS, TEST_FRAMEWORKS } from "./testing.js";

// Commands
export { COMMON_COMMANDS, getCommandsByCategory, COMMANDS_BY_CATEGORY } from "./commands.js";

