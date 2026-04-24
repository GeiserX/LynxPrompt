import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/feature-flags", () => ({
  APP_NAME: "LynxPrompt",
  APP_URL: "https://lynxprompt.com",
}));

vi.mock("@/lib/platforms", () => ({
  PLATFORM_FILES: {
    cursor: ".cursor/rules/",
    claude: "CLAUDE.md",
    copilot: ".github/copilot-instructions.md",
    windsurf: ".windsurfrules",
    universal: "AGENTS.md",
    antigravity: "GEMINI.md",
    aider: "AIDER.md",
    continue: ".continue/config.json",
    cody: ".cody/config.json",
    tabnine: ".tabnine.yaml",
    supermaven: ".supermaven/config.json",
    codegpt: ".codegpt/config.json",
    void: ".void/config.json",
    zed: ".zed/instructions.md",
    cline: ".clinerules",
    goose: ".goosehints",
    amazonq: ".amazonq/rules/",
    roocode: ".roo/rules/",
    warp: "WARP.md",
    "gemini-cli": "GEMINI.md",
    trae: ".trae/rules/",
    firebase: ".idx/",
    augment: ".augment/rules/",
    kilocode: ".kilocode/rules/",
    junie: ".junie/guidelines.md",
    kiro: ".kiro/steering/",
    openhands: ".openhands/microagents/repo.md",
    crush: "CRUSH.md",
    opencode: "opencode.json",
    firebender: "firebender.json",
  },
  getPlatform: (id: string) => ({ id, name: id, file: `.${id}` }),
}));

import { generateAllFiles } from "@/lib/file-generator";

const baseUser = {
  name: "Test User",
  displayName: "Test User",
  email: "test@test.com",
  tier: "free" as const,
  skillLevel: "intermediate",
  persona: null,
  subscriptionPlan: "FREE",
};

const maxUser = { ...baseUser, tier: "max" as const };
const proUser = { ...baseUser, tier: "pro" as const };

const baseConfig = {
  projectName: "TestProject",
  projectDescription: "A test project",
  languages: ["typescript"] as string[],
  frameworks: ["nextjs"] as string[],
  additionalFeedback: "",
  isPublic: true,
  repoUrl: "https://github.com/test/repo",
  repoHost: "github",
  license: "mit",
  funding: false,
  cicd: ["github_actions"],
  aiBehaviorRules: [] as string[],
};

