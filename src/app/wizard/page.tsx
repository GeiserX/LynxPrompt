"use client";

import { Suspense, useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AiEditPanel } from "@/components/ai-edit-panel";
import { useFeatureFlags } from "@/components/providers/feature-flags-provider";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  FileText,
  GitBranch,
  Lock,
  LogIn,
  MessageSquare,
  Settings,
  Loader2,
  Search,
  Plus,
  Sparkles,
  Wand2,
  Code,
  Shield,
  ClipboardList,
  User,
  Share2,
  X,
  Save,
  FolderOpen,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CodeEditor } from "@/components/code-editor";
import { Logo } from "@/components/logo";
import {
  generateConfigFiles,
  downloadConfigFile,
  generateAllFiles,
  type GeneratedFile,
} from "@/lib/file-generator";
// NOTE: Wizard constants are defined inline in this file. 
// The shared package (packages/shared) contains the canonical list.
// TODO: Migrate to importing from @/lib/wizard-options once inline constants are removed.

type WizardTier = "basic" | "intermediate" | "advanced";

const WIZARD_STEPS: {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  tier: WizardTier;
}[] = [
  { id: "project", title: "Project Basics", icon: Sparkles, tier: "basic" },
  { id: "tech", title: "Tech Stack", icon: Code, tier: "basic" },
  { id: "repo", title: "Repository Setup", icon: GitBranch, tier: "basic" },
  { id: "security", title: "Security", icon: Lock, tier: "basic" },  // NEW: Security step (FREE)
  { id: "commands", title: "Commands", icon: ClipboardList, tier: "intermediate" },
  { id: "code_style", title: "Code Style", icon: Wand2, tier: "intermediate" },
  { id: "ai", title: "AI Behavior", icon: Brain, tier: "basic" },
  { id: "boundaries", title: "Boundaries", icon: Shield, tier: "advanced" },
  { id: "testing", title: "Testing Strategy", icon: Shield, tier: "advanced" },
  { id: "static", title: "Static Files", icon: FileText, tier: "advanced" },
  { id: "extra", title: "Anything Else?", icon: MessageSquare, tier: "basic" },
  { id: "generate", title: "Generate", icon: Download, tier: "basic" },
];

// Precomputed widths (Tailwind-safe arbitrary values) for the mobile progress bar
// Updated for 12 steps (including security step)
const MOBILE_PROGRESS_WIDTHS = [
  "w-[8%]",
  "w-[17%]",
  "w-[25%]",
  "w-[33%]",
  "w-[42%]",
  "w-[50%]",
  "w-[58%]",
  "w-[67%]",
  "w-[75%]",
  "w-[83%]",
  "w-[92%]",
  "w-[100%]",
];

// Tier badges removed - all wizard steps are now available to all users
function getTierBadge(_tier: WizardTier) {
  // No badges needed - all users have full wizard access
  return null;
}

// All users can access all wizard steps
function canAccessTier(_userTier: string, _requiredTier: WizardTier): boolean {
  // All users get full wizard access - only AI features are restricted to Teams
  return true;
}

// Tech stack constants - these should eventually be imported from @/lib/wizard-options
// For now they're defined inline to match the CLI wizard

const LANGUAGES = [
  { value: "typescript", label: "TypeScript", icon: "📘" },
  { value: "javascript", label: "JavaScript", icon: "📒" },
  { value: "python", label: "Python", icon: "🐍" },
  { value: "go", label: "Go", icon: "🐹" },
  { value: "rust", label: "Rust", icon: "🦀" },
  { value: "java", label: "Java", icon: "☕" },
  { value: "csharp", label: "C#", icon: "🎯" },
  { value: "php", label: "PHP", icon: "🐘" },
  { value: "ruby", label: "Ruby", icon: "💎" },
  { value: "swift", label: "Swift", icon: "🍎" },
  { value: "kotlin", label: "Kotlin", icon: "🎨" },
  { value: "cpp", label: "C++", icon: "⚙️" },
  { value: "c", label: "C", icon: "🔧" },
  { value: "scala", label: "Scala", icon: "🔴" },
  { value: "elixir", label: "Elixir", icon: "💧" },
  { value: "clojure", label: "Clojure", icon: "🔮" },
  { value: "haskell", label: "Haskell", icon: "λ" },
  { value: "fsharp", label: "F#", icon: "🟦" },
  { value: "dart", label: "Dart", icon: "🎯" },
  { value: "lua", label: "Lua", icon: "🌙" },
  { value: "perl", label: "Perl", icon: "🐪" },
  { value: "r", label: "R", icon: "📊" },
  { value: "julia", label: "Julia", icon: "🔬" },
  { value: "zig", label: "Zig", icon: "⚡" },
  { value: "nim", label: "Nim", icon: "👑" },
  { value: "ocaml", label: "OCaml", icon: "🐫" },
  { value: "erlang", label: "Erlang", icon: "📞" },
  { value: "groovy", label: "Groovy", icon: "🎵" },
  { value: "objectivec", label: "Objective-C", icon: "📱" },
  { value: "shell", label: "Shell/Bash", icon: "🐚" },
  { value: "powershell", label: "PowerShell", icon: "💻" },
  { value: "sql", label: "SQL", icon: "🗃️" },
  { value: "solidity", label: "Solidity", icon: "⛓️" },
  { value: "move", label: "Move", icon: "🔒" },
  { value: "cairo", label: "Cairo", icon: "🏛️" },
  { value: "wasm", label: "WebAssembly", icon: "🌐" },
  { value: "hcl", label: "HCL (Terraform)", icon: "🏗️" },
  { value: "yaml", label: "YAML", icon: "📄" },
  { value: "jsonnet", label: "Jsonnet", icon: "🔧" },
  { value: "nix", label: "Nix", icon: "❄️" },
];

const FRAMEWORKS = [
  { value: "react", label: "React", icon: "⚛️" },
  { value: "nextjs", label: "Next.js", icon: "▲" },
  { value: "vue", label: "Vue.js", icon: "💚" },
  { value: "nuxt", label: "Nuxt.js", icon: "💚" },
  { value: "angular", label: "Angular", icon: "🅰️" },
  { value: "svelte", label: "Svelte", icon: "🔥" },
  { value: "sveltekit", label: "SvelteKit", icon: "🔥" },
  { value: "solid", label: "SolidJS", icon: "💎" },
  { value: "qwik", label: "Qwik", icon: "⚡" },
  { value: "astro", label: "Astro", icon: "🚀" },
  { value: "remix", label: "Remix", icon: "💿" },
  { value: "gatsby", label: "Gatsby", icon: "🟣" },
  { value: "express", label: "Express.js", icon: "📦" },
  { value: "nestjs", label: "NestJS", icon: "🐱" },
  { value: "fastify", label: "Fastify", icon: "🚀" },
  { value: "hono", label: "Hono", icon: "🔥" },
  { value: "fastapi", label: "FastAPI", icon: "⚡" },
  { value: "django", label: "Django", icon: "🎸" },
  { value: "flask", label: "Flask", icon: "🌶️" },
  { value: "spring", label: "Spring Boot", icon: "🌱" },
  { value: "dotnet", label: ".NET", icon: "🔷" },
  { value: "rails", label: "Ruby on Rails", icon: "🛤️" },
  { value: "gin", label: "Gin", icon: "🍸" },
  { value: "fiber", label: "Fiber", icon: "⚡" },
  { value: "actix", label: "Actix", icon: "🦀" },
  { value: "axum", label: "Axum", icon: "🦀" },
  { value: "laravel", label: "Laravel", icon: "🐘" },
  { value: "flutter", label: "Flutter", icon: "🦋" },
  { value: "reactnative", label: "React Native", icon: "📱" },
  { value: "electron", label: "Electron", icon: "⚡" },
  { value: "tauri", label: "Tauri", icon: "🦀" },
  { value: "tailwind", label: "Tailwind CSS", icon: "🎨" },
  { value: "prisma", label: "Prisma", icon: "🔺" },
  { value: "drizzle", label: "Drizzle", icon: "💧" },
  { value: "docker", label: "Docker", icon: "🐳" },
  { value: "kubernetes", label: "Kubernetes", icon: "☸️" },
  { value: "terraform", label: "Terraform", icon: "🏗️" },
  { value: "ansible", label: "Ansible", icon: "🔧" },
  { value: "argocd", label: "ArgoCD", icon: "🐙" },
];

const DATABASES = [
  { value: "postgresql", label: "PostgreSQL", icon: "🐘", category: "opensource" },
  { value: "mysql", label: "MySQL", icon: "🐬", category: "opensource" },
  { value: "sqlite", label: "SQLite", icon: "📦", category: "opensource" },
  { value: "mongodb", label: "MongoDB", icon: "🍃", category: "opensource" },
  { value: "redis", label: "Redis", icon: "🔴", category: "opensource" },
  { value: "cassandra", label: "Apache Cassandra", icon: "👁️", category: "opensource" },
  { value: "neo4j", label: "Neo4j", icon: "🔗", category: "opensource" },
  { value: "elasticsearch", label: "Elasticsearch", icon: "🔍", category: "opensource" },
  { value: "clickhouse", label: "ClickHouse", icon: "🏠", category: "opensource" },
  { value: "cockroachdb", label: "CockroachDB", icon: "🪳", category: "opensource" },
  { value: "timescaledb", label: "TimescaleDB", icon: "⏱️", category: "opensource" },
  { value: "milvus", label: "Milvus", icon: "🧠", category: "opensource" },
  { value: "kafka", label: "Apache Kafka", icon: "📨", category: "opensource" },
  { value: "supabase", label: "Supabase", icon: "⚡", category: "cloud" },
  { value: "planetscale", label: "PlanetScale", icon: "🪐", category: "cloud" },
  { value: "neon", label: "Neon", icon: "💡", category: "cloud" },
  { value: "turso", label: "Turso", icon: "🚀", category: "cloud" },
  { value: "aws_rds", label: "AWS RDS", icon: "☁️", category: "cloud" },
  { value: "aws_dynamodb", label: "AWS DynamoDB", icon: "⚡", category: "cloud" },
  { value: "mongodb_atlas", label: "MongoDB Atlas", icon: "🍃", category: "cloud" },
  { value: "oracle", label: "Oracle Database", icon: "🔶", category: "proprietary" },
  { value: "mssql", label: "Microsoft SQL Server", icon: "🟦", category: "proprietary" },
];

const PACKAGE_MANAGERS = [
  { id: "npm", label: "npm", icon: "📦", desc: "Node Package Manager" },
  { id: "yarn", label: "Yarn", icon: "🧶", desc: "Fast, reliable, secure" },
  { id: "pnpm", label: "pnpm", icon: "📀", desc: "Fast, disk efficient" },
  { id: "bun", label: "Bun", icon: "🥟", desc: "All-in-one runtime + PM" },
];

const MONOREPO_TOOLS = [
  { id: "", label: "None", icon: "📁", desc: "Single package repository" },
  { id: "turborepo", label: "Turborepo", icon: "⚡", desc: "High-performance build" },
  { id: "nx", label: "Nx", icon: "🔷", desc: "Smart build framework" },
  { id: "lerna", label: "Lerna", icon: "🐉", desc: "Multi-package repos" },
  { id: "pnpm_workspaces", label: "pnpm Workspaces", icon: "📀", desc: "Native pnpm monorepo" },
];

const JS_RUNTIMES = [
  { id: "node", label: "Node.js", icon: "🟢", desc: "Standard JavaScript runtime" },
  { id: "deno", label: "Deno", icon: "🦕", desc: "Secure runtime with TypeScript" },
  { id: "bun", label: "Bun", icon: "🥟", desc: "Fast all-in-one JS runtime" },
];

// ORMs and Database tools
const ORM_OPTIONS = [
  { id: "", label: "None / Raw SQL", icon: "📝", desc: "Direct database queries" },
  // JavaScript/TypeScript
  { id: "prisma", label: "Prisma", icon: "🔷", desc: "Type-safe ORM for JS/TS", lang: ["typescript", "javascript"] },
  { id: "drizzle", label: "Drizzle", icon: "💧", desc: "TypeScript ORM", lang: ["typescript", "javascript"] },
  { id: "typeorm", label: "TypeORM", icon: "🔶", desc: "TypeScript/JS ORM", lang: ["typescript", "javascript"] },
  { id: "sequelize", label: "Sequelize", icon: "📘", desc: "Promise-based ORM", lang: ["typescript", "javascript"] },
  { id: "knex", label: "Knex.js", icon: "🔧", desc: "SQL query builder", lang: ["typescript", "javascript"] },
  { id: "kysely", label: "Kysely", icon: "🎯", desc: "Type-safe SQL builder", lang: ["typescript", "javascript"] },
  { id: "mikro-orm", label: "MikroORM", icon: "🔵", desc: "TypeScript ORM", lang: ["typescript", "javascript"] },
  { id: "objection", label: "Objection.js", icon: "📊", desc: "SQL-friendly ORM", lang: ["typescript", "javascript"] },
  // Python
  { id: "sqlalchemy", label: "SQLAlchemy", icon: "🐍", desc: "Python SQL toolkit", lang: ["python"] },
  { id: "django_orm", label: "Django ORM", icon: "🎸", desc: "Django's built-in ORM", lang: ["python"] },
  { id: "tortoise", label: "Tortoise ORM", icon: "🐢", desc: "Async Python ORM", lang: ["python"] },
  { id: "sqlmodel", label: "SQLModel", icon: "⚡", desc: "Pydantic + SQLAlchemy", lang: ["python"] },
  { id: "peewee", label: "Peewee", icon: "🐦", desc: "Simple Python ORM", lang: ["python"] },
  // Go
  { id: "gorm", label: "GORM", icon: "🐹", desc: "Go ORM library", lang: ["go"] },
  { id: "ent", label: "Ent", icon: "🏗️", desc: "Entity framework for Go", lang: ["go"] },
  { id: "sqlc", label: "sqlc", icon: "📝", desc: "Generate Go from SQL", lang: ["go"] },
  { id: "bun_go", label: "Bun (Go)", icon: "🥟", desc: "Lightweight Go ORM", lang: ["go"] },
  // Rust
  { id: "diesel", label: "Diesel", icon: "🦀", desc: "Safe Rust ORM", lang: ["rust"] },
  { id: "sea-orm", label: "SeaORM", icon: "🌊", desc: "Async Rust ORM", lang: ["rust"] },
  { id: "sqlx", label: "SQLx", icon: "📦", desc: "Async Rust SQL toolkit", lang: ["rust"] },
  // Java/Kotlin
  { id: "hibernate", label: "Hibernate", icon: "☕", desc: "Java ORM framework", lang: ["java", "kotlin"] },
  { id: "jooq", label: "jOOQ", icon: "🎵", desc: "Typesafe SQL in Java", lang: ["java", "kotlin"] },
  { id: "exposed", label: "Exposed", icon: "🎨", desc: "Kotlin SQL framework", lang: ["kotlin"] },
  // .NET
  { id: "ef_core", label: "Entity Framework", icon: "🔷", desc: ".NET ORM", lang: ["csharp"] },
  { id: "dapper", label: "Dapper", icon: "⚡", desc: "Micro ORM for .NET", lang: ["csharp"] },
  // Ruby
  { id: "activerecord", label: "ActiveRecord", icon: "💎", desc: "Rails ORM", lang: ["ruby"] },
  { id: "sequel", label: "Sequel", icon: "📚", desc: "Ruby database toolkit", lang: ["ruby"] },
  // PHP
  { id: "eloquent", label: "Eloquent", icon: "🐘", desc: "Laravel ORM", lang: ["php"] },
  { id: "doctrine", label: "Doctrine", icon: "📖", desc: "PHP ORM", lang: ["php"] },
];

// AI Behavior rules (security moved to dedicated Security step)
const AI_BEHAVIOR_RULES = [
  { id: "always_debug_after_build", label: "Always Debug After Building", description: "Run and test locally after making changes", recommended: true },
  { id: "check_logs_after_build", label: "Check Logs After Build/Commit", description: "Check logs when build or commit finishes", recommended: true },
  { id: "run_tests_before_commit", label: "Run Tests Before Commit", description: "Ensure tests pass before committing", recommended: true },
  { id: "follow_existing_patterns", label: "Follow Existing Patterns", description: "Match the codebase's existing style", recommended: true },
  { id: "ask_before_large_refactors", label: "Ask Before Large Refactors", description: "Confirm before significant changes", recommended: true },
  // Burke Holland-inspired rules
  { id: "code_for_llms", label: "Code for LLMs", description: "Optimize for LLM reasoning: flat patterns, minimal abstractions" },
  { id: "self_improving", label: "Self-Improving Config", description: "AI updates this config when it learns project patterns" },
  { id: "verify_work", label: "Always Verify Work", description: "Run tests and check builds before returning control", recommended: true },
  { id: "terminal_management", label: "Terminal Management", description: "Reuse existing terminals, close unused ones" },
  { id: "check_docs_first", label: "Check Docs First", description: "Check docs via MCP before assuming API knowledge" },
];

// ═══════════════════════════════════════════════════════════════
// SECURITY OPTIONS (FREE tier - new dedicated section)
// ═══════════════════════════════════════════════════════════════

// Secrets management strategies
const SECRETS_MANAGEMENT_OPTIONS = [
  { id: "env_vars", label: "Environment Variables", description: "Use .env files locally, env vars in prod", recommended: true },
  { id: "dotenv", label: "dotenv / dotenvx", description: "Load .env files with dotenv library" },
  { id: "vault", label: "HashiCorp Vault", description: "Enterprise secrets management" },
  { id: "aws_secrets", label: "AWS Secrets Manager", description: "AWS native secrets storage" },
  { id: "aws_ssm", label: "AWS SSM Parameter Store", description: "AWS Systems Manager parameters" },
  { id: "gcp_secrets", label: "GCP Secret Manager", description: "Google Cloud secrets storage" },
  { id: "azure_keyvault", label: "Azure Key Vault", description: "Azure secrets and keys" },
  { id: "infisical", label: "Infisical", description: "Open-source secrets management" },
  { id: "doppler", label: "Doppler", description: "Universal secrets platform" },
  { id: "1password", label: "1Password Secrets Automation", description: "1Password for teams/CI" },
  { id: "bitwarden", label: "Bitwarden Secrets Manager", description: "Bitwarden for secrets" },
  { id: "sops", label: "SOPS (Mozilla)", description: "Encrypted files with KMS" },
  { id: "age", label: "age encryption", description: "Simple file encryption" },
  { id: "sealed_secrets", label: "Sealed Secrets (K8s)", description: "Kubernetes encrypted secrets" },
  { id: "external_secrets", label: "External Secrets Operator", description: "K8s external secrets sync" },
  { id: "git_crypt", label: "git-crypt", description: "Transparent file encryption in git" },
  { id: "chamber", label: "Chamber", description: "AWS SSM-based secrets tool" },
  { id: "berglas", label: "Berglas", description: "GCP secrets CLI tool" },
  { id: "other", label: "Other", description: "Custom secrets management" },
];

// Security tooling (scanning, dependency updates, etc.)
const SECURITY_TOOLING_OPTIONS = [
  { id: "dependabot", label: "Dependabot", description: "GitHub dependency updates", recommended: true },
  { id: "renovate", label: "Renovate", description: "Multi-platform dependency updates", recommended: true },
  { id: "snyk", label: "Snyk", description: "Vulnerability scanning & fixing" },
  { id: "sonarqube", label: "SonarQube / SonarCloud", description: "Code quality & security" },
  { id: "codeql", label: "CodeQL", description: "GitHub semantic code analysis" },
  { id: "semgrep", label: "Semgrep", description: "Static analysis with custom rules" },
  { id: "trivy", label: "Trivy", description: "Container & IaC vulnerability scanner" },
  { id: "grype", label: "Grype", description: "Container image vulnerability scanner" },
  { id: "checkov", label: "Checkov", description: "IaC security scanning" },
  { id: "tfsec", label: "tfsec", description: "Terraform security scanner" },
  { id: "kics", label: "KICS", description: "IaC security scanning" },
  { id: "gitleaks", label: "Gitleaks", description: "Secret detection in git repos" },
  { id: "trufflehog", label: "TruffleHog", description: "Secret scanning in code" },
  { id: "detect_secrets", label: "detect-secrets (Yelp)", description: "Pre-commit secret detection" },
  { id: "bandit", label: "Bandit", description: "Python security linter" },
  { id: "brakeman", label: "Brakeman", description: "Ruby on Rails security scanner" },
  { id: "gosec", label: "gosec", description: "Go security checker" },
  { id: "npm_audit", label: "npm audit / yarn audit", description: "Node.js vulnerability check" },
  { id: "pip_audit", label: "pip-audit", description: "Python dependency audit" },
  { id: "safety", label: "Safety", description: "Python dependency checker" },
  { id: "bundler_audit", label: "bundler-audit", description: "Ruby gem vulnerability checker" },
  { id: "owasp_dependency_check", label: "OWASP Dependency-Check", description: "Known vulnerability detection" },
  { id: "ossf_scorecard", label: "OSSF Scorecard", description: "Open source security metrics" },
  { id: "socket", label: "Socket.dev", description: "Supply chain security" },
  { id: "mend", label: "Mend (WhiteSource)", description: "Open source security platform" },
  { id: "fossa", label: "FOSSA", description: "License & security compliance" },
  { id: "other", label: "Other", description: "Custom security tooling" },
];

// Authentication patterns
const AUTH_PATTERNS_OPTIONS = [
  { id: "oauth2", label: "OAuth 2.0", description: "Standard authorization framework", recommended: true },
  { id: "oidc", label: "OpenID Connect (OIDC)", description: "Identity layer on OAuth 2.0", recommended: true },
  { id: "jwt", label: "JWT (JSON Web Tokens)", description: "Stateless token authentication" },
  { id: "session", label: "Session-based Auth", description: "Server-side session management" },
  { id: "api_keys", label: "API Keys", description: "Simple API authentication" },
  { id: "basic_auth", label: "Basic Authentication", description: "Username/password (HTTPS only)" },
  { id: "bearer_token", label: "Bearer Tokens", description: "Token-based API auth" },
  { id: "mfa_totp", label: "MFA / TOTP", description: "Multi-factor with time-based OTP" },
  { id: "passkeys", label: "Passkeys / WebAuthn", description: "Passwordless authentication" },
  { id: "saml", label: "SAML 2.0", description: "Enterprise SSO protocol" },
  { id: "ldap", label: "LDAP / Active Directory", description: "Directory-based auth" },
  { id: "mutual_tls", label: "Mutual TLS (mTLS)", description: "Certificate-based auth" },
  { id: "auth0", label: "Auth0", description: "Identity platform" },
  { id: "clerk", label: "Clerk", description: "User management platform" },
  { id: "firebase_auth", label: "Firebase Auth", description: "Google auth service" },
  { id: "supabase_auth", label: "Supabase Auth", description: "Supabase auth service" },
  { id: "keycloak", label: "Keycloak", description: "Open source IAM" },
  { id: "okta", label: "Okta", description: "Enterprise identity" },
  { id: "cognito", label: "AWS Cognito", description: "AWS user pools" },
  { id: "workos", label: "WorkOS", description: "Enterprise SSO" },
  { id: "other", label: "Other", description: "Custom auth pattern" },
];

// Data handling policies
const DATA_HANDLING_OPTIONS = [
  { id: "encryption_at_rest", label: "Encryption at Rest", description: "Encrypt stored data", recommended: true },
  { id: "encryption_in_transit", label: "Encryption in Transit (TLS)", description: "HTTPS/TLS for all connections", recommended: true },
  { id: "pii_handling", label: "PII Data Handling", description: "Special handling for personal data" },
  { id: "gdpr_compliance", label: "GDPR Compliance", description: "EU data protection rules" },
  { id: "ccpa_compliance", label: "CCPA Compliance", description: "California privacy law" },
  { id: "hipaa_compliance", label: "HIPAA Compliance", description: "Healthcare data protection" },
  { id: "soc2_compliance", label: "SOC 2 Compliance", description: "Service organization controls" },
  { id: "pci_dss", label: "PCI-DSS Compliance", description: "Payment card data security" },
  { id: "data_masking", label: "Data Masking / Anonymization", description: "Hide sensitive data in logs/exports" },
  { id: "data_retention", label: "Data Retention Policies", description: "Automatic data expiration" },
  { id: "audit_logging", label: "Audit Logging", description: "Track data access and changes" },
  { id: "backup_encryption", label: "Encrypted Backups", description: "Encrypt backup data" },
  { id: "key_rotation", label: "Key Rotation", description: "Regular encryption key updates" },
  { id: "zero_trust", label: "Zero Trust Architecture", description: "Never trust, always verify" },
  { id: "least_privilege", label: "Least Privilege Access", description: "Minimal permissions" },
  { id: "rbac", label: "RBAC (Role-Based Access)", description: "Permission by role" },
  { id: "abac", label: "ABAC (Attribute-Based Access)", description: "Fine-grained access control" },
  { id: "data_classification", label: "Data Classification", description: "Classify data sensitivity levels" },
  { id: "dlp", label: "DLP (Data Loss Prevention)", description: "Prevent data leakage" },
  { id: "other", label: "Other", description: "Custom data handling" },
];

// Auth providers (social/enterprise login options)
const AUTH_PROVIDERS_OPTIONS = [
  { id: "email_password", label: "Email/Password", description: "Traditional credentials" },
  { id: "google", label: "Google", description: "Google OAuth" },
  { id: "github", label: "GitHub", description: "GitHub OAuth" },
  { id: "gitlab", label: "GitLab", description: "GitLab OAuth" },
  { id: "microsoft", label: "Microsoft", description: "Azure AD / Microsoft" },
  { id: "apple", label: "Apple", description: "Sign in with Apple" },
  { id: "facebook", label: "Facebook", description: "Facebook Login" },
  { id: "twitter", label: "Twitter/X", description: "Twitter OAuth" },
  { id: "linkedin", label: "LinkedIn", description: "LinkedIn OAuth" },
  { id: "discord", label: "Discord", description: "Discord OAuth" },
  { id: "slack", label: "Slack", description: "Slack OAuth" },
  { id: "twitch", label: "Twitch", description: "Twitch OAuth" },
  { id: "spotify", label: "Spotify", description: "Spotify OAuth" },
  { id: "magic_link", label: "Magic Link", description: "Email magic links" },
  { id: "sms_otp", label: "SMS OTP", description: "SMS verification codes" },
  { id: "passkeys", label: "Passkeys/WebAuthn", description: "Passwordless biometric" },
  { id: "saml_sso", label: "SAML SSO", description: "Enterprise SAML" },
  { id: "oidc_generic", label: "Generic OIDC", description: "Custom OIDC provider" },
  { id: "ldap", label: "LDAP/AD", description: "Directory services" },
  { id: "other", label: "Other", description: "Custom provider" },
];

// Version tag formats
const VERSION_TAG_FORMATS = [
  { id: "v_prefix", label: "v-prefix (v1.0.0)", description: "Most common format" },
  { id: "no_prefix", label: "No prefix (1.0.0)", description: "Plain version number" },
  { id: "package_prefix", label: "Package prefix (@pkg/v1.0.0)", description: "Monorepo scoped" },
  { id: "date_based", label: "Date-based (2024.01.15)", description: "CalVer style" },
  { id: "custom", label: "Custom format", description: "Define your own" },
];

// Changelog tools
const CHANGELOG_OPTIONS = [
  { id: "manual", label: "Manual", description: "Write changelogs by hand" },
  { id: "conventional_changelog", label: "Conventional Changelog", description: "Auto-generate from commits" },
  { id: "release_please", label: "Release Please", description: "Google's release automation" },
  { id: "semantic_release", label: "Semantic Release", description: "Full automation" },
  { id: "changesets", label: "Changesets", description: "Monorepo versioning" },
  { id: "github_releases", label: "GitHub Releases", description: "Use GH release notes" },
  { id: "keep_a_changelog", label: "Keep a Changelog", description: "Standard format" },
  { id: "other", label: "Other", description: "Custom tooling" },
];

// Plan mode frequency options
const PLAN_MODE_FREQUENCY_OPTIONS = [
  { id: "always", label: "Always", description: "Plan before every task" },
  { id: "complex_tasks", label: "Complex Tasks", description: "Multi-step or risky changes" },
  { id: "multi_file", label: "Multi-file Changes", description: "When touching multiple files" },
  { id: "new_features", label: "New Features Only", description: "Only for new functionality" },
  { id: "on_request", label: "On Request", description: "Only when explicitly asked" },
  { id: "never", label: "Never", description: "Skip planning entirely" },
];

// Compliance standards
const COMPLIANCE_OPTIONS = [
  { id: "gdpr", label: "GDPR", description: "EU data protection" },
  { id: "ccpa", label: "CCPA", description: "California privacy" },
  { id: "hipaa", label: "HIPAA", description: "Healthcare data" },
  { id: "soc2", label: "SOC 2", description: "Service controls" },
  { id: "pci_dss", label: "PCI-DSS", description: "Payment card data" },
  { id: "iso27001", label: "ISO 27001", description: "Information security" },
  { id: "fedramp", label: "FedRAMP", description: "US federal cloud" },
  { id: "other", label: "Other", description: "Custom compliance" },
];

