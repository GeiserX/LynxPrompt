# LynxPrompt Security Documentation

## Security Measures Implemented

### 1. Authentication & Authorization

#### NextAuth.js Configuration
- **Session Strategy**: Database sessions with secure cookie settings
- **Secure Cookies**: `__Secure-` prefix in production, HttpOnly, SameSite=Lax
- **Session Lifetime**: 30-day max age with 24-hour refresh interval
- **Role-Based Access**: USER, ADMIN, SUPERADMIN roles

#### OAuth Providers
- GitHub OAuth with proper callback validation
- Google OAuth (optional)
- Magic Link email authentication

#### Passkeys (WebAuthn)
- FIDO2/WebAuthn support for passwordless authentication
- Challenge-based authentication to prevent replay attacks
- Credential storage with counter tracking

### 2. API Security

#### Rate Limiting
- General requests: 100/minute per IP
- Auth endpoints: 10/minute per IP
- 429 responses with Retry-After headers

#### Input Validation
- Prisma ORM prevents SQL injection
- Type validation via TypeScript
- API routes validate required parameters

### 3. HTTP Security Headers

All responses include:
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - XSS filter
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` - Disables camera, microphone, geolocation, payment
- `Content-Security-Policy` - Restricts resource loading
- `Strict-Transport-Security` - HSTS in production

### 4. Infrastructure Security

#### Docker
- Non-root user (`nextjs`, UID 1001)
- Multi-stage builds (minimal production image)
- No exposed database ports in production
- Isolated Docker networks per stack

#### Database
- Dual database architecture (app data vs user data)
- Strong randomly-generated passwords (48 hex characters)
- Connection strings not exposed externally
- PostgreSQL 17 with healthchecks

### 5. Secrets Management

- All secrets in environment variables (not in code)
- Production secrets in docker-compose only (not in .env files in git)
- NEXTAUTH_SECRET: 256-bit random
- Database passwords: 192-bit random

---

## Security Recommendations

### Immediate (Should Do)

1. **Set up WAF (Web Application Firewall)**
   - Cloudflare Pro or similar
   - Block common attack patterns
   - Bot protection

2. **Enable Fail2ban or similar**
   - Monitor for brute force attempts
   - Auto-ban suspicious IPs

3. **Database Backups**
   - Automated daily backups of `postgres-users`
   - Off-site storage (S3, Backblaze B2)
   - Test restore procedure

### Medium-Term

4. **Implement CAPTCHA**
   - On sign-up/sign-in pages
   - reCAPTCHA v3 or hCaptcha

5. **Add Audit Logging**
   - Log authentication attempts
   - Log admin actions
   - Log API abuse

6. **Set up Monitoring**
   - Uptime monitoring (Uptime Kuma)
   - Error tracking (Sentry)
   - Performance monitoring

### Long-Term

7. **SOC 2 Compliance**
   - If handling enterprise customers
   - Security policies documentation

8. **Penetration Testing**
   - Annual third-party security audit
   - Bug bounty program

9. **Security.txt**
   - Add `/.well-known/security.txt`
   - Vulnerability disclosure policy

---

## Known Vulnerabilities

### Dependencies (as of build)
- Run `npm audit` regularly
- Auto-update via Dependabot/Renovate

### Mitigated Issues
- CVE-2024-XXXXX (Next.js middleware bypass) - Fixed via update to 15.5.9+

---

## Incident Response

### If a breach is suspected:
1. Rotate all secrets immediately
2. Invalidate all sessions (truncate sessions table)
3. Review audit logs
4. Notify affected users if PII exposed
5. Document timeline and actions

### Contact
Security issues: security@lynxprompt.com (configure when available)

---

## Compliance Considerations

### GDPR
- User data in dedicated database (easy to export/delete)
- No tracking without consent
- Privacy policy needed

### Data Retention
- Sessions: Auto-expire after 30 days
- User data: Retained until account deletion
- Logs: Configure retention policy

---

Last updated: 2025-12-21


