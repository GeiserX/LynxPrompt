import type { SecurityOption } from "./types.js";

/**
 * Authentication Providers - specific OAuth/auth services
 * (Different from AUTH_PATTERNS which are the technical patterns)
 */
export const AUTH_PROVIDERS: SecurityOption[] = [
  // Username/Password
  { id: "username_password", label: "Username & Password", description: "Traditional credentials", recommended: true },
  { id: "email_password", label: "Email & Password", description: "Email-based login" },
  // OAuth Providers
  { id: "github_oauth", label: "GitHub OAuth", description: "Sign in with GitHub" },
  { id: "google_oauth", label: "Google OAuth", description: "Sign in with Google" },
  { id: "microsoft_oauth", label: "Microsoft / Azure AD", description: "Sign in with Microsoft" },
  { id: "apple_oauth", label: "Apple Sign In", description: "Sign in with Apple" },
  { id: "facebook_oauth", label: "Facebook OAuth", description: "Sign in with Facebook" },
  { id: "twitter_oauth", label: "X (Twitter) OAuth", description: "Sign in with X/Twitter" },
  { id: "linkedin_oauth", label: "LinkedIn OAuth", description: "Sign in with LinkedIn" },
  { id: "discord_oauth", label: "Discord OAuth", description: "Sign in with Discord" },
  { id: "slack_oauth", label: "Slack OAuth", description: "Sign in with Slack" },
  { id: "gitlab_oauth", label: "GitLab OAuth", description: "Sign in with GitLab" },
  { id: "bitbucket_oauth", label: "Bitbucket OAuth", description: "Sign in with Bitbucket" },
  { id: "twitch_oauth", label: "Twitch OAuth", description: "Sign in with Twitch" },
  { id: "spotify_oauth", label: "Spotify OAuth", description: "Sign in with Spotify" },
  // Passwordless
  { id: "magic_link", label: "Magic Link (Email)", description: "Passwordless email login" },
  { id: "passkeys", label: "Passkeys / WebAuthn", description: "Biometric/hardware keys" },
  { id: "sms_otp", label: "SMS OTP", description: "Phone number verification" },
  { id: "email_otp", label: "Email OTP", description: "Email code verification" },
  // Enterprise SSO
  { id: "okta", label: "Okta", description: "Enterprise identity management" },
  { id: "auth0", label: "Auth0", description: "Identity platform" },
  { id: "keycloak", label: "Keycloak", description: "Open-source IAM" },
  { id: "cognito", label: "AWS Cognito", description: "AWS user pools" },
  { id: "firebase_auth", label: "Firebase Auth", description: "Google Firebase authentication" },
  { id: "supabase_auth", label: "Supabase Auth", description: "Supabase authentication" },
  { id: "clerk", label: "Clerk", description: "Modern auth for developers" },
  { id: "workos", label: "WorkOS", description: "Enterprise SSO & directory sync" },
  { id: "fusionauth", label: "FusionAuth", description: "Customer identity management" },
  { id: "authentik", label: "Authentik", description: "Open-source identity provider" },
  { id: "zitadel", label: "Zitadel", description: "Cloud-native identity management" },
  // Other
  { id: "ldap", label: "LDAP / Active Directory", description: "Directory service auth" },
  { id: "radius", label: "RADIUS", description: "Network access auth" },
  { id: "kerberos", label: "Kerberos", description: "Network authentication protocol" },
  { id: "other", label: "Other", description: "Custom auth provider" },
];

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
  { id: "pii_handling", label: "PII Handling", description: "Personal data protection" },
  { id: "data_masking", label: "Data Masking", description: "Hide sensitive data" },
  { id: "audit_logging", label: "Audit Logging", description: "Track data access" },
  { id: "backup_encryption", label: "Backup Encryption", description: "Encrypt backups" },
  { id: "data_retention", label: "Data Retention Policy", description: "Auto-delete old data" },
  { id: "data_minimization", label: "Data Minimization", description: "Collect only necessary data" },
  { id: "right_to_erasure", label: "Right to Erasure", description: "Support data deletion requests" },
  { id: "data_portability", label: "Data Portability", description: "Export user data on request" },
  { id: "consent_management", label: "Consent Management", description: "Track user consent" },
  { id: "other", label: "Other", description: "Custom data handling" },
];

