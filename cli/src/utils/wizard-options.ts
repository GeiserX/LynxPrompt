/**
 * Wizard Options - Imported from shared package
 * 
 * This file imports all wizard constants from @lynxprompt/shared
 * and transforms them for CLI use (prompts library format).
 */

import {
  // Types
  type WizardOption,
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
  SECRETS_MANAGEMENT_OPTIONS as SHARED_SECRETS_MANAGEMENT_OPTIONS,
  SECURITY_TOOLING_OPTIONS as SHARED_SECURITY_TOOLING_OPTIONS,
  AUTH_PATTERNS_OPTIONS as SHARED_AUTH_PATTERNS_OPTIONS,
  DATA_HANDLING_OPTIONS as SHARED_DATA_HANDLING_OPTIONS,
  NAMING_CONVENTIONS as SHARED_NAMING_CONVENTIONS,
  ERROR_HANDLING_PATTERNS as SHARED_ERROR_HANDLING_PATTERNS,
  LOGGING_OPTIONS as SHARED_LOGGING_OPTIONS,
  BOUNDARY_OPTIONS as SHARED_BOUNDARY_OPTIONS,
  TEST_LEVELS as SHARED_TEST_LEVELS,
  TEST_FRAMEWORKS as SHARED_TEST_FRAMEWORKS,
  COMMANDS_BY_CATEGORY as SHARED_COMMANDS_BY_CATEGORY,
} from "../../../packages/shared/src/wizard/index.js";

// ============================================
// Transform to CLI format: { title, value }
// ============================================

function toCliFormat<T extends WizardOption>(options: T[]): Array<{ title: string; value: string }> {
  return options.map((o) => ({
    title: o.icon ? `${o.icon} ${o.label}` : o.label,
    value: o.id,
  }));
}

function toCliFormatWithDesc<T extends WizardOption & { description?: string }>(
  options: T[]
): Array<{ title: string; value: string; description?: string }> {
  return options.map((o) => ({
    title: o.icon ? `${o.icon} ${o.label}` : o.label,
    value: o.id,
    description: o.description,
  }));
}

// Tech Stack
export const LANGUAGES = toCliFormat(SHARED_LANGUAGES);
export const FRAMEWORKS = toCliFormat(SHARED_FRAMEWORKS);
export const DATABASES = toCliFormat(SHARED_DATABASES);
export const PACKAGE_MANAGERS = SHARED_PACKAGE_MANAGERS.map((o) => ({
  title: `${o.icon} ${o.label}`,
  value: o.id,
  desc: o.description,
}));
export const MONOREPO_TOOLS = SHARED_MONOREPO_TOOLS.map((o) => ({
  title: `${o.icon} ${o.label}`,
  value: o.id,
  desc: o.description,
}));
export const JS_RUNTIMES = SHARED_JS_RUNTIMES.map((o) => ({
  title: `${o.icon} ${o.label}`,
  value: o.id,
  desc: o.description,
}));
export const ORM_OPTIONS = SHARED_ORM_OPTIONS.map((o) => ({
  title: o.icon ? `${o.icon} ${o.label}` : o.label,
  value: o.id,
  langs: o.languages || [],
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
}));
export const BRANCH_STRATEGIES = toCliFormatWithDesc(SHARED_BRANCH_STRATEGIES);
export const DEFAULT_BRANCHES = toCliFormat(SHARED_DEFAULT_BRANCHES);
export const SELF_HOSTED_TARGETS = toCliFormat(SHARED_SELF_HOSTED_TARGETS);
export const CLOUD_TARGETS = toCliFormat(SHARED_CLOUD_TARGETS);
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

// Security
export const SECRETS_MANAGEMENT_OPTIONS = toCliFormatWithDesc(SHARED_SECRETS_MANAGEMENT_OPTIONS);
export const SECURITY_TOOLING_OPTIONS = toCliFormatWithDesc(SHARED_SECURITY_TOOLING_OPTIONS);
export const AUTH_PATTERNS_OPTIONS = toCliFormatWithDesc(SHARED_AUTH_PATTERNS_OPTIONS);
export const DATA_HANDLING_OPTIONS = toCliFormatWithDesc(SHARED_DATA_HANDLING_OPTIONS);

// Code Style
export const NAMING_CONVENTIONS = SHARED_NAMING_CONVENTIONS.map((o) => ({
  id: o.id,
  label: o.label,
  desc: o.description,
}));
export const ERROR_PATTERNS = SHARED_ERROR_HANDLING_PATTERNS.map((o) => ({
  id: o.id,
  label: o.label,
}));
export const LOGGING_OPTIONS = SHARED_LOGGING_OPTIONS.map((o) => ({
  id: o.id,
  label: o.label,
}));
export const BOUNDARY_OPTIONS = SHARED_BOUNDARY_OPTIONS.map((o) => o.action);

// Testing
export const TEST_LEVELS = SHARED_TEST_LEVELS.map((o) => ({
  id: o.id,
  label: o.label,
  desc: o.description,
}));
export const TEST_FRAMEWORKS = SHARED_TEST_FRAMEWORKS;

// Commands - CLI uses categorized format
export const COMMON_COMMANDS = SHARED_COMMANDS_BY_CATEGORY;

