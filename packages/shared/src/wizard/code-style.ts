import type { NamingConventionOption, ErrorHandlingOption, LoggingOption, BoundaryOption } from "./types.js";

/**
 * Naming conventions
 */
export const NAMING_CONVENTIONS: NamingConventionOption[] = [
  { id: "language_default", label: "Follow language conventions", description: "Use idiomatic style for selected language(s)" },
  { id: "camelCase", label: "camelCase", description: "JavaScript, TypeScript, Java" },
  { id: "snake_case", label: "snake_case", description: "Python, Ruby, Rust, Go" },
  { id: "PascalCase", label: "PascalCase", description: "C#, .NET classes" },
  { id: "kebab-case", label: "kebab-case", description: "CSS, HTML attributes, URLs" },
  { id: "SCREAMING_SNAKE_CASE", label: "SCREAMING_SNAKE_CASE", description: "Constants, environment variables" },
];

/**
 * Error handling patterns
 */
export const ERROR_HANDLING_PATTERNS: ErrorHandlingOption[] = [
  { id: "try_catch", label: "Try-Catch", description: "Standard exception handling" },
  { id: "result_type", label: "Result/Either Type", description: "Functional error handling" },
  { id: "error_codes", label: "Error Codes", description: "Numeric/string error codes" },
  { id: "monads", label: "Monads (Option/Maybe)", description: "Functional programming style" },
  { id: "panic_recover", label: "Panic/Recover", description: "Go-style error handling" },
  { id: "error_boundaries", label: "Error Boundaries", description: "React error boundaries" },
  { id: "global_handler", label: "Global Error Handler", description: "Centralized error handling" },
  { id: "other", label: "Other", description: "Custom error handling" },
];

/**
 * Logging conventions
 */
export const LOGGING_OPTIONS: LoggingOption[] = [
  { id: "structured", label: "Structured Logging", description: "JSON logs with metadata" },
  { id: "console", label: "Console Logging", description: "Simple console.log/print" },
  { id: "log_levels", label: "Log Levels", description: "DEBUG, INFO, WARN, ERROR" },
  { id: "winston", label: "Winston", description: "Node.js logging library" },
  { id: "pino", label: "Pino", description: "Fast Node.js logger" },
  { id: "bunyan", label: "Bunyan", description: "JSON logging for Node.js" },
  { id: "log4j", label: "Log4j / Logback", description: "Java logging framework" },
  { id: "slog", label: "slog", description: "Go structured logging" },
  { id: "logrus", label: "Logrus", description: "Go structured logger" },
  { id: "zap", label: "Zap", description: "Uber's Go logger" },
  { id: "python_logging", label: "Python logging", description: "Standard library logging" },
  { id: "loguru", label: "Loguru", description: "Python logging made simple" },
  { id: "tracing", label: "tracing", description: "Rust async logging" },
  { id: "serilog", label: "Serilog", description: ".NET structured logging" },
  { id: "elk", label: "ELK Stack", description: "Elasticsearch, Logstash, Kibana" },
  { id: "loki", label: "Grafana Loki", description: "Log aggregation" },
  { id: "datadog", label: "Datadog Logs", description: "Cloud logging service" },
  { id: "other", label: "Other", description: "Custom logging" },
];

/**
 * Boundary options (what AI should always/ask/never do)
 */
export const BOUNDARY_OPTIONS: BoundaryOption[] = [
  // File operations
  { action: "Delete files", category: "files" },
  { action: "Create new files", category: "files" },
  { action: "Rename/move files", category: "files" },
  // Code changes
  { action: "Rewrite large sections", category: "code" },
  { action: "Refactor architecture", category: "code" },
  { action: "Add new dependencies", category: "code" },
  { action: "Remove dependencies", category: "code" },
  { action: "Change public APIs", category: "code" },
  // Database
  { action: "Modify database schema", category: "database" },
  { action: "Write migrations", category: "database" },
  { action: "Delete data", category: "database" },
  // Git
  { action: "Make commits", category: "git" },
  { action: "Push to remote", category: "git" },
  { action: "Create branches", category: "git" },
  { action: "Merge branches", category: "git" },
  // Deployment
  { action: "Deploy to production", category: "deployment" },
  { action: "Modify CI/CD config", category: "deployment" },
  { action: "Change environment variables", category: "deployment" },
  // Security
  { action: "Modify authentication", category: "security" },
  { action: "Change permissions", category: "security" },
  { action: "Access secrets", category: "security" },
];



