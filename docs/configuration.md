# Configuration

All features are controlled via environment variables. Toggle what you need, disable what you don't.

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXTAUTH_SECRET` | *(required)* | Session encryption key |
| `APP_URL` | `http://localhost:3000` | Base URL of your instance |
| `APP_NAME` | `LynxPrompt` | Instance name shown in the UI |
| `ENABLE_GITHUB_OAUTH` | `false` | GitHub OAuth login |
| `ENABLE_GOOGLE_OAUTH` | `false` | Google OAuth login |
| `ENABLE_EMAIL_AUTH` | `true` | Magic link email login |
| `ENABLE_PASSKEYS` | `true` | WebAuthn passkey authentication |
| `ENABLE_TURNSTILE` | `false` | Cloudflare Turnstile CAPTCHA |
| `ENABLE_SSO` | `false` | SAML / OIDC / LDAP authentication |
| `ENABLE_USER_REGISTRATION` | `true` | Allow public sign-ups |
| `ENABLE_AI` | `false` | AI-powered editing features |
| `AI_MODEL` | `claude-3-5-haiku-latest` | AI model for editing |
| `ANTHROPIC_API_KEY` | | Required when `ENABLE_AI=true` |
| `ENABLE_BLOG` | `false` | Blog module |
| `ENABLE_SUPPORT_FORUM` | `false` | Support forum module |
| `ENABLE_STRIPE` | `false` | Stripe payments for marketplace |
| `SUPERADMIN_EMAIL` | | Auto-promote this email to superadmin |
| `APP_LOGO_URL` | | Custom logo URL |
| `UMAMI_SCRIPT_URL` | | Umami analytics script URL |
| `CONTACT_EMAIL` | | Contact form destination |
| `STATUS_PAGE_URL` | | Status page link |