// Analytics options
const ANALYTICS_OPTIONS = [
  { id: "google_analytics", label: "Google Analytics", description: "GA4" },
  { id: "plausible", label: "Plausible", description: "Privacy-focused" },
  { id: "posthog", label: "PostHog", description: "Product analytics" },
  { id: "mixpanel", label: "Mixpanel", description: "Event analytics" },
  { id: "amplitude", label: "Amplitude", description: "Product analytics" },
  { id: "segment", label: "Segment", description: "Data pipeline" },
  { id: "umami", label: "Umami", description: "Self-hosted analytics" },
  { id: "matomo", label: "Matomo", description: "Self-hosted (Piwik)" },
  { id: "none", label: "No Analytics", description: "Privacy-first approach" },
  { id: "other", label: "Other", description: "Custom analytics" },
];

// Project types define AI behavior flexibility
const PROJECT_TYPES = [
  {
    id: "work",
    label: "Work / Professional",
    icon: "💼",
    description: "Follow procedures strictly, don't deviate from established patterns",
    aiNote: "Strict adherence to documented procedures. Don't make assumptions or go your own way.",
  },
  {
    id: "open_source",
    label: "Open Source",
    icon: "🌱",
    description: "Open source project, community contributions welcome",
    aiNote: "Follow existing conventions strictly. Document everything. Consider backward compatibility. Be thorough but pragmatic.",
  },
  {
    id: "leisure",
    label: "Leisure / Learning",
    icon: "🎮",
    description: "For fun, experimentation, or learning new things",
    aiNote: "Be inventive and creative. Never delete files without explicit consent. Explain concepts as you go.",
  },
  {
    id: "private_business",
    label: "Private Business",
    icon: "🏠",
    description: "Side project or startup with commercial goals",
    aiNote: "Balance speed with quality. Focus on MVP features. Document important decisions.",
  },
];

// Architecture patterns for project structure
const ARCHITECTURE_PATTERNS = [
  { id: "monolith", label: "Monolith" },
  { id: "modular_monolith", label: "Modular Monolith" },
  { id: "microservices", label: "Microservices" },
  { id: "multi_image_docker", label: "Multi-Image Docker", description: "Shared codebase, multiple container images" },
  { id: "serverless", label: "Serverless" },
  { id: "event_driven", label: "Event-Driven" },
  { id: "layered", label: "Layered / N-Tier" },
  { id: "hexagonal", label: "Hexagonal / Ports & Adapters" },
  { id: "clean", label: "Clean Architecture" },
  { id: "cqrs", label: "CQRS" },
  { id: "mvc", label: "MVC / MVVM" },
  { id: "other", label: "Other" },
];

// Important files AI should read first (NOT AI config files - those are what we're creating)
const IMPORTANT_FILES = [
  { id: "readme", label: "README.md", icon: "📖" },
  { id: "package_json", label: "package.json", icon: "📦" },
  { id: "changelog", label: "CHANGELOG.md", icon: "📝" },
  { id: "contributing", label: "CONTRIBUTING.md", icon: "🤝" },
  { id: "makefile", label: "Makefile", icon: "🔧" },
  { id: "dockerfile", label: "Dockerfile", icon: "🐳" },
  { id: "docker_compose", label: "docker-compose.yml", icon: "🐳" },
  { id: "env_example", label: ".env.example", icon: "🔐" },
  { id: "openapi", label: "openapi.yaml / swagger.json", icon: "📡" },
  { id: "architecture_md", label: "ARCHITECTURE.md", icon: "🏗️" },
  { id: "api_docs", label: "API documentation", icon: "📚" },
  { id: "database_schema", label: "Database schema / migrations", icon: "🗄️" },
];

// Error handling patterns
const ERROR_HANDLING_PATTERNS = [
  { id: "try_catch", label: "Try-Catch Everywhere" },
  { id: "result_types", label: "Result / Either Types" },
  { id: "error_boundaries", label: "Error Boundaries (React)" },
  { id: "global_handler", label: "Global Error Handler" },
  { id: "middleware", label: "Middleware-based" },
  { id: "exceptions", label: "Custom Exceptions / Errors" },
  { id: "other", label: "Other" },
];

// Platforms are the PRIMARY target, but files often work across multiple IDEs
// Import from central platforms definition
import { PLATFORMS, PLATFORM_COUNT } from "@/lib/platforms";

