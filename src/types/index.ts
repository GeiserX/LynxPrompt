// =============================================================================
// LynxPrompt Type Definitions
// =============================================================================

/**
 * Developer personas for tailored experiences
 */
export type DeveloperPersona =
  | "backend"
  | "frontend"
  | "fullstack"
  | "devops"
  | "dba"
  | "infrastructure"
  | "sre"
  | "mobile"
  | "data"
  | "ml";

/**
 * Supported AI IDE platforms
 */
export type AIPlatformId =
  | "cursor"
  | "claude_code"
  | "github_copilot"
  | "windsurf"
  | "continue"
  | "cody";

/**
 * Template types that can be generated
 */
export type TemplateTypeId =
  | "license"
  | "funding"
  | "cursorrules"
  | "claude_md"
  | "copilot_instructions"
  | "windsurf_rules"
  | "gitignore"
  | "readme"
  | "contributing"
  | "code_of_conduct"
  | "security"
  | "dockerfile"
  | "docker_compose"
  | "github_actions"
  | "gitlab_ci"
  | "editorconfig"
  | "prettier"
  | "eslint"
  | "pre_commit";

/**
 * License options
 */
export type LicenseType =
  | "mit"
  | "apache-2.0"
  | "gpl-3.0"
  | "bsd-3-clause"
  | "unlicense"
  | "custom";

/**
 * Wizard step configuration
 */
export interface WizardStepConfig {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  isRequired: boolean;
  conditions?: WizardCondition[];
}

/**
 * Conditional logic for wizard steps
 */
export interface WizardCondition {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "not_contains";
  value: string | string[] | boolean;
}

/**
 * User preferences for a category
 */
export interface UserPreference {
  category: string;
  key: string;
  value: string;
  isDefault: boolean;
}

/**
 * Project configuration from wizard
 */
export interface ProjectConfig {
  // Step 1: Developer Persona
  persona?: DeveloperPersona;

  // Step 2: Languages & Frameworks
  languages: string[];
  frameworks: string[];
  letAiDecide: boolean;

  // Step 3: Repository Setup
  license: LicenseType;
  funding: {
    enabled: boolean;
    platforms: FundingPlatform[];
  };
  conventionalCommits: boolean;
  semver: boolean;

  // Step 4: CI/CD & Deployment
  cicd: {
    provider: "github_actions" | "gitlab_ci" | "circleci" | "jenkins" | "none";
    features: CICDFeature[];
  };
  docker: {
    enabled: boolean;
    publish: boolean;
    registry: "dockerhub" | "ghcr" | "ecr" | "gcr" | "custom";
  };

  // Step 5: Code Quality
  testing: {
    enabled: boolean;
    framework?: string;
    coverage: boolean;
  };
  linting: {
    enabled: boolean;
    tools: string[];
  };
  preCommitHooks: boolean;

  // Step 6: AI Behavior Rules
  aiBehaviorRules: AIBehaviorRule[];

  // Step 7: AI IDEs
  targetPlatforms: AIPlatformId[];

  // Metadata
  projectName?: string;
  projectDescription?: string;
}

/**
 * Funding platform configuration
 */
export interface FundingPlatform {
  type:
    | "github"
    | "patreon"
    | "open_collective"
    | "ko_fi"
    | "tidelift"
    | "custom";
  username?: string;
  url?: string;
}

/**
 * CI/CD feature flags
 */
export type CICDFeature =
  | "lint"
  | "test"
  | "build"
  | "deploy"
  | "release"
  | "security_scan"
  | "dependency_update";

/**
 * AI Behavior Rules - Instructions for AI assistants
 * These get included in the generated config files
 */
export type AIBehaviorRuleId =
  | "always_debug_after_build"
  | "check_logs_after_build"
  | "run_tests_before_commit"
  | "explain_changes"
  | "prefer_simple_solutions"
  | "ask_before_large_refactors"
  | "follow_existing_patterns"
  | "add_comments_for_complex_logic"
  | "suggest_tests_for_new_code"
  | "check_for_security_issues"
  | "optimize_for_readability"
  | "use_conventional_commits"
  | "update_docs_with_changes";

/**
 * AI Behavior Rule definition
 */
