import type { AiBehaviorRuleOption, ImportantFileOption, WizardOption } from "./types.js";

/**
 * AI behavior rules
 */
export const AI_BEHAVIOR_RULES: AiBehaviorRuleOption[] = [
  { id: "always_debug_after_build", label: "Always Debug After Building", description: "Run and test locally after making changes", recommended: true },
  { id: "check_logs_after_build", label: "Check Logs After Build/Commit", description: "Check logs when build or commit finishes", recommended: true },
  { id: "run_tests_before_commit", label: "Run Tests Before Commit", description: "Ensure tests pass before committing", recommended: true },
  { id: "follow_existing_patterns", label: "Follow Existing Patterns", description: "Match the codebase's existing style", recommended: true },
  { id: "ask_before_large_refactors", label: "Ask Before Large Refactors", description: "Confirm before significant changes", recommended: true },
  { id: "prefer_small_commits", label: "Prefer Small Commits", description: "Make atomic, focused commits" },
  { id: "document_complex_logic", label: "Document Complex Logic", description: "Add comments for non-obvious code" },
  { id: "avoid_breaking_changes", label: "Avoid Breaking Changes", description: "Maintain backward compatibility" },
  { id: "use_conventional_commits", label: "Use Conventional Commits", description: "Follow commit message conventions" },
  { id: "prefer_composition", label: "Prefer Composition Over Inheritance", description: "Use composition patterns" },
];

/**
 * Plan mode frequency - how often should the AI enter plan mode before implementing
 */
export const PLAN_MODE_FREQUENCY: WizardOption[] = [
  { id: "always", label: "Always", icon: "🧠", description: "Plan before every task, even simple ones" },
  { id: "complex_tasks", label: "Complex Tasks Only", icon: "🎯", description: "Plan for multi-step or complex changes (recommended)" },
  { id: "multi_file", label: "Multi-file Changes", icon: "📁", description: "Plan when changes span multiple files" },
  { id: "new_features", label: "New Features", icon: "✨", description: "Plan only for new feature implementations" },
  { id: "on_request", label: "On Request", icon: "🙋", description: "Only plan when explicitly asked" },
  { id: "never", label: "Never", icon: "⚡", description: "Execute immediately without planning" },
];

/**
 * Important files that AI should read first
 */
export const IMPORTANT_FILES: ImportantFileOption[] = [
  { id: "readme", label: "README.md", icon: "📄", description: "Project overview and setup" },
  { id: "contributing", label: "CONTRIBUTING.md", icon: "🤝", description: "Contribution guidelines" },
  { id: "architecture", label: "ARCHITECTURE.md", icon: "🏗️", description: "System design docs" },
  { id: "api_docs", label: "API Documentation", icon: "📚", description: "API reference" },
  { id: "changelog", label: "CHANGELOG.md", icon: "📝", description: "Version history" },
  { id: "agents", label: "AGENTS.md", icon: "🤖", description: "AI agent instructions" },
  { id: "package_json", label: "package.json", icon: "📦", description: "Project dependencies" },
  { id: "tsconfig", label: "tsconfig.json", icon: "📘", description: "TypeScript config" },
  { id: "env_example", label: ".env.example", icon: "🔒", description: "Environment variables" },
  { id: "docker_compose", label: "docker-compose.yml", icon: "🐳", description: "Docker services" },
  { id: "makefile", label: "Makefile", icon: "🔧", description: "Build commands" },
  { id: "openapi", label: "openapi.yaml", icon: "📄", description: "OpenAPI spec" },
  { id: "prisma_schema", label: "prisma/schema.prisma", icon: "🔷", description: "Database schema" },
  { id: "other", label: "Other", icon: "📁", description: "Custom file" },
];