// ============================================================================
// Security Configuration (cursor, free tier)
// ============================================================================
describe("generateAllFiles - security config", () => {
  it("includes secrets management section", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        security: {
          secretsManagement: ["env_vars", "vault", "aws_secrets", "doppler", "1password", "sops", "age", "sealed_secrets", "external_secrets", "git_crypt", "chamber", "berglas"],
        },
      },
      baseUser
    );
    const content = files[0].content;
    expect(content).toContain("Security Configuration");
    expect(content).toContain("Secrets Management");
    expect(content).toContain("Environment Variables");
    expect(content).toContain("HashiCorp Vault");
    expect(content).toContain("AWS Secrets Manager");
    expect(content).toContain("Doppler");
    expect(content).toContain("1Password Secrets Automation");
    expect(content).toContain("SOPS (Mozilla)");
    expect(content).toContain("age encryption");
    expect(content).toContain("Sealed Secrets (K8s)");
    expect(content).toContain("External Secrets Operator");
    expect(content).toContain("git-crypt");
    expect(content).toContain("Chamber");
    expect(content).toContain("Berglas");
  });

  it("includes more secrets management options", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        security: {
          secretsManagement: ["dotenv", "aws_ssm", "gcp_secrets", "azure_keyvault", "infisical", "bitwarden"],
        },
      },
      baseUser
    );
    const content = files[0].content;
    expect(content).toContain("dotenv");
    expect(content).toContain("AWS SSM Parameter Store");
    expect(content).toContain("GCP Secret Manager");
    expect(content).toContain("Azure Key Vault");
    expect(content).toContain("Infisical");
    expect(content).toContain("Bitwarden Secrets Manager");
  });

  it("includes security tooling section", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        security: {
          securityTooling: [
            "dependabot", "renovate", "snyk", "sonarqube", "codeql", "semgrep",
            "trivy", "grype", "checkov", "tfsec", "kics",
            "gitleaks", "trufflehog", "detect_secrets",
            "bandit", "brakeman", "gosec",
            "npm_audit", "pip_audit", "safety", "bundler_audit",
            "owasp_dependency_check", "ossf_scorecard", "socket", "mend", "fossa",
          ],
        },
      },
      baseUser
    );
    const content = files[0].content;
    expect(content).toContain("Security Tooling");
    expect(content).toContain("Dependabot");
    expect(content).toContain("Renovate");
    expect(content).toContain("Snyk");
    expect(content).toContain("SonarQube");
    expect(content).toContain("CodeQL");
    expect(content).toContain("Semgrep");
    expect(content).toContain("Trivy");
    expect(content).toContain("Grype");
    expect(content).toContain("Checkov");
    expect(content).toContain("tfsec");
    expect(content).toContain("KICS");
    expect(content).toContain("Gitleaks");
    expect(content).toContain("TruffleHog");
    expect(content).toContain("detect-secrets");
    expect(content).toContain("Bandit");
    expect(content).toContain("Brakeman");
    expect(content).toContain("gosec");
    expect(content).toContain("npm audit");
    expect(content).toContain("pip-audit");
    expect(content).toContain("Safety");
    expect(content).toContain("bundler-audit");
    expect(content).toContain("OWASP");
    expect(content).toContain("OSSF Scorecard");
    expect(content).toContain("Socket.dev");
    expect(content).toContain("Mend");
    expect(content).toContain("FOSSA");
  });

  it("includes auth patterns section", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        security: {
          authPatterns: [
            "oauth2", "oidc", "jwt", "session", "api_keys", "basic_auth",
            "bearer_token", "mfa_totp", "passkeys", "saml", "ldap", "mutual_tls",
            "auth0", "clerk", "firebase_auth", "supabase_auth", "keycloak", "okta",
            "cognito", "workos",
          ],
        },
      },
      baseUser
    );
    const content = files[0].content;
    expect(content).toContain("Authentication");
    expect(content).toContain("OAuth 2.0");
    expect(content).toContain("OpenID Connect");
    expect(content).toContain("JWT");
    expect(content).toContain("Session-based");
    expect(content).toContain("API Keys");
    expect(content).toContain("Basic Authentication");
    expect(content).toContain("Bearer Tokens");
    expect(content).toContain("MFA / TOTP");
    expect(content).toContain("Passkeys");
    expect(content).toContain("SAML");
    expect(content).toContain("LDAP");
    expect(content).toContain("Mutual TLS");
    expect(content).toContain("Auth0");
    expect(content).toContain("Clerk");
    expect(content).toContain("Firebase Auth");
    expect(content).toContain("Supabase Auth");
    expect(content).toContain("Keycloak");
    expect(content).toContain("Okta");
    expect(content).toContain("AWS Cognito");
    expect(content).toContain("WorkOS");
  });

  it("includes data handling section", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        security: {
          dataHandling: [
            "encryption_at_rest", "encryption_in_transit", "pii_handling",
            "gdpr_compliance", "ccpa_compliance", "hipaa_compliance",
            "soc2_compliance", "pci_dss", "data_masking", "data_retention",
            "audit_logging", "backup_encryption", "key_rotation",
            "zero_trust", "least_privilege", "rbac", "abac",
            "data_classification", "dlp",
          ],
        },
      },
      baseUser
    );
    const content = files[0].content;
    expect(content).toContain("Data Handling");
    expect(content).toContain("Encryption at Rest");
    expect(content).toContain("Encryption in Transit");
    expect(content).toContain("PII");
    expect(content).toContain("GDPR");
    expect(content).toContain("CCPA");
    expect(content).toContain("HIPAA");
    expect(content).toContain("SOC 2");
    expect(content).toContain("PCI-DSS");
    expect(content).toContain("Data Masking");
    expect(content).toContain("Data Retention");
    expect(content).toContain("Audit Logging");
    expect(content).toContain("Encrypted Backups");
    expect(content).toContain("Key Rotation");
    expect(content).toContain("Zero Trust");
    expect(content).toContain("Least Privilege");
    expect(content).toContain("RBAC");
    expect(content).toContain("ABAC");
    expect(content).toContain("Data Classification");
    expect(content).toContain("DLP");
  });

  it("includes additional security notes", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        security: {
          additionalNotes: "All API endpoints must require authentication. Rate limiting at 100 req/min.",
        },
      },
      baseUser
    );
    expect(files[0].content).toContain("Additional Security Notes");
    expect(files[0].content).toContain("Rate limiting");
  });

  it("includes unknown security keys with raw value", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        security: {
          secretsManagement: ["custom_secret_tool"],
          securityTooling: ["custom_security_scanner"],
          authPatterns: ["custom_auth"],
          dataHandling: ["custom_compliance"],
        },
      },
      baseUser
    );
    const content = files[0].content;
    expect(content).toContain("custom_secret_tool");
    expect(content).toContain("custom_security_scanner");
    expect(content).toContain("custom_auth");
    expect(content).toContain("custom_compliance");
  });
});

