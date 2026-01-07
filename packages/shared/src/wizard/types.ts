/**
 * Base option type - all wizard options extend this
 */
export interface WizardOption {
  id: string;
  label: string;
  icon?: string;
  description?: string;
  category?: string;
  recommended?: boolean;
}

/**
 * Language option
 */
export interface LanguageOption extends WizardOption {
  id: string;
  label: string;
  icon: string;
}

/**
 * Framework option
 */
export interface FrameworkOption extends WizardOption {
  id: string;
  label: string;
  icon: string;
}

/**
 * Database option with category
 */
export interface DatabaseOption extends WizardOption {
  id: string;
  label: string;
  icon: string;
  category: "opensource" | "cloud" | "proprietary";
}

/**
 * ORM option with language filter
 */
export interface OrmOption extends WizardOption {
  id: string;
  label: string;
  icon: string;
  languages?: string[]; // Languages this ORM supports
}

/**
 * Package manager option
 */
export interface PackageManagerOption extends WizardOption {
  id: string;
  label: string;
  icon: string;
  description: string;
}

/**
 * Monorepo tool option
 */
export interface MonorepoToolOption extends WizardOption {
  id: string;
  label: string;
  icon: string;
  description: string;
}

/**
 * JS Runtime option
 */
export interface JsRuntimeOption extends WizardOption {
  id: string;
  label: string;
  icon: string;
  description: string;
}

/**
 * Project type option
 */
export interface ProjectTypeOption extends WizardOption {
  id: string;
  label: string;
  icon: string;
  description: string;
}

/**
 * Architecture pattern option
 */
export interface ArchitectureOption extends WizardOption {
  id: string;
  label: string;
  description: string;
}

/**
 * Dev OS option
 */
export interface DevOsOption extends WizardOption {
  id: string;
  label: string;
  icon: string;
}

/**
 * Repository host option
 */
export interface RepoHostOption extends WizardOption {
  id: string;
  label: string;
  icon: string;
}

/**
 * CI/CD option
 */
export interface CiCdOption extends WizardOption {
  id: string;
  label: string;
  icon: string;
}

/**
 * License option
 */
export interface LicenseOption extends WizardOption {
  id: string;
  label: string;
  description?: string;
}

/**
 * Branch strategy option
 */
export interface BranchStrategyOption extends WizardOption {
  id: string;
  label: string;
  icon: string;
  description: string;
}

/**
 * Deployment target option
 */
export interface DeploymentTargetOption extends WizardOption {
  id: string;
  label: string;
  icon: string;
  category: "self_hosted" | "cloud";
}

/**
 * Container registry option
 */
export interface ContainerRegistryOption extends WizardOption {
  id: string;
  label: string;
  icon: string;
}

/**
 * Command option with category
 */
export interface CommandOption {
  cmd: string;
  category: "build" | "test" | "lint" | "dev" | "format" | "typecheck" | "clean" | "preCommit" | "other";
}

/**
 * AI behavior rule option
 */
export interface AiBehaviorRuleOption extends WizardOption {
  id: string;
  label: string;
  description: string;
  recommended?: boolean;
}

/**
 * Security option (secrets, tooling, auth, data handling)
 */
export interface SecurityOption extends WizardOption {
  id: string;
  label: string;
  description: string;
  recommended?: boolean;
}

/**
 * Important file option
 */
export interface ImportantFileOption extends WizardOption {
  id: string;
  label: string;
  icon: string;
  description?: string;
}

/**
 * Error handling pattern option
 */
export interface ErrorHandlingOption extends WizardOption {
  id: string;
  label: string;
  description?: string;
}

/**
 * Logging option
 */
export interface LoggingOption extends WizardOption {
  id: string;
  label: string;
  description?: string;
}

/**
 * Naming convention option
 */
export interface NamingConventionOption extends WizardOption {
  id: string;
  label: string;
  description: string;
}

/**
 * Boundary option
 */
export interface BoundaryOption {
  action: string;
  category?: string;
}

/**
 * Test framework option
 */
export interface TestFrameworkOption {
  name: string;
  languages?: string[];
}

/**
 * Test level option
 */
export interface TestLevelOption extends WizardOption {
  id: string;
  label: string;
  description: string;
}

// ============================================
// Helper functions for transforming to UI formats
// ============================================

/**
 * Transform option to WebUI format
 */
export function toWebUiOption<T extends WizardOption>(option: T): { value: string; label: string; icon?: string } {
  return {
    value: option.id,
    label: option.label,
    icon: option.icon,
  };
}

/**
 * Transform option to CLI format (prompts library)
 */
export function toCliOption<T extends WizardOption>(option: T): { title: string; value: string } {
  const icon = option.icon ? `${option.icon} ` : "";
  return {
    title: `${icon}${option.label}`,
    value: option.id,
  };
}

/**
 * Transform option to CLI format with description
 */
export function toCliOptionWithDesc<T extends WizardOption>(option: T): { title: string; value: string; description?: string } {
  const icon = option.icon ? `${option.icon} ` : "";
  return {
    title: `${icon}${option.label}`,
    value: option.id,
    description: option.description,
  };
}


