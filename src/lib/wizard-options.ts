/**
 * Wizard Options - Imported from shared package
 * 
 * This file imports all wizard constants from @lynxprompt/shared
 * and transforms them for WebUI use.
 */

import {
  // Types
  type WizardOption,
  type LanguageOption,
  type FrameworkOption,
  type DatabaseOption,
  type OrmOption,
  type PackageManagerOption,
  type MonorepoToolOption,
  type JsRuntimeOption,
  type ProjectTypeOption,
  type ArchitectureOption,
  type DevOsOption,
  type RepoHostOption,
  type CiCdOption,
  type LicenseOption,
  type BranchStrategyOption,
  type DeploymentTargetOption,
  type ContainerRegistryOption,
  type AiBehaviorRuleOption,
  type ImportantFileOption,
  type SecurityOption,
  type NamingConventionOption,
  type ErrorHandlingOption,
  type LoggingOption,
  type BoundaryOption,
  type TestLevelOption,
  type CommandOption,
  // Constants
  LANGUAGES as SHARED_LANGUAGES,
  FRAMEWORKS as SHARED_FRAMEWORKS,
  DATABASES as SHARED_DATABASES,
  PACKAGE_MANAGERS as SHARED_PACKAGE_MANAGERS,
  MONOREPO_TOOLS as SHARED_MONOREPO_TOOLS,
  JS_RUNTIMES as SHARED_JS_RUNTIMES,
  ORM_OPTIONS as SHARED_ORM_OPTIONS,
  PROJECT_TYPES as SHARED_PROJECT_TYPES,
  ARCHITECTURE_PATTERNS as SHARED_ARCHITECTURE_PATTERNS,
  DEV_OS_OPTIONS as SHARED_DEV_OS_OPTIONS,
  REPO_HOSTS as SHARED_REPO_HOSTS,
  CICD_OPTIONS as SHARED_CICD_OPTIONS,
  LICENSES as SHARED_LICENSES,
  BRANCH_STRATEGIES as SHARED_BRANCH_STRATEGIES,
  DEFAULT_BRANCHES as SHARED_DEFAULT_BRANCHES,
  SELF_HOSTED_TARGETS as SHARED_SELF_HOSTED_TARGETS,
  CLOUD_TARGETS as SHARED_CLOUD_TARGETS,
  DEPLOYMENT_TARGETS as SHARED_DEPLOYMENT_TARGETS,
  CONTAINER_REGISTRIES as SHARED_CONTAINER_REGISTRIES,
  AI_BEHAVIOR_RULES as SHARED_AI_BEHAVIOR_RULES,
  IMPORTANT_FILES as SHARED_IMPORTANT_FILES,
  PLAN_MODE_FREQUENCY as SHARED_PLAN_MODE_FREQUENCY,
  AUTH_PROVIDERS as SHARED_AUTH_PROVIDERS,
  SECRETS_MANAGEMENT_OPTIONS as SHARED_SECRETS_MANAGEMENT_OPTIONS,
  SECURITY_TOOLING_OPTIONS as SHARED_SECURITY_TOOLING_OPTIONS,
  AUTH_PATTERNS_OPTIONS as SHARED_AUTH_PATTERNS_OPTIONS,
  DATA_HANDLING_OPTIONS as SHARED_DATA_HANDLING_OPTIONS,
  COMPLIANCE_OPTIONS as SHARED_COMPLIANCE_OPTIONS,
  ANALYTICS_OPTIONS as SHARED_ANALYTICS_OPTIONS,
  VERSION_TAG_FORMATS as SHARED_VERSION_TAG_FORMATS,
  CHANGELOG_OPTIONS as SHARED_CHANGELOG_OPTIONS,
  VPN_OPTIONS as SHARED_VPN_OPTIONS,
  GITOPS_TOOLS as SHARED_GITOPS_TOOLS,
  NAMING_CONVENTIONS as SHARED_NAMING_CONVENTIONS,
  ERROR_HANDLING_PATTERNS as SHARED_ERROR_HANDLING_PATTERNS,
  LOGGING_OPTIONS as SHARED_LOGGING_OPTIONS,
  BOUNDARY_OPTIONS as SHARED_BOUNDARY_OPTIONS,
  TEST_LEVELS as SHARED_TEST_LEVELS,
  TEST_FRAMEWORKS as SHARED_TEST_FRAMEWORKS,
  COMMON_COMMANDS as SHARED_COMMON_COMMANDS,
} from "../../packages/shared/src/wizard/index.js";