// ============================================================================
// CodeGPT deep branches
// ============================================================================
describe("generateAllFiles - codegpt deep", () => {
  it("includes architecture pattern", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "codegpt", architecturePattern: "microservices" },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.project.architecture).toBe("microservices");
    expect(parsed.assistant.systemPrompt).toContain("Microservices");
  });

  it("includes architecture pattern - other with custom", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "codegpt", architecturePattern: "other", architecturePatternOther: "Custom arch" },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.assistant.systemPrompt).toContain("Custom arch");
  });

  it("includes databases", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "codegpt", databases: ["postgresql", "custom:CockroachDB"] },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.techStack.databases).toContain("postgresql");
    expect(parsed.techStack.databases).toContain("CockroachDB");
  });

  it("includes letAiDecide", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "codegpt", letAiDecide: true },
      baseUser
    );
    expect(files[0].content).toContain("suggest what's best");
  });

  it("includes skill levels in communication style", () => {
    const levels = [
      { level: "novice", expected: "verbose" },
      { level: "beginner", expected: "verbose" },
      { level: "intermediate", expected: "Balanced" },
      { level: "expert", expected: "concise" },
    ];
    for (const { level, expected } of levels) {
      const files = generateAllFiles(
        { ...baseConfig, platform: "codegpt" },
        { ...baseUser, skillLevel: level }
      );
      expect(files[0].content.toLowerCase()).toContain(expected.toLowerCase());
    }
  });

  it("includes code style (naming, error handling, logging, notes)", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "codegpt",
        codeStyle: {
          naming: "snake_case",
          errorHandling: "result_types",
          loggingConventions: "structured JSON logs",
          notes: "Prefer composition over inheritance",
        },
      },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.assistant.codeStyle).toBe("snake_case");
    expect(parsed.assistant.systemPrompt).toContain("snake_case");
    expect(parsed.assistant.systemPrompt).toContain("Result/Either");
    expect(parsed.assistant.systemPrompt).toContain("structured JSON logs");
    expect(parsed.assistant.systemPrompt).toContain("composition over inheritance");
  });

  it("includes error handling - other custom", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "codegpt",
        codeStyle: { errorHandling: "other", errorHandlingOther: "Custom retry logic" },
      },
      baseUser
    );
    expect(files[0].content).toContain("Custom retry logic");
  });

  it("includes AI behavior rules", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "codegpt", aiBehaviorRules: ["follow_existing_patterns", "verify_work"] },
      baseUser
    );
    expect(files[0].content).toContain("existing style");
    expect(files[0].content).toContain("verify");
  });

  it("includes boundaries", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "codegpt",
        boundaries: { always: ["Run tests"], ask: ["Before refactoring"], never: ["Delete data"] },
      },
      baseUser
    );
    const content = files[0].content;
    expect(content).toContain("Run tests");
    expect(content).toContain("Before refactoring");
    expect(content).toContain("Delete data");
  });

  it("includes commands", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "codegpt",
        commands: { build: "make build", test: "make test", lint: "make lint", dev: "make dev" },
      },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.commands.build).toBe("make build");
    expect(parsed.commands.test).toBe("make test");
  });

  it("includes testing strategy", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "codegpt",
        testingStrategy: { levels: ["unit", "e2e"], frameworks: ["vitest", "playwright"], coverage: 90 },
      },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.testing.levels).toContain("unit");
    expect(parsed.testing.coverage).toBe(90);
  });

  it("includes cicd and deployment", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "codegpt",
        cicd: ["github_actions"],
        deploymentTarget: ["aws", "kubernetes"],
      },
      baseUser
    );
    const content = files[0].content;
    expect(content).toContain("GitHub Actions");
    expect(content).toContain("Kubernetes");
  });

  it("includes project type", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "codegpt", projectType: "open_source_small" },
      baseUser
    );
    expect(files[0].content).toContain("Project Context");
  });

  it("includes conventional commits and semver", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "codegpt", conventionalCommits: true, semver: true },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.preferences.conventionalCommits).toBe(true);
    expect(parsed.preferences.semver).toBe(true);
  });

  it("includes important files", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "codegpt", importantFiles: ["readme", "dockerfile"] },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.importantFiles).toContain("README.md");
    expect(parsed.importantFiles).toContain("Dockerfile");
  });

  it("includes custom additional feedback", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "codegpt", additionalFeedback: "Always use TypeScript strict mode" },
      baseUser
    );
    expect(files[0].content).toContain("TypeScript strict mode");
  });

  it("includes dependabot in preferences", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "codegpt", security: { securityTooling: ["dependabot"] } },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.preferences.dependabot).toBe(true);
  });

  it("skips personal data when includePersonalData is false", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "codegpt", includePersonalData: false },
      { ...baseUser, skillLevel: "expert" }
    );
    expect(files[0].content).not.toContain("Communication Style");
  });
});

