# Security Policy

LynxPrompt takes security seriously. We handle user data, payment information, and authentication credentials, which requires a strong security posture.

## Reporting Security Issues

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please use GitHub's private vulnerability reporting:

1. Go to https://github.com/GeiserX/LynxPrompt/security/advisories
2. Click "Report a vulnerability"
3. Fill out the form with details

We will respond within **48 hours** and work with you to understand and address the issue.

### What to Include

- Type of issue (e.g., XSS, SQL injection, authentication bypass)
- Full paths of affected source files
- Step-by-step instructions to reproduce
- Proof-of-concept or exploit code (if possible)
- Impact assessment and potential attack scenarios

### Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.x.x   | ✅ Current release |

Only the latest version receives security updates. We recommend always running the latest version.

## Security Architecture

### Authentication & Authorization

- **NextAuth.js** for authentication with multiple providers (GitHub, Google, Magic Link, Passkeys)
- **Role-based access control** (USER, ADMIN, SUPERADMIN)
- **Session-based authentication** with secure cookies
- **CSRF protection** via NextAuth.js built-in mechanisms
- **Passkeys/WebAuthn** for passwordless authentication

### Data Protection

- **Separate databases** for different data types (app, users, blog, support)
- **Encrypted connections** (TLS) for all database connections in production
- **No plaintext passwords** - authentication via OAuth or magic links
- **GDPR compliant** - users can request data deletion

### API Security

- **Rate limiting** via middleware (configurable per-endpoint)
- **Input validation** with Zod schemas
- **IDOR prevention** - ownership checks on all user resources
- **No user enumeration** - consistent responses for login/signup

### Infrastructure Security

- **Self-hosted** - no third-party cloud providers for core services
- **Docker containers** with non-root users and security options
- **Reverse proxy** (Caddy) with automatic HTTPS
- **Cloudflare** for DDoS protection and WAF

### Error Tracking

- **GlitchTip** (self-hosted, Sentry-compatible)
- **Sensitive data filtering** - headers, passwords, and PII are filtered before sending

## Security Best Practices

### For Contributors

1. **Never commit secrets** - Use environment variables
2. **Validate all input** - Use Zod schemas for API endpoints
3. **Check ownership** - Always verify user owns the resource they're accessing
4. **Sanitize output** - Prevent XSS in user-generated content
5. **Use parameterized queries** - Prisma handles this automatically

### For Self-Hosters

1. **Use strong secrets** - Generate with `openssl rand -base64 32`
2. **Enable HTTPS** - Use a reverse proxy with TLS
3. **Keep updated** - Run the latest version
4. **Backup regularly** - Especially the users database
5. **Monitor logs** - Watch for suspicious activity

## Compliance

### GDPR

LynxPrompt is designed for GDPR compliance:

- Physical address disclosed in privacy policy
- Data processing based on contract and legitimate interest
- Users can request data export and deletion
- Cookieless analytics via self-hosted Umami
- AEPD (Spanish DPA) complaint rights mentioned

### EU Consumer Rights

- 14-day withdrawal right (waived for digital content with consent)
- Clear pricing in EUR
- Spanish law applies (Courts of Cartagena)

## Security Changelog

Security-related changes are documented in releases and the main CHANGELOG.

### Recent Security Improvements

- Rate limiting middleware implementation
- Sensitive data filtering in error tracking
- Cloudflare integration for edge security
- Turnstile integration for bot protection

## Contact

For security questions that aren't vulnerabilities, contact: security@lynxprompt.com

---

*Last updated: December 2025*