// Re-export types
export type {
  WizardOption,
  LanguageOption,
  FrameworkOption,
  DatabaseOption,
  OrmOption,
  PackageManagerOption,
  MonorepoToolOption,
  JsRuntimeOption,
  ProjectTypeOption,
  ArchitectureOption,
  DevOsOption,
  RepoHostOption,
  CiCdOption,
  LicenseOption,
  BranchStrategyOption,
  DeploymentTargetOption,
  ContainerRegistryOption,
  AiBehaviorRuleOption,
  ImportantFileOption,
  SecurityOption,
  NamingConventionOption,
  ErrorHandlingOption,
  LoggingOption,
  BoundaryOption,
  TestLevelOption,
  CommandOption,
};

// ============================================
// Transform to WebUI format: { value, label, icon }
// ============================================

function toWebFormat<T extends WizardOption>(options: T[]): Array<{ value: string; label: string; icon?: string }> {
  return options.map((o) => ({
    value: o.id,
    label: o.label,
    icon: o.icon,
  }));
}

// Tech Stack
export const LANGUAGES = toWebFormat(SHARED_LANGUAGES);
export const FRAMEWORKS = toWebFormat(SHARED_FRAMEWORKS);
export const DATABASES = toWebFormat(SHARED_DATABASES);
export const PACKAGE_MANAGERS = SHARED_PACKAGE_MANAGERS.map((o) => ({
  id: o.id,
  label: o.label,
  icon: o.icon,
  desc: o.description,
}));
export const MONOREPO_TOOLS = SHARED_MONOREPO_TOOLS.map((o) => ({
  id: o.id,
  label: o.label,
  icon: o.icon,
  desc: o.description,
}));
export const JS_RUNTIMES = SHARED_JS_RUNTIMES.map((o) => ({
  id: o.id,
  label: o.label,
  icon: o.icon,
  desc: o.description,
}));
export const ORM_OPTIONS = SHARED_ORM_OPTIONS.map((o) => ({
  id: o.id,
  label: o.label,
  icon: o.icon,
  lang: o.languages,
}));

// Project
export const PROJECT_TYPES = SHARED_PROJECT_TYPES.map((o) => ({
  id: o.id,
  label: o.label,
  icon: o.icon,
  description: o.description,
}));
export const ARCHITECTURE_PATTERNS = SHARED_ARCHITECTURE_PATTERNS.map((o) => ({
  id: o.id,
  label: o.label,
  description: o.description,
}));
export const DEV_OS_OPTIONS = SHARED_DEV_OS_OPTIONS.map((o) => ({
  id: o.id,
  label: o.label,
  icon: o.icon,
}));

// Repository
export const REPO_HOSTS = SHARED_REPO_HOSTS.map((o) => ({
  id: o.id,
  label: o.label,
  icon: o.icon,
}));
export const CICD_OPTIONS = SHARED_CICD_OPTIONS.map((o) => ({
  id: o.id,
  label: o.label,
  icon: o.icon,
}));
export const LICENSES = SHARED_LICENSES.map((o) => ({
  id: o.id,
  label: o.label,
  description: o.description,
}));
export const BRANCH_STRATEGIES = SHARED_BRANCH_STRATEGIES.map((o) => ({
  id: o.id,
  label: o.label,
  icon: o.icon,
  desc: o.description,
}));
export const DEFAULT_BRANCHES = SHARED_DEFAULT_BRANCHES.map((o) => ({
  id: o.id,
  label: o.label,
}));
export const SELF_HOSTED_TARGETS = SHARED_SELF_HOSTED_TARGETS.map((o) => ({
  id: o.id,
  label: o.label,
  icon: o.icon,
}));
export const CLOUD_TARGETS = SHARED_CLOUD_TARGETS.map((o) => ({
  id: o.id,
  label: o.label,
  icon: o.icon,
}));
export const DEPLOYMENT_TARGETS = [...SELF_HOSTED_TARGETS, ...CLOUD_TARGETS];
export const CONTAINER_REGISTRIES = SHARED_CONTAINER_REGISTRIES.map((o) => ({
  id: o.id,
  label: o.label,
  icon: o.icon,
}));