// ============================================================================
// Supermaven deep branches
// ============================================================================
describe("generateAllFiles - supermaven deep", () => {
  it("includes architecture pattern", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "supermaven", architecturePattern: "hexagonal" },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.context).toContain("Hexagonal");
  });

  it("includes databases in tech stack", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "supermaven", databases: ["postgresql", "custom:DynamoDB"] },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.techStack.databases).toContain("postgresql");
    expect(parsed.techStack.databases).toContain("DynamoDB");
  });

  it("includes code style (naming, error handling, logging, notes)", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "supermaven",
        codeStyle: {
          naming: "PascalCase",
          errorHandling: "middleware",
          loggingConventions: "Winston structured",
          notes: "Use interfaces not classes",
        },
      },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.codeStyle.naming).toBe("PascalCase");
    expect(parsed.codeStyle.errorHandling).toBe("middleware");
    expect(parsed.context).toContain("Winston structured");
    expect(parsed.context).toContain("interfaces not classes");
  });

  it("includes error handling - other custom", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "supermaven",
        codeStyle: { errorHandling: "other", errorHandlingOther: "Go-style errors" },
      },
      baseUser
    );
    expect(files[0].content).toContain("Go-style errors");
  });

  it("includes all skill levels", () => {
    for (const level of ["beginner", "intermediate", "expert"]) {
      const files = generateAllFiles(
        { ...baseConfig, platform: "supermaven" },
        { ...baseUser, skillLevel: level }
      );
      expect(files[0].content).toContain("Communication");
    }
  });

  it("includes AI behavior rules in guidelines", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "supermaven", aiBehaviorRules: ["code_for_llms", "self_improving"] },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.guidelines.length).toBeGreaterThan(3); // 3 are always added
  });

  it("includes boundaries in guidelines and context", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "supermaven",
        boundaries: { always: ["Lint before commit"], ask: ["Before big changes"], never: ["Push to main"] },
      },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.context).toContain("Lint before commit");
    expect(parsed.context).toContain("Before big changes");
    expect(parsed.context).toContain("Push to main");
    expect(parsed.guidelines.some((g: string) => g.includes("Always: Lint"))).toBe(true);
    expect(parsed.guidelines.some((g: string) => g.includes("Never: Push"))).toBe(true);
  });

  it("includes commands", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "supermaven",
        commands: { build: "cargo build", test: "cargo test", lint: "clippy", dev: "cargo run" },
      },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.commands.build).toBe("cargo build");
  });

  it("includes testing strategy", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "supermaven",
        testingStrategy: { levels: ["unit", "integration"], frameworks: ["pytest"], coverage: 85 },
      },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.testing.levels).toContain("unit");
    expect(parsed.testing.coverage).toBe(85);
  });

  it("includes project type", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "supermaven", projectType: "work" },
      baseUser
    );
    expect(files[0].content).toContain("Project Context");
  });

  it("includes conventional commits", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "supermaven", conventionalCommits: true },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.preferences.conventionalCommits).toBe(true);
    expect(parsed.context).toContain("conventional commits");
  });

  it("includes important files", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "supermaven", importantFiles: ["readme", "makefile"] },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.importantFiles).toContain("README.md");
    expect(parsed.importantFiles).toContain("Makefile");
  });

  it("includes additional feedback", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "supermaven", additionalFeedback: "Always use strict mode" },
      baseUser
    );
    expect(files[0].content).toContain("strict mode");
  });
});