/**
 * Compliance frameworks and regulations
 */
export const COMPLIANCE_OPTIONS: SecurityOption[] = [
  // Privacy regulations
  { id: "gdpr", label: "GDPR", description: "EU General Data Protection Regulation", recommended: true },
  { id: "ccpa", label: "CCPA/CPRA", description: "California Consumer Privacy Act" },
  { id: "lgpd", label: "LGPD", description: "Brazil's data protection law" },
  { id: "pipeda", label: "PIPEDA", description: "Canada's privacy law" },
  { id: "pdpa", label: "PDPA", description: "Singapore's Personal Data Protection Act" },
  { id: "appi", label: "APPI", description: "Japan's privacy law" },
  // Industry-specific
  { id: "hipaa", label: "HIPAA", description: "US healthcare data protection" },
  { id: "pci_dss", label: "PCI-DSS", description: "Payment card data security" },
  { id: "ferpa", label: "FERPA", description: "US student education records" },
  { id: "coppa", label: "COPPA", description: "US children's online privacy" },
  { id: "glba", label: "GLBA", description: "US financial services privacy" },
  // Security frameworks
  { id: "soc2", label: "SOC 2", description: "Service Organization Controls" },
  { id: "iso27001", label: "ISO 27001", description: "Information security management" },
  { id: "iso27701", label: "ISO 27701", description: "Privacy information management" },
  { id: "nist", label: "NIST CSF", description: "Cybersecurity framework" },
  { id: "fedramp", label: "FedRAMP", description: "US federal cloud security" },
  { id: "cis", label: "CIS Controls", description: "Center for Internet Security" },
  // Accessibility
  { id: "wcag", label: "WCAG 2.1", description: "Web accessibility guidelines" },
  { id: "section508", label: "Section 508", description: "US federal accessibility" },
  { id: "ada", label: "ADA", description: "Americans with Disabilities Act" },
  // Other
  { id: "other", label: "Other", description: "Custom compliance requirements" },
];

/**
 * Analytics and tracking options (privacy-focused)
 */
export const ANALYTICS_OPTIONS: SecurityOption[] = [
  // Privacy-focused / cookie-less
  { id: "umami", label: "Umami", description: "Privacy-focused, cookie-less, self-hosted", recommended: true },
  { id: "plausible", label: "Plausible", description: "Privacy-focused, cookie-less" },
  { id: "fathom", label: "Fathom", description: "Privacy-first analytics" },
  { id: "simple_analytics", label: "Simple Analytics", description: "Privacy-friendly, no cookies" },
  { id: "pirsch", label: "Pirsch", description: "Cookie-free web analytics" },
  { id: "counter", label: "Counter.dev", description: "Privacy-first, open-source" },
  { id: "cabin", label: "Cabin", description: "Privacy-first carbon-aware analytics" },
  { id: "goatcounter", label: "GoatCounter", description: "Open-source, privacy-aware" },
  { id: "ackee", label: "Ackee", description: "Self-hosted, privacy-focused" },
  { id: "matomo", label: "Matomo", description: "Self-hosted Google Analytics alternative" },
  // Traditional (require cookies/consent)
  { id: "google_analytics", label: "Google Analytics", description: "Requires cookie consent" },
  { id: "mixpanel", label: "Mixpanel", description: "Product analytics" },
  { id: "amplitude", label: "Amplitude", description: "Product analytics platform" },
  { id: "heap", label: "Heap", description: "Digital insights platform" },
  { id: "posthog", label: "PostHog", description: "Open-source product analytics" },
  { id: "none", label: "No Analytics", description: "Don't track users" },
];