type CommandsConfig = {
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

type BoundariesConfig = {
  always: string[];
  ask: string[];
  never: string[];
  customAlways: string;
  customAsk: string;
  customNever: string;
  savePreferences: boolean;
};

type CodeStyleConfig = {
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

type TestingStrategyConfig = {
  levels: string[];
  coverage: number;
  frameworks: string[];
  tddPreference: boolean; // Test-Driven Development
  snapshotTesting: boolean;
  mockStrategy: string; // minimal, comprehensive, none
  notes: string;
  savePreferences: boolean;
};

type StaticFilesConfig = {
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

type WizardConfig = {
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
  preferCliSync: boolean; // Use CLI commands instead of curl (default true)
  tokenEnvVar: string; // Environment variable name for API token
  additionalFeedback: string;
  commands: CommandsConfig;
  codeStyle: CodeStyleConfig;
  boundaries: BoundariesConfig;
  testing: TestingStrategyConfig;
  staticFiles: StaticFilesConfig;
  security: SecurityConfig;
};

// Security configuration (FREE tier)
type SecurityConfig = {
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

interface WizardDraftSummary {
  id: string;
  name: string;
  step: number;
  createdAt: string;
  updatedAt: string;
  projectName: string;
  projectType: string;
  languages: string[];
  frameworks: string[];
  platform: string;
}

// localStorage key for preserving wizard state across auth flow
const WIZARD_GUEST_STATE_KEY = "lynxprompt_wizard_guest_state";

function WizardPageContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<GeneratedFile[]>([]);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<string>("free");
  const [tierLoading, setTierLoading] = useState(true);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [existingBlueprintId, setExistingBlueprintId] = useState<string | null>(null);
  const [isSavingBlueprint, setIsSavingBlueprint] = useState(false);
  const [savedBlueprintId, setSavedBlueprintId] = useState<string | null>(null);
  const [guestStateRestored, setGuestStateRestored] = useState(false);
  
  // Draft state
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showLoadDraftModal, setShowLoadDraftModal] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<WizardDraftSummary[]>([]);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [isDeletingDraft, setIsDeletingDraft] = useState<string | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [showDeleteDraftModal, setShowDeleteDraftModal] = useState(false);
  const [showSaveBlueprintModal, setShowSaveBlueprintModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<"download" | "share" | null>(null);
  
  // Repo detection state (Teams feature)
  const [repoDetectUrl, setRepoDetectUrl] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  // Track which fields were auto-filled from detection (persists after applying)
  const [detectedFields, setDetectedFields] = useState<Set<string>>(new Set());
  const [detectedData, setDetectedData] = useState<{
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
  } | null>(null);

  const [config, setConfig] = useState<WizardConfig>({
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
    // Security configuration (FREE tier)
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
  });

  // Save guest wizard state to localStorage before auth redirect
  const saveGuestStateAndRedirect = (redirectUrl: string) => {
    const guestState = {
      config,
      currentStep,
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem(WIZARD_GUEST_STATE_KEY, JSON.stringify(guestState));
    } catch (e) {
      console.error("Failed to save guest wizard state:", e);
    }
    router.push(redirectUrl);
  };

  // Restore guest state from localStorage on mount (runs once)
  useEffect(() => {
    if (guestStateRestored) return;
    
    try {
      const savedState = localStorage.getItem(WIZARD_GUEST_STATE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        // Only restore if saved within the last hour
        if (parsed.timestamp && Date.now() - parsed.timestamp < 60 * 60 * 1000) {
          if (parsed.config) {
            setConfig(parsed.config);
          }
          if (typeof parsed.currentStep === "number") {
            setCurrentStep(parsed.currentStep);
          }
          console.log("[Wizard] Restored guest state from localStorage");
        }
        // Clear the saved state after restoration
        localStorage.removeItem(WIZARD_GUEST_STATE_KEY);
      }
    } catch (e) {
      console.error("Failed to restore guest wizard state:", e);
      localStorage.removeItem(WIZARD_GUEST_STATE_KEY);
    }
    setGuestStateRestored(true);
  }, [guestStateRestored]);

  // Auto-save as draft when user becomes authenticated after restoring guest state
  useEffect(() => {
    const autoSaveDraft = async () => {
      if (status !== "authenticated" || !guestStateRestored) return;
      if (!config.projectName || config.projectName.trim() === "") return;
      // Only auto-save if we actually have meaningful config (not default)
      if (config.languages.length === 0 && config.frameworks.length === 0) return;
      
      try {
        const res = await fetch("/api/wizard/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: config.projectName || "Auto-saved from guest session",
            step: currentStep,
            config,
          }),
        });
        if (res.ok) {
          const draft = await res.json();
          setCurrentDraftId(draft.id);
          setDraftName(draft.name);
          console.log("[Wizard] Auto-saved guest configuration as draft");
        }
      } catch (error) {
        console.error("Failed to auto-save draft:", error);
      }
    };
    
    autoSaveDraft();
  }, [status, guestStateRestored]);

  // Fetch user's drafts
  const fetchDrafts = useCallback(async () => {
    if (status !== "authenticated") return;
    try {
      const res = await fetch("/api/wizard/drafts");
      if (res.ok) {
        const data = await res.json();
        setDrafts(data);
      }
    } catch (error) {
      console.error("Failed to fetch drafts:", error);
    }
  }, [status]);

  // Load draft from URL param on mount
  useEffect(() => {
    const loadDraftFromParam = async () => {
      const draftId = searchParams.get("draft");
      if (!draftId || status !== "authenticated" || draftLoaded) return;
      
      setIsLoadingDraft(true);
      try {
        const res = await fetch(`/api/wizard/drafts/${draftId}`);
        if (res.ok) {
          const draft = await res.json();
          setConfig(draft.config as WizardConfig);
          setCurrentStep(draft.step);
          setCurrentDraftId(draft.id);
          setDraftName(draft.name);
          setDraftLoaded(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch (error) {
        console.error("Failed to load draft:", error);
      } finally {
        setIsLoadingDraft(false);
      }
    };
    
    loadDraftFromParam();
  }, [searchParams, status, draftLoaded]);

  // Fetch drafts when modal opens
  useEffect(() => {
    if (showLoadDraftModal) {
      fetchDrafts();
    }
  }, [showLoadDraftModal, fetchDrafts]);

  // Save draft function (requires login)
  const handleSaveDraft = async () => {
    if (requireLogin("draft")) return;
    if (!draftName.trim()) return;
    
    setIsSavingDraft(true);
    try {
      const res = await fetch("/api/wizard/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentDraftId,
          name: draftName.trim(),
          step: currentStep,
          config,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentDraftId(data.id);
        setShowDraftModal(false);
        // Optionally show success message
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save draft");
      }
    } catch (error) {
      console.error("Failed to save draft:", error);
      alert("Failed to save draft. Please try again.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Load draft function
  const handleLoadDraft = async (draftId: string) => {
    setIsLoadingDraft(true);
    try {
      const res = await fetch(`/api/wizard/drafts/${draftId}`);
      if (res.ok) {
        const draft = await res.json();
        setConfig(draft.config as WizardConfig);
        setCurrentStep(draft.step);
        setCurrentDraftId(draft.id);
        setDraftName(draft.name);
        setShowLoadDraftModal(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        alert("Failed to load draft");
      }
    } catch (error) {
      console.error("Failed to load draft:", error);
      alert("Failed to load draft. Please try again.");
    } finally {
      setIsLoadingDraft(false);
    }
  };

  // Delete draft function
  const handleDeleteDraft = async (draftId: string) => {
    if (!confirm("Are you sure you want to delete this draft?")) return;
    
    setIsDeletingDraft(draftId);
    try {
      const res = await fetch(`/api/wizard/drafts/${draftId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDrafts(prev => prev.filter(d => d.id !== draftId));
        if (currentDraftId === draftId) {
          setCurrentDraftId(null);
          setDraftName("");
        }
      } else {
        alert("Failed to delete draft");
      }
    } catch (error) {
      console.error("Failed to delete draft:", error);
      alert("Failed to delete draft. Please try again.");
    } finally {
      setIsDeletingDraft(null);
    }
  };

  // Detect repository configuration (Teams only)
  const handleDetectRepo = async () => {
    if (!repoDetectUrl.trim()) {
      setDetectError("Please enter a repository URL");
      return;
    }

    setIsDetecting(true);
    setDetectError(null);
    setDetectedData(null);

    try {
      const res = await fetch("/api/wizard/detect-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: repoDetectUrl.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setDetectError(data.error || "Failed to detect repository");
        return;
      }

      if (data.detected) {
        setDetectedData(data.detected);
        // Auto-apply detected data immediately
        applyDetectedDataFromResult(data.detected);
      }
    } catch (error) {
      console.error("Repo detection error:", error);
      setDetectError("Failed to connect. Please try again.");
    } finally {
      setIsDetecting(false);
    }
  };

  // Apply detected data to config (called with result directly for auto-apply)
  const applyDetectedDataFromResult = (detectedResult: typeof detectedData) => {
    if (!detectedResult) return;
    
    // Track which fields are being filled from detection
    const newDetectedFields = new Set<string>();
    if (detectedResult.name) newDetectedFields.add("projectName");
    if (detectedResult.description) newDetectedFields.add("projectDescription");
    if (detectedResult.stack.length > 0) {
      newDetectedFields.add("languages");
      newDetectedFields.add("frameworks");
    }
    if (detectedResult.databases?.length > 0) newDetectedFields.add("databases");
    if (detectedResult.license) newDetectedFields.add("license");
    if (detectedResult.cicd) newDetectedFields.add("cicd");
    if (detectedResult.isOpenSource) newDetectedFields.add("projectType");
    if (detectedResult.hasDocker) newDetectedFields.add("buildContainer");
    if (detectedResult.containerRegistry) newDetectedFields.add("containerRegistry");
    if (detectedResult.repoHost) newDetectedFields.add("repoHost");

    setConfig((prev) => ({
      ...prev,
      projectName: detectedResult.name || prev.projectName,
      projectDescription: detectedResult.description || prev.projectDescription,
      languages: detectedResult.stack.filter((s: string) =>
        ["javascript", "typescript", "python", "go", "rust", "java", "csharp", "ruby", "php", "swift", "kotlin", "cpp"].includes(s)
      ),
      frameworks: detectedResult.stack.filter((s: string) =>
        ["nextjs", "react", "vue", "angular", "svelte", "express", "fastapi", "django", "flask", "nestjs", "nuxt", "remix", "astro", "hono", "fastify"].includes(s)
      ),
      databases: detectedResult.databases || prev.databases,
      license: detectedResult.license || prev.license,
      cicd: detectedResult.cicd ? [detectedResult.cicd] : prev.cicd,
      projectType: detectedResult.isOpenSource ? "open_source" : prev.projectType,
      buildContainer: detectedResult.hasDocker || prev.buildContainer,
      containerRegistry: detectedResult.containerRegistry || prev.containerRegistry,
      repoHost: detectedResult.repoHost || prev.repoHost,
    }));

    setDetectedFields(newDetectedFields);
    
    // Clear detection state after applying
    setDetectedData(null);
    setRepoDetectUrl("");
  };

  // Legacy apply function for manual button (now unused but kept for safety)
  const applyDetectedData = () => {
    if (!detectedData) return;

    // Track which fields are being filled from detection
    const newDetectedFields = new Set<string>();
    if (detectedData.name) newDetectedFields.add("projectName");
    if (detectedData.description) newDetectedFields.add("projectDescription");
    if (detectedData.projectType) newDetectedFields.add("projectType");
    if (detectedData.stack.length > 0) {
      newDetectedFields.add("languages");
      newDetectedFields.add("frameworks");
    }
    if (detectedData.databases?.length > 0) newDetectedFields.add("databases");
    if (detectedData.repoHost) newDetectedFields.add("repoHost");
    if (detectedData.license) newDetectedFields.add("license");
    if (detectedData.cicd) newDetectedFields.add("cicd");
    if (detectedData.hasDocker) newDetectedFields.add("docker");
    if (detectedData.commands.build) newDetectedFields.add("commands.build");
    if (detectedData.commands.test) newDetectedFields.add("commands.test");
    if (detectedData.commands.lint) newDetectedFields.add("commands.lint");
    if (detectedData.commands.dev) newDetectedFields.add("commands.dev");
    if (detectedData.testFramework) newDetectedFields.add("testFramework");
    
    setDetectedFields(prev => new Set([...prev, ...newDetectedFields]));

    // Extract languages and frameworks from stack
    const detectedLanguages = detectedData.stack.filter(s => 
      ["javascript", "typescript", "python", "go", "rust", "java", "csharp", "ruby", "php", "swift", "kotlin", "cpp", "c", "scala", "elixir", "clojure", "haskell", "fsharp", "dart", "lua", "perl", "r", "julia", "zig", "nim", "crystal", "ocaml", "erlang", "groovy"].includes(s)
    );
    const detectedFrameworks = detectedData.stack.filter(s => 
      ["nextjs", "react", "vue", "nuxt", "angular", "svelte", "sveltekit", "solid", "qwik", "astro", "remix", "gatsby", "express", "nestjs", "fastify", "hono", "koa", "fastapi", "django", "flask", "starlette", "tornado", "pyramid", "spring", "quarkus", "micronaut", "ktor", "dotnet", "blazor", "rails", "sinatra", "hanami", "gin", "echo", "fiber", "chi", "actix", "rocket", "axum", "warp", "phoenix", "prisma", "drizzle", "tailwind", "vite", "vitest", "jest", "playwright", "cypress", "mocha"].includes(s)
    );
    const detectedDatabases = detectedData.databases || [];

    setConfig(prev => ({
      ...prev,
      projectName: detectedData.name || prev.projectName,
      projectDescription: detectedData.description || prev.projectDescription,
      projectType: detectedData.projectType || prev.projectType,
      languages: detectedLanguages.length > 0 ? detectedLanguages : prev.languages,
      frameworks: detectedFrameworks.length > 0 ? detectedFrameworks : prev.frameworks,
      databases: detectedDatabases.length > 0 ? detectedDatabases : prev.databases,
      repoHost: detectedData.repoHost || prev.repoHost,
      repoHosts: detectedData.repoHost ? [detectedData.repoHost] : prev.repoHosts,
      license: detectedData.license || prev.license,
      cicd: detectedData.cicd ? [detectedData.cicd] : prev.cicd,
      buildContainer: detectedData.hasDocker,
      containerRegistry: detectedData.containerRegistry || prev.containerRegistry,
      isPublic: detectedData.isOpenSource,
      commands: {
        ...prev.commands,
        build: detectedData.commands.build || prev.commands.build,
        test: detectedData.commands.test || prev.commands.test,
        lint: detectedData.commands.lint || prev.commands.lint,
        dev: detectedData.commands.dev || prev.commands.dev,
      },
      testing: {
        ...prev.testing,
        frameworks: detectedData.testFramework ? [detectedData.testFramework] : prev.testing.frameworks,
      },
      // Apply detected existing static files
      staticFiles: {
        ...prev.staticFiles,
        contributing: detectedData.existingFiles.includes("CONTRIBUTING.md"),
        codeOfConduct: detectedData.existingFiles.includes("CODE_OF_CONDUCT.md"),
        security: detectedData.existingFiles.includes("SECURITY.md"),
        roadmap: detectedData.existingFiles.includes("ROADMAP.md"),
        editorconfig: detectedData.existingFiles.includes(".editorconfig"),
      },
    }));

    // Clear detection state after applying
    setDetectedData(null);
    setRepoDetectUrl("");
  };

  useEffect(() => {
    const fetchTier = async () => {
      if (status !== "authenticated") {
        setTierLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/billing/status");
        if (res.ok) {
          const data = await res.json();
          setUserTier(data.plan || "free");
        }
      } catch {
        setUserTier("free");
      } finally {
        setTierLoading(false);
      }
    };
    fetchTier();
  }, [status]);

  // Prefill from preferences
  useEffect(() => {
    const loadPrefs = async () => {
      if (status !== "authenticated") {
        setPreferencesLoaded(true);
        return;
      }
      try {
        const res = await fetch("/api/user/wizard-preferences");
        if (!res.ok) throw new Error("pref fetch failed");
        const data = await res.json();

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
        setConfig((prev) => ({
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
        }));
      } catch {
        // ignore
      } finally {
        setPreferencesLoaded(true);
      }
    };
    loadPrefs();
  }, [status]);

  const lockedSteps = useMemo(
    () => WIZARD_STEPS.filter((s) => !canAccessTier(userTier, s.tier)),
    [userTier],
  );

  const buildGeneratorConfig = () => {
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
      frameworks: config.frameworks,
      databases: config.databases,
      additionalLibraries: config.additionalLibraries,
      letAiDecide: config.letAiDecide,
      
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
      
      // CI/CD & Deployment
      cicd: config.cicd || [],
      deploymentTarget: [...config.selfHostedTargets, ...config.cloudTargets],
      deploymentEnvironment: config.deploymentEnvironment,
      buildContainer: config.buildContainer,
      containerRegistry: config.containerRegistry,
      customRegistry: config.containerRegistryOther,
      dockerImageNames: config.dockerImageNames,
      
      // Funding
      funding: config.funding,
      fundingYml: config.fundingYml,
      
      // AI behavior
      aiBehaviorRules: config.aiBehaviorRules,
      mcpServers: config.mcpServers,
      attemptWorkarounds: config.attemptWorkarounds,
      serverAccess: config.serverAccess,
      sshKeyPath: config.sshKeyPath,
      manualDeployment: config.manualDeployment,
      deploymentMethod: config.deploymentMethod,
      importantFiles: config.importantFiles,
      importantFilesOther: config.importantFilesOther,
      enableAutoUpdate: config.enableAutoUpdate,
      includePersonalData: config.includePersonalData,
      
      // Platform & output
      platform: config.platform,
      platforms: [config.platform],
      blueprintMode: config.blueprintMode,
      additionalFeedback: config.additionalFeedback,
      
      // Commands
      commands: config.commands,
      
      // Code style (including error handling other)
      codeStyle: {
        ...config.codeStyle,
        errorHandlingOther: config.codeStyle.errorHandlingOther,
      },
      
      // Boundaries
      boundaries: config.boundaries,
      
      // Testing strategy
      testingStrategy: {
        levels: config.testing.levels,
        coverage: config.testing.coverage,
        frameworks: config.testing.frameworks,
        notes: config.testing.notes,
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
  };

  // Extract [[VARIABLE]] or [[VARIABLE|default]] patterns from content
  const extractVariables = (content: string): string[] => {
    const regex = /\[\[([A-Z_][A-Z0-9_]*)(?:\|[^\]]*)?\]\]/g;
    const vars = new Set<string>();
    let match;
    while ((match = regex.exec(content)) !== null) {
      vars.add(match[1]);
    }
    return Array.from(vars);
  };

  // Extract variables WITH their defaults - returns { name, default } pairs
  const extractVariablesWithDefaults = (content: string): Array<{ name: string; defaultVal: string | undefined }> => {
    const regex = /\[\[([A-Z_][A-Z0-9_]*)(?:\|([^\]]*))?\]\]/g;
    const vars = new Map<string, string | undefined>();
    let match;
    while ((match = regex.exec(content)) !== null) {
      const [, varName, defaultVal] = match;
      // Keep the first default we find (don't overwrite if already exists with a default)
      if (!vars.has(varName) || (vars.get(varName) === undefined && defaultVal !== undefined)) {
        vars.set(varName, defaultVal);
      }
    }
    return Array.from(vars.entries()).map(([name, defaultVal]) => ({ name, defaultVal }));
  };

  // Get all variables from all preview files
  const allVariables = useMemo(() => {
    const vars = new Set<string>();
    previewFiles.forEach(file => {
      extractVariables(file.content).forEach(v => vars.add(v));
    });
    // Also check additionalFeedback for variables
    extractVariables(config.additionalFeedback).forEach(v => vars.add(v));
    return Array.from(vars);
  }, [previewFiles, config.additionalFeedback]);

  // Get variables that have NO default (these need user input)
  const variablesWithoutDefaults = useMemo(() => {
    const allVarsWithDefaults: Array<{ name: string; defaultVal: string | undefined }> = [];
    previewFiles.forEach(file => {
      extractVariablesWithDefaults(file.content).forEach(v => allVarsWithDefaults.push(v));
    });
    extractVariablesWithDefaults(config.additionalFeedback).forEach(v => allVarsWithDefaults.push(v));
    
    // Build a map of variable -> has default
    const varDefaultMap = new Map<string, boolean>();
    allVarsWithDefaults.forEach(({ name, defaultVal }) => {
      if (varDefaultMap.has(name)) {
        // If already has a default, keep it true; only set false if currently false and no default
        if (defaultVal !== undefined) {
          varDefaultMap.set(name, true);
        }
      } else {
        varDefaultMap.set(name, defaultVal !== undefined);
      }
    });
    
    // Return names that have no default
    return Array.from(varDefaultMap.entries())
      .filter(([, hasDefault]) => !hasDefault)
      .map(([name]) => name);
  }, [previewFiles, config.additionalFeedback]);

  // Replace variables in content (handles [[VAR]] and [[VAR|default]] syntax)
  const replaceVariablesInContent = (content: string): string => {
    return content.replace(/\[\[([A-Z_][A-Z0-9_]*)(?:\|([^\]]*))?\]\]/g, (match, varName, defaultVal) => {
      const userValue = variableValues[varName];
      if (userValue !== undefined && userValue !== "") {
        return userValue;
      }
      if (defaultVal !== undefined) {
        return defaultVal;
      }
      return match;
    });
  };

  // State for login prompt modal
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginPromptAction, setLoginPromptAction] = useState<"save" | "share" | "draft" | "download">("save");

  // Generate preview when entering the generate step (regardless of how user got there)
  // Works for both logged-in and guest users
  useEffect(() => {
    if (currentStep === WIZARD_STEPS.length - 1) {
      const userProfile = session?.user ? {
        displayName: session.user.displayName,
        name: session.user.name,
        persona: session.user.persona,
        skillLevel: session.user.skillLevel,
        tier: userTier,
      } : {
        displayName: "Developer",
        name: "Guest",
        persona: "fullstack",
        skillLevel: "intermediate",
        tier: "free",
      };
      const files = generateAllFiles(buildGeneratorConfig(), userProfile);
      setPreviewFiles(files);
      // When files change (e.g., IDE switch), always keep the first file expanded
      // This ensures the user always sees content, even after switching platforms
      if (files.length > 0) {
        setExpandedFile(files[0].fileName);
      }
    }
  }, [currentStep, session?.user, config, userTier]);

  // Auth/loading gates - only show loading when checking auth status
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Allow guests to use wizard - no longer blocking unauthenticated users
  // Profile setup is only required for logged-in users who haven't completed it
  if (session?.user && !session.user.profileCompleted) {
    return <ProfileSetupRequired />;
  }
  
  // Helper to check if user is logged in
  const isLoggedIn = status === "authenticated" && !!session;
  
  // Helper to prompt login for certain actions
  const requireLogin = (action: "save" | "share" | "draft") => {
    if (!isLoggedIn) {
      setLoginPromptAction(action);
      setShowLoginPrompt(true);
      return true;
    }
    return false;
  };

  // Helper to change step and scroll to top
  const goToStep = (step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNext = () => {
    if (currentStep >= WIZARD_STEPS.length - 1) return;
    let next = currentStep + 1;
    while (next < WIZARD_STEPS.length && !canAccessTier(userTier, WIZARD_STEPS[next].tier)) {
      next++;
    }
    if (next >= WIZARD_STEPS.length) next = WIZARD_STEPS.length - 1;
    goToStep(next);
  };

  const handleCopyFile = async (fileName: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedFile(fileName);
      setTimeout(() => setCopiedFile(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      // Find previous accessible step
      let prevStep = currentStep - 1;
      while (prevStep >= 0 && !canAccessTier(userTier, WIZARD_STEPS[prevStep].tier)) {
        prevStep--;
      }
      if (prevStep >= 0) {
        goToStep(prevStep);
      }
    }
  };

  const toggleArrayValue = (
    key: "languages" | "frameworks" | "databases" | "aiBehaviorRules" | "importantFiles",
    value: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  const savePreferences = async () => {
    console.log("[savePreferences] Function called!");
    console.log("[savePreferences] fundingSave:", config.staticFiles.fundingSave);
    console.log("[savePreferences] editorconfigSave:", config.staticFiles.editorconfigSave);
    console.log("[savePreferences] contributingSave:", config.staticFiles.contributingSave);
    console.log("[savePreferences] codeOfConductSave:", config.staticFiles.codeOfConductSave);
    console.log("[savePreferences] securitySave:", config.staticFiles.securitySave);
    console.log("[savePreferences] gitignoreSave:", config.staticFiles.gitignoreSave);
    console.log("[savePreferences] dockerignoreSave:", config.staticFiles.dockerignoreSave);
    console.log("[savePreferences] licenseSave:", config.staticFiles.licenseSave);
    const payload: { category: string; key: string; value: any; isDefault?: boolean }[] = [];
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
        { category: "repo", key: "isPublic", value: config.isPublic },
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
    console.log("[savePreferences] payload to save:", payload);
    if (payload.length === 0) {
      console.log("[savePreferences] No preferences to save, payload is empty");
      return;
    }
    try {
      const response = await fetch("/api/user/wizard-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      console.log("[savePreferences] API response:", result);
    } catch (error) {
      console.error("[savePreferences] Error saving preferences:", error);
    }
  };

  // Check for unfilled variables before download
  const handleDownloadClick = async () => {
    // If API sync is enabled, ALL variables without defaults must be filled (mandatory)
    // Otherwise, only prompt for unfilled variables
    const unfilledWithoutDefaults = variablesWithoutDefaults.filter(v => !variableValues[v]);
    
    if (unfilledWithoutDefaults.length > 0) {
      setShowVariableModal(true);
      return;
    }
    
    // If guest user, show a prompt offering to sign in first to save their work
    if (!isLoggedIn) {
      setLoginPromptAction("download");
      setShowLoginPrompt(true);
      return;
    }
    
    // If API sync is enabled, check for existing blueprint with same name
    if (config.enableApiSync && config.projectName) {
      try {
        const res = await fetch(`/api/blueprints?name=${encodeURIComponent(config.projectName)}&checkOwned=true`);
        if (res.ok) {
          const data = await res.json();
          if (data.existingId) {
            setExistingBlueprintId(data.existingId);
            setShowOverwriteModal(true);
            return;
          }
        }
      } catch {
        // If check fails, proceed without overwrite check
      }
    }
    
    await handleDownload();
  };

  // Handle overwrite confirmation
  const handleOverwriteConfirm = async (overwrite: boolean) => {
    setShowOverwriteModal(false);
    if (overwrite) {
      await handleDownload(existingBlueprintId || undefined);
    }
    setExistingBlueprintId(null);
  };

  const handleDownload = async (overwriteBlueprintId?: string) => {
    setIsDownloading(true);
    setIsSavingBlueprint(config.enableApiSync);
    
    try {
      // Only save preferences if logged in
      if (isLoggedIn) {
        await savePreferences();
      }
      const userProfile = session?.user ? {
        displayName: session.user.displayName,
        name: session.user.name,
        persona: session.user.persona,
        skillLevel: session.user.skillLevel,
        tier: userTier,
      } : {
        displayName: "Developer",
        name: "Guest",
        persona: "fullstack",
        skillLevel: "intermediate",
        tier: "free",
      };
      
      // Build config (keep variables intact for blueprint saving)
      const genConfig = buildGeneratorConfig();
      
      const blob = await generateConfigFiles(genConfig, userProfile);
      let files = generateAllFiles(genConfig, userProfile);
      
      // Keep original content with variables intact for blueprint saving
      const originalContent = files[0]?.content || "";
      
      // If API sync is enabled, save/update the blueprint first (with variables intact)
      let blueprintId: string | null = null;
      if (config.enableApiSync && files.length > 0) {
        try {
          const blueprintData = {
            name: config.projectName || "My AI Config",
            description: config.projectDescription || "Generated with the LynxPrompt wizard",
            content: originalContent, // Keep [[VAR|default]] syntax for blueprints
            type: "AGENTS_MD",
            category: "other",
            visibility: "PRIVATE",
          };

          let res: Response;
          if (overwriteBlueprintId) {
            // Update existing blueprint
            res = await fetch(`/api/blueprints/${overwriteBlueprintId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(blueprintData),
            });
          } else {
            // Create new blueprint
            res = await fetch("/api/blueprints", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(blueprintData),
            });
          }

          if (res.ok) {
            const data = await res.json();
            blueprintId = data.template?.id || overwriteBlueprintId;
            setSavedBlueprintId(blueprintId);
          } else {
            console.error("Failed to save blueprint for API sync");
          }
        } catch (error) {
          console.error("Error saving blueprint:", error);
        }
      }
      
      // NOW replace variables for the download (after blueprint was saved with variables intact)
      files = files.map(file => ({
        ...file,
        content: replaceVariablesInContent(file.content),
      }));
      
      // Also replace variables in additionalFeedback for genConfig (used by generateConfigFiles)
      genConfig.additionalFeedback = replaceVariablesInContent(genConfig.additionalFeedback);
      
      // If we have a blueprint ID, prepend API sync header to the content
      let finalContent = files[0]?.content || "";
      if (config.enableApiSync && blueprintId) {
        const apiHeader = generateApiSyncHeader(blueprintId, files[0]?.fileName || "AGENTS.md");
        finalContent = apiHeader + finalContent;
        files = files.map((file, i) => i === 0 ? { ...file, content: finalContent } : file);
      }
      
      // Create new blob with final content (variables already replaced)
      const finalBlob = files.length > 0 
        ? new Blob([finalContent], { type: "text/plain" })
        : blob;
      
      downloadConfigFile(finalBlob, files);
      
      // After successful download, ask about draft deletion and blueprint saving
      if (currentDraftId) {
        setPendingAction("download");
        setShowDeleteDraftModal(true);
      } else if (isLoggedIn) {
        // Only ask to save as blueprint if logged in
        setPendingAction("download");
        setShowSaveBlueprintModal(true);
      }
      // If not logged in and no draft, just download without additional prompts
    } catch (error) {
      console.error("Error generating files:", error);
      alert("Failed to generate files. Please try again.");
    } finally {
      setIsDownloading(false);
      setIsSavingBlueprint(false);
      setShowVariableModal(false);
    }
  };
  
  // Generate API sync header for the downloaded file - CLI or env var based (never put token directly in file)
  const generateApiSyncHeader = (blueprintId: string, fileName: string) => {
    const bpId = blueprintId.startsWith("bp_") ? blueprintId : `bp_${blueprintId}`;
    const tokenEnvVar = config.tokenEnvVar || "LYNXPROMPT_API_TOKEN";
    
    let syncCommands = "";
    
    if (config.preferCliSync) {
      // CLI method (recommended - no token needed in file)
      syncCommands = `#   # Using LynxPrompt CLI (recommended):
#   lynxp push    # Upload local changes to cloud
#   lynxp pull    # Download cloud changes to local
#   lynxp diff    # Compare local vs cloud versions
#
#   Install CLI: npm install -g lynxprompt
#   Login: lynxp login`;
    } else {
      // Environment variable method (no token in file)
      syncCommands = `#   # Using curl with environment variable:
#   # Token stored in $${tokenEnvVar} - NEVER put token directly in this file!
#
#   # Push local changes to cloud:
#   curl -X PUT "${appUrl}/api/v1/blueprints/${bpId}" \\
#     -H "Authorization: Bearer \$${tokenEnvVar}" \\
#     -H "Content-Type: application/json" \\
#     -d "{\\"content\\": \\"$(cat ${fileName} | jq -Rs .)\\"}"\n#
#   # Pull cloud changes to local:
#   curl -s "${appUrl}/api/v1/blueprints/${bpId}" \\
#     -H "Authorization: Bearer \$${tokenEnvVar}" | jq -r '.content' > ${fileName}
#
#   Set your token: export ${tokenEnvVar}="your_token_here"`;
    }
    
    return `# ${config.projectName || fileName}
#
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔄 LynxPrompt Cloud Sync
# Blueprint ID: ${bpId}
# 
# This file is synced with LynxPrompt.
#
${syncCommands}
#
# Generate an API token at: ${appUrl}/settings
# Docs: ${appUrl}/docs/api
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;
  };

  // Handle saving as blueprint (requires login)
  const handleShareAsBlueprint = () => {
    if (requireLogin("share")) return;
    
    // Get the generated content (keep variables intact for blueprints)
    if (previewFiles.length === 0) return;
    const content = previewFiles[0].content; // Don't replace variables - blueprints should keep [[VAR|default]] syntax
    // Store in sessionStorage for the create page to pick up
    sessionStorage.setItem("wizardBlueprintContent", content);
    sessionStorage.setItem("wizardBlueprintName", config.projectName || "My AI Config");
    sessionStorage.setItem("wizardBlueprintDescription", config.projectDescription || "Generated with the LynxPrompt wizard");
    
    // If there's a draft, ask if user wants to delete it before navigating
    if (currentDraftId) {
      setPendingAction("share");
      setShowDeleteDraftModal(true);
    } else {
      // Navigate to create blueprint page
      window.location.href = "/blueprints/create";
    }
  };
  
  // Handle delete draft confirmation after download/share
  const handleDeleteDraftConfirm = async (shouldDelete: boolean) => {
    if (shouldDelete && currentDraftId) {
      try {
        await fetch(`/api/wizard/drafts/${currentDraftId}`, {
          method: "DELETE",
        });
        setCurrentDraftId(null);
        setDraftName("");
      } catch (error) {
        console.error("Failed to delete draft:", error);
      }
    }
    setShowDeleteDraftModal(false);
    
    // After draft decision, proceed with next step
    if (pendingAction === "share") {
      window.location.href = "/blueprints/create";
    } else if (pendingAction === "download" && isLoggedIn) {
      // Show save blueprint modal only if logged in
      setShowSaveBlueprintModal(true);
    }
    setPendingAction(null);
  };
  
  // Handle save blueprint confirmation after download
  const handleSaveBlueprintConfirm = (shouldSave: boolean) => {
    setShowSaveBlueprintModal(false);
    if (shouldSave) {
      // Navigate to create blueprint page with the content (keep variables intact)
      if (previewFiles.length > 0) {
        const content = previewFiles[0].content; // Don't replace variables - blueprints should keep [[VAR|default]] syntax
        sessionStorage.setItem("wizardBlueprintContent", content);
        sessionStorage.setItem("wizardBlueprintName", config.projectName || "My AI Config");
        sessionStorage.setItem("wizardBlueprintDescription", config.projectDescription || "Generated with the LynxPrompt wizard");
        window.location.href = "/blueprints/create";
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* Login Required Modal for Save/Share/Download */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl">
            <button
              onClick={() => setShowLoginPrompt(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close login modal"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                {loginPromptAction === "download" ? (
                  <Download className="h-8 w-8 text-primary" />
                ) : (
                  <Lock className="h-8 w-8 text-primary" />
                )}
              </div>
              
              <h2 className="mt-4 text-xl font-bold">
                {loginPromptAction === "download" 
                  ? "Save Your Configuration?" 
                  : loginPromptAction === "save" 
                  ? "Sign in to Save" 
                  : loginPromptAction === "share" 
                  ? "Sign in to Share" 
                  : "Sign in to Save Drafts"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {loginPromptAction === "download"
                  ? "Sign in to save your configuration as a reusable blueprint. You can download now or sign in first to keep your work."
                  : loginPromptAction === "draft" 
                  ? "Create an account or sign in to save your wizard progress and continue later."
                  : loginPromptAction === "share"
                  ? "Create an account or sign in to save your configuration as a reusable blueprint that you can share with others."
                  : "Create an account or sign in to save your preferences and sync across devices."}
              </p>
              
              <div className="mt-6 w-full space-y-3">
                <Button 
                  className="w-full"
                  onClick={() => {
                    setShowLoginPrompt(false);
                    saveGuestStateAndRedirect(`/auth/signin?callbackUrl=${encodeURIComponent("/wizard")}`);
                  }}
                >
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign in {loginPromptAction === "download" ? "& Save" : ""}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    setShowLoginPrompt(false);
                    if (loginPromptAction === "download") {
                      // Proceed with download without signing in
                      await handleDownload();
                    }
                  }} 
                  className="w-full"
                >
                  {loginPromptAction === "download" ? (
                    <>
                      <Download className="mr-2 h-5 w-5" />
                      Download without Signing in
                    </>
                  ) : (
                    "Continue as Guest"
                  )}
                </Button>
              </div>
              
              <p className="mt-4 text-xs text-muted-foreground">
                {loginPromptAction === "download"
                  ? "Your configuration will be ready to download after signing in."
                  : "Your wizard progress will be saved and restored after sign in."}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Variable Fill Modal */}
      {showVariableModal && variablesWithoutDefaults.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl">
            <button
              onClick={() => setShowVariableModal(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Close variable modal"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h2 className="text-xl font-bold">Fill in Required Variables</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              These variables don&apos;t have default values. {config.enableApiSync ? "All values are required for API sync." : "Please provide values for them:"}
            </p>
            {config.enableApiSync && (
              <div className="mt-2 rounded-lg bg-blue-50 p-2 text-xs text-blue-800 dark:bg-blue-950/50 dark:text-blue-200">
                🔄 API Sync is enabled. Variables must be filled to ensure the downloaded file works correctly.
              </div>
            )}
            
            <div className="mt-4 max-h-[60vh] space-y-4 overflow-y-auto">
              {variablesWithoutDefaults.map(varName => (
                <div key={varName}>
                  <label className="text-sm font-medium">
                    <code className="rounded bg-amber-200 px-2 py-0.5 text-amber-800 dark:bg-amber-800 dark:text-amber-200">[[{varName}]]</code>
                    <span className="ml-2 text-xs text-destructive">(no default)</span>
                  </label>
                  <input
                    type="text"
                    value={variableValues[varName] || ""}
                    onChange={(e) => setVariableValues(prev => ({ ...prev, [varName]: e.target.value }))}
                    placeholder={`Enter value for ${varName}`}
                    className="mt-1 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowVariableModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => handleDownload()}
                disabled={isDownloading || variablesWithoutDefaults.some(v => !variableValues[v])}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Overwrite Confirmation Modal */}
      {showOverwriteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl">
            <h2 className="text-xl font-bold">Blueprint Already Exists</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You already have a blueprint named <strong>&quot;{config.projectName}&quot;</strong>.
              Do you want to overwrite it with this new configuration?
            </p>
            
            <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
              <strong>Note:</strong> The existing blueprint will be updated with the new content.
              The blueprint ID will remain the same, so existing API integrations will continue to work.
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleOverwriteConfirm(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleOverwriteConfirm(true)}>
                Yes, Overwrite
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Save Draft Modal */}
      {showDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl">
            <button
              onClick={() => setShowDraftModal(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold">
              {currentDraftId ? "Update Draft" : "Save Draft"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Save your progress and continue later. Your configuration will be preserved at step {currentStep + 1}.
            </p>
            
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">
                Draft Name
              </label>
              <input
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="My Project Config"
                className="w-full rounded-lg border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDraftModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveDraft}
                disabled={isSavingDraft || !draftName.trim()}
              >
                {isSavingDraft ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {currentDraftId ? "Update" : "Save"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Load Draft Modal */}
      {showLoadDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl">
            <button
              onClick={() => setShowLoadDraftModal(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold">Load Draft</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Resume a saved configuration. Loading a draft will replace your current progress.
            </p>
            
            <div className="mt-4 max-h-80 overflow-y-auto">
              {drafts.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <FolderOpen className="mx-auto h-12 w-12 opacity-50" />
                  <p className="mt-2">No saved drafts yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {drafts.map((draft) => (
                    <div
                      key={draft.id}
                      className={`rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                        currentDraftId === draft.id ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{draft.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {draft.projectName || "Untitled Project"} • Step {draft.step + 1}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {draft.languages?.slice(0, 3).map((lang: string) => (
                              <span
                                key={lang}
                                className="text-xs px-2 py-0.5 rounded bg-muted"
                              >
                                {lang}
                              </span>
                            ))}
                            {(draft.languages?.length ?? 0) > 3 && (
                              <span className="text-xs px-2 py-0.5 rounded bg-muted">
                                +{draft.languages.length - 3}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Updated {new Date(draft.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteDraft(draft.id)}
                            disabled={isDeletingDraft === draft.id}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            {isDeletingDraft === draft.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleLoadDraft(draft.id)}
                            disabled={isLoadingDraft}
                          >
                            {isLoadingDraft ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Load"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={() => setShowLoadDraftModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Draft Confirmation Modal */}
      {showDeleteDraftModal && currentDraftId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl">
            <button
              onClick={() => handleDeleteDraftConfirm(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold">Delete Draft?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You have a saved draft: <strong>&quot;{draftName}&quot;</strong>. Would you like to delete it now that you&apos;ve finished your configuration?
            </p>
            
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleDeleteDraftConfirm(false)}>
                Keep Draft
              </Button>
              <Button 
                variant="destructive"
                onClick={() => handleDeleteDraftConfirm(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Draft
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Save Blueprint Confirmation Modal (after Download) */}
      {showSaveBlueprintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl">
            <button
              onClick={() => handleSaveBlueprintConfirm(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold">Save Blueprint to Profile?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your AI config file has been downloaded. Would you like to also save this blueprint to your dashboard for easy access and sharing?
            </p>
            
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleSaveBlueprintConfirm(false)}>
                No, Thanks
              </Button>
              <Button 
                onClick={() => handleSaveBlueprintConfirm(true)}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Blueprint
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <PageHeader currentPage="wizard" breadcrumbLabel="Wizard" />

      <div className="container mx-auto flex flex-1 gap-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Sidebar - Step Navigation */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 space-y-2">
            {/* User Profile Info */}
            <div className="mb-6 rounded-lg border bg-card p-4">
              {isLoggedIn && session?.user ? (
                <>
                  <div className="flex items-center gap-3">
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt=""
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-lg">
                          {(session.user.displayName || session.user.name || "U")[0]}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {session.user.displayName || session.user.name || "User"}
                      </p>
                      <p className="truncate text-xs capitalize text-muted-foreground">
                        {session.user.persona || "Developer"} • {session.user.skillLevel || "Intermediate"}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild className="mt-2 w-full">
                    <Link href="/settings/profile">
                      <Settings className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Link>
                  </Button>
                </>
              ) : (
                <div className="text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="mt-2 text-sm font-medium">Guest User</p>
                  <p className="text-xs text-muted-foreground">Sign in to save your preferences</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 w-full"
                    onClick={() => saveGuestStateAndRedirect(`/auth/signin?callbackUrl=${encodeURIComponent("/wizard")}`)}
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </Button>
                </div>
              )}
            </div>

            {WIZARD_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              const isLocked = !canAccessTier(userTier, step.tier);
              // tierBadge removed - all wizard steps now available to all users

              return (
                <button
                  key={step.id}
                  onClick={() => !isLocked && goToStep(index)}
                  disabled={isLocked}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                    isLocked
                      ? "cursor-not-allowed opacity-50"
                      : isActive
                        ? "bg-primary text-primary-foreground"
                        : isCompleted
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isLocked
                        ? "bg-muted"
                        : isActive
                          ? "bg-primary-foreground/20"
                          : isCompleted
                            ? "bg-primary/20"
                            : "bg-muted"
                    }`}
                  >
                    {isLocked ? (
                      <Lock className="h-4 w-4" />
                    ) : isCompleted ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <span className="flex-1 text-sm font-medium">{step.title}</span>
                  {/* Tier badges removed - all wizard steps now available to all users */}
                </button>
              );
            })}

            {/* Note: All wizard steps are now unlocked for all users.
                This block is kept for backwards compatibility but will never render
                since canAccessTier always returns true. */}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="mx-auto max-w-2xl">
            {/* Progress Bar (Mobile) */}
            <div className="mb-6 lg:hidden">
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium">
                  Step {currentStep + 1} of {WIZARD_STEPS.length}
                </span>
                <span className="text-muted-foreground">
                  {WIZARD_STEPS[currentStep].title}
                </span>
              </div>
              <progress
                className="h-2 w-full overflow-hidden rounded-full bg-muted"
                value={currentStep + 1}
                max={WIZARD_STEPS.length}
                aria-label="Wizard progress"
              />
            </div>

            {/* Step Content */}
            <div className="rounded-xl border bg-card p-8">
              {currentStep === 0 && (
                <StepProject
                  name={config.projectName}
                  description={config.projectDescription}
                  projectType={config.projectType}
                  architecturePattern={config.architecturePattern}
                  architecturePatternOther={config.architecturePatternOther}
                  devOS={config.devOS}
                  blueprintMode={config.blueprintMode}
                  userTier={userTier}
                  repoDetectUrl={repoDetectUrl}
                  isDetecting={isDetecting}
                  detectError={detectError}
                  detectedData={detectedData}
                  detectedFields={detectedFields}
                  onNameChange={(v) => setConfig({ ...config, projectName: v })}
                  onDescriptionChange={(v) => setConfig({ ...config, projectDescription: v })}
                  onProjectTypeChange={(v) => setConfig({ ...config, projectType: v })}
                  onArchitecturePatternChange={(v) => setConfig({ ...config, architecturePattern: v })}
                  onArchitecturePatternOtherChange={(v) => setConfig({ ...config, architecturePatternOther: v })}
                  onDevOSChange={(v) => setConfig({ ...config, devOS: v })}
                  onBlueprintModeChange={(v) => setConfig({ ...config, blueprintMode: v })}
                  onRepoUrlChange={(v) => setRepoDetectUrl(v)}
                  onDetectRepo={handleDetectRepo}
                  onApplyDetected={applyDetectedData}
                />
              )}
              {currentStep === 1 && (
                <StepTechStack
                  selectedLanguages={config.languages}
                  selectedFrameworks={config.frameworks}
                  selectedDatabases={config.databases}
                  packageManager={config.packageManager}
                  monorepoTool={config.monorepoTool}
                  jsRuntime={config.jsRuntime}
                  orm={config.orm}
                  additionalLibraries={config.additionalLibraries}
                  letAiDecide={config.letAiDecide}
                  detectedFields={detectedFields}
                  onToggleLanguage={(v) => toggleArrayValue("languages", v)}
                  onToggleFramework={(v) => toggleArrayValue("frameworks", v)}
                  onToggleDatabase={(v) => toggleArrayValue("databases", v)}
                  onPackageManagerChange={(v) => setConfig({ ...config, packageManager: v })}
                  onMonorepoToolChange={(v) => setConfig({ ...config, monorepoTool: v })}
                  onJsRuntimeChange={(v) => setConfig({ ...config, jsRuntime: v })}
                  onOrmChange={(v) => setConfig({ ...config, orm: v })}
                  onAdditionalLibrariesChange={(v) => setConfig({ ...config, additionalLibraries: v })}
                  onLetAiDecide={(v) => setConfig({ ...config, letAiDecide: v })}
                />
              )}
              {currentStep === 2 && (
                <StepRepository
                  config={config}
                  detectedFields={detectedFields}
                  onChange={(updates) => setConfig({ ...config, ...updates })}
                />
              )}
              {currentStep === 3 && (
                <StepSecurity
                  config={config.security}
                  onChange={(updates) => setConfig({ ...config, security: { ...config.security, ...updates } })}
                />
              )}
              {currentStep === 4 && (
                <StepCommands
                  config={config.commands}
                  onChange={(updates) => setConfig({ ...config, commands: { ...config.commands, ...updates } })}
                />
              )}
              {currentStep === 5 && (
                <StepCodeStyle
                  config={config.codeStyle}
                  onChange={(updates) => setConfig({ ...config, codeStyle: { ...config.codeStyle, ...updates } })}
                  selectedLanguages={config.languages}
                />
              )}
              {currentStep === 6 && (
                <StepAIBehavior
                  selected={config.aiBehaviorRules}
                  onToggle={(v) => toggleArrayValue("aiBehaviorRules", v)}
                  planModeFrequency={config.planModeFrequency}
                  onPlanModeFrequencyChange={(v) => setConfig({ ...config, planModeFrequency: v })}
                  explanationVerbosity={config.explanationVerbosity}
                  onExplanationVerbosityChange={(v) => setConfig({ ...config, explanationVerbosity: v })}
                  accessibilityFocus={config.accessibilityFocus}
                  onAccessibilityFocusChange={(v) => setConfig({ ...config, accessibilityFocus: v })}
                  performanceFocus={config.performanceFocus}
                  onPerformanceFocusChange={(v) => setConfig({ ...config, performanceFocus: v })}
                  mcpServers={config.mcpServers}
                  onMcpServersChange={(v) => setConfig({ ...config, mcpServers: v })}
                  attemptWorkarounds={config.attemptWorkarounds}
                  onAttemptWorkaroundsChange={(v) => setConfig({ ...config, attemptWorkarounds: v })}
                  serverAccess={config.serverAccess}
                  onServerAccessChange={(v) => setConfig({ ...config, serverAccess: v })}
                  sshKeyPath={config.sshKeyPath}
                  onSshKeyPathChange={(v) => setConfig({ ...config, sshKeyPath: v })}
                  manualDeployment={config.manualDeployment}
                  onManualDeploymentChange={(v) => setConfig({ ...config, manualDeployment: v })}
                  deploymentMethod={config.deploymentMethod}
                  onDeploymentMethodChange={(v) => setConfig({ ...config, deploymentMethod: v })}
                  hasCicd={(config.cicd?.length ?? 0) > 0}
                  importantFiles={config.importantFiles}
                  importantFilesOther={config.importantFilesOther}
                  onImportantFilesToggle={(v) => toggleArrayValue("importantFiles", v)}
                  onImportantFilesOtherChange={(v) => setConfig({ ...config, importantFilesOther: v })}
                  enableAutoUpdate={config.enableAutoUpdate}
                  onAutoUpdateChange={(v) => setConfig({ ...config, enableAutoUpdate: v })}
                  includePersonalData={config.includePersonalData}
                  onIncludePersonalDataChange={(v) => setConfig({ ...config, includePersonalData: v })}
                  userPersona={session?.user?.persona}
                  userSkillLevel={session?.user?.skillLevel}
                  selectedLanguages={config.languages}
                  isLoggedIn={isLoggedIn}
                />
              )}
              {currentStep === 7 && (
                <StepBoundaries
                  config={config.boundaries}
                  onChange={(updates) => setConfig({ ...config, boundaries: { ...config.boundaries, ...updates } })}
                />
              )}
              {currentStep === 8 && (
                <StepTesting
                  config={config.testing}
                  onChange={(updates) => setConfig({ ...config, testing: { ...config.testing, ...updates } })}
                />
              )}
              {currentStep === 9 && (
                <StepStaticFiles
                  config={config.staticFiles}
                  isGithub={config.repoHost === "github"}
                  isPublic={config.isPublic}
                  buildContainer={config.buildContainer}
                  onChange={(updates) => setConfig({ ...config, staticFiles: { ...config.staticFiles, ...updates } })}
                  hasDetectedRepo={!!detectedFields.size}
                />
              )}
              {currentStep === 10 && (
                <StepFeedback
                  value={config.additionalFeedback}
                  onChange={(v) => setConfig({ ...config, additionalFeedback: v })}
                  userTier={userTier}
                />
              )}
              {currentStep === 11 && (
                <StepGenerate
                  config={config}
                  session={session}
                  previewFiles={previewFiles}
                  expandedFile={expandedFile}
                  copiedFile={copiedFile}
                  blueprintMode={config.blueprintMode}
                  enableApiSync={config.enableApiSync}
                  preferCliSync={config.preferCliSync}
                  tokenEnvVar={config.tokenEnvVar}
                  userTier={userTier}
                  onToggleExpand={(fileName) => setExpandedFile(expandedFile === fileName ? null : fileName)}
                  onCopyFile={handleCopyFile}
                  onPlatformChange={(v) => setConfig({ ...config, platform: v })}
                  onApiSyncChange={(v) => setConfig({ ...config, enableApiSync: v })}
                  onPreferCliSyncChange={(v) => setConfig({ ...config, preferCliSync: v })}
                  onTokenEnvVarChange={(v) => setConfig({ ...config, tokenEnvVar: v })}
                />
              )}

              {/* Navigation */}
              <div className="mt-8 flex justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 0}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  {/* Draft buttons */}
                  <Button
                    variant="ghost"
                    onClick={() => setShowLoadDraftModal(true)}
                    title="Load Draft"
                  >
                    <FolderOpen className="h-4 w-4" />
                    <span className="sr-only">Load Draft</span>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (!draftName && config.projectName) {
                        setDraftName(config.projectName);
                      }
                      setShowDraftModal(true);
                    }}
                    title="Save Draft"
                  >
                    <Save className="h-4 w-4" />
                    <span className="sr-only">Save Draft</span>
                  </Button>
                </div>
                {currentStep < WIZARD_STEPS.length - 1 ? (
                  <Button onClick={handleNext}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleShareAsBlueprint}
                      disabled={isDownloading || previewFiles.length === 0}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share/Save Blueprint
                    </Button>
                    <Button
                      className="bg-gradient-to-r from-purple-600 to-pink-600"
                      onClick={handleDownloadClick}
                      disabled={isDownloading}
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          AI Config File
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Default export with Suspense boundary for useSearchParams
export default function WizardPage() {
  return (
    <Suspense fallback={<WizardLoadingFallback />}>
      <WizardPageContent />
    </Suspense>
  );
}

// Loading fallback for the wizard page
function WizardLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading wizard...</div>
    </div>
  );
}

// NEW: Project Info Step
const DEV_OS_OPTIONS = [
  { id: "linux", label: "Linux", icon: "🐧", desc: "Ubuntu, Debian, Fedora, Arch..." },
  { id: "macos", label: "macOS", icon: "🍎", desc: "Mac with zsh/bash" },
  { id: "windows", label: "Windows", icon: "🪟", desc: "PowerShell, CMD, or WSL" },
  { id: "wsl", label: "Windows + WSL", icon: "🐧🪟", desc: "Windows with Linux subsystem" },
];

// Helper component for detected badge
function DetectedBadge() {
  return (
    <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700 dark:bg-green-900/50 dark:text-green-300">
      detected
    </span>
  );
}

function StepProject({
  name,
  description,
  projectType,
  architecturePattern,
  architecturePatternOther,
  devOS,
  blueprintMode,
  userTier,
  repoDetectUrl,
  isDetecting,
  detectError,
  detectedData,
  detectedFields,
  onNameChange,
  onDescriptionChange,
  onProjectTypeChange,
  onArchitecturePatternChange,
  onArchitecturePatternOtherChange,
  onDevOSChange,
  onBlueprintModeChange,
  onRepoUrlChange,
  onDetectRepo,
  onApplyDetected,
}: {
  name: string;
  description: string;
  projectType: string;
  architecturePattern: string;
  architecturePatternOther: string;
  devOS: string[];
  blueprintMode: boolean;
  userTier: string;
  repoDetectUrl: string;
  isDetecting: boolean;
  detectError: string | null;
  detectedData: {
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
  } | null;
  detectedFields: Set<string>;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onProjectTypeChange: (v: string) => void;
  onArchitecturePatternChange: (v: string) => void;
  onArchitecturePatternOtherChange: (v: string) => void;
  onDevOSChange: (v: string[]) => void;
  onBlueprintModeChange: (v: boolean) => void;
  onRepoUrlChange: (v: string) => void;
  onDetectRepo: () => void;
  onApplyDetected: () => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold">What project is this for?</h2>
      <p className="mt-2 text-muted-foreground">
        Tell us about the repository you&apos;re setting up AI configurations
        for.
      </p>

      <div className="mt-6 space-y-6">
        {/* Repository Auto-Detection (Free for all) */}
        <div className="rounded-lg border-2 p-4 transition-colors border-primary/30 bg-primary/5">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                <label className="text-sm font-medium">
                  🔍 Auto-detect from existing repository
                </label>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter a public GitHub or GitLab URL to auto-detect tech stack, license, CI/CD, and more.
              </p>
              
              <div className="mt-3 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={repoDetectUrl}
                    onChange={(e) => onRepoUrlChange(e.target.value)}
                    placeholder="https://github.com/owner/repo"
                    className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isDetecting}
                  />
                  <button
                    onClick={onDetectRepo}
                    disabled={isDetecting || !repoDetectUrl.trim()}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isDetecting ? (
                      <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Detecting...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          Detect
                        </>
                      )}
                    </button>
                  </div>

                  {detectError && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      {detectError}
                    </div>
                  )}
                </div>
            </div>
          </div>
        </div>

        {/* Blueprint Template Mode - at the beginning */}
        <div className={`rounded-lg border-2 p-4 transition-colors ${blueprintMode ? "border-amber-500 bg-amber-50 dark:border-amber-600 dark:bg-amber-950/30" : "border-dashed border-muted-foreground/30"}`}>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">
                  🧩 Create as Blueprint Template?
                </label>
                {blueprintMode && (
                  <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">
                    Enabled
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Enable this to share your config as a reusable template. Values will be converted to{" "}
                <code className="rounded bg-amber-200 px-1 py-0.5 font-mono text-xs dark:bg-amber-800">[[VARIABLE|default]]</code>{" "}
                placeholders that others can customize.{" "}
                <a
                  href="/docs/blueprints/variables"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:no-underline"
                >
                  Learn more →
                </a>
              </p>
              {blueprintMode && (
                <div className="mt-3 rounded-md bg-amber-100 p-3 text-xs text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                  <strong>Note:</strong> The preview will show variables like <code className="font-mono">[[PROJECT_NAME|{name || "my-app"}]]</code>.
                  When downloading, defaults are applied so the file works immediately.
                </div>
              )}
            </div>
            <div
              onClick={() => onBlueprintModeChange(!blueprintMode)}
              className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors ${blueprintMode ? "bg-amber-500" : "bg-muted"}`}
            >
              <div
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${blueprintMode ? "left-0.5 translate-x-5" : "left-0.5 translate-x-0"}`}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Project Name <span className="text-destructive">*</span>
            {detectedFields.has("projectName") && <DetectedBadge />}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g., my-awesome-app, company-backend"
            className="w-full rounded-lg border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Description
            {detectedFields.has("projectDescription") && <DetectedBadge />}
          </label>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Brief description of what this project does..."
            rows={3}
            className="w-full resize-none rounded-lg border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Development Environment */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Development Environment
          </label>
          <p className="mb-3 text-sm text-muted-foreground">
            What OS are you developing on? This helps generate compatible commands.
          </p>
          <div className="flex flex-wrap gap-2">
            {DEV_OS_OPTIONS.map((os) => {
              const isSelected = devOS.includes(os.id);
              return (
                <button
                  key={os.id}
                  onClick={() => {
                    if (isSelected) {
                      // Don't allow deselecting if it's the only one
                      if (devOS.length > 1) {
                        onDevOSChange(devOS.filter(o => o !== os.id));
                      }
                    } else {
                      onDevOSChange([...devOS, os.id]);
                    }
                  }}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "hover:border-primary"
                  }`}
                >
                  <span>{os.icon}</span>
                  <span>{os.label}</span>
                </button>
              );
            })}
          </div>
          {devOS.length > 1 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Cross-platform development: commands will be shown for multiple OS
            </p>
          )}
        </div>

        {/* Project Type - affects AI behavior */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            What type of project is this?
            {detectedFields.has("projectType") && <DetectedBadge />}
          </label>
          <p className="mb-3 text-sm text-muted-foreground">
            This affects how the AI assistant behaves when helping you code.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {PROJECT_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => onProjectTypeChange(type.id)}
                className={`flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-all ${
                  projectType === type.id
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{type.icon}</span>
                  <span className="font-medium">{type.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Architecture Pattern */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Architecture Pattern
          </label>
          <p className="mb-3 text-sm text-muted-foreground">
            What architectural approach does this project follow? Click again to deselect.
          </p>
          <div className="flex flex-wrap gap-2">
            {ARCHITECTURE_PATTERNS.map((pattern) => (
              <button
                key={pattern.id}
                onClick={() => onArchitecturePatternChange(architecturePattern === pattern.id ? "" : pattern.id)}
                className={`rounded-full border px-4 py-2 text-sm transition-all ${
                  architecturePattern === pattern.id
                    ? "border-primary bg-primary/10"
                    : "hover:border-primary"
                }`}
              >
                {pattern.label}
              </button>
            ))}
          </div>
          {architecturePattern === "other" && (
            <input
              type="text"
              value={architecturePatternOther}
              onChange={(e) => onArchitecturePatternOtherChange(e.target.value)}
              placeholder="e.g., CQRS, Hexagonal, Clean Architecture..."
              className="mt-3 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          💡 The project type affects AI behavior: <strong>Work</strong> projects get strict procedure following, while <strong>Leisure</strong> projects allow more creativity.
        </p>
      </div>
    </div>
  );
}

// UPDATED: Tech Stack Step with search, load more, and AI decide that works with selections
function StepTechStack({
  selectedLanguages,
  selectedFrameworks,
  selectedDatabases,
  packageManager,
  monorepoTool,
  jsRuntime,
  orm,
  additionalLibraries,
  letAiDecide,
  detectedFields,
  onToggleLanguage,
  onToggleFramework,
  onToggleDatabase,
  onPackageManagerChange,
  onMonorepoToolChange,
  onJsRuntimeChange,
  onOrmChange,
  onAdditionalLibrariesChange,
  onLetAiDecide,
}: {
  selectedLanguages: string[];
  selectedFrameworks: string[];
  selectedDatabases: string[];
  packageManager: string;
  monorepoTool: string;
  jsRuntime: string;
  orm: string;
  additionalLibraries: string;
  letAiDecide: boolean;
  detectedFields: Set<string>;
  onToggleLanguage: (v: string) => void;
  onToggleFramework: (v: string) => void;
  onToggleDatabase: (v: string) => void;
  onPackageManagerChange: (v: string) => void;
  onMonorepoToolChange: (v: string) => void;
  onJsRuntimeChange: (v: string) => void;
  onOrmChange: (v: string) => void;
  onAdditionalLibrariesChange: (v: string) => void;
  onLetAiDecide: (v: boolean) => void;
}) {
  const [langSearch, setLangSearch] = useState("");
  const [fwSearch, setFwSearch] = useState("");
  const [dbSearch, setDbSearch] = useState("");
  const [showAllLangs, setShowAllLangs] = useState(false);
  const [showAllFrameworks, setShowAllFrameworks] = useState(false);
  const [showAllDatabases, setShowAllDatabases] = useState(false);
  const [customLanguage, setCustomLanguage] = useState("");
  const [customFramework, setCustomFramework] = useState("");
  const [customDatabase, setCustomDatabase] = useState("");
  const [showCustomLang, setShowCustomLang] = useState(false);
  const [showCustomFw, setShowCustomFw] = useState(false);
  const [showCustomDb, setShowCustomDb] = useState(false);

  const INITIAL_DISPLAY = 12;

  // Filter languages - selected items first
  const filteredLanguages = useMemo(() => {
    const filtered = LANGUAGES.filter(lang => 
      lang.label.toLowerCase().includes(langSearch.toLowerCase()) ||
      lang.value.toLowerCase().includes(langSearch.toLowerCase())
    );
    // Sort selected items first
    return [...filtered].sort((a, b) => {
      const aSelected = selectedLanguages.includes(a.value);
      const bSelected = selectedLanguages.includes(b.value);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  }, [langSearch, selectedLanguages]);
  const displayedLanguages = showAllLangs || langSearch 
    ? filteredLanguages 
    : filteredLanguages.slice(0, INITIAL_DISPLAY);
  const hasMoreLangs = !langSearch && filteredLanguages.length > INITIAL_DISPLAY;

  // Filter frameworks - selected items first
  const filteredFrameworks = useMemo(() => {
    const filtered = FRAMEWORKS.filter(fw => 
      fw.label.toLowerCase().includes(fwSearch.toLowerCase()) ||
      fw.value.toLowerCase().includes(fwSearch.toLowerCase())
    );
    // Sort selected items first
    return [...filtered].sort((a, b) => {
      const aSelected = selectedFrameworks.includes(a.value);
      const bSelected = selectedFrameworks.includes(b.value);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  }, [fwSearch, selectedFrameworks]);
  const displayedFrameworks = showAllFrameworks || fwSearch 
    ? filteredFrameworks 
    : filteredFrameworks.slice(0, INITIAL_DISPLAY);
  const hasMoreFws = !fwSearch && filteredFrameworks.length > INITIAL_DISPLAY;

  // Filter databases - grouped by category, selected items first
  const filteredDatabases = useMemo(() => {
    const filtered = DATABASES.filter(db => 
      db.label.toLowerCase().includes(dbSearch.toLowerCase()) ||
      db.value.toLowerCase().includes(dbSearch.toLowerCase())
    );
    // Sort selected items first within each category
    return [...filtered].sort((a, b) => {
      const aSelected = selectedDatabases.includes(a.value);
      const bSelected = selectedDatabases.includes(b.value);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  }, [dbSearch, selectedDatabases]);
  // Group by category for display
  const openSourceDbs = filteredDatabases.filter(db => db.category === "opensource");
  const cloudDbs = filteredDatabases.filter(db => db.category === "cloud");
  const proprietaryDbs = filteredDatabases.filter(db => db.category === "proprietary");
  const displayedOpenSource = showAllDatabases || dbSearch ? openSourceDbs : openSourceDbs.slice(0, 12);
  const displayedCloud = showAllDatabases || dbSearch ? cloudDbs : cloudDbs.slice(0, 8);
  const displayedProprietary = showAllDatabases || dbSearch ? proprietaryDbs : proprietaryDbs.slice(0, 4);
  const hasMoreDbs = !dbSearch && (openSourceDbs.length > 12 || cloudDbs.length > 8 || proprietaryDbs.length > 4);

  const handleAddCustomLanguage = () => {
    if (customLanguage.trim()) {
      onToggleLanguage(`custom:${customLanguage.trim()}`);
      setCustomLanguage("");
      setShowCustomLang(false);
    }
  };

  const handleAddCustomFramework = () => {
    if (customFramework.trim()) {
      onToggleFramework(`custom:${customFramework.trim()}`);
      setCustomFramework("");
      setShowCustomFw(false);
    }
  };

  const handleAddCustomDatabase = () => {
    if (customDatabase.trim()) {
      onToggleDatabase(`custom:${customDatabase.trim()}`);
      setCustomDatabase("");
      setShowCustomDb(false);
    }
  };

  // Get custom items from selected
  const customLangs = selectedLanguages.filter(l => l.startsWith("custom:")).map(l => l.replace("custom:", ""));
  const customFws = selectedFrameworks.filter(f => f.startsWith("custom:")).map(f => f.replace("custom:", ""));
  const customDbs = selectedDatabases.filter(d => d.startsWith("custom:")).map(d => d.replace("custom:", ""));

  return (
    <div>
      <h2 className="text-2xl font-bold">Select Your Tech Stack</h2>
      <p className="mt-2 text-muted-foreground">
        Choose the languages and frameworks you&apos;ll be using. You can also let AI help with additional choices.
      </p>

      {/* Let AI Decide - Now works WITH selections */}
      <div className="mt-6">
        <button
          onClick={() => onLetAiDecide(!letAiDecide)}
          className={`flex w-full items-center justify-center gap-2 rounded-lg border-2 p-4 transition-all ${
            letAiDecide
              ? "border-primary bg-primary/5 ring-1 ring-primary"
              : "border-dashed border-muted-foreground/30 hover:border-primary"
          }`}
        >
          <Brain className="h-5 w-5" />
          <span className="font-medium">
            Let AI help with additional technologies
          </span>
          {letAiDecide && <Check className="h-4 w-4 text-primary" />}
        </button>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {letAiDecide 
            ? selectedLanguages.length > 0 || selectedFrameworks.length > 0
              ? "AI will analyze your codebase and suggest additional technologies beyond your selections"
              : "AI will analyze your codebase and suggest the best technologies for your project"
            : "Enable this to let AI suggest technologies based on your codebase"}
        </p>
      </div>

      {/* Languages */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">
            Languages
            {detectedFields.has("languages") && <DetectedBadge />}
          </h3>
          <span className="text-sm text-muted-foreground">
            {selectedLanguages.length} selected
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={langSearch}
            onChange={(e) => setLangSearch(e.target.value)}
            placeholder="Search languages..."
            className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Grid with fade effect */}
        <div className="relative">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {displayedLanguages.map((lang) => (
              <button
                key={lang.value}
                onClick={() => onToggleLanguage(lang.value)}
                className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all hover:border-primary ${
                  selectedLanguages.includes(lang.value)
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : ""
                }`}
              >
                <span className="text-lg">{lang.icon}</span>
                <span className="truncate text-sm font-medium">{lang.label}</span>
              </button>
            ))}

            {/* Custom languages */}
            {customLangs.map((lang) => (
              <button
                key={`custom:${lang}`}
                onClick={() => onToggleLanguage(`custom:${lang}`)}
                className="flex items-center gap-2 rounded-lg border border-primary bg-primary/5 p-2.5 text-left ring-1 ring-primary"
              >
                <span className="text-lg">📝</span>
                <span className="truncate text-sm font-medium">{lang}</span>
              </button>
            ))}

            {/* Add Other button */}
            {!showCustomLang && (
              <button
                onClick={() => setShowCustomLang(true)}
                className="flex items-center gap-2 rounded-lg border border-dashed p-2.5 text-left transition-all hover:border-primary"
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Other...</span>
              </button>
            )}
          </div>

          {/* Fade overlay for load more */}
          {hasMoreLangs && !showAllLangs && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent" />
          )}
        </div>

        {/* Custom language input */}
        {showCustomLang && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={customLanguage}
              onChange={(e) => setCustomLanguage(e.target.value)}
              placeholder="Enter language name..."
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleAddCustomLanguage()}
            />
            <button
              onClick={handleAddCustomLanguage}
              disabled={!customLanguage.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => { setShowCustomLang(false); setCustomLanguage(""); }}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Load more */}
        {hasMoreLangs && (
          <button
            onClick={() => setShowAllLangs(!showAllLangs)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-2 text-sm text-muted-foreground transition-all hover:border-primary hover:text-primary"
          >
            {showAllLangs ? (
              <>Show less <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>Show {filteredLanguages.length - INITIAL_DISPLAY} more <ChevronDown className="h-4 w-4" /></>
            )}
          </button>
        )}
      </div>

      {/* Frameworks */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">
            Frameworks & Libraries
            {detectedFields.has("frameworks") && <DetectedBadge />}
          </h3>
          <span className="text-sm text-muted-foreground">
            {selectedFrameworks.length} selected
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={fwSearch}
            onChange={(e) => setFwSearch(e.target.value)}
            placeholder="Search frameworks..."
            className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Grid with fade effect */}
        <div className="relative">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {displayedFrameworks.map((fw) => (
              <button
                key={fw.value}
                onClick={() => onToggleFramework(fw.value)}
                className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all hover:border-primary ${
                  selectedFrameworks.includes(fw.value)
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : ""
                }`}
              >
                <span className="text-lg">{fw.icon}</span>
                <span className="truncate text-sm font-medium">{fw.label}</span>
              </button>
            ))}

            {/* Custom frameworks */}
            {customFws.map((fw) => (
              <button
                key={`custom:${fw}`}
                onClick={() => onToggleFramework(`custom:${fw}`)}
                className="flex items-center gap-2 rounded-lg border border-primary bg-primary/5 p-2.5 text-left ring-1 ring-primary"
              >
                <span className="text-lg">📝</span>
                <span className="truncate text-sm font-medium">{fw}</span>
              </button>
            ))}

            {/* Add Other button */}
            {!showCustomFw && (
              <button
                onClick={() => setShowCustomFw(true)}
                className="flex items-center gap-2 rounded-lg border border-dashed p-2.5 text-left transition-all hover:border-primary"
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Other...</span>
              </button>
            )}
          </div>

          {/* Fade overlay for load more */}
          {hasMoreFws && !showAllFrameworks && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent" />
          )}
        </div>

        {/* Custom framework input */}
        {showCustomFw && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={customFramework}
              onChange={(e) => setCustomFramework(e.target.value)}
              placeholder="Enter framework name..."
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleAddCustomFramework()}
            />
            <button
              onClick={handleAddCustomFramework}
              disabled={!customFramework.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => { setShowCustomFw(false); setCustomFramework(""); }}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Load more */}
        {hasMoreFws && (
          <button
            onClick={() => setShowAllFrameworks(!showAllFrameworks)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-2 text-sm text-muted-foreground transition-all hover:border-primary hover:text-primary"
          >
            {showAllFrameworks ? (
              <>Show less <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>Show {filteredFrameworks.length - INITIAL_DISPLAY} more <ChevronDown className="h-4 w-4" /></>
            )}
          </button>
        )}
      </div>

      {/* Database Preference */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Database Preference</h3>
          <span className="text-sm text-muted-foreground">
            {selectedDatabases.length > 0 ? `${selectedDatabases.length} selected` : "Optional"}
          </span>
        </div>

        <p className="mb-3 text-sm text-muted-foreground">
          Select your preferred databases. You can select multiple. This helps AI understand your data storage preferences.
        </p>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={dbSearch}
            onChange={(e) => setDbSearch(e.target.value)}
            placeholder="Search databases..."
            className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Open Source Databases */}
        {displayedOpenSource.length > 0 && (
          <div className="mb-4">
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              🌿 Open Source
            </h4>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {displayedOpenSource.map((db) => (
                <button
                  key={db.value}
                  onClick={() => onToggleDatabase(db.value)}
                  className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all hover:border-primary ${
                    selectedDatabases.includes(db.value)
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : ""
                  }`}
                >
                  <span className="text-lg">{db.icon}</span>
                  <span className="truncate text-sm font-medium">{db.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cloud Managed Databases */}
        {displayedCloud.length > 0 && (
          <div className="mb-4">
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              ☁️ Cloud Managed
            </h4>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {displayedCloud.map((db) => (
                <button
                  key={db.value}
                  onClick={() => onToggleDatabase(db.value)}
                  className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all hover:border-primary ${
                    selectedDatabases.includes(db.value)
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : ""
                  }`}
                >
                  <span className="text-lg">{db.icon}</span>
                  <span className="truncate text-sm font-medium">{db.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Proprietary/Closed Source Databases */}
        {displayedProprietary.length > 0 && (
          <div className="mb-4">
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              🔒 Proprietary / Enterprise
            </h4>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {displayedProprietary.map((db) => (
                <button
                  key={db.value}
                  onClick={() => onToggleDatabase(db.value)}
                  className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all hover:border-primary ${
                    selectedDatabases.includes(db.value)
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : ""
                  }`}
                >
                  <span className="text-lg">{db.icon}</span>
                  <span className="truncate text-sm font-medium">{db.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom database display */}
        {customDbs.length > 0 && (
          <div className="mb-4">
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Custom
            </h4>
            <div className="flex flex-wrap gap-2">
              {customDbs.map((dbName) => (
                <button
                  key={dbName}
                  onClick={() => onToggleDatabase(`custom:${dbName}`)}
                  className="flex items-center gap-2 rounded-lg border border-primary bg-primary/5 p-2.5 text-left ring-1 ring-primary"
                >
                  <span className="text-lg">📝</span>
                  <span className="truncate text-sm font-medium">{dbName}</span>
                  <X className="ml-auto h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add Other button */}
        {!showCustomDb && (
          <button
            onClick={() => setShowCustomDb(true)}
            className="flex items-center gap-2 rounded-lg border border-dashed p-2.5 text-left transition-all hover:border-primary"
          >
            <Plus className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Other database...</span>
          </button>
        )}

        {/* Custom database input */}
        {showCustomDb && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={customDatabase}
              onChange={(e) => setCustomDatabase(e.target.value)}
              placeholder="Enter database name..."
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleAddCustomDatabase()}
            />
            <button
              onClick={handleAddCustomDatabase}
              disabled={!customDatabase.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => { setShowCustomDb(false); setCustomDatabase(""); }}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Load more */}
        {hasMoreDbs && (
          <button
            onClick={() => setShowAllDatabases(!showAllDatabases)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-2 text-sm text-muted-foreground transition-all hover:border-primary hover:text-primary"
          >
            {showAllDatabases ? (
              <>Show less <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>Show all databases <ChevronDown className="h-4 w-4" /></>
            )}
          </button>
        )}
      </div>

      {/* JS/TS Specific Options - shown only when JS or TS is selected */}
      {(selectedLanguages.includes("javascript") || selectedLanguages.includes("typescript")) && (
        <div className="mt-8 rounded-lg border bg-muted/30 p-4">
          <h3 className="mb-4 font-semibold">JavaScript/TypeScript Options</h3>
          
          {/* Package Manager */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium">Package Manager</label>
            <div className="flex flex-wrap gap-2">
              {PACKAGE_MANAGERS.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => onPackageManagerChange(pm.id)}
                  className={`flex items-center gap-2 rounded-lg border p-2.5 transition-all ${
                    packageManager === pm.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "hover:border-primary"
                  }`}
                >
                  <span>{pm.icon}</span>
                  <div className="text-left">
                    <span className="text-sm font-medium">{pm.label}</span>
                    <p className="text-xs text-muted-foreground">{pm.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* JS Runtime */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium">JavaScript Runtime</label>
            <div className="flex flex-wrap gap-2">
              {JS_RUNTIMES.map((rt) => (
                <button
                  key={rt.id}
                  onClick={() => onJsRuntimeChange(rt.id)}
                  className={`flex items-center gap-2 rounded-lg border p-2.5 transition-all ${
                    jsRuntime === rt.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "hover:border-primary"
                  }`}
                >
                  <span>{rt.icon}</span>
                  <div className="text-left">
                    <span className="text-sm font-medium">{rt.label}</span>
                    <p className="text-xs text-muted-foreground">{rt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Monorepo Tool */}
          <div>
            <label className="mb-2 block text-sm font-medium">Monorepo Tool</label>
            <div className="flex flex-wrap gap-2">
              {MONOREPO_TOOLS.slice(0, 5).map((tool) => (
                <button
                  key={tool.id || "none"}
                  onClick={() => onMonorepoToolChange(tool.id)}
                  className={`flex items-center gap-2 rounded-lg border p-2.5 transition-all ${
                    monorepoTool === tool.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "hover:border-primary"
                  }`}
                >
                  <span>{tool.icon}</span>
                  <div className="text-left">
                    <span className="text-sm font-medium">{tool.label}</span>
                    <p className="text-xs text-muted-foreground">{tool.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-primary">More monorepo options...</summary>
              <div className="mt-2 flex flex-wrap gap-2">
                {MONOREPO_TOOLS.slice(5).map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => onMonorepoToolChange(tool.id)}
                    className={`flex items-center gap-2 rounded-lg border p-2.5 transition-all ${
                      monorepoTool === tool.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "hover:border-primary"
                    }`}
                  >
                    <span>{tool.icon}</span>
                    <div className="text-left">
                      <span className="text-sm font-medium">{tool.label}</span>
                      <p className="text-xs text-muted-foreground">{tool.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </details>
          </div>
        </div>
      )}

      {/* ORM Selection - shown when databases are selected, filtered by language */}
      {selectedDatabases.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-2 font-semibold">ORM / Database Library</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            Select your preferred ORM or database library
          </p>
          <div className="flex flex-wrap gap-2">
            {ORM_OPTIONS.filter(o => 
              !o.lang || o.lang.some(l => selectedLanguages.includes(l))
            ).slice(0, 10).map((o) => (
              <button
                key={o.id || "none"}
                onClick={() => onOrmChange(o.id)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all ${
                  orm === o.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:border-primary"
                }`}
              >
                <span>{o.icon}</span>
                <span className="text-sm font-medium">{o.label}</span>
              </button>
            ))}
          </div>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-primary">More ORM options...</summary>
            <div className="mt-2 flex flex-wrap gap-2">
              {ORM_OPTIONS.filter(o => 
                !o.lang || o.lang.some(l => selectedLanguages.includes(l))
              ).slice(10).map((o) => (
                <button
                  key={o.id}
                  onClick={() => onOrmChange(o.id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all ${
                    orm === o.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "hover:border-primary"
                  }`}
                >
                  <span>{o.icon}</span>
                  <span className="text-sm font-medium">{o.label}</span>
                </button>
              ))}
            </div>
          </details>
        </div>
      )}

      {/* Additional Libraries - for domain-specific libs not in predefined lists */}
      <div className="mt-8">
        <h3 className="mb-2 font-semibold">Additional Libraries / Tools</h3>
        <p className="mb-3 text-sm text-muted-foreground">
          Add any key libraries not listed above (e.g., Telethon, APScheduler, boto3, alembic)
        </p>
        <input
          type="text"
          value={additionalLibraries}
          onChange={(e) => onAdditionalLibrariesChange(e.target.value)}
          placeholder="e.g., Telethon, APScheduler, uvicorn, alembic"
          className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          💡 Separate multiple libraries with commas. These will appear in your Tech Stack section.
        </p>
      </div>
    </div>
  );
}

// Branch strategies
const BRANCH_STRATEGIES = [
  { id: "none", label: "None (toy project)", desc: "No branching, commit directly to main", icon: "🎮" },
  { id: "github_flow", label: "GitHub Flow", desc: "Simple: main + feature branches", icon: "🌊" },
  { id: "gitflow", label: "Gitflow", desc: "develop, feature, release, hotfix branches", icon: "🌳" },
  { id: "trunk_based", label: "Trunk-Based", desc: "Short-lived branches, continuous integration", icon: "🚂" },
  { id: "gitlab_flow", label: "GitLab Flow", desc: "Environment branches (staging, production)", icon: "🦊" },
  { id: "release_flow", label: "Release Flow", desc: "Microsoft style: main + release branches", icon: "🚀" },
];

// Default branch names
const DEFAULT_BRANCHES = [
  { id: "main", label: "main" },
  { id: "master", label: "master" },
  { id: "develop", label: "develop" },
  { id: "trunk", label: "trunk" },
  { id: "other", label: "Other" },
];

const REPO_HOSTS = [
  { id: "github", label: "GitHub", icon: "🐙" },
  { id: "gitlab", label: "GitLab", icon: "🦊" },
  { id: "gitea", label: "Gitea", icon: "🍵" },
  { id: "forgejo", label: "Forgejo", icon: "🔧" },
  { id: "bitbucket", label: "Bitbucket", icon: "🪣" },
  { id: "codeberg", label: "Codeberg", icon: "🏔️" },
  { id: "sourcehut", label: "SourceHut", icon: "📦" },
  { id: "gogs", label: "Gogs", icon: "🐙" },
  { id: "aws_codecommit", label: "AWS CodeCommit", icon: "☁️" },
  { id: "azure_devops", label: "Azure DevOps", icon: "☁️" },
  { id: "gerrit", label: "Gerrit", icon: "🔍" },
  { id: "phabricator", label: "Phabricator", icon: "📦" },
  { id: "other", label: "Other", icon: "📦" },
];

const CICD_OPTIONS = [
  { id: "github_actions", label: "GitHub Actions", icon: "🐙" },
  { id: "gitlab_ci", label: "GitLab CI/CD", icon: "🦊" },
  { id: "jenkins", label: "Jenkins", icon: "🔧" },
  { id: "circleci", label: "CircleCI", icon: "🔵" },
  { id: "travis", label: "Travis CI", icon: "🔨" },
  { id: "azure_pipelines", label: "Azure Pipelines", icon: "☁️" },
  { id: "aws_codepipeline", label: "AWS CodePipeline", icon: "☁️" },
  { id: "gcp_cloudbuild", label: "GCP Cloud Build", icon: "☁️" },
  { id: "bitbucket_pipelines", label: "Bitbucket Pipelines", icon: "🪣" },
  { id: "drone", label: "Drone CI", icon: "🐝" },
  { id: "tekton", label: "Tekton", icon: "🔧" },
  { id: "argocd", label: "ArgoCD", icon: "🐙" },
  { id: "fluxcd", label: "FluxCD", icon: "🔄" },
  { id: "concourse", label: "Concourse", icon: "✈️" },
  { id: "buildkite", label: "Buildkite", icon: "🔨" },
  { id: "semaphore", label: "Semaphore", icon: "🚦" },
  { id: "harness", label: "Harness", icon: "🏗️" },
  { id: "spinnaker", label: "Spinnaker", icon: "🎡" },
  { id: "woodpecker", label: "Woodpecker", icon: "🐦" },
  { id: "none", label: "None / Manual", icon: "🔧" },
  { id: "other", label: "Other", icon: "📦" },
];

// Deployment environment type (first question)
const DEPLOYMENT_ENVIRONMENTS = [
  { id: "self_hosted", label: "Self-hosted / On-prem", icon: "🏠", desc: "Your own servers, homelab, or private infrastructure" },
  { id: "cloud", label: "Cloud", icon: "☁️", desc: "Public cloud providers and managed platforms" },
];

// Self-hosted deployment targets (shown if self_hosted selected)
const SELF_HOSTED_TARGETS = [
  // Container Management
  { id: "docker_compose", label: "Docker Compose", icon: "🐳" },
  { id: "portainer", label: "Portainer", icon: "📦" },
  { id: "kubernetes_selfhosted", label: "Kubernetes (self-hosted)", icon: "☸️" },
  { id: "k3s", label: "K3s / K0s", icon: "☸️" },
  { id: "rancher", label: "Rancher", icon: "🐄" },
  { id: "openshift", label: "OpenShift", icon: "🎩" },
  { id: "nomad", label: "HashiCorp Nomad", icon: "🔷" },
  // Homelab / NAS
  { id: "unraid", label: "Unraid", icon: "🏠" },
  { id: "truenas", label: "TrueNAS / FreeNAS", icon: "🐟" },
  { id: "synology", label: "Synology NAS", icon: "📦" },
  { id: "qnap", label: "QNAP NAS", icon: "📦" },
  { id: "proxmox", label: "Proxmox VE", icon: "🖥️" },
  { id: "esxi", label: "VMware ESXi", icon: "🖥️" },
  // Linux Distros
  { id: "ubuntu", label: "Ubuntu Server", icon: "🐧" },
  { id: "debian", label: "Debian", icon: "🐧" },
  { id: "rhel", label: "RHEL / CentOS / Rocky", icon: "🎩" },
  { id: "alpine", label: "Alpine Linux", icon: "🏔️" },
  { id: "nixos", label: "NixOS", icon: "❄️" },
  // Bare metal
  { id: "baremetal", label: "Bare Metal (systemd)", icon: "🔧" },
  { id: "ansible", label: "Ansible managed", icon: "🔴" },
  { id: "puppet", label: "Puppet managed", icon: "🎭" },
  { id: "chef", label: "Chef managed", icon: "👨‍🍳" },
];

// Cloud deployment targets (shown if cloud selected)
const CLOUD_TARGETS = [
  // Major Cloud Providers
  { id: "aws", label: "AWS", icon: "☁️" },
  { id: "gcp", label: "Google Cloud", icon: "☁️" },
  { id: "azure", label: "Microsoft Azure", icon: "☁️" },
  // Managed Kubernetes
  { id: "eks", label: "AWS EKS", icon: "☸️" },
  { id: "gke", label: "GCP GKE", icon: "☸️" },
  { id: "aks", label: "Azure AKS", icon: "☸️" },
  { id: "digitalocean_k8s", label: "DigitalOcean Kubernetes", icon: "☸️" },
  // PaaS
  { id: "vercel", label: "Vercel", icon: "▲" },
  { id: "netlify", label: "Netlify", icon: "🌐" },
  { id: "heroku", label: "Heroku", icon: "🟣" },
  { id: "railway", label: "Railway", icon: "🚂" },
  { id: "render", label: "Render", icon: "🔷" },
  { id: "flyio", label: "Fly.io", icon: "🪁" },
  { id: "cloudflare_pages", label: "Cloudflare Pages", icon: "☁️" },
  // VPS Providers
  { id: "digitalocean", label: "DigitalOcean Droplets", icon: "🌊" },
  { id: "linode", label: "Linode/Akamai", icon: "🖥️" },
  { id: "vultr", label: "Vultr", icon: "🖥️" },
  { id: "hetzner", label: "Hetzner Cloud", icon: "🖥️" },
  { id: "ovh", label: "OVH", icon: "🖥️" },
  { id: "scaleway", label: "Scaleway", icon: "🖥️" },
  { id: "upcloud", label: "UpCloud", icon: "🖥️" },
  // Serverless
  { id: "lambda", label: "AWS Lambda", icon: "λ" },
  { id: "cloud_functions", label: "GCP Cloud Functions", icon: "λ" },
  { id: "azure_functions", label: "Azure Functions", icon: "λ" },
  { id: "cloudflare_workers", label: "Cloudflare Workers", icon: "⚡" },
  { id: "deno_deploy", label: "Deno Deploy", icon: "🦕" },
  // Edge
  { id: "edge", label: "Edge (CDN)", icon: "🌐" },
];

// Combined for backward compatibility
const DEPLOYMENT_TARGETS = [...SELF_HOSTED_TARGETS, ...CLOUD_TARGETS];

const CONTAINER_REGISTRIES = [
  { id: "dockerhub", label: "Docker Hub", icon: "🐳" },
  { id: "ghcr", label: "GitHub Container Registry", icon: "🐙" },
  { id: "ecr", label: "AWS ECR", icon: "☁️" },
  { id: "gcr", label: "Google Container Registry", icon: "☁️" },
  { id: "gar", label: "Google Artifact Registry", icon: "☁️" },
  { id: "acr", label: "Azure Container Registry", icon: "☁️" },
  { id: "quay", label: "Quay.io", icon: "📦" },
  { id: "harbor", label: "Harbor", icon: "⚓" },
  { id: "gitlab_registry", label: "GitLab Container Registry", icon: "🦊" },
  { id: "jfrog", label: "JFrog Artifactory", icon: "🐸" },
  { id: "nexus", label: "Sonatype Nexus", icon: "📦" },
  { id: "custom", label: "Custom / Self-hosted", icon: "🏠" },
];

function StepRepository({
  config,
  detectedFields,
  onChange,
}: {
  config: WizardConfig;
  detectedFields: Set<string>;
  onChange: (updates: Partial<WizardConfig>) => void;
}) {
  // Search states for multi-selects
  const [cicdSearch, setCicdSearch] = useState("");
  const [selfHostedSearch, setSelfHostedSearch] = useState("");
  const [cloudSearch, setCloudSearch] = useState("");

  // Filtered and sorted CI/CD options (selected first)
  const filteredCicd = useMemo(() => {
    const filtered = CICD_OPTIONS.filter(opt =>
      opt.label.toLowerCase().includes(cicdSearch.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      const aSelected = config.cicd.includes(a.id);
      const bSelected = config.cicd.includes(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  }, [cicdSearch, config.cicd]);

  // Filtered and sorted self-hosted targets (selected first)
  const filteredSelfHosted = useMemo(() => {
    const filtered = SELF_HOSTED_TARGETS.filter(opt =>
      opt.label.toLowerCase().includes(selfHostedSearch.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      const aSelected = config.selfHostedTargets.includes(a.id);
      const bSelected = config.selfHostedTargets.includes(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  }, [selfHostedSearch, config.selfHostedTargets]);

  // Filtered and sorted cloud targets (selected first)
  const filteredCloud = useMemo(() => {
    const filtered = CLOUD_TARGETS.filter(opt =>
      opt.label.toLowerCase().includes(cloudSearch.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      const aSelected = config.cloudTargets.includes(a.id);
      const bSelected = config.cloudTargets.includes(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  }, [cloudSearch, config.cloudTargets]);

  const toggleRepoHost = (hostId: string) => {
    const currentHosts = config.repoHosts || [];
    const isSelected = currentHosts.includes(hostId);
    
    if (isSelected) {
      // Deselect
      const newHosts = currentHosts.filter((h) => h !== hostId);
      onChange({ 
        repoHosts: newHosts,
        repoHost: newHosts[0] || "github" // Keep single host for backward compat
      });
    } else {
      // Select
      const newHosts = [...currentHosts, hostId];
      
      // Auto-select CI/CD based on repo host, but only if current CI/CD is empty or default
      // Don't override if user already selected something different
      let cicdUpdate: Partial<WizardConfig> = {};
      const hasDefaultCicd = config.cicd.length === 0 || 
        (config.cicd.length === 1 && (config.cicd[0] === "github_actions" || config.cicd[0] === "gitlab_ci"));
      if (hasDefaultCicd) {
        if (hostId === "github" && !newHosts.includes("gitlab")) {
          cicdUpdate = { cicd: ["github_actions"] };
        } else if (hostId === "gitlab" && !newHosts.includes("github")) {
          cicdUpdate = { cicd: ["gitlab_ci"] };
        }
      }
      
      onChange({ 
        repoHosts: newHosts,
        repoHost: newHosts[0], // Keep single host for backward compat
        ...cicdUpdate
      });
    }
  };
  
  const selectedHosts = config.repoHosts?.length ? config.repoHosts : (config.repoHost ? [config.repoHost] : []);
  
  return (
    <div>
      <h2 className="text-2xl font-bold">Repository Setup</h2>
      <p className="mt-2 text-muted-foreground">
        Configure host, visibility, and repo preferences.
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <label className="text-sm font-medium">
            Repository Host(s)
            {detectedFields.has("repoHost") && <DetectedBadge />}
          </label>
          <p className="text-xs text-muted-foreground mt-1">Select one or more platforms where this code will be hosted</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {REPO_HOSTS.map((host) => (
              <button
                key={host.id}
                onClick={() => toggleRepoHost(host.id)}
                className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-all ${
                  selectedHosts.includes(host.id) ? "border-primary bg-primary/5" : "hover:border-primary"
                }`}
              >
                <span>{host.icon}</span>
                <span>{host.label}</span>
              </button>
            ))}
          </div>
          {selectedHosts.includes("other") && (
            <div className="mt-3">
              <input
                type="text"
                value={config.repoHostOther || ""}
                onChange={(e) => onChange({ repoHostOther: e.target.value })}
                placeholder="e.g., Forgejo, Gogs, Azure DevOps..."
                className="w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
          {selectedHosts.length >= 2 && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
              <label className="text-sm font-medium text-amber-800 dark:text-amber-200">Why multiple repositories?</label>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Help the AI understand how you use each platform</p>
              <input
                type="text"
                value={config.multiRepoReason || ""}
                onChange={(e) => onChange({ multiRepoReason: e.target.value })}
                placeholder="e.g., GitHub for code, Gitea for deployment"
                className="mt-2 w-full rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-amber-700 dark:bg-amber-950/50"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Visibility</label>
          <ToggleOption
            label="Public Repository"
            description="Public repos unlock funding and sharing. Enable this if this is an existing public project."
            checked={config.isPublic}
            onChange={(v) => onChange({ isPublic: v })}
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            License
            {detectedFields.has("license") && <DetectedBadge />}
          </label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[
              { id: "mit", label: "MIT" },
              { id: "apache-2.0", label: "Apache 2.0" },
              { id: "gpl-3.0", label: "GPL 3.0" },
              { id: "lgpl-3.0", label: "LGPL 3.0" },
              { id: "agpl-3.0", label: "AGPL 3.0" },
              { id: "bsd-2", label: "BSD 2-Clause" },
              { id: "bsd-3", label: "BSD 3-Clause" },
              { id: "mpl-2.0", label: "MPL 2.0" },
              { id: "isc", label: "ISC" },
              { id: "unlicense", label: "Unlicense" },
              { id: "cc0", label: "CC0" },
              { id: "none", label: "None" },
              { id: "other", label: "Other" },
            ].map((license) => (
              <button
                key={license.id}
                onClick={() => onChange({ license: license.id })}
                className={`rounded-md border px-3 py-2 text-sm transition-all ${
                  config.license === license.id ? "border-primary bg-primary/5" : "hover:border-primary"
                }`}
              >
                {license.label}
              </button>
            ))}
          </div>
          {config.license === "other" && (
            <input
              type="text"
              value={config.licenseOther || ""}
              onChange={(e) => onChange({ licenseOther: e.target.value })}
              placeholder="e.g., Proprietary, WTFPL, CC BY 4.0..."
              className="mt-2 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
          {config.license && config.license !== "none" && (
            <div className="mt-3">
              <label className="text-xs text-muted-foreground">Additional license notes</label>
              <input
                type="text"
                value={config.licenseNotes || ""}
                onChange={(e) => onChange({ licenseNotes: e.target.value })}
                placeholder="e.g., I want to avoid commercial usage, Include copyright notice in files..."
                className="mt-1 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
          <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={config.staticFiles.licenseSave}
              onChange={(e) =>
                onChange({
                  staticFiles: { ...config.staticFiles, licenseSave: e.target.checked },
                  licenseSave: e.target.checked,
                })
              }
            />
            Save as default license
          </label>
        </div>

        <div>
          <label className="text-sm font-medium">Example Repository</label>
          <p className="mt-1 text-xs text-muted-foreground">
            Optionally, provide a public repo similar to this project to guide AI on style and structure.
          </p>
          <input
            type="text"
            value={config.exampleRepoUrl || ""}
            onChange={(e) => onChange({ exampleRepoUrl: e.target.value })}
            placeholder="e.g., https://github.com/org/example"
            className="mt-2 w-full rounded-lg border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="text-sm font-medium">External Documentation</label>
          <p className="mt-1 text-xs text-muted-foreground">
            Optionally, link to Confluence, Notion, GitBook, or internal wiki for additional context.
          </p>
          <input
            type="text"
            value={config.documentationUrl || ""}
            onChange={(e) => onChange({ documentationUrl: e.target.value })}
            placeholder="e.g., https://company.atlassian.net/wiki/spaces/PROJECT"
            className="mt-2 w-full rounded-lg border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-3">
          <ToggleOption
            label="Conventional Commits"
            description="Use standardized commit messages"
            checked={config.conventionalCommits}
            onChange={(v) => onChange({ conventionalCommits: v })}
          />
          <ToggleOption
            label="Semantic Versioning"
            description="Follow semver for releases"
            checked={config.semver}
            onChange={(v) => onChange({ semver: v })}
          />
          <ToggleOption
            label="Commit Signing"
            description="Require GPG/SSH signed commits"
            checked={config.commitSigning}
            onChange={(v) => onChange({ commitSigning: v })}
          />
          {/* Dependabot/Renovate moved to Security step */}
        </div>

        {/* Conditional Semver Options */}
        {config.semver && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-4">
            <p className="text-sm font-medium text-primary">Versioning Options</p>
            
            <div>
              <label className="block text-sm font-medium mb-2">Version Tag Format</label>
              <div className="flex flex-wrap gap-2">
                {VERSION_TAG_FORMATS.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => onChange({ versionTagFormat: format.id })}
                    className={`rounded-lg border px-3 py-2 text-sm transition-all ${
                      config.versionTagFormat === format.id
                        ? "border-primary bg-primary/10 ring-1 ring-primary"
                        : "hover:border-primary"
                    }`}
                    title={format.description}
                  >
                    {format.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Changelog Management</label>
              <div className="flex flex-wrap gap-2">
                {CHANGELOG_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => onChange({ changelogTool: opt.id })}
                    className={`rounded-lg border px-3 py-2 text-sm transition-all ${
                      config.changelogTool === opt.id
                        ? "border-primary bg-primary/10 ring-1 ring-primary"
                        : "hover:border-primary"
                    }`}
                    title={opt.description}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Branch Strategy */}
        <div>
          <label className="block text-sm font-medium mb-2">Branch Strategy</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {BRANCH_STRATEGIES.map((strategy) => (
              <button
                key={strategy.id}
                onClick={() => onChange({ 
                  branchStrategy: strategy.id,
                  // Auto-enable direct commits for toy projects
                  allowDirectCommits: strategy.id === "none"
                })}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all h-full ${
                  config.branchStrategy === strategy.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:border-primary"
                }`}
              >
                <span className="shrink-0">{strategy.icon}</span>
                <div className="text-left min-w-0">
                  <span className="text-sm font-medium block">{strategy.label}</span>
                  <p className="text-xs text-muted-foreground line-clamp-2">{strategy.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Default Branch */}
        <div>
          <label className="block text-sm font-medium mb-2">Default Branch</label>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_BRANCHES.map((branch) => (
              <button
                key={branch.id}
                onClick={() => onChange({ defaultBranch: branch.id })}
                className={`rounded-lg border px-4 py-2 text-sm font-mono transition-all ${
                  config.defaultBranch === branch.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:border-primary"
                }`}
              >
                {branch.label}
              </button>
            ))}
          </div>
          {config.defaultBranch === "other" && (
            <input
              type="text"
              value={config.defaultBranchOther || ""}
              onChange={(e) => onChange({ defaultBranchOther: e.target.value })}
              placeholder="Enter custom branch name"
              className="mt-2 w-full max-w-xs rounded-lg border bg-background px-4 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
        </div>

        {/* Direct Commits for Small Fixes */}
        <ToggleOption
          label="Allow direct commits for small fixes"
          description="Enable direct commits to main for typos, docs, and minor fixes (bypassing PRs)"
          checked={config.allowDirectCommits}
          onChange={(v) => onChange({ allowDirectCommits: v })}
        />

        {/* Git Worktrees for Parallel AI Sessions */}
        <div>
          <label className="block text-sm font-medium mb-2">
            🌲 Parallel AI Sessions
          </label>
          <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-4">
            <div className="flex items-start gap-3">
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  id="useGitWorktrees"
                  checked={config.useGitWorktrees}
                  onChange={(e) => onChange({ useGitWorktrees: e.target.checked })}
                  className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="useGitWorktrees" className="block text-sm font-medium cursor-pointer">
                  Use Git Worktrees for multi-agent work
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Enable if you work with multiple AI agents (Cursor, Claude, Copilot) on the same repo simultaneously.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  AI agents will be instructed to create separate git worktrees for each task, 
                  preventing branch conflicts between parallel sessions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CI/CD Selection - Multi-select */}
        <div>
          <label className="block text-sm font-medium">
            CI/CD Platform
            {detectedFields.has("cicd") && <DetectedBadge />}
          </label>
          <p className="text-xs text-muted-foreground mb-2">Select your continuous integration/deployment tools (select all that apply)</p>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={cicdSearch}
              onChange={(e) => setCicdSearch(e.target.value)}
              placeholder="Search CI/CD platforms..."
              className="w-full rounded-lg border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div className="mt-3 flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
            {filteredCicd.map((opt) => {
              const isSelected = config.cicd.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    onChange({ 
                      cicd: isSelected 
                        ? config.cicd.filter(c => c !== opt.id)
                        : [...config.cicd, opt.id]
                    });
                  }}
                  className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-all ${
                    isSelected ? "border-primary bg-primary/10 text-primary" : "hover:border-primary"
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                  {isSelected && <Check className="h-3 w-3" />}
                </button>
              );
            })}
          </div>
          
          {config.cicd.includes("other") && (
            <input
              type="text"
              value={config.cicdOther || ""}
              onChange={(e) => onChange({ cicdOther: e.target.value })}
              placeholder="Enter your CI/CD platform name"
              className="mt-3 w-full max-w-md rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
        </div>

        {/* Deployment Environment - First Question */}
        <div>
          <label className="block text-sm font-medium">Deployment Environment</label>
          <p className="text-xs text-muted-foreground mb-2">Where will this project be deployed? (select all that apply)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DEPLOYMENT_ENVIRONMENTS.map((env) => {
              const isSelected = config.deploymentEnvironment.includes(env.id);
              return (
                <button
                  key={env.id}
                  onClick={() => {
                    onChange({ 
                      deploymentEnvironment: isSelected 
                        ? config.deploymentEnvironment.filter(e => e !== env.id)
                        : [...config.deploymentEnvironment, env.id]
                    });
                  }}
                  className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all h-full ${
                    isSelected ? "border-primary bg-primary/10 ring-1 ring-primary" : "hover:border-primary"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl shrink-0">{env.icon}</span>
                    <span className="font-medium">{env.label}</span>
                    {isSelected && <span className="text-primary shrink-0">✓</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">{env.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Self-hosted Targets - Shown if self_hosted selected */}
        {config.deploymentEnvironment.includes("self_hosted") && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <label className="block text-sm font-medium">Self-hosted Deployment Targets</label>
            <p className="text-xs text-muted-foreground mb-2">How do you deploy to your own infrastructure?</p>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={selfHostedSearch}
                onChange={(e) => setSelfHostedSearch(e.target.value)}
                placeholder="Search self-hosted targets..."
                className="w-full rounded-lg border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div className="mt-3 flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
              {filteredSelfHosted.map((target) => {
                const isSelected = config.selfHostedTargets.includes(target.id);
                return (
                  <button
                    key={target.id}
                    onClick={() => {
                      onChange({ 
                        selfHostedTargets: isSelected 
                          ? config.selfHostedTargets.filter(t => t !== target.id)
                          : [...config.selfHostedTargets, target.id]
                      });
                    }}
                    className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-all ${
                      isSelected ? "border-primary bg-primary/10 text-primary" : "hover:border-primary"
                    }`}
                  >
                    <span>{target.icon}</span>
                    <span>{target.label}</span>
                    {isSelected && <Check className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Cloud Targets - Shown if cloud selected */}
        {config.deploymentEnvironment.includes("cloud") && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <label className="block text-sm font-medium">Cloud Deployment Targets</label>
            <p className="text-xs text-muted-foreground mb-2">Which cloud platforms do you deploy to?</p>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={cloudSearch}
                onChange={(e) => setCloudSearch(e.target.value)}
                placeholder="Search cloud targets..."
                className="w-full rounded-lg border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div className="mt-3 flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
              {filteredCloud.map((target) => {
                const isSelected = config.cloudTargets.includes(target.id);
                return (
                  <button
                    key={target.id}
                    onClick={() => {
                      onChange({ 
                        cloudTargets: isSelected 
                          ? config.cloudTargets.filter(t => t !== target.id)
                          : [...config.cloudTargets, target.id]
                      });
                    }}
                    className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-all ${
                      isSelected ? "border-primary bg-primary/10 text-primary" : "hover:border-primary"
                    }`}
                  >
                    <span>{target.icon}</span>
                    <span>{target.label}</span>
                    {isSelected && <Check className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Container Build Options */}
        <ToggleOption
          label="Build container image"
          description="Plan to build Docker images in this repo"
          checked={config.buildContainer}
          onChange={(v) => onChange({ buildContainer: v })}
        />

        {/* Container Registry Selection - shown if buildContainer is true */}
        {config.buildContainer && (
          <div className="ml-4 border-l-2 border-primary/30 pl-4">
            <label className="block text-sm font-medium">Container Registry</label>
            <p className="text-xs text-muted-foreground mb-2">Where will you push your container images?</p>
            <div className="flex flex-wrap gap-2">
              {CONTAINER_REGISTRIES.map((reg) => (
                <button
                  key={reg.id}
                  onClick={() => onChange({ containerRegistry: reg.id })}
                  className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-all ${
                    config.containerRegistry === reg.id ? "border-primary bg-primary/10" : "hover:border-primary"
                  }`}
                >
                  <span>{reg.icon}</span>
                  <span>{reg.label}</span>
                </button>
              ))}
            </div>
            {config.containerRegistry === "custom" && (
              <input
                type="text"
                value={config.containerRegistryOther}
                onChange={(e) => onChange({ containerRegistryOther: e.target.value })}
                placeholder="e.g., registry.example.com"
                className="mt-2 w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            )}

            {/* Docker Image Names */}
            <div className="mt-4">
              <label className="block text-sm font-medium">Docker Image Names</label>
              <p className="text-xs text-muted-foreground mb-2">
                Published image names for this project (helps AI understand deployment)
              </p>
              <input
                type="text"
                value={config.dockerImageNames}
                onChange={(e) => onChange({ dockerImageNames: e.target.value })}
                placeholder="e.g., myuser/myapp, myuser/myapp-viewer"
                className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                💡 Separate multiple images with commas. These will appear in your generated config.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECURITY STEP (FREE tier)
// ═══════════════════════════════════════════════════════════════
function StepSecurity({
  config,
  onChange,
}: {
  config: SecurityConfig;
  onChange: (updates: Partial<SecurityConfig>) => void;
}) {
  const [authProvidersSearch, setAuthProvidersSearch] = useState("");
  const [secretsSearch, setSecretsSearch] = useState("");
  const [toolingSearch, setToolingSearch] = useState("");
  const [authSearch, setAuthSearch] = useState("");
  const [dataSearch, setDataSearch] = useState("");
  const [complianceSearch, setComplianceSearch] = useState("");
  const [analyticsSearch, setAnalyticsSearch] = useState("");

  // Filter and sort functions - selected items appear first
  const filteredAuthProviders = useMemo(() => {
    const filtered = AUTH_PROVIDERS_OPTIONS.filter(opt =>
      opt.label.toLowerCase().includes(authProvidersSearch.toLowerCase()) ||
      opt.description.toLowerCase().includes(authProvidersSearch.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      const aSelected = config.authProviders.includes(a.id);
      const bSelected = config.authProviders.includes(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  }, [authProvidersSearch, config.authProviders]);

  const filteredSecrets = useMemo(() => {
    const filtered = SECRETS_MANAGEMENT_OPTIONS.filter(opt =>
      opt.label.toLowerCase().includes(secretsSearch.toLowerCase()) ||
      opt.description.toLowerCase().includes(secretsSearch.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      const aSelected = config.secretsManagement.includes(a.id);
      const bSelected = config.secretsManagement.includes(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  }, [secretsSearch, config.secretsManagement]);

  const filteredTooling = useMemo(() => {
    const filtered = SECURITY_TOOLING_OPTIONS.filter(opt =>
      opt.label.toLowerCase().includes(toolingSearch.toLowerCase()) ||
      opt.description.toLowerCase().includes(toolingSearch.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      const aSelected = config.securityTooling.includes(a.id);
      const bSelected = config.securityTooling.includes(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  }, [toolingSearch, config.securityTooling]);

  const filteredAuth = useMemo(() => {
    const filtered = AUTH_PATTERNS_OPTIONS.filter(opt =>
      opt.label.toLowerCase().includes(authSearch.toLowerCase()) ||
      opt.description.toLowerCase().includes(authSearch.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      const aSelected = config.authPatterns.includes(a.id);
      const bSelected = config.authPatterns.includes(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  }, [authSearch, config.authPatterns]);

  const filteredData = useMemo(() => {
    const filtered = DATA_HANDLING_OPTIONS.filter(opt =>
      opt.label.toLowerCase().includes(dataSearch.toLowerCase()) ||
      opt.description.toLowerCase().includes(dataSearch.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      const aSelected = config.dataHandling.includes(a.id);
      const bSelected = config.dataHandling.includes(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  }, [dataSearch, config.dataHandling]);

  const filteredCompliance = useMemo(() => {
    const filtered = COMPLIANCE_OPTIONS.filter(opt =>
      opt.label.toLowerCase().includes(complianceSearch.toLowerCase()) ||
      opt.description.toLowerCase().includes(complianceSearch.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      const aSelected = config.compliance.includes(a.id);
      const bSelected = config.compliance.includes(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  }, [complianceSearch, config.compliance]);

  const filteredAnalytics = useMemo(() => {
    const filtered = ANALYTICS_OPTIONS.filter(opt =>
      opt.label.toLowerCase().includes(analyticsSearch.toLowerCase()) ||
      opt.description.toLowerCase().includes(analyticsSearch.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      const aSelected = config.analytics.includes(a.id);
      const bSelected = config.analytics.includes(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  }, [analyticsSearch, config.analytics]);

  const toggleItem = (field: keyof SecurityConfig, id: string) => {
    const current = config[field] as string[];
    const updated = current.includes(id)
      ? current.filter(x => x !== id)
      : [...current, id];
    onChange({ [field]: updated });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Lock className="h-6 w-6 text-primary" />
        Security Configuration
      </h2>
      <p className="mt-2 text-muted-foreground">
        Configure security practices for your project.
      </p>
      
      {/* Security Warning Banner */}
      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-800 dark:text-red-200">⚠️ Never commit secrets to your repository!</p>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              Always use secure methods to manage credentials, API keys, and sensitive data.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-8">
        {/* 1. Authentication Providers */}
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
            Authentication Providers
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">Which login methods should your app support?</p>
          
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={authProvidersSearch}
              onChange={(e) => setAuthProvidersSearch(e.target.value)}
              placeholder="Search auth providers..."
              className="w-full rounded-lg border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div className="mt-3 flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
            {filteredAuthProviders.map((opt) => (
              <button
                key={opt.id}
                onClick={() => toggleItem("authProviders", opt.id)}
                className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-all ${
                  config.authProviders.includes(opt.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:border-primary"
                }`}
                title={opt.description}
              >
                {opt.label}
                {config.authProviders.includes(opt.id) && <Check className="h-3 w-3" />}
              </button>
            ))}
          </div>
          
          {/* Custom input when "other" is selected */}
          {config.authProviders.includes("other") && (
            <input
              type="text"
              value={config.authProvidersOther}
              onChange={(e) => onChange({ authProvidersOther: e.target.value })}
              placeholder="Describe your custom auth provider..."
              className="mt-3 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
        </div>

        {/* 2. Secrets Management */}
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
            Secrets Management
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">How do you manage secrets and credentials?</p>
          
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={secretsSearch}
              onChange={(e) => setSecretsSearch(e.target.value)}
              placeholder="Search secrets management..."
              className="w-full rounded-lg border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div className="mt-3 flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
            {filteredSecrets.map((opt) => (
              <button
                key={opt.id}
                onClick={() => toggleItem("secretsManagement", opt.id)}
                className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-all ${
                  config.secretsManagement.includes(opt.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:border-primary"
                }`}
                title={opt.description}
              >
                {opt.label}
                {opt.recommended && <span className="text-xs text-green-500">★</span>}
                {config.secretsManagement.includes(opt.id) && <Check className="h-3 w-3" />}
              </button>
            ))}
          </div>
          
          {/* Custom input when "other" is selected */}
          {config.secretsManagement.includes("other") && (
            <input
              type="text"
              value={config.secretsManagementOther}
              onChange={(e) => onChange({ secretsManagementOther: e.target.value })}
              placeholder="Describe your custom secrets management approach..."
              className="mt-3 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
        </div>

        {/* 3. Security Tooling */}
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</span>
            Security Tooling
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">Security scanning, dependency updates, and vulnerability detection.</p>
          
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={toolingSearch}
              onChange={(e) => setToolingSearch(e.target.value)}
              placeholder="Search security tools..."
              className="w-full rounded-lg border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div className="mt-3 flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
            {filteredTooling.map((opt) => (
              <button
                key={opt.id}
                onClick={() => toggleItem("securityTooling", opt.id)}
                className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-all ${
                  config.securityTooling.includes(opt.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:border-primary"
                }`}
                title={opt.description}
              >
                {opt.label}
                {opt.recommended && <span className="text-xs text-green-500">★</span>}
                {config.securityTooling.includes(opt.id) && <Check className="h-3 w-3" />}
              </button>
            ))}
          </div>
          
          {/* Custom input when "other" is selected */}
          {config.securityTooling.includes("other") && (
            <input
              type="text"
              value={config.securityToolingOther}
              onChange={(e) => onChange({ securityToolingOther: e.target.value })}
              placeholder="Describe your custom security tooling..."
              className="mt-3 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
        </div>

        {/* 4. Authentication Patterns */}
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">4</span>
            Authentication Patterns
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">How users and services authenticate with your application.</p>
          
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={authSearch}
              onChange={(e) => setAuthSearch(e.target.value)}
              placeholder="Search auth patterns..."
              className="w-full rounded-lg border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div className="mt-3 flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
            {filteredAuth.map((opt) => (
              <button
                key={opt.id}
                onClick={() => toggleItem("authPatterns", opt.id)}
                className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-all ${
                  config.authPatterns.includes(opt.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:border-primary"
                }`}
                title={opt.description}
              >
                {opt.label}
                {opt.recommended && <span className="text-xs text-green-500">★</span>}
                {config.authPatterns.includes(opt.id) && <Check className="h-3 w-3" />}
              </button>
            ))}
          </div>
          
          {/* Custom input when "other" is selected */}
          {config.authPatterns.includes("other") && (
            <input
              type="text"
              value={config.authPatternsOther}
              onChange={(e) => onChange({ authPatternsOther: e.target.value })}
              placeholder="Describe your custom authentication pattern..."
              className="mt-3 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
        </div>

        {/* 5. Data Handling */}
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">5</span>
            Data Handling & Compliance
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">Data protection, encryption, and compliance requirements.</p>
          
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={dataSearch}
              onChange={(e) => setDataSearch(e.target.value)}
              placeholder="Search data handling..."
              className="w-full rounded-lg border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div className="mt-3 flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
            {filteredData.map((opt) => (
              <button
                key={opt.id}
                onClick={() => toggleItem("dataHandling", opt.id)}
                className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-all ${
                  config.dataHandling.includes(opt.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:border-primary"
                }`}
                title={opt.description}
              >
                {opt.label}
                {opt.recommended && <span className="text-xs text-green-500">★</span>}
                {config.dataHandling.includes(opt.id) && <Check className="h-3 w-3" />}
              </button>
            ))}
          </div>
          
          {/* Custom input when "other" is selected */}
          {config.dataHandling.includes("other") && (
            <input
              type="text"
              value={config.dataHandlingOther}
              onChange={(e) => onChange({ dataHandlingOther: e.target.value })}
              placeholder="Describe your custom data handling policy..."
              className="mt-3 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
        </div>

        {/* 6. Compliance Standards */}
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">6</span>
            Compliance Standards
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">Regulatory compliance requirements for your application.</p>
          
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={complianceSearch}
              onChange={(e) => setComplianceSearch(e.target.value)}
              placeholder="Search compliance..."
              className="w-full rounded-lg border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div className="mt-3 flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
            {filteredCompliance.map((opt) => (
              <button
                key={opt.id}
                onClick={() => toggleItem("compliance", opt.id)}
                className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-all ${
                  config.compliance.includes(opt.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:border-primary"
                }`}
                title={opt.description}
              >
                {opt.label}
                {config.compliance.includes(opt.id) && <Check className="h-3 w-3" />}
              </button>
            ))}
          </div>
          
          {/* Custom input when "other" is selected */}
          {config.compliance.includes("other") && (
            <input
              type="text"
              value={config.complianceOther}
              onChange={(e) => onChange({ complianceOther: e.target.value })}
              placeholder="Describe your custom compliance requirements..."
              className="mt-3 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
        </div>

        {/* 7. Analytics */}
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">7</span>
            Analytics & Telemetry
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">Usage analytics and monitoring solutions.</p>
          
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={analyticsSearch}
              onChange={(e) => setAnalyticsSearch(e.target.value)}
              placeholder="Search analytics..."
              className="w-full rounded-lg border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div className="mt-3 flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
            {filteredAnalytics.map((opt) => (
              <button
                key={opt.id}
                onClick={() => toggleItem("analytics", opt.id)}
                className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-all ${
                  config.analytics.includes(opt.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:border-primary"
                }`}
                title={opt.description}
              >
                {opt.label}
                {config.analytics.includes(opt.id) && <Check className="h-3 w-3" />}
              </button>
            ))}
          </div>
          
          {/* Custom input when "other" is selected */}
          {config.analytics.includes("other") && (
            <input
              type="text"
              value={config.analyticsOther}
              onChange={(e) => onChange({ analyticsOther: e.target.value })}
              placeholder="Describe your custom analytics solution..."
              className="mt-3 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
        </div>

        {/* Additional Notes */}
        <div>
          <label className="text-sm font-medium">Additional Security Notes</label>
          <p className="text-xs text-muted-foreground mt-1">Any specific security requirements or custom practices?</p>
          <textarea
            value={config.additionalNotes}
            onChange={(e) => onChange({ additionalNotes: e.target.value })}
            placeholder="e.g., specific compliance requirements, custom security practices..."
            className="mt-2 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
          />
        </div>

        {/* Summary */}
        {(config.authProviders.length > 0 || config.secretsManagement.length > 0 || config.securityTooling.length > 0 || 
          config.authPatterns.length > 0 || config.dataHandling.length > 0 || config.compliance.length > 0 || config.analytics.length > 0) && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
            <h4 className="font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
              <Check className="h-4 w-4" />
              Security Configuration Summary
            </h4>
            <div className="mt-2 text-sm text-green-700 dark:text-green-300 space-y-1">
              {config.authProviders.length > 0 && (
                <p>• <strong>Auth Providers:</strong> {config.authProviders.length} provider(s) selected</p>
              )}
              {config.secretsManagement.length > 0 && (
                <p>• <strong>Secrets:</strong> {config.secretsManagement.length} method(s) selected</p>
              )}
              {config.securityTooling.length > 0 && (
                <p>• <strong>Tooling:</strong> {config.securityTooling.length} tool(s) selected</p>
              )}
              {config.authPatterns.length > 0 && (
                <p>• <strong>Auth Patterns:</strong> {config.authPatterns.length} pattern(s) selected</p>
              )}
              {config.dataHandling.length > 0 && (
                <p>• <strong>Data:</strong> {config.dataHandling.length} policy/policies selected</p>
              )}
              {config.compliance.length > 0 && (
                <p>• <strong>Compliance:</strong> {config.compliance.length} standard(s) selected</p>
              )}
              {config.analytics.length > 0 && (
                <p>• <strong>Analytics:</strong> {config.analytics.length} tool(s) selected</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepAIBehavior({
  selected,
  onToggle,
  planModeFrequency,
  onPlanModeFrequencyChange,
  explanationVerbosity,
  onExplanationVerbosityChange,
  accessibilityFocus,
  onAccessibilityFocusChange,
  performanceFocus,
  onPerformanceFocusChange,
  mcpServers,
  onMcpServersChange,
  attemptWorkarounds,
  onAttemptWorkaroundsChange,
  serverAccess,
  onServerAccessChange,
  sshKeyPath,
  onSshKeyPathChange,
  manualDeployment,
  onManualDeploymentChange,
  deploymentMethod,
  onDeploymentMethodChange,
  hasCicd,
  importantFiles,
  importantFilesOther,
  onImportantFilesToggle,
  onImportantFilesOtherChange,
  enableAutoUpdate,
  onAutoUpdateChange,
  includePersonalData,
  onIncludePersonalDataChange,
  userPersona,
  userSkillLevel,
  selectedLanguages,
  isLoggedIn,
}: {
  selected: string[];
  onToggle: (v: string) => void;
  planModeFrequency: string;
  onPlanModeFrequencyChange: (v: string) => void;
  explanationVerbosity: string;
  onExplanationVerbosityChange: (v: string) => void;
  accessibilityFocus: boolean;
  onAccessibilityFocusChange: (v: boolean) => void;
  performanceFocus: boolean;
  onPerformanceFocusChange: (v: boolean) => void;
  mcpServers: string;
  onMcpServersChange: (v: string) => void;
  attemptWorkarounds: boolean;
  onAttemptWorkaroundsChange: (v: boolean) => void;
  serverAccess: boolean;
  onServerAccessChange: (v: boolean) => void;
  sshKeyPath: string;
  onSshKeyPathChange: (v: string) => void;
  manualDeployment: boolean;
  onManualDeploymentChange: (v: boolean) => void;
  deploymentMethod: string;
  onDeploymentMethodChange: (v: string) => void;
  hasCicd: boolean;
  importantFiles: string[];
  importantFilesOther: string;
  onImportantFilesToggle: (v: string) => void;
  onImportantFilesOtherChange: (v: string) => void;
  enableAutoUpdate: boolean;
  onAutoUpdateChange: (v: boolean) => void;
  includePersonalData: boolean;
  onIncludePersonalDataChange: (v: boolean) => void;
  userPersona?: string | null;
  userSkillLevel?: string | null;
  selectedLanguages?: string[];
  isLoggedIn: boolean;
}) {
  const personaLabel = userPersona ? userPersona.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "Not set";
  const skillLabel = userSkillLevel ? userSkillLevel.replace(/\b\w/g, c => c.toUpperCase()) : "Not set";
  
  return (
    <div>
      <h2 className="text-2xl font-bold">AI Behavior Rules</h2>
      <p className="mt-2 text-muted-foreground">
        Define how AI assistants should behave when helping you code.
      </p>
      
      {/* Personal Data Section - Only available for signed-in users */}
      {isLoggedIn ? (
        <div className="mt-6 rounded-lg border-2 border-blue-600 bg-white p-4 shadow-sm dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-blue-200">Include Your Profile in Blueprint</h3>
              <p className="mt-1 text-sm text-gray-700 dark:text-blue-300">
                Your developer role (<strong>{personaLabel}</strong>) and skill level (<strong>{skillLabel}</strong>) 
                can be included in the generated config file. This helps the AI tailor its responses to your experience level.
              </p>
              <p className="mt-2 text-xs text-gray-600 dark:text-blue-400 italic">
                Note: This information is only used in the downloaded config file — it doesn&apos;t affect the wizard itself.
              </p>
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="includePersonalData"
                  checked={includePersonalData}
                  onChange={(e) => onIncludePersonalDataChange(e.target.checked)}
                  className="h-4 w-4 rounded border-blue-600 accent-blue-600"
                />
                <label htmlFor="includePersonalData" className="text-sm font-medium text-gray-800 dark:text-blue-200">
                  Include my role &amp; skill level in the AI config file
                </label>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-lg border-2 border-muted bg-muted/30 p-4 shadow-sm opacity-60">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-muted-foreground">Include Your Profile in Blueprint</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in to include your developer role and skill level in the generated config file.
              </p>
              <p className="mt-2 text-xs text-muted-foreground italic">
                This helps the AI tailor its responses to your experience level.
              </p>
              <div className="mt-3 flex items-center gap-3 pointer-events-none">
                <input
                  type="checkbox"
                  disabled
                  className="h-4 w-4 rounded border-muted-foreground cursor-not-allowed"
                />
                <span className="text-sm text-muted-foreground">
                  Sign in required
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Behavior Toggles */}
      <div className="mt-6 space-y-3">
        {AI_BEHAVIOR_RULES.map((rule) => (
          <ToggleOption
            key={rule.id}
            label={rule.label}
            description={rule.description}
            checked={selected.includes(rule.id)}
            onChange={() => onToggle(rule.id)}
            recommended={rule.recommended}
          />
        ))}
      </div>

      {/* Self-Improving Blueprint Option */}
      <div className="mt-3">
        <ToggleOption
          label="Enable Self-Improving Blueprint"
          description="Include an instruction for AI agents to track your coding patterns and automatically update this configuration file as you work."
          checked={enableAutoUpdate}
          onChange={onAutoUpdateChange}
        />
      </div>

      {/* Plan Mode Frequency */}
      <div className="mt-8">
        <h3 className="font-semibold">Plan Mode Frequency</h3>
        <p className="mt-1 text-sm text-muted-foreground">When should the AI enter plan mode before making changes?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PLAN_MODE_FREQUENCY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onPlanModeFrequencyChange(opt.id)}
              className={`rounded-lg border px-3 py-2 text-sm transition-all ${
                planModeFrequency === opt.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "hover:border-primary"
              }`}
              title={opt.description}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Explanation Verbosity */}
      <div className="mt-8">
        <h3 className="font-semibold">Explanation Verbosity</h3>
        <p className="mt-1 text-sm text-muted-foreground">How detailed should AI explanations be?</p>
        <div className="mt-3 flex gap-2">
          {[
            { id: "concise", label: "Concise", desc: "Brief, to the point", icon: "📝" },
            { id: "balanced", label: "Balanced", desc: "Clear with context", icon: "⚖️" },
            { id: "detailed", label: "Detailed", desc: "In-depth explanations", icon: "📚" },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => onExplanationVerbosityChange(opt.id)}
              className={`flex-1 rounded-lg border p-3 text-center transition-all ${
                explanationVerbosity === opt.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "hover:border-primary"
              }`}
            >
              <span className="text-xl">{opt.icon}</span>
              <div className="mt-1 text-sm font-medium">{opt.label}</div>
              <div className="text-xs text-muted-foreground">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Focus Areas */}
      <div className="mt-6 space-y-3">
        <h3 className="font-semibold">Focus Areas</h3>
        <ToggleOption
          label="♿ Accessibility Focus"
          description="Prioritize WCAG compliance and a11y best practices"
          checked={accessibilityFocus}
          onChange={onAccessibilityFocusChange}
        />
        <ToggleOption
          label="⚡ Performance Focus"
          description="Prioritize performance optimizations and efficiency"
          checked={performanceFocus}
          onChange={onPerformanceFocusChange}
        />
        <ToggleOption
          label="🔧 Attempt Workarounds"
          description="When stuck, try creative workarounds instead of stopping to ask"
          checked={attemptWorkarounds}
          onChange={onAttemptWorkaroundsChange}
        />
      </div>

      {/* MCP Servers */}
      <div className="mt-8">
        <h3 className="font-semibold">🔌 MCP Servers</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          List any <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Model Context Protocol</a> servers you have configured. The AI will know to use them when relevant.
        </p>
        <input
          type="text"
          value={mcpServers}
          onChange={(e) => onMcpServersChange(e.target.value)}
          placeholder="e.g. filesystem, github, postgres, docker"
          className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      {/* Server Access */}
      <div className="mt-8">
        <h3 className="font-semibold">🖥️ Infrastructure</h3>
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="serverAccess"
              checked={serverAccess}
              onChange={(e) => onServerAccessChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="serverAccess" className="text-sm cursor-pointer">
              This project requires logging into a server (SSH)
            </label>
          </div>
          {serverAccess && (
            <input
              type="text"
              value={sshKeyPath}
              onChange={(e) => onSshKeyPathChange(e.target.value)}
              placeholder="SSH key path (leave empty for default ~/.ssh/)"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          )}
          {!hasCicd && (
            <>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="manualDeployment"
                  checked={manualDeployment}
                  onChange={(e) => onManualDeploymentChange(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="manualDeployment" className="text-sm cursor-pointer">
                  I deploy manually (no CI/CD)
                </label>
              </div>
              {manualDeployment && (
                <select
                  value={deploymentMethod}
                  onChange={(e) => onDeploymentMethodChange(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select deployment method...</option>
                  <option value="portainer">Portainer (GitOps stacks)</option>
                  <option value="docker_compose">Docker Compose (manual)</option>
                  <option value="kubernetes">Kubernetes (kubectl)</option>
                  <option value="bare_metal">Bare metal (direct)</option>
                </select>
              )}
            </>
          )}
        </div>
      </div>

      {/* Important Files to Read First */}
      <div className="mt-8">
        <h3 className="font-semibold">Important Files to Read First</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Select files the AI should read to understand your project context. These are typically documentation, configuration, or architecture files.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {IMPORTANT_FILES.map((file) => (
            <button
              key={file.id}
              onClick={() => onImportantFilesToggle(file.id)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all ${
                importantFiles.includes(file.id)
                  ? "border-primary bg-primary/10"
                  : "hover:border-primary"
              }`}
            >
              <span>{file.icon}</span>
              <span>{file.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-3">
          <label className="text-xs text-muted-foreground">Other important files (comma-separated)</label>
          {(() => {
            // Language-aware placeholder hints
            const hints: string[] = [];
            if (selectedLanguages?.includes("python")) {
              hints.push("src/config.py", "requirements.txt", ".env.example");
            }
            if (selectedLanguages?.includes("typescript") || selectedLanguages?.includes("javascript")) {
              hints.push("src/config/index.ts", "tsconfig.json", ".env.example");
            }
            if (selectedLanguages?.includes("go")) {
              hints.push("cmd/main.go", "internal/config/config.go", "go.mod");
            }
            if (selectedLanguages?.includes("rust")) {
              hints.push("src/main.rs", "src/config.rs", "Cargo.toml");
            }
            if (selectedLanguages?.includes("java") || selectedLanguages?.includes("kotlin")) {
              hints.push("src/main/resources/application.yml", "pom.xml");
            }
            const placeholder = hints.length > 0 
              ? `e.g., ${hints.slice(0, 3).join(", ")}`
              : "e.g., src/config/index.ts, docs/api.md, prisma/schema.prisma";
            return (
              <input
                type="text"
                value={importantFilesOther}
                onChange={(e) => onImportantFilesOtherChange(e.target.value)}
                placeholder={placeholder}
                className="mt-1 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            );
          })()}
        </div>
      </div>
    </div>
  );
}

const COMMON_COMMANDS = [
  // Build commands - JavaScript/Node
  { cmd: "npm run build", category: "build" },
  { cmd: "pnpm build", category: "build" },
  { cmd: "yarn build", category: "build" },
  { cmd: "bun run build", category: "build" },
  { cmd: "next build", category: "build" },
  { cmd: "vite build", category: "build" },
  { cmd: "tsc", category: "build" },
  { cmd: "tsc --noEmit", category: "build" },
  { cmd: "esbuild", category: "build" },
  { cmd: "rollup -c", category: "build" },
  { cmd: "webpack", category: "build" },
  { cmd: "parcel build", category: "build" },
  // Build - Python
  { cmd: "python setup.py build", category: "build" },
  { cmd: "pip install -e .", category: "build" },
  { cmd: "poetry build", category: "build" },
  { cmd: "pdm build", category: "build" },
  { cmd: "hatch build", category: "build" },
  // Build - Go
  { cmd: "go build", category: "build" },
  { cmd: "go build ./...", category: "build" },
  { cmd: "go install", category: "build" },
  // Build - Rust
  { cmd: "cargo build", category: "build" },
  { cmd: "cargo build --release", category: "build" },
  // Build - Java/JVM
  { cmd: "mvn package", category: "build" },
  { cmd: "mvn clean install", category: "build" },
  { cmd: "gradle build", category: "build" },
  { cmd: "./gradlew build", category: "build" },
  // Build - .NET
  { cmd: "dotnet build", category: "build" },
  { cmd: "dotnet publish", category: "build" },
  // Build - Containers
  { cmd: "docker build -t app .", category: "build" },
  { cmd: "docker compose build", category: "build" },
  { cmd: "podman build -t app .", category: "build" },
  { cmd: "buildah bud -t app .", category: "build" },
  // Build - IaC
  { cmd: "terraform init", category: "build" },
  { cmd: "terraform plan", category: "build" },
  { cmd: "terragrunt run-all plan", category: "build" },
  { cmd: "pulumi preview", category: "build" },
  { cmd: "cdk synth", category: "build" },
  { cmd: "helm package .", category: "build" },
  
  // Test commands - JavaScript
  { cmd: "npm test", category: "test" },
  { cmd: "pnpm test", category: "test" },
  { cmd: "yarn test", category: "test" },
  { cmd: "bun test", category: "test" },
  { cmd: "npm test -- --coverage", category: "test" },
  { cmd: "vitest", category: "test" },
  { cmd: "vitest run", category: "test" },
  { cmd: "vitest --coverage", category: "test" },
  { cmd: "jest", category: "test" },
  { cmd: "jest --coverage", category: "test" },
  { cmd: "mocha", category: "test" },
  { cmd: "ava", category: "test" },
  // Test - E2E
  { cmd: "playwright test", category: "test" },
  { cmd: "cypress run", category: "test" },
  { cmd: "cypress open", category: "test" },
  { cmd: "puppeteer", category: "test" },
  // Test - Python
  { cmd: "pytest", category: "test" },
  { cmd: "pytest --cov", category: "test" },
  { cmd: "pytest -v", category: "test" },
  { cmd: "python -m unittest", category: "test" },
  { cmd: "tox", category: "test" },
  { cmd: "nox", category: "test" },
  // Test - Go
  { cmd: "go test ./...", category: "test" },
  { cmd: "go test -v ./...", category: "test" },
  { cmd: "go test -cover ./...", category: "test" },
  // Test - Rust
  { cmd: "cargo test", category: "test" },
  { cmd: "cargo test --all", category: "test" },
  // Test - Java
  { cmd: "mvn test", category: "test" },
  { cmd: "gradle test", category: "test" },
  { cmd: "./gradlew test", category: "test" },
  // Test - .NET
  { cmd: "dotnet test", category: "test" },
  // Test - Infrastructure
  { cmd: "terratest", category: "test" },
  { cmd: "conftest test", category: "test" },
  { cmd: "inspec exec", category: "test" },
  { cmd: "molecule test", category: "test" },
  { cmd: "kitchen test", category: "test" },
  { cmd: "helm unittest", category: "test" },
  // Test - Load/Performance
  { cmd: "k6 run", category: "test" },
  { cmd: "locust", category: "test" },
  { cmd: "artillery run", category: "test" },
  
  // Lint commands - JavaScript
  { cmd: "npm run lint", category: "lint" },
  { cmd: "eslint .", category: "lint" },
  { cmd: "eslint . --fix", category: "lint" },
  { cmd: "next lint", category: "lint" },
  { cmd: "prettier --check .", category: "lint" },
  { cmd: "prettier --write .", category: "lint" },
  { cmd: "biome check", category: "lint" },
  { cmd: "oxlint", category: "lint" },
  // Lint - Python
  { cmd: "ruff check .", category: "lint" },
  { cmd: "ruff format .", category: "lint" },
  { cmd: "black --check .", category: "lint" },
  { cmd: "flake8", category: "lint" },
  { cmd: "pylint", category: "lint" },
  { cmd: "mypy .", category: "lint" },
  { cmd: "pyright", category: "lint" },
  // Lint - Go
  { cmd: "go fmt ./...", category: "lint" },
  { cmd: "golangci-lint run", category: "lint" },
  { cmd: "go vet ./...", category: "lint" },
  // Lint - Rust
  { cmd: "cargo fmt --check", category: "lint" },
  { cmd: "cargo clippy", category: "lint" },
  // Lint - Shell
  { cmd: "shellcheck *.sh", category: "lint" },
  // Lint - IaC
  { cmd: "terraform fmt -check", category: "lint" },
  { cmd: "terraform validate", category: "lint" },
  { cmd: "tflint", category: "lint" },
  { cmd: "checkov", category: "lint" },
  { cmd: "trivy config .", category: "lint" },
  { cmd: "ansible-lint", category: "lint" },
  { cmd: "yamllint .", category: "lint" },
  { cmd: "helm lint", category: "lint" },
  { cmd: "kubeval", category: "lint" },
  { cmd: "kubeconform", category: "lint" },
  // Lint - Docker
  { cmd: "hadolint Dockerfile", category: "lint" },
  { cmd: "dockle", category: "lint" },
  
  // Dev commands
  { cmd: "npm run dev", category: "dev" },
  { cmd: "pnpm dev", category: "dev" },
  { cmd: "yarn dev", category: "dev" },
  { cmd: "bun dev", category: "dev" },
  { cmd: "next dev", category: "dev" },
  { cmd: "next dev --turbo", category: "dev" },
  { cmd: "vite", category: "dev" },
  { cmd: "vite dev", category: "dev" },
  { cmd: "nuxt dev", category: "dev" },
  { cmd: "remix dev", category: "dev" },
  { cmd: "astro dev", category: "dev" },
  // Dev - Python
  { cmd: "python app.py", category: "dev" },
  { cmd: "flask run", category: "dev" },
  { cmd: "uvicorn main:app --reload", category: "dev" },
  { cmd: "python manage.py runserver", category: "dev" },
  // Dev - Go
  { cmd: "go run .", category: "dev" },
  { cmd: "air", category: "dev" },
  // Dev - Rust
  { cmd: "cargo run", category: "dev" },
  { cmd: "cargo watch -x run", category: "dev" },
  // Dev - Containers
  { cmd: "docker compose up", category: "dev" },
  { cmd: "docker compose up -d", category: "dev" },
  { cmd: "docker compose watch", category: "dev" },
  { cmd: "podman-compose up", category: "dev" },
  // Dev - Kubernetes
  { cmd: "kubectl port-forward", category: "dev" },
  { cmd: "skaffold dev", category: "dev" },
  { cmd: "tilt up", category: "dev" },
  { cmd: "telepresence connect", category: "dev" },
  
  // Format commands - JavaScript
  { cmd: "prettier --write .", category: "format" },
  { cmd: "prettier --write 'src/**/*.{ts,tsx}'", category: "format" },
  { cmd: "npm run format", category: "format" },
  { cmd: "pnpm format", category: "format" },
  { cmd: "biome format --write .", category: "format" },
  { cmd: "dprint fmt", category: "format" },
  // Format - Python
  { cmd: "black .", category: "format" },
  { cmd: "ruff format .", category: "format" },
  { cmd: "isort .", category: "format" },
  { cmd: "autopep8 --in-place -r .", category: "format" },
  { cmd: "yapf -i -r .", category: "format" },
  // Format - Go
  { cmd: "go fmt ./...", category: "format" },
  { cmd: "gofmt -w .", category: "format" },
  { cmd: "goimports -w .", category: "format" },
  // Format - Rust
  { cmd: "cargo fmt", category: "format" },
  // Format - Other
  { cmd: "shfmt -w .", category: "format" },
  { cmd: "terraform fmt -recursive", category: "format" },

  // Typecheck commands - TypeScript
  { cmd: "tsc --noEmit", category: "typecheck" },
  { cmd: "npm run typecheck", category: "typecheck" },
  { cmd: "pnpm typecheck", category: "typecheck" },
  { cmd: "tsc -b", category: "typecheck" },
  { cmd: "vue-tsc --noEmit", category: "typecheck" },
  // Typecheck - Python
  { cmd: "mypy .", category: "typecheck" },
  { cmd: "pyright", category: "typecheck" },
  { cmd: "pyre check", category: "typecheck" },
  // Typecheck - Go (static analysis)
  { cmd: "go vet ./...", category: "typecheck" },
  { cmd: "staticcheck ./...", category: "typecheck" },
  // Typecheck - Rust
  { cmd: "cargo check", category: "typecheck" },

  // Clean commands
  { cmd: "npm run clean", category: "clean" },
  { cmd: "rm -rf node_modules", category: "clean" },
  { cmd: "rm -rf dist", category: "clean" },
  { cmd: "rm -rf .next", category: "clean" },
  { cmd: "rm -rf build", category: "clean" },
  { cmd: "rm -rf coverage", category: "clean" },
  { cmd: "pnpm clean", category: "clean" },
  // Clean - Python
  { cmd: "rm -rf __pycache__", category: "clean" },
  { cmd: "rm -rf .pytest_cache", category: "clean" },
  { cmd: "rm -rf .mypy_cache", category: "clean" },
  { cmd: "find . -name '*.pyc' -delete", category: "clean" },
  // Clean - Go
  { cmd: "go clean -cache", category: "clean" },
  { cmd: "go clean -testcache", category: "clean" },
  // Clean - Rust
  { cmd: "cargo clean", category: "clean" },
  // Clean - Containers
  { cmd: "docker system prune -af", category: "clean" },
  { cmd: "docker compose down -v", category: "clean" },

  // Pre-commit hooks
  { cmd: "npx husky install", category: "preCommit" },
  { cmd: "npx husky add .husky/pre-commit", category: "preCommit" },
  { cmd: "pnpm dlx husky install", category: "preCommit" },
  { cmd: "lefthook install", category: "preCommit" },
  { cmd: "pre-commit install", category: "preCommit" },
  { cmd: "pre-commit run --all-files", category: "preCommit" },
  { cmd: "lint-staged", category: "preCommit" },
  { cmd: "npx lint-staged", category: "preCommit" },
  { cmd: "simple-git-hooks", category: "preCommit" },

  // Other/Misc commands
  { cmd: "npm run storybook", category: "other" },
  { cmd: "prisma db push", category: "other" },
  { cmd: "prisma generate", category: "other" },
  { cmd: "prisma migrate dev", category: "other" },
  { cmd: "drizzle-kit push", category: "other" },
  // Deploy
  { cmd: "terraform apply", category: "other" },
  { cmd: "pulumi up", category: "other" },
  { cmd: "cdk deploy", category: "other" },
  { cmd: "ansible-playbook", category: "other" },
  { cmd: "helm install", category: "other" },
  { cmd: "helm upgrade --install", category: "other" },
  { cmd: "kubectl apply -f", category: "other" },
  { cmd: "argocd app sync", category: "other" },
  { cmd: "flux reconcile", category: "other" },
];

function StepCommands({
  config,
  onChange,
}: {
  config: CommandsConfig;
  onChange: (updates: Partial<CommandsConfig>) => void;
}) {
  const [searches, setSearches] = useState<Record<string, string>>({ build: "", test: "", lint: "", dev: "", format: "", typecheck: "", clean: "", preCommit: "", other: "" });
  const [newCommand, setNewCommand] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  const allSelected = [
    ...(config.build ? [config.build] : []),
    ...(config.test ? [config.test] : []),
    ...(config.lint ? [config.lint] : []),
    ...(config.dev ? [config.dev] : []),
    ...(config.format ? [config.format] : []),
    ...(config.typecheck ? [config.typecheck] : []),
    ...(config.clean ? [config.clean] : []),
    ...(config.preCommit ? [config.preCommit] : []),
    ...config.additional,
  ];
  
  const toggleCommand = (cmd: string, category: string) => {
    if (category === "build") {
      onChange({ build: config.build === cmd ? "" : cmd });
    } else if (category === "test") {
      onChange({ test: config.test === cmd ? "" : cmd });
    } else if (category === "lint") {
      onChange({ lint: config.lint === cmd ? "" : cmd });
    } else if (category === "dev") {
      onChange({ dev: config.dev === cmd ? "" : cmd });
    } else if (category === "format") {
      onChange({ format: config.format === cmd ? "" : cmd });
    } else if (category === "typecheck") {
      onChange({ typecheck: config.typecheck === cmd ? "" : cmd });
    } else if (category === "clean") {
      onChange({ clean: config.clean === cmd ? "" : cmd });
    } else if (category === "preCommit") {
      onChange({ preCommit: config.preCommit === cmd ? "" : cmd });
    } else {
      const exists = config.additional.includes(cmd);
      onChange({ additional: exists ? config.additional.filter(c => c !== cmd) : [...config.additional, cmd] });
    }
  };
  
  const isSelected = (cmd: string) => allSelected.includes(cmd);
  
  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };
  
  const categories = [
    { id: "build", label: "Build", desc: "Compile / bundle" },
    { id: "test", label: "Test", desc: "Run tests" },
    { id: "lint", label: "Lint", desc: "Check code quality" },
    { id: "dev", label: "Dev", desc: "Development server" },
    { id: "format", label: "Format", desc: "Code formatting" },
    { id: "typecheck", label: "Typecheck", desc: "Type checking" },
    { id: "clean", label: "Clean", desc: "Clean build artifacts" },
    { id: "preCommit", label: "Pre-commit", desc: "Git hooks" },
    { id: "other", label: "Other", desc: "Deploy, storybook, etc." },
  ] as const;

  return (
    <div>
      <h2 className="text-2xl font-bold">Commands</h2>
      <p className="mt-2 text-muted-foreground">
        Select your project commands for each category. Each has its own search.
      </p>

      <div className="mt-4 space-y-3">
        {categories.map(cat => {
          const catCmds = COMMON_COMMANDS.filter(c => c.category === cat.id);
          const search = searches[cat.id] || "";
          const filteredCmds = catCmds.filter(c => 
            c.cmd.toLowerCase().includes(search.toLowerCase())
          );
          const isExpanded = expandedCategories.includes(cat.id);
          const selectedInCat = cat.id === "build" ? config.build 
            : cat.id === "test" ? config.test 
            : cat.id === "lint" ? config.lint 
            : cat.id === "dev" ? config.dev 
            : cat.id === "format" ? config.format
            : cat.id === "typecheck" ? config.typecheck
            : cat.id === "clean" ? config.clean
            : cat.id === "preCommit" ? config.preCommit
            : null;
          
          return (
            <div key={cat.id} className="rounded-lg border overflow-hidden">
              <button
                onClick={() => toggleCategory(cat.id)}
                className="flex w-full items-center justify-between bg-muted/30 px-4 py-3 hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{cat.label}</span>
                  <span className="text-xs text-muted-foreground">{cat.desc}</span>
                  {selectedInCat && (
                    <code className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">{selectedInCat}</code>
                  )}
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              {isExpanded && (
                <div className="p-3 border-t">
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={search}
                      onChange={(e) => setSearches(prev => ({ ...prev, [cat.id]: e.target.value }))}
                      placeholder={`Search ${cat.label.toLowerCase()} commands...`}
                      className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    {filteredCmds.slice(0, 20).map(c => (
                      <button
                        key={c.cmd}
                        onClick={() => toggleCommand(c.cmd, c.category)}
                        className={`rounded-full border px-3 py-1 text-xs font-mono transition-all ${
                          isSelected(c.cmd) ? "border-primary bg-primary/10 text-primary" : "hover:border-primary"
                        }`}
                      >
                        {c.cmd}
                      </button>
                    ))}
                    {filteredCmds.length > 20 && (
                      <span className="text-xs text-muted-foreground self-center">
                        +{filteredCmds.length - 20} more (use search)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="rounded-lg border p-3">
          <label className="text-sm font-medium">Add custom command</label>
          <div className="mt-2 flex gap-2">
            <input
              value={newCommand}
              onChange={(e) => setNewCommand(e.target.value)}
              placeholder="e.g., npm run migrate"
              className="flex-1 rounded-md border bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newCommand.trim()) {
                  onChange({ additional: [...config.additional, newCommand.trim()] });
                  setNewCommand("");
                }
              }}
            />
            <Button
              variant="secondary"
              disabled={!newCommand.trim()}
              onClick={() => {
                onChange({ additional: [...config.additional, newCommand.trim()] });
                setNewCommand("");
              }}
            >
              Add
            </Button>
          </div>
        </div>

        {config.additional.length > 0 && (
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Custom commands:</p>
            <div className="flex flex-wrap gap-2">
              {config.additional.map((c, idx) => (
                <button
                  key={`${c}-${idx}`}
                  onClick={() => onChange({ additional: config.additional.filter((_, i) => i !== idx) })}
                  className="rounded-full bg-primary/10 px-3 py-1 font-mono text-xs text-primary hover:bg-red-100 hover:text-red-600"
                  title="Click to remove"
                >
                  {c} ×
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={config.savePreferences}
            onChange={(e) => onChange({ savePreferences: e.target.checked })}
          />
          Save these commands as defaults
        </label>
      </div>
    </div>
  );
}

function StepCodeStyle({
  config,
  onChange,
  selectedLanguages,
}: {
  config: CodeStyleConfig;
  onChange: (updates: Partial<CodeStyleConfig>) => void;
  selectedLanguages: string[];
}) {
  const namingOptions = [
    { id: "language_default", label: "Follow language conventions", desc: "Use idiomatic style for selected language(s)" },
    { id: "camelCase", label: "camelCase", desc: "JavaScript, TypeScript, Java" },
    { id: "snake_case", label: "snake_case", desc: "Python, Ruby, Rust, Go" },
    { id: "PascalCase", label: "PascalCase", desc: "C#, .NET classes" },
    { id: "kebab-case", label: "kebab-case", desc: "CSS, HTML attributes, URLs" },
  ];

  // Get language-specific hints
  const getLanguageHint = () => {
    if (selectedLanguages.length === 0) return null;
    const hints: Record<string, string> = {
      python: "Python typically uses snake_case for functions/variables, PascalCase for classes",
      typescript: "TypeScript typically uses camelCase for variables, PascalCase for types/interfaces",
      javascript: "JavaScript typically uses camelCase for variables, PascalCase for classes",
      go: "Go uses camelCase for private, PascalCase for exported",
      rust: "Rust uses snake_case for functions/variables, PascalCase for types",
      java: "Java uses camelCase for methods/variables, PascalCase for classes",
      csharp: "C# uses PascalCase for public members, camelCase with _ prefix for private",
      ruby: "Ruby uses snake_case for methods/variables, PascalCase for classes",
      php: "PHP uses camelCase or snake_case depending on framework (PSR-12 recommends camelCase)",
      kotlin: "Kotlin uses camelCase for functions/variables, PascalCase for classes",
    };
    for (const lang of selectedLanguages) {
      if (hints[lang]) return hints[lang];
    }
    return null;
  };

  const languageHint = getLanguageHint();

  return (
    <div>
      <h2 className="text-2xl font-bold">Code Style</h2>
      <p className="mt-2 text-muted-foreground">
        Capture naming and style conventions to guide AI output.
      </p>

      {selectedLanguages.length === 0 && (
        <div className="mt-4 rounded-lg border-2 border-amber-500 bg-white p-3 shadow-sm dark:border-yellow-500/50 dark:bg-yellow-900/20">
          <p className="text-sm font-medium text-amber-800 dark:text-yellow-200">
            ⚠️ No languages selected. Go back to the Tech Stack step to select at least one language, 
            or enable "Let AI decide" for best results.
          </p>
        </div>
      )}

      {languageHint && (
        <div className="mt-4 rounded-lg border-2 border-blue-500 bg-white p-3 shadow-sm dark:border-blue-500/50 dark:bg-blue-900/20">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
            💡 {languageHint}
          </p>
        </div>
      )}

      <div className="mt-4 space-y-4">
        <div>
          <label className="text-sm font-medium">Naming convention</label>
          <div className="mt-2 space-y-2">
            {namingOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onChange({ naming: opt.id })}
                className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all ${
                  config.naming === opt.id ? "border-primary bg-primary/5" : "hover:border-primary"
                }`}
              >
                <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  config.naming === opt.id ? "border-primary bg-primary text-white" : "border-muted-foreground"
                }`}>
                  {config.naming === opt.id && <Check className="h-3 w-3" />}
                </div>
                <div>
                  <span className="font-medium">{opt.label}</span>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Error Handling Pattern */}
        <div>
          <label className="text-sm font-medium">Error Handling Pattern</label>
          <p className="mt-1 text-xs text-muted-foreground">How should errors be handled in this project? Click again to deselect.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ERROR_HANDLING_PATTERNS.map((pattern) => (
              <button
                key={pattern.id}
                onClick={() => onChange({ errorHandling: config.errorHandling === pattern.id ? "" : pattern.id })}
                className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                  config.errorHandling === pattern.id
                    ? "border-primary bg-primary/10"
                    : "hover:border-primary"
                }`}
              >
                {pattern.label}
              </button>
            ))}
          </div>
          {config.errorHandling === "other" && (
            <input
              type="text"
              value={config.errorHandlingOther}
              onChange={(e) => onChange({ errorHandlingOther: e.target.value })}
              placeholder="e.g., Domain-specific errors, Monad-based, Custom error classes..."
              className="mt-2 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
        </div>

        {/* Logging Conventions */}
        <div>
          <label className="text-sm font-medium">Logging Conventions</label>
          <p className="mt-1 text-xs text-muted-foreground">How should logging be handled? Click again to deselect.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              { id: "structured_json", label: "Structured JSON" },
              { id: "console_log", label: "Console.log (dev)" },
              { id: "log_levels", label: "Log Levels (debug/info/warn/error)" },
              { id: "pino", label: "Pino" },
              { id: "winston", label: "Winston" },
              { id: "bunyan", label: "Bunyan" },
              { id: "python_logging", label: "Python logging" },
              { id: "log4j", label: "Log4j / SLF4J" },
              { id: "serilog", label: "Serilog" },
              { id: "opentelemetry", label: "OpenTelemetry" },
              { id: "other", label: "Other" },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => onChange({ loggingConventions: config.loggingConventions === option.id ? "" : option.id })}
                className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                  config.loggingConventions === option.id
                    ? "border-primary bg-primary/10"
                    : "hover:border-primary"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {config.loggingConventions === "other" && (
            <input
              type="text"
              value={config.loggingConventionsOther || ""}
              onChange={(e) => onChange({ loggingConventionsOther: e.target.value })}
              placeholder="e.g., Custom logger, file-based logging, centralized logging service..."
              className="mt-2 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
        </div>

        {/* Max file length */}
        <div>
          <label className="text-sm font-medium">Max file length (lines)</label>
          <p className="mt-1 text-xs text-muted-foreground">Suggest splitting files when they exceed this length (100-10,000)</p>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="range"
              min="100"
              max="10000"
              step="100"
              value={config.maxFileLength}
              onChange={(e) => onChange({ maxFileLength: parseInt(e.target.value) })}
              className="flex-1"
            />
            <input
              type="number"
              min="100"
              max="10000"
              value={config.maxFileLength}
              onChange={(e) => onChange({ maxFileLength: Math.min(10000, Math.max(100, parseInt(e.target.value) || 300)) })}
              className="w-20 rounded border bg-background px-2 py-1 text-sm font-mono"
            />
          </div>
        </div>

        {/* Import order */}
        <div>
          <label className="text-sm font-medium">Import order preference</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              { id: "", label: "Skip", desc: "Don't specify" },
              { id: "grouped", label: "Grouped", desc: "External → internal → relative" },
              { id: "sorted", label: "Alphabetical", desc: "Sort all imports A-Z" },
              { id: "natural", label: "Natural", desc: "Leave as written" },
            ].map((opt) => (
              <button
                key={opt.id || "skip"}
                onClick={() => onChange({ importOrder: opt.id })}
                className={`rounded-lg border px-3 py-2 transition-all ${
                  config.importOrder === opt.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:border-primary"
                }`}
              >
                <span className="text-sm font-medium">{opt.label}</span>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Comment language */}
        <div>
          <label className="text-sm font-medium">Comment language</label>
          <p className="mt-1 text-xs text-muted-foreground">Language for code comments and documentation</p>
          <select
            value={config.commentLanguage}
            onChange={(e) => onChange({ commentLanguage: e.target.value })}
            className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Skip</option>
            <option value="english">🇬🇧 English</option>
            <option value="spanish">🇪🇸 Spanish (Español)</option>
            <option value="french">🇫🇷 French (Français)</option>
            <option value="german">🇩🇪 German (Deutsch)</option>
            <option value="italian">🇮🇹 Italian (Italiano)</option>
            <option value="portuguese">🇵🇹 Portuguese (Português)</option>
            <option value="brazilian_portuguese">🇧🇷 Brazilian Portuguese</option>
            <option value="dutch">🇳🇱 Dutch (Nederlands)</option>
            <option value="russian">🇷🇺 Russian (Русский)</option>
            <option value="chinese_simplified">🇨🇳 Chinese Simplified (简体中文)</option>
            <option value="chinese_traditional">🇹🇼 Chinese Traditional (繁體中文)</option>
            <option value="japanese">🇯🇵 Japanese (日本語)</option>
            <option value="korean">🇰🇷 Korean (한국어)</option>
            <option value="arabic">🇸🇦 Arabic (العربية)</option>
            <option value="hebrew">🇮🇱 Hebrew (עברית)</option>
            <option value="hindi">🇮🇳 Hindi (हिन्दी)</option>
            <option value="bengali">🇧🇩 Bengali (বাংলা)</option>
            <option value="urdu">🇵🇰 Urdu (اردو)</option>
            <option value="thai">🇹🇭 Thai (ไทย)</option>
            <option value="vietnamese">🇻🇳 Vietnamese (Tiếng Việt)</option>
            <option value="indonesian">🇮🇩 Indonesian (Bahasa Indonesia)</option>
            <option value="malay">🇲🇾 Malay (Bahasa Melayu)</option>
            <option value="filipino">🇵🇭 Filipino (Tagalog)</option>
            <option value="polish">🇵🇱 Polish (Polski)</option>
            <option value="czech">🇨🇿 Czech (Čeština)</option>
            <option value="slovak">🇸🇰 Slovak (Slovenčina)</option>
            <option value="hungarian">🇭🇺 Hungarian (Magyar)</option>
            <option value="romanian">🇷🇴 Romanian (Română)</option>
            <option value="bulgarian">🇧🇬 Bulgarian (Български)</option>
            <option value="ukrainian">🇺🇦 Ukrainian (Українська)</option>
            <option value="greek">🇬🇷 Greek (Ελληνικά)</option>
            <option value="turkish">🇹🇷 Turkish (Türkçe)</option>
            <option value="swedish">🇸🇪 Swedish (Svenska)</option>
            <option value="norwegian">🇳🇴 Norwegian (Norsk)</option>
            <option value="danish">🇩🇰 Danish (Dansk)</option>
            <option value="finnish">🇫🇮 Finnish (Suomi)</option>
            <option value="estonian">🇪🇪 Estonian (Eesti)</option>
            <option value="latvian">🇱🇻 Latvian (Latviešu)</option>
            <option value="lithuanian">🇱🇹 Lithuanian (Lietuvių)</option>
            <option value="slovenian">🇸🇮 Slovenian (Slovenščina)</option>
            <option value="croatian">🇭🇷 Croatian (Hrvatski)</option>
            <option value="serbian">🇷🇸 Serbian (Српски)</option>
            <option value="persian">🇮🇷 Persian/Farsi (فارسی)</option>
            <option value="afrikaans">🇿🇦 Afrikaans</option>
            <option value="swahili">🇳🇬 Swahili (Kiswahili)</option>
            <option value="latam_spanish">🇲🇽 Latin American Spanish</option>
            <option value="canadian_french">🇨🇦 Canadian French</option>
            <option value="austrian_german">🇦🇹 Austrian German</option>
            <option value="swiss_german">🇨🇭 Swiss German</option>
            <option value="other">🔤 Other (specify below)</option>
          </select>
          {config.commentLanguage === "other" && (
            <input
              type="text"
              placeholder="Enter language name..."
              onChange={(e) => onChange({ commentLanguage: e.target.value || "other" })}
              className="mt-2 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
        </div>

        {/* Documentation style */}
        <div>
          <label className="text-sm font-medium">Documentation style</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              { id: "", label: "None / Language default" },
              { id: "jsdoc", label: "JSDoc" },
              { id: "tsdoc", label: "TSDoc" },
              { id: "pydoc", label: "Python docstrings" },
              { id: "godoc", label: "Go doc comments" },
              { id: "rustdoc", label: "Rust doc (///)" },
              { id: "javadoc", label: "Javadoc" },
              { id: "xmldoc", label: "C# XML docs" },
            ].map((opt) => (
              <button
                key={opt.id || "none"}
                onClick={() => onChange({ docStyle: opt.id })}
                className={`rounded-lg border px-3 py-2 text-sm transition-all ${
                  config.docStyle === opt.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:border-primary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Additional style notes</label>
          <textarea
            value={config.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="e.g., prefer named exports, keep functions pure, avoid default exports, max line length 100..."
            rows={4}
            className="mt-2 w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={config.savePreferences}
            onChange={(e) => onChange({ savePreferences: e.target.checked })}
          />
          Save as default code style
        </label>
      </div>
    </div>
  );
}

const BOUNDARY_OPTIONS = [
  // File operations
  "Delete files",
  "Create new files",
  "Rename/move files",
  // Code changes
  "Rewrite large sections",
  "Refactor architecture",
  "Change dependencies",
  "Modify database schema",
  "Update API contracts",
  // Infrastructure
  "Touch CI pipelines",
  "Modify Docker config",
  "Change environment vars",
  // Documentation
  "Update docs automatically",
  "Edit README",
  "Modify comments",
  // Security
  "Handle secrets/credentials",
  "Modify auth logic",
  // Testing
  "Delete failing tests",
  "Skip tests temporarily",
];

function StepBoundaries({
  config,
  onChange,
}: {
  config: BoundariesConfig;
  onChange: (updates: Partial<BoundariesConfig>) => void;
}) {
  const toggle = (bucket: "always" | "ask" | "never", value: string) => {
    const current = config[bucket];
    if (!current) return;
    const exists = current.includes(value);
    const updated = exists ? current.filter((v) => v !== value) : [...current, value];
    onChange({ [bucket]: updated } as Partial<BoundariesConfig>);
  };

  // Get options already selected in other buckets
  const getUsedOptions = (excludeBucket: "always" | "ask" | "never") => {
    const used = new Set<string>();
    if (excludeBucket !== "always") config.always?.forEach(o => used.add(o));
    if (excludeBucket !== "ask") config.ask?.forEach(o => used.add(o));
    if (excludeBucket !== "never") config.never?.forEach(o => used.add(o));
    return used;
  };

  const customFieldMap = {
    always: "customAlways" as const,
    ask: "customAsk" as const,
    never: "customNever" as const,
  };

  const renderBucket = (title: string, bucket: "always" | "ask" | "never", description: string) => {
    const usedInOther = getUsedOptions(bucket);
    const availableOptions = BOUNDARY_OPTIONS.filter(opt => !usedInOther.has(opt));
    const selectedInBucket = config[bucket] || [];
    const customField = customFieldMap[bucket];
    const customValue = config[customField] || "";
    
    return (
      <div className="rounded-lg border p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">{title}</p>
          <span className="text-xs text-muted-foreground">{description}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {availableOptions.length === 0 && selectedInBucket.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">All options assigned to other categories</p>
          ) : (
            <>
              {/* Show selected items first */}
              {selectedInBucket.map((opt) => (
                <button
                  key={`${bucket}-${opt}`}
                  onClick={() => toggle(bucket, opt)}
                  className="rounded-full border border-primary bg-primary/10 px-3 py-1 text-xs"
                >
                  {opt} ✓
                </button>
              ))}
              {/* Show available unselected items */}
              {availableOptions.filter(opt => !selectedInBucket.includes(opt)).map((opt) => (
                <button
                  key={`${bucket}-${opt}`}
                  onClick={() => toggle(bucket, opt)}
                  className="rounded-full border px-3 py-1 text-xs hover:border-primary"
                >
                  {opt}
                </button>
              ))}
            </>
          )}
        </div>
        {/* Custom input for other items */}
        <input
          type="text"
          placeholder="Add custom (comma-separated)..."
          value={customValue}
          onChange={(e) => onChange({ [customField]: e.target.value })}
          className="mt-2 w-full rounded border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-2xl font-bold">Boundaries</h2>
      <p className="mt-2 text-muted-foreground">Define what AI should always do, ask first, or never do. Each option can only be in one category.</p>
      <div className="mt-4 space-y-3">
        {renderBucket("Always do", "always", "AI will do these automatically")}
        {renderBucket("Ask first", "ask", "AI will ask before doing")}
        {renderBucket("Never do", "never", "AI will refuse to do")}
      </div>
      <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={config.savePreferences}
          onChange={(e) => onChange({ savePreferences: e.target.checked })}
        />
        Save boundaries as defaults in my profile
      </label>
    </div>
  );
}

const TEST_FRAMEWORKS = [
  // JavaScript/TypeScript
  "jest", "vitest", "mocha", "ava", "tap", "bun:test",
  // E2E/Integration
  "playwright", "cypress", "puppeteer", "selenium", "webdriverio", "testcafe",
  // React/Frontend
  "rtl", "enzyme", "storybook", "chromatic",
  // API/Mocking
  "msw", "supertest", "pact", "dredd", "karate", "postman", "insomnia",
  // Python
  "pytest", "unittest", "nose2", "hypothesis", "behave", "robot",
  // Go
  "go-test", "testify", "ginkgo", "gomega",
  // Java/JVM
  "junit", "testng", "mockito", "spock", "cucumber-jvm",
  // Ruby
  "rspec", "minitest", "capybara", "factory_bot",
  // .NET
  "xunit", "nunit", "mstest", "specflow",
  // Infrastructure/DevOps
  "terratest", "conftest", "opa", "inspec", "serverspec", "molecule", "kitchen", "goss",
  // Kubernetes
  "kubetest", "kuttl", "chainsaw", "helm-unittest",
  // Security
  "owasp-zap", "burpsuite", "nuclei", "semgrep",
  // Load/Performance
  "k6", "locust", "jmeter", "artillery", "gatling", "vegeta", "wrk", "ab",
  // Chaos Engineering
  "chaos-mesh", "litmus", "gremlin", "toxiproxy",
  // Contract Testing
  "pact", "spring-cloud-contract", "specmatic",
  // BDD
  "cucumber", "behave", "gauge", "concordion",
  // Mutation Testing
  "stryker", "pitest", "mutmut",
  // Fuzzing
  "go-fuzz", "afl", "libfuzzer", "jazzer",
];

const TEST_LEVELS = [
  { id: "smoke", label: "Smoke", desc: "Quick sanity checks" },
  { id: "unit", label: "Unit", desc: "Individual functions/components" },
  { id: "integration", label: "Integration", desc: "Component interactions" },
  { id: "e2e", label: "E2E", desc: "Full user flows" },
];

function StepTesting({
  config,
  onChange,
}: {
  config: TestingStrategyConfig;
  onChange: (updates: Partial<TestingStrategyConfig>) => void;
}) {
  const [search, setSearch] = useState("");
  const [showAllFrameworks, setShowAllFrameworks] = useState(false);
  
  const filtered = TEST_FRAMEWORKS.filter((f) => f.toLowerCase().includes(search.toLowerCase()));
  // Show selected frameworks first, then others - limit to 16 initially
  const sortedFiltered = useMemo(() => {
    const selected = filtered.filter(fw => config.frameworks.includes(fw));
    const unselected = filtered.filter(fw => !config.frameworks.includes(fw));
    return [...selected, ...unselected];
  }, [filtered, config.frameworks]);
  
  const visibleFrameworks = showAllFrameworks ? sortedFiltered : sortedFiltered.slice(0, 16);
  const hasMoreFrameworks = sortedFiltered.length > 16 && !showAllFrameworks;
  
  const toggleLevel = (lvl: string) => {
    const exists = config.levels.includes(lvl);
    onChange({
      levels: exists ? config.levels.filter((l) => l !== lvl) : [...config.levels, lvl],
    });
  };
  
  const toggleFramework = (fw: string) => {
    const exists = config.frameworks.includes(fw);
    onChange({
      frameworks: exists ? config.frameworks.filter((f) => f !== fw) : [...config.frameworks, fw],
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold">Testing Strategy</h2>
      <p className="mt-2 text-muted-foreground">Document how tests should run and what good coverage looks like.</p>

      <div className="mt-4 space-y-4">
        <div>
          <label className="text-sm font-medium">Test Levels (select all that apply)</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {TEST_LEVELS.map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => toggleLevel(lvl.id)}
                className={`flex flex-col items-start rounded-md border p-3 text-left text-sm transition-all ${
                  config.levels.includes(lvl.id) ? "border-primary bg-primary/5" : "hover:border-primary"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-medium">{lvl.label}</span>
                  {config.levels.includes(lvl.id) && <Check className="h-4 w-4 text-primary" />}
                </div>
                <span className="text-xs text-muted-foreground">{lvl.desc}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium" htmlFor="coverage-target">
              Coverage target
            </label>
            <span className="text-lg font-bold text-primary">{config.coverage}%</span>
          </div>
          <input
            id="coverage-target"
            type="range"
            min="0"
            max="100"
            step="5"
            value={config.coverage}
            onChange={(e) => onChange({ coverage: parseInt(e.target.value, 10) })}
            className="mt-2 w-full accent-primary"
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium">Frameworks</label>
          <div className="relative mb-2 mt-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowAllFrameworks(true); }}
              placeholder="Search testing frameworks..."
              className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="relative">
            <div className="flex flex-wrap gap-2">
              {visibleFrameworks.map((fw) => (
                <button
                  key={fw}
                  onClick={() => toggleFramework(fw)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    config.frameworks.includes(fw) ? "border-primary bg-primary/10" : "hover:border-primary"
                  }`}
                >
                  {fw}
                </button>
              ))}
            </div>
            
            {/* Blur overlay and Load More button */}
            {hasMoreFrameworks && (
              <div className="relative mt-2">
                <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
                <button
                  onClick={() => setShowAllFrameworks(true)}
                  className="w-full rounded-md border border-dashed border-muted-foreground/30 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  Show {sortedFiltered.length - 16} more frameworks...
                </button>
              </div>
            )}
            
            {showAllFrameworks && sortedFiltered.length > 16 && (
              <button
                onClick={() => setShowAllFrameworks(false)}
                className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-primary"
              >
                Show less
              </button>
            )}
          </div>
        </div>
        
        {/* Testing Practices */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Testing Practices</label>
          <ToggleOption
            label="🧪 Test-Driven Development (TDD)"
            description="Write tests before implementation"
            checked={config.tddPreference}
            onChange={(v) => onChange({ tddPreference: v })}
          />
          <ToggleOption
            label="📸 Snapshot Testing"
            description="Captures expected output (HTML, JSON, etc.) and compares future runs against it. Useful for UI components, API responses, serialization."
            checked={config.snapshotTesting}
            onChange={(v) => onChange({ snapshotTesting: v })}
          />
        </div>

        {/* Mock Strategy */}
        <div>
          <label className="text-sm font-medium">Mock Strategy</label>
          <div className="mt-2 flex gap-2">
            {[
              { id: "minimal", label: "Minimal", desc: "Only mock external deps" },
              { id: "comprehensive", label: "Comprehensive", desc: "Mock for isolation" },
              { id: "none", label: "None", desc: "No mocking preferred" },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => onChange({ mockStrategy: opt.id })}
                className={`flex-1 rounded-lg border p-2 text-center transition-all ${
                  config.mockStrategy === opt.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:border-primary"
                }`}
              >
                <div className="text-sm font-medium">{opt.label}</div>
                <div className="text-xs text-muted-foreground">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Notes</label>
          <textarea
            value={config.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            rows={3}
            placeholder="e.g., run e2e on main only, use msw for network mocking"
            className="mt-1 w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={config.savePreferences}
            onChange={(e) => onChange({ savePreferences: e.target.checked })}
          />
          Save testing defaults to profile
        </label>
      </div>
    </div>
  );
}

function StaticFileEditor({
  label,
  description,
  enabled,
  onEnable,
  content,
  onContentChange,
  saveChecked,
  onSaveToggle,
  placeholder,
  minHeight = "150px",
}: {
  label: string;
  description: string;
  enabled: boolean;
  onEnable: (v: boolean) => void;
  content?: string;
  onContentChange?: (v: string) => void;
  saveChecked: boolean;
  onSaveToggle: (v: boolean) => void;
  placeholder?: string;
  minHeight?: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => onEnable(!enabled)}
          className="flex items-center gap-3 text-left"
        >
          <div className={`flex h-5 w-5 items-center justify-center rounded border ${
            enabled ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
          }`}>
            {enabled && <Check className="h-3 w-3" />}
          </div>
          <div>
            <p className="font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </button>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={saveChecked}
            onChange={(e) => onSaveToggle(e.target.checked)}
          />
          Save to profile
        </label>
      </div>
      {enabled && onContentChange && (
        <div className="mt-3">
          <CodeEditor
            value={content || ""}
            onChange={onContentChange}
            placeholder={placeholder}
            minHeight={minHeight}
          />
        </div>
      )}
    </div>
  );
}

function StepStaticFiles({
  config,
  isGithub,
  isPublic,
  buildContainer,
  onChange,
  hasDetectedRepo,
}: {
  config: StaticFilesConfig;
  isGithub: boolean;
  isPublic: boolean;
  buildContainer: boolean;
  onChange: (updates: Partial<StaticFilesConfig>) => void;
  hasDetectedRepo?: boolean;
}) {
  const [showFiles, setShowFiles] = useState(!hasDetectedRepo);

  return (
    <div>
      <h2 className="text-2xl font-bold">Static Files</h2>
      <p className="mt-2 text-muted-foreground">
        Enable files to embed in your AI config.
      </p>
      
      {hasDetectedRepo && (
        <div className="mt-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
          <p className="text-sm text-muted-foreground">
            Since you&apos;re working with an existing repository, you may already have these files configured.
          </p>
          <button
            onClick={() => setShowFiles(!showFiles)}
            className="mt-2 text-sm font-medium text-primary hover:underline"
          >
            {showFiles ? "Hide static files configuration" : "Show static files configuration"}
          </button>
        </div>
      )}
      
      {!showFiles && hasDetectedRepo ? (
        <p className="mt-4 text-sm text-muted-foreground italic">Static files configuration skipped.</p>
      ) : (

      <div className="mt-4 space-y-3">
        <StaticFileEditor
          label=".editorconfig"
          description="Consistent indentation and line endings"
          enabled={config.editorconfig}
          onEnable={(v) => onChange({ editorconfig: v })}
          content={config.editorconfigCustom}
          onContentChange={(v) => onChange({ editorconfigCustom: v })}
          saveChecked={config.editorconfigSave}
          onSaveToggle={(v) => onChange({ editorconfigSave: v })}
          placeholder={`root = true

[*]
indent_style = space
indent_size = 2`}
        />
        
        <StaticFileEditor
          label="CONTRIBUTING.md"
          description="Guidelines for contributors"
          enabled={config.contributing}
          onEnable={(v) => onChange({ contributing: v })}
          content={config.contributingCustom}
          onContentChange={(v) => onChange({ contributingCustom: v })}
          saveChecked={config.contributingSave}
          onSaveToggle={(v) => onChange({ contributingSave: v })}
          placeholder={`# Contributing

Thank you for your interest in contributing!`}
          minHeight="180px"
        />
        
        <StaticFileEditor
          label="CODE_OF_CONDUCT.md"
          description="Community expectations"
          enabled={config.codeOfConduct}
          onEnable={(v) => onChange({ codeOfConduct: v })}
          content={config.codeOfConductCustom}
          onContentChange={(v) => onChange({ codeOfConductCustom: v })}
          saveChecked={config.codeOfConductSave}
          onSaveToggle={(v) => onChange({ codeOfConductSave: v })}
          placeholder={`# Code of Conduct

We are committed to providing a welcoming environment.`}
          minHeight="180px"
        />
        
        <StaticFileEditor
          label="SECURITY.md"
          description="How to report vulnerabilities"
          enabled={config.security}
          onEnable={(v) => onChange({ security: v })}
          content={config.securityCustom}
          onContentChange={(v) => onChange({ securityCustom: v })}
          saveChecked={config.securitySave}
          onSaveToggle={(v) => onChange({ securitySave: v })}
          placeholder={`# Security Policy

To report a vulnerability, please email security@example.com`}
          minHeight="150px"
        />
        
        <StaticFileEditor
          label="ROADMAP.md"
          description="Project roadmap and planned features"
          enabled={config.roadmap}
          onEnable={(v) => onChange({ roadmap: v })}
          content={config.roadmapCustom}
          onContentChange={(v) => onChange({ roadmapCustom: v })}
          saveChecked={config.roadmapSave}
          onSaveToggle={(v) => onChange({ roadmapSave: v })}
          placeholder={`# Roadmap

## Planned Features
- [ ] Feature 1
- [ ] Feature 2

## Future Ideas
- Idea 1
- Idea 2`}
          minHeight="180px"
        />

        {isGithub && isPublic && (
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => onChange({ funding: !config.funding })}
                className="flex items-center gap-3 text-left"
              >
                <div className={`flex h-5 w-5 items-center justify-center rounded border ${
                  config.funding ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                }`}>
                  {config.funding && <Check className="h-3 w-3" />}
                </div>
                <div>
                  <p className="font-medium">FUNDING.yml</p>
                  <p className="text-xs text-muted-foreground">GitHub Sponsors & donation links</p>
                </div>
              </button>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={config.fundingSave}
                  onChange={(e) => onChange({ fundingSave: e.target.checked })}
                />
                Save to profile
              </label>
            </div>
            {config.funding && (
              <div className="mt-3">
                <CodeEditor
                  value={config.fundingYml || ""}
                  onChange={(v) => onChange({ fundingYml: v })}
                  placeholder={`github: [your-username]
patreon: your-patreon
ko_fi: your-kofi`}
                  minHeight="100px"
                />
              </div>
            )}
          </div>
        )}

        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">.gitignore</p>
              <p className="text-xs text-muted-foreground">Generate or provide a custom one</p>
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={config.gitignoreSave}
                onChange={(e) => onChange({ gitignoreSave: e.target.checked })}
              />
              Save to profile
            </label>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(["generate", "custom", "skip"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => onChange({ gitignoreMode: opt })}
                className={`rounded-md border px-3 py-2 text-sm ${
                  config.gitignoreMode === opt ? "border-primary bg-primary/5" : "hover:border-primary"
                }`}
              >
                {opt === "generate" ? "AI generate" : opt === "custom" ? "Custom" : "Skip"}
              </button>
            ))}
          </div>
          {config.gitignoreMode === "custom" && (
            <div className="mt-2">
              <CodeEditor
                value={config.gitignoreCustom || ""}
                onChange={(v) => onChange({ gitignoreCustom: v })}
                placeholder={`node_modules/
.env
dist/`}
                minHeight="120px"
              />
            </div>
          )}
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">.dockerignore</p>
              <p className="text-xs text-muted-foreground">
                {buildContainer ? "Recommended for container builds" : "Exclude files from Docker context"}
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={config.dockerignoreSave}
                onChange={(e) => onChange({ dockerignoreSave: e.target.checked })}
              />
              Save to profile
            </label>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(["generate", "custom", "skip"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => onChange({ dockerignoreMode: opt })}
                className={`rounded-md border px-3 py-2 text-sm ${
                  config.dockerignoreMode === opt ? "border-primary bg-primary/5" : "hover:border-primary"
                }`}
              >
                {opt === "generate" ? "AI generate" : opt === "custom" ? "Custom" : "Skip"}
              </button>
            ))}
          </div>
          {config.dockerignoreMode === "custom" && (
            <div className="mt-2">
              <CodeEditor
                value={config.dockerignoreCustom || ""}
                onChange={(v) => onChange({ dockerignoreCustom: v })}
                placeholder={`node_modules/
.git/
*.log`}
                minHeight="120px"
              />
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}

function StepFeedback({
  value,
  onChange,
  userTier,
}: {
  value: string;
  onChange: (v: string) => void;
  userTier: string;
}) {
  const isTeamsUser = userTier === "teams";
  const { enableAI, appUrl } = useFeatureFlags();
  
  return (
    <div>
      <h2 className="text-2xl font-bold">Anything we&apos;ve missed?</h2>
      <p className="mt-2 text-muted-foreground">
        Is there something specific you&apos;d like the AI to know about your
        project that we haven&apos;t asked? Add any additional context.
      </p>

      {/* AI Assist Panel - Teams users only, when AI is enabled */}
      {enableAI && isTeamsUser && (
        <div className="mt-6 rounded-lg border border-purple-200 bg-white p-4 shadow-sm dark:border-purple-800 dark:bg-purple-900/20">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300">
            <Sparkles className="h-4 w-4" />
            AI Assistant
          </div>
          <AiEditPanel
            currentContent={value}
            onContentChange={onChange}
            mode="wizard"
            placeholder="Describe what you need, e.g., 'I want strict TypeScript, no any types'"
            showReplaceWarning={!!value.trim()}
          />
        </div>
      )}

      <div className="mt-6">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="E.g., 'This project uses a monorepo setup with Turborepo', 'We follow a specific naming convention for components'..."
          className="min-h-[200px] w-full resize-y rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="mt-4 rounded-lg bg-muted/50 p-4">
        <h4 className="font-medium">💡 Suggestions:</h4>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>• Special deployment requirements or procedures</li>
          <li>• Team-specific workflows or conventions</li>
        </ul>
        
        <h4 className="mt-4 font-medium">⚠️ Known Issues / Gotchas:</h4>
        <p className="mt-1 text-xs text-muted-foreground">Document quirks so AI doesn&apos;t repeat mistakes:</p>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>• Platform-specific bugs or workarounds</li>
          <li>• &quot;If you see X error, do Y instead&quot;</li>
          <li>• Dependencies that need special handling</li>
          <li>• Things AI assistants commonly get wrong in this project</li>
        </ul>
        
        <h4 className="mt-4 font-medium">🔑 Things You Might Not Have Thought Of:</h4>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>• Environment variable naming patterns</li>
          <li>• Database migration procedures</li>
          <li>• Performance constraints or SLAs</li>
          <li>• Security requirements (auth flow, data handling)</li>
        </ul>
      </div>
    </div>
  );
}

function StepGenerate({
  config,
  session,
  previewFiles,
  expandedFile,
  copiedFile,
  blueprintMode,
  enableApiSync,
  preferCliSync,
  tokenEnvVar,
  userTier,
  onToggleExpand,
  onCopyFile,
  onPlatformChange,
  onApiSyncChange,
  onPreferCliSyncChange,
  onTokenEnvVarChange,
}: {
  config: WizardConfig;
  session: {
    user: {
      displayName?: string | null;
      name?: string | null;
      persona?: string | null;
      skillLevel?: string | null;
    };
  } | null;
  previewFiles: GeneratedFile[];
  expandedFile: string | null;
  copiedFile: string | null;
  blueprintMode: boolean;
  enableApiSync: boolean;
  preferCliSync: boolean;
  tokenEnvVar: string;
  userTier: string;
  onToggleExpand: (fileName: string) => void;
  onCopyFile: (fileName: string, content: string) => void;
  onPlatformChange: (v: string) => void;
  onApiSyncChange: (v: boolean) => void;
  onPreferCliSyncChange: (v: boolean) => void;
  onTokenEnvVarChange: (v: string) => void;
}) {
  const [ideSearch, setIdeSearch] = useState("");
  const [showAllIdes, setShowAllIdes] = useState(false);
  
  const filteredPlatforms = useMemo(() => {
    const searchLower = ideSearch.toLowerCase();
    return PLATFORMS.filter(
      (p) =>
        !p.isCommand && // Exclude commands - wizard is for config files only
        (p.name.toLowerCase().includes(searchLower) ||
        p.note.toLowerCase().includes(searchLower))
    );
  }, [ideSearch]);
  
  const visiblePlatforms = showAllIdes ? filteredPlatforms : filteredPlatforms.slice(0, 4);
  const hasMore = filteredPlatforms.length > 4 && !showAllIdes;
  
  return (
    <div>
      <h2 className="text-2xl font-bold">Preview & Download</h2>
      <p className="mt-2 text-muted-foreground">
        Preview your generated files for{" "}
        <strong>{config.projectName || "your project"}</strong>. Click to expand
        and copy individual files.
      </p>

      {/* Blueprint Mode Notice */}
      {blueprintMode && (
        <div className="mt-4 rounded-lg border-2 border-amber-500 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🧩</span>
            <div>
              <h4 className="font-medium text-amber-800 dark:text-amber-200">Blueprint Template Mode Active</h4>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                Your configuration includes <code className="rounded bg-amber-200 px-1 py-0.5 font-mono text-xs dark:bg-amber-800">[[VARIABLE|default]]</code> placeholders 
                (highlighted in amber) that others can customize when using this template.
              </p>
              <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                <strong>Preview:</strong> Shows variable placeholders • <strong>Download:</strong> Replaces variables with their default values so the file works immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {/* Target AI IDE Selection */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <h3 className="font-medium">Target AI IDE</h3>
          <p className="text-sm text-muted-foreground">Choose your AI IDE (files are optimized for it but remain portable).</p>
          
          {/* Search box */}
          <div className="relative mt-3 mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={ideSearch}
              onChange={(e) => { setIdeSearch(e.target.value); setShowAllIdes(true); }}
              placeholder="Search AI IDEs..."
              className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div className="relative">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {visiblePlatforms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onPlatformChange(p.id)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-md border px-3 py-3 text-sm transition-all ${
                    config.platform === p.id ? "border-primary bg-primary/10 ring-1 ring-primary" : "hover:border-primary"
                  }`}
                >
                  <span className="text-lg">{p.icon}</span>
                  <span className="font-medium">{p.name}</span>
                  <span className="text-[10px] text-muted-foreground">{p.note}</span>
                </button>
              ))}
            </div>
            
            {/* Blur overlay and Load More button */}
            {hasMore && (
              <div className="relative mt-2">
                <div className="absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
                <button
                  onClick={() => setShowAllIdes(true)}
                  className="w-full rounded-md border border-dashed border-muted-foreground/30 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  Show {filteredPlatforms.length - 4} more IDEs...
                </button>
              </div>
            )}
            
            {showAllIdes && filteredPlatforms.length > 4 && (
              <button
                onClick={() => setShowAllIdes(false)}
                className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-primary"
              >
                Show less
              </button>
            )}
          </div>
        </div>

        {/* Profile info used */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <h3 className="font-medium">Using your profile settings:</h3>
          <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
            <span>Author: {session?.user?.displayName || session?.user?.name || "Guest"}</span>
            <span>•</span>
            <span className="capitalize">{session?.user?.persona || "Developer"}</span>
            <span>•</span>
            <span className="capitalize">{session?.user?.skillLevel || "Intermediate"} level</span>
          </div>
        </div>

        {/* Cloud Sync Option */}
        <div className={`rounded-lg border p-4 transition-colors ${enableApiSync ? "border-green-500 bg-green-500/5" : "border-dashed"}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <label className="font-medium">
                  ☁️ Cloud Sync
                </label>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Save as private blueprint &amp; include sync commands in the downloaded file. Your AI agent will read these instructions and automatically sync changes to LynxPrompt Cloud.
              </p>
            </div>
            <button
              onClick={() => onApiSyncChange(!enableApiSync)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${enableApiSync ? "bg-green-500" : "bg-muted"}`}
              aria-label="Toggle cloud sync"
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${enableApiSync ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>
          
          {/* CLI vs curl preference - shown when sync is enabled */}
          {enableApiSync && (
            <div className="mt-4 space-y-4 border-t pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <label className="font-medium text-sm">
                    📦 Use LynxPrompt CLI
                    <span className="ml-2 rounded bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">
                      Recommended
                    </span>
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {preferCliSync 
                      ? "AI will use lynxp push/pull/diff commands. No API token stored in file."
                      : "AI will use curl with environment variable. Token in $" + tokenEnvVar}
                  </p>
                </div>
                <button
                  onClick={() => onPreferCliSyncChange(!preferCliSync)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${preferCliSync ? "bg-green-500" : "bg-muted"}`}
                  aria-label="Toggle CLI preference"
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${preferCliSync ? "translate-x-5" : "translate-x-0"}`}
                  />
                </button>
              </div>
              
              {/* Env var name input - shown when not using CLI */}
              {!preferCliSync && (
                <div>
                  <label className="text-xs text-muted-foreground">Environment variable for API token:</label>
                  <input
                    type="text"
                    value={tokenEnvVar}
                    onChange={(e) => onTokenEnvVarChange(e.target.value)}
                    placeholder="LYNXPROMPT_API_TOKEN"
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Set this in your shell: <code className="rounded bg-muted px-1">export {tokenEnvVar}=&quot;your_token&quot;</code>
                  </p>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                {preferCliSync 
                  ? <>Install CLI: <code className="rounded bg-muted px-1">npm install -g lynxprompt</code></>
                  : <>Get a token at <a href="/settings" target="_blank" className="text-primary hover:underline">Settings →</a></>
                }
              </p>
            </div>
          )}
        </div>

        {/* File Previews */}
        <div className="space-y-2">
          <h3 className="font-medium">
            Generated Files ({previewFiles.length}):
          </h3>
          {previewFiles.length === 0 ? (
            <div className="rounded-lg border bg-muted/50 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Generating preview... If this persists, try going back and selecting options.
              </p>
            </div>
          ) : null}
          {previewFiles.map((file) => (
            <div
              key={file.fileName}
              className="overflow-hidden rounded-lg border"
            >
              {/* File Header */}
              <button
                onClick={() => onToggleExpand(file.fileName)}
                className="flex w-full items-center justify-between bg-muted/50 px-4 py-3 text-left hover:bg-muted/70"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">{file.fileName}</span>
                  {file.platform && (
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      {PLATFORMS.find((p) => p.id === file.platform)?.name ||
                        file.platform}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopyFile(file.fileName, file.content);
                    }}
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-background"
                  >
                    {copiedFile === file.fileName ? (
                      <>
                        <Check className="h-3 w-3 text-green-500" />
                        <span className="text-green-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                  {expandedFile === file.fileName ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>

              {/* File Content Preview */}
              {expandedFile === file.fileName && (
                <div className="border-t bg-background">
                  <pre className="max-h-64 overflow-auto p-4 text-xs font-mono">
                    <code 
                      dangerouslySetInnerHTML={{
                        __html: file.content
                          .replace(/&/g, "&amp;")
                          .replace(/</g, "&lt;")
                          .replace(/>/g, "&gt;")
                          .replace(
                            /\[\[([A-Za-z_][A-Za-z0-9_]*)(?:\|([^\]]*))?\]\]/g,
                            '<mark class="bg-amber-300 dark:bg-amber-700 text-amber-900 dark:text-amber-100 rounded px-0.5 font-semibold">$&</mark>'
                          )
                      }}
                    />
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Tech Stack:</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {config.languages.map((lang) => (
                <span
                  key={lang}
                  className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-600"
                >
                  {LANGUAGES.find((l) => l.value === lang)?.label || lang}
                </span>
              ))}
              {config.frameworks.map((fw) => (
                <span
                  key={fw}
                  className="rounded-full bg-purple-500/10 px-3 py-1 text-xs text-purple-600"
                >
                  {FRAMEWORKS.find((f) => f.value === fw)?.label || fw}
                </span>
              ))}
              {config.databases.map((db) => (
                <span
                  key={db}
                  className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-600"
                >
                  🗄️ {DATABASES.find((d) => d.value === db)?.label || db.replace("custom:", "")}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="font-medium">AI Behavior:</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {config.aiBehaviorRules.slice(0, 3).map((rule) => (
                <span
                  key={rule}
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary"
                >
                  {AI_BEHAVIOR_RULES.find((r) => r.id === rule)?.label}
                </span>
              ))}
              {config.aiBehaviorRules.length > 3 && (
                <span className="rounded-full bg-muted px-3 py-1 text-xs">
                  +{config.aiBehaviorRules.length - 3} more
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleOption({
  label,
  description,
  checked,
  onChange,
  recommended,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  recommended?: boolean;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center justify-between gap-4 rounded-lg border p-4 text-left transition-all ${
        checked ? "border-primary bg-primary/5" : "hover:border-primary"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{label}</p>
          {recommended && (
            <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
              Recommended
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div
        className={`flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition-colors ${
          checked ? "bg-green-500" : "bg-muted"
        }`}
      >
        <div
          className={`h-4 w-4 rounded-full shadow-sm transition-transform ${
            checked ? "translate-x-5 bg-white" : "translate-x-0 bg-gray-400 dark:bg-gray-600"
          }`}
        />
      </div>
    </button>
  );
}

function ToggleWithSave({
  label,
  description,
  checked,
  saveChecked,
  onToggle,
  onSaveToggle,
}: {
  label: string;
  description: string;
  checked: boolean;
  saveChecked: boolean;
  onToggle: (v: boolean) => void;
  onSaveToggle: (v: boolean) => void;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={saveChecked} onChange={(e) => onSaveToggle(e.target.checked)} />
          Save
        </label>
      </div>
      <div className="mt-3">
        <ToggleOption
          label={`Include ${label}`}
          description=""
          checked={checked}
          onChange={onToggle}
        />
      </div>
    </div>
  );
}

// Login Required Gate Component
function LoginRequired() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-10 w-10 text-primary" />
          </div>

          <h1 className="text-3xl font-bold">Sign in to continue</h1>
          <p className="mt-3 text-muted-foreground">
            Create an account or sign in to start building your AI IDE
            configurations.
          </p>

          <div className="mt-8 space-y-4">
            <Button asChild size="lg" className="w-full">
              <Link href="/auth/signin?callbackUrl=/wizard">
                <LogIn className="mr-2 h-5 w-5" />
                Sign in to Get Started
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// NEW: Profile Setup Required Component
function ProfileSetupRequired() {
  const [skipping, setSkipping] = useState(false);

  const handleSkip = async () => {
    setSkipping(true);
    try {
      // Set profile as completed with defaults
      await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Developer",
          persona: "fullstack",
          skillLevel: "intermediate",
          skipped: true,
        }),
      });
      // Reload to continue with wizard
      window.location.reload();
    } catch {
      setSkipping(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20">
            <Settings className="h-10 w-10 text-primary" />
          </div>

          <h1 className="text-3xl font-bold">Personalize Your Experience</h1>
          <p className="mt-3 text-muted-foreground">
            Tell us about yourself to get better AI configurations.
            <strong className="block mt-2 text-foreground">This is optional — you can skip it!</strong>
          </p>

          <div className="mt-8 space-y-3">
            <Button asChild size="lg" className="w-full">
              <Link href="/settings?tab=profile&onboarding=true">
                <Settings className="mr-2 h-5 w-5" />
                Set Up Profile
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="w-full"
              onClick={handleSkip}
              disabled={skipping}
            >
              {skipping ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Skipping...
                </>
              ) : (
                "Skip for now"
              )}
            </Button>
          </div>

          <div className="mt-8 rounded-xl border bg-card p-6 text-left">
            <h3 className="font-semibold">Why set up your profile?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your persona (e.g., &quot;DevOps Engineer&quot;) is <strong>dynamically added</strong> to 
              every blueprint you download. This helps AI assistants understand your background 
              and tailor responses accordingly.
            </p>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span><strong>Display name</strong> — Your nickname or name (doesn&apos;t have to be real)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span><strong>Developer type</strong> — Backend, Frontend, DevOps, Data, etc.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span><strong>Skill level</strong> — Controls how verbose AI explanations are</span>
              </li>
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              🔒 This info is only used to personalize your downloads. We don&apos;t share it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