// ============================================================================
// Void deep branches
// ============================================================================
describe("generateAllFiles - void deep", () => {
  it("includes architecture pattern", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "void", architecturePattern: "clean" },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.rules).toContain("Clean Architecture");
  });

  it("includes architecture pattern - other custom", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "void", architecturePattern: "other", architecturePatternOther: "Onion" },
      baseUser
    );
    expect(files[0].content).toContain("Onion");
  });

  it("includes isPublic visibility", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "void", isPublic: false },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.project.visibility).toBe("private");
  });

  it("includes devOS", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "void", devOS: "macos" },
      baseUser
    );
    expect(files[0].content).toContain("macOS");
  });

  it("includes reference materials", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "void", exampleRepoUrl: "https://github.com/example/demo", documentationUrl: "https://docs.example.com" },
      baseUser
    );
    const content = files[0].content;
    expect(content).toContain("Reference Materials");
    expect(content).toContain("example/demo");
    expect(content).toContain("docs.example.com");
  });

  it("includes databases", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "void", databases: ["redis", "custom:ScyllaDB"] },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.techStack.databases).toContain("redis");
    expect(parsed.techStack.databases).toContain("ScyllaDB");
  });

  it("includes letAiDecide", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "void", letAiDecide: true },
      baseUser
    );
    expect(files[0].content).toContain("suggest appropriate solutions");
  });

  it("includes all skill levels", () => {
    const levels = [
      { level: "beginner", expected: "verbose" },
      { level: "intermediate", expected: "balanced" },
      { level: "expert", expected: "concise" },
    ];
    for (const { level, expected } of levels) {
      const files = generateAllFiles(
        { ...baseConfig, platform: "void" },
        { ...baseUser, skillLevel: level, persona: "backend_developer", displayName: "Dev" }
      );
      expect(files[0].content.toLowerCase()).toContain(expected.toLowerCase());
    }
  });

  it("includes code style (naming, error handling, logging, notes)", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "void",
        codeStyle: {
          naming: "kebab-case",
          errorHandling: "exceptions",
          loggingConventions: "Pino structured",
          notes: "No console.log in production",
        },
      },
      baseUser
    );
    const content = files[0].content;
    expect(content).toContain("kebab-case");
    expect(content).toContain("Custom exception classes");
    expect(content).toContain("Pino structured");
    expect(content).toContain("No console.log");
  });

  it("includes error handling - other custom", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "void",
        codeStyle: { errorHandling: "other", errorHandlingOther: "Railway pattern" },
      },
      baseUser
    );
    expect(files[0].content).toContain("Railway pattern");
  });

  it("includes important files with custom others", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "void",
        importantFiles: ["readme", "docker_compose"],
        importantFilesOther: "scripts/setup.sh, config/defaults.yml",
      },
      baseUser
    );
    const content = files[0].content;
    expect(content).toContain("README.md");
    expect(content).toContain("docker-compose.yml");
    expect(content).toContain("scripts/setup.sh");
    expect(content).toContain("config/defaults.yml");
  });

  it("includes boundaries", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "void",
        boundaries: { always: ["Write tests"], ask: ["Before deleting"], never: ["Commit secrets"] },
      },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.boundaries.always).toContain("Write tests");
    expect(parsed.boundaries.ask).toContain("Before deleting");
    expect(parsed.boundaries.never).toContain("Commit secrets");
    expect(parsed.rules).toContain("Write tests");
    expect(parsed.rules).toContain("Before deleting");
    expect(parsed.rules).toContain("Commit secrets");
  });

  it("includes commands with additional", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "void",
        commands: {
          build: "pnpm build",
          test: "pnpm test",
          lint: "pnpm lint",
          dev: "pnpm dev",
          additional: ["pnpm db:migrate", "pnpm db:seed"],
        },
      },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.commands.build).toBe("pnpm build");
    expect(parsed.commands.additional).toContain("pnpm db:migrate");
    expect(parsed.rules).toContain("pnpm db:migrate");
  });

  it("includes testing with notes", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "void",
        testingStrategy: { levels: ["unit", "e2e"], frameworks: ["vitest"], coverage: 80, notes: "Snapshot for UI" },
      },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.testing.notes).toBe("Snapshot for UI");
    expect(parsed.rules).toContain("Snapshot for UI");
  });

  it("includes cicd, deployment, and container registry", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "void",
        cicd: ["gitlab_ci"],
        deploymentTarget: ["kubernetes", "aws"],
        buildContainer: true,
        containerRegistry: "ghcr",
      },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.cicd.platforms).toContain("gitlab_ci");
    expect(parsed.cicd.deploymentTargets).toContain("kubernetes");
    expect(parsed.rules).toContain("GitLab CI/CD");
    expect(parsed.rules).toContain("GHCR");
  });

  it("includes project type", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "void", projectType: "open_source_large" },
      baseUser
    );
    expect(files[0].content).toContain("Project Context");
    expect(files[0].content).toContain("Open Source (Enterprise)");
  });

  it("includes conventional commits and semver", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "void", conventionalCommits: true, semver: true },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.preferences.conventionalCommits).toBe(true);
    expect(parsed.preferences.semver).toBe(true);
    expect(parsed.rules).toContain("conventional commits");
    expect(parsed.rules).toContain("semantic versioning");
  });

  it("includes dependabot in preferences via security tooling", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "void",
        security: { securityTooling: ["dependabot", "renovate"] },
      },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.preferences.dependabot).toBe(true);
    expect(parsed.rules).toContain("Dependabot/Renovate");
  });

  it("includes additional feedback", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "void", additionalFeedback: "Use functional style" },
      baseUser
    );
    expect(files[0].content).toContain("Use functional style");
  });

  it("includes auto-update config", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "void", enableAutoUpdate: true },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.preferences.autoUpdate).toBe(true);
    expect(parsed.rules).toContain("Self-Improving");
  });

  it("includes AI behavior rules in behavior array", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "void", aiBehaviorRules: ["check_docs_first", "terminal_management"] },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.behavior.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Platform delegation tests (generateAllFiles routing)
// ============================================================================
describe("generateAllFiles - platform routing", () => {
  const delegationCases = [
    "zed", "cline", "goose", "amazonq", "roocode", "warp",
    "gemini-cli", "trae", "firebase", "augment", "kilocode",
    "junie", "kiro", "openhands", "crush", "opencode", "firebender",
  ];

  for (const platform of delegationCases) {
    it(`generates content for ${platform}`, () => {
      const files = generateAllFiles(
        { ...baseConfig, platform },
        baseUser
      );
      expect(files.length).toBe(1);
      expect(files[0].content.length).toBeGreaterThan(50);
    });
  }
});