// AI Behavior
export const AI_BEHAVIOR_RULES = SHARED_AI_BEHAVIOR_RULES.map((o) => ({
  id: o.id,
  label: o.label,
  description: o.description,
  recommended: o.recommended,
}));
export const IMPORTANT_FILES = SHARED_IMPORTANT_FILES.map((o) => ({
  id: o.id,
  label: o.label,
  icon: o.icon,
  description: o.description,
}));
export const PLAN_MODE_FREQUENCY = SHARED_PLAN_MODE_FREQUENCY.map((o) => ({
  id: o.id,
  label: o.label,
  icon: o.icon,
  description: o.description,
}));

// Security
export const AUTH_PROVIDERS = SHARED_AUTH_PROVIDERS.map((o) => ({
  id: o.id,
  label: o.label,
  description: o.description,
  recommended: o.recommended,
}));
export const SECRETS_MANAGEMENT_OPTIONS = SHARED_SECRETS_MANAGEMENT_OPTIONS.map((o) => ({
  id: o.id,
  label: o.label,
  description: o.description,
  recommended: o.recommended,
}));
export const SECURITY_TOOLING_OPTIONS = SHARED_SECURITY_TOOLING_OPTIONS.map((o) => ({
  id: o.id,
  label: o.label,
  description: o.description,
  recommended: o.recommended,
}));
export const AUTH_PATTERNS_OPTIONS = SHARED_AUTH_PATTERNS_OPTIONS.map((o) => ({
  id: o.id,
  label: o.label,
  description: o.description,
  recommended: o.recommended,
}));
export const DATA_HANDLING_OPTIONS = SHARED_DATA_HANDLING_OPTIONS.map((o) => ({
  id: o.id,
  label: o.label,
  description: o.description,
  recommended: o.recommended,
}));
export const COMPLIANCE_OPTIONS = SHARED_COMPLIANCE_OPTIONS.map((o) => ({
  id: o.id,
  label: o.label,
  description: o.description,
  recommended: o.recommended,
}));
export const ANALYTICS_OPTIONS = SHARED_ANALYTICS_OPTIONS.map((o) => ({
  id: o.id,
  label: o.label,
  description: o.description,
  recommended: o.recommended,
}));

// Versioning & Release
export const VERSION_TAG_FORMATS = SHARED_VERSION_TAG_FORMATS.map((o) => ({
  id: o.id,
  label: o.label,
  icon: o.icon,
  description: o.description,
}));
export const CHANGELOG_OPTIONS = SHARED_CHANGELOG_OPTIONS.map((o) => ({
  id: o.id,
  label: o.label,
  icon: o.icon,
  description: o.description,
}));

// Infrastructure
export const VPN_OPTIONS = SHARED_VPN_OPTIONS.map((o) => ({
  id: o.id,
  label: o.label,
  icon: o.icon,
  description: o.description,
}));
export const GITOPS_TOOLS = SHARED_GITOPS_TOOLS.map((o) => ({
  id: o.id,
  label: o.label,
  icon: o.icon,
  description: o.description,
}));

// Code Style
export const NAMING_CONVENTIONS = SHARED_NAMING_CONVENTIONS.map((o) => ({
  id: o.id,
  label: o.label,
  desc: o.description,
}));
export const ERROR_HANDLING_PATTERNS = SHARED_ERROR_HANDLING_PATTERNS.map((o) => ({
  id: o.id,
  label: o.label,
  description: o.description,
}));
export const LOGGING_OPTIONS = SHARED_LOGGING_OPTIONS.map((o) => ({
  id: o.id,
  label: o.label,
  description: o.description,
}));
export const BOUNDARY_OPTIONS = SHARED_BOUNDARY_OPTIONS.map((o) => o.action);

// Testing
export const TEST_LEVELS = SHARED_TEST_LEVELS.map((o) => ({
  id: o.id,
  label: o.label,
  desc: o.description,
}));
export const TEST_FRAMEWORKS = SHARED_TEST_FRAMEWORKS;

// Commands
export const COMMON_COMMANDS = SHARED_COMMON_COMMANDS;

