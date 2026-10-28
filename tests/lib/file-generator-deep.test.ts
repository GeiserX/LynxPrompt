// @ts-nocheck
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/feature-flags", () => ({
  APP_NAME: "LynxPrompt",
  APP_URL: "https://lynxprompt.com",
}));

import { generateAllFiles } from "@/lib/file-generator";

const baseUser = {
  name: "Test User",
  displayName: "Test User",
  email: "test@test.com",
  skillLevel: "intermediate",
  persona: null,
  subscriptionPlan: "FREE",
};

const maxUser = { ...baseUser };
const proUser = { ...baseUser };

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
// Platform delegation tests (generateAllFiles routing)
// ============================================================================
describe("generateAllFiles - platform routing", () => {
  const delegationCases = [
    "zed", "cline", "goose", "amazonq", "roocode", "warp",
    "gemini-cli", "trae", "firebase", "augment", "kilocode",
    "junie", "kiro", "openhands", "crush", "opencode", "firebender",
    "codex", "antigravity", "windsurf", "tabnine",
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
