import type { SecurityOption } from "./types.js";

/**
 * Secrets management strategies
 */
export const SECRETS_MANAGEMENT_OPTIONS: SecurityOption[] = [
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

/**
 * Security tooling options
 */
export const SECURITY_TOOLING_OPTIONS: SecurityOption[] = [
  { id: "dependabot", label: "Dependabot", description: "GitHub dependency updates", recommended: true },
  { id: "renovate", label: "Renovate", description: "Automated dependency updates" },
  { id: "snyk", label: "Snyk", description: "Vulnerability scanning" },
  { id: "sonarqube", label: "SonarQube", description: "Code quality and security" },
  { id: "codeql", label: "CodeQL", description: "GitHub semantic analysis" },
  { id: "semgrep", label: "Semgrep", description: "Lightweight static analysis" },
  { id: "trivy", label: "Trivy", description: "Container/IaC scanning" },
  { id: "grype", label: "Grype", description: "Container vulnerability scanner" },
  { id: "checkov", label: "Checkov", description: "IaC security scanning" },
  { id: "tfsec", label: "tfsec", description: "Terraform security scanner" },
  { id: "bandit", label: "Bandit", description: "Python security linter" },
  { id: "brakeman", label: "Brakeman", description: "Rails security scanner" },
  { id: "gosec", label: "gosec", description: "Go security checker" },
  { id: "safety", label: "Safety", description: "Python dependency checker" },
  { id: "npm_audit", label: "npm audit", description: "Node.js vulnerability check" },
  { id: "ossf_scorecard", label: "OSSF Scorecard", description: "Open source security metrics" },
  { id: "gitleaks", label: "Gitleaks", description: "Secret detection in git" },
  { id: "trufflehog", label: "TruffleHog", description: "Secret scanning" },
  { id: "other", label: "Other", description: "Custom security tooling" },
];

/**
 * Authentication patterns
 */
export const AUTH_PATTERNS_OPTIONS: SecurityOption[] = [
  { id: "session", label: "Session-based", description: "Server-side sessions with cookies", recommended: true },
  { id: "jwt", label: "JWT Tokens", description: "Stateless JSON Web Tokens" },
  { id: "oauth2", label: "OAuth 2.0", description: "Third-party authorization" },
  { id: "oidc", label: "OpenID Connect", description: "OAuth2 + identity layer" },
  { id: "saml", label: "SAML", description: "Enterprise SSO" },
  { id: "passkeys", label: "Passkeys / WebAuthn", description: "Passwordless authentication" },
  { id: "magic_link", label: "Magic Links", description: "Email-based passwordless" },
  { id: "api_keys", label: "API Keys", description: "Simple key authentication" },
  { id: "mfa", label: "Multi-Factor Auth", description: "TOTP, SMS, or hardware keys" },
  { id: "basic_auth", label: "Basic Auth", description: "Username/password in header" },
  { id: "mtls", label: "Mutual TLS", description: "Client certificate auth" },
  { id: "other", label: "Other", description: "Custom authentication" },
];

/**
 * Data handling options
 */
export const DATA_HANDLING_OPTIONS: SecurityOption[] = [
  { id: "encryption_at_rest", label: "Encryption at Rest", description: "Encrypt stored data", recommended: true },
  { id: "encryption_in_transit", label: "Encryption in Transit", description: "TLS/HTTPS everywhere", recommended: true },
  { id: "input_validation", label: "Input Validation", description: "Validate all user input", recommended: true },
  { id: "output_encoding", label: "Output Encoding", description: "Prevent XSS attacks", recommended: true },
  { id: "parameterized_queries", label: "Parameterized Queries", description: "Prevent SQL injection", recommended: true },
  { id: "rate_limiting", label: "Rate Limiting", description: "Prevent abuse" },
  { id: "gdpr_compliance", label: "GDPR Compliance", description: "EU data protection" },
  { id: "pii_handling", label: "PII Handling", description: "Personal data protection" },
  { id: "data_masking", label: "Data Masking", description: "Hide sensitive data" },
  { id: "audit_logging", label: "Audit Logging", description: "Track data access" },
  { id: "backup_encryption", label: "Backup Encryption", description: "Encrypt backups" },
  { id: "data_retention", label: "Data Retention Policy", description: "Auto-delete old data" },
  { id: "other", label: "Other", description: "Custom data handling" },
];