export interface AIBehaviorRule {
  id: AIBehaviorRuleId;
  enabled: boolean;
  customPrompt?: string; // Allow users to customize the rule text
}

/**
 * Predefined AI behavior rules with descriptions
 */
export const AI_BEHAVIOR_RULES: Record<
  AIBehaviorRuleId,
  { label: string; description: string; defaultPrompt: string }
> = {
  always_debug_after_build: {
    label: "Always Debug After Building",
    description:
      "AI should always run and test the application locally after making changes",
    defaultPrompt:
      "After building or making changes locally, always debug and verify the changes work correctly before considering the task complete. Run the application and check for errors in the console, logs, and browser (if applicable).",
  },
  check_logs_after_build: {
    label: "Check Logs After Build/Commit",
    description: "Automatically check logs when local build or commit finishes",
    defaultPrompt:
      "When a local build or commit finishes, automatically check the logs for any errors, warnings, or issues. Do not proceed until you have verified the logs are clean or addressed any problems found.",
  },
  run_tests_before_commit: {
    label: "Run Tests Before Commit",
    description: "Ensure all tests pass before committing changes",
    defaultPrompt:
      "Before committing any changes, run the test suite and ensure all tests pass. If tests fail, fix them before proceeding.",
  },
  explain_changes: {
    label: "Explain Changes",
    description: "AI should explain what changes it made and why",
    defaultPrompt:
      "After making changes, provide a clear explanation of what was changed and why. Include any relevant context or trade-offs considered.",
  },
  prefer_simple_solutions: {
    label: "Prefer Simple Solutions",
    description: "Favor straightforward implementations over complex ones",
    defaultPrompt:
      "Always prefer simple, readable solutions over clever or complex ones. Avoid over-engineering and premature optimization.",
  },
  ask_before_large_refactors: {
    label: "Ask Before Large Refactors",
    description: "Confirm with user before making significant changes",
    defaultPrompt:
      "Before making large refactors or architectural changes, explain the proposed changes and ask for confirmation. Never make sweeping changes without approval.",
  },
  follow_existing_patterns: {
    label: "Follow Existing Patterns",
    description: "Match the codebase's existing style and patterns",
    defaultPrompt:
      "Follow the existing code patterns, naming conventions, and architectural decisions in the codebase. Maintain consistency with the established style.",
  },
  add_comments_for_complex_logic: {
    label: "Add Comments for Complex Logic",
    description: "Document complex or non-obvious code sections",
    defaultPrompt:
      "Add clear comments for complex logic, algorithms, or non-obvious code. Comments should explain 'why' not just 'what'.",
  },
  suggest_tests_for_new_code: {
    label: "Suggest Tests for New Code",
    description: "Recommend tests when adding new functionality",
    defaultPrompt:
      "When adding new functionality, suggest appropriate unit tests, integration tests, or e2e tests that should be added.",
  },
  check_for_security_issues: {
    label: "Check for Security Issues",
    description: "Review code for common security vulnerabilities",
    defaultPrompt:
      "Review code for common security issues like SQL injection, XSS, CSRF, exposed secrets, and insecure dependencies.",
  },
  optimize_for_readability: {
    label: "Optimize for Readability",
    description: "Prioritize code readability and maintainability",
    defaultPrompt:
      "Write code that is easy to read and understand. Use descriptive variable names, break complex functions into smaller ones, and structure code logically.",
  },
  use_conventional_commits: {
    label: "Use Conventional Commits",
    description: "Follow conventional commit message format",
    defaultPrompt:
      "Use conventional commit format for all commits: type(scope): description. Types include: feat, fix, docs, style, refactor, test, chore.",
  },
  update_docs_with_changes: {
    label: "Update Documentation",
    description: "Keep documentation in sync with code changes",
    defaultPrompt:
      "When making changes that affect documentation (README, API docs, comments), update the relevant documentation to reflect the changes.",
  },
};

/**
 * Generated file output
 */
export interface GeneratedFileOutput {
  filename: string;
  filepath: string;
  content: string;
  type: TemplateTypeId;
}

/**
 * Wizard state
 */
export interface WizardState {
  currentStep: number;
  totalSteps: number;
  config: Partial<ProjectConfig>;
  isComplete: boolean;
}
