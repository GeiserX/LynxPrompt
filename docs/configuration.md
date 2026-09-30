# Configuration

Every setting is an environment variable read by the container. `docker-compose.selfhost.yml` takes them from
`.env`; the Helm chart maps them from `values.yaml`. Defaults below are what the app uses when the variable is
unset; "compose" means the self-host compose file sets it for you.

## Required

| Variable | Default | What it does |
|---|---|---|
| `NEXTAUTH_SECRET` | none, required | Signs sessions. `openssl rand -base64 32`. Changing it signs everyone out. |
| `DB_PASSWORD` | none, required | Used by the compose file for PostgreSQL and for the four `DB_*_PASSWORD` values below. |
| `APP_URL` | `http://localhost:3000` | The URL browsers use. Sign-in links and OAuth callbacks are built from it; the compose file also sets `NEXTAUTH_URL` to it. |
| `ADMIN_EMAIL` | empty | Compose only: copied into `SUPERADMIN_EMAIL`. |
| `SUPERADMIN_EMAIL` | empty | The account with this address becomes superadmin when it signs in. |
| `PORT` | `3000` | Compose only: the host port published for the app. |

## Database

The entrypoint builds one connection string per schema (app, users, blog, support) from these, unless the
full `DATABASE_URL_APP`, `DATABASE_URL_USERS`, `DATABASE_URL_BLOG` or `DATABASE_URL_SUPPORT` is set. The self-host
compose file uses one PostgreSQL server and one database per schema: `lynxprompt`, `lynxprompt_users`,
`lynxprompt_blog` and `lynxprompt_support` (the first start creates the last three). Never point two schemas
at the same database: `prisma db push` drops the tables it does not know, so each start would delete the other
schema's tables.

| Variable (per `APP`, `USERS`, `BLOG`, `SUPPORT`) | Default | What it does |
|---|---|---|
| `DB_<NAME>_HOST` | compose: `postgres` | PostgreSQL host |
| `DB_<NAME>_PORT` | `5432` | Port |
| `DB_<NAME>_USER` | compose: `lynxprompt` | User |
| `DB_<NAME>_PASSWORD` | compose: `DB_PASSWORD` | Password |
| `DB_<NAME>_NAME` | compose: `lynxprompt`, `lynxprompt_users`, `lynxprompt_blog`, `lynxprompt_support` | Database name, one per schema |
| `DB_<NAME>_SCHEMA` | `public` | Schema |
| `DATABASE_URL_<NAME>` | built from the above | Full connection string; wins when set |

## Sign-in

| Variable | Default | What it does |
|---|---|---|
| `ENABLE_EMAIL_AUTH` | `true` | Magic-link login by mail. Needs the `SMTP_*` variables. |
| `SMTP_HOST` | empty | Mail server for the sign-in link. Without it, no one can sign in by mail. |
| `SMTP_PORT` | `587` | `465` switches to implicit TLS. |
| `SMTP_USER`, `SMTP_PASSWORD` | empty | Mail server login. The app logs in whenever the server offers AUTH, so a server that offers it needs both. |
| `SMTP_FROM` | `noreply@<host of APP_URL>` | Sender address. |
| `SMTP_FROM_NAME` | `LynxPrompt` | Sender name on the contact form's mail. |
| `ENABLE_PASSKEYS` | `true` | WebAuthn passkeys, for accounts that already exist. |
| `ENABLE_GITHUB_OAUTH` | `false` | GitHub login. Needs `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`; callback `<APP_URL>/api/auth/callback/github`. |
| `ENABLE_GOOGLE_OAUTH` | `false` | Google login. Needs `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`; callback `<APP_URL>/api/auth/callback/google`. |
| `ENABLE_SSO` | `false` | SAML, OIDC and LDAP, configured per team in the UI. |
| `ENABLE_USER_REGISTRATION` | `true` | `false` lets only existing accounts sign in (new ones get `RegistrationDisabled`). |
| `ENABLE_TURNSTILE` | `false` | Cloudflare Turnstile on the sign-in forms. |

## Features

| Variable | Default | What it does |
|---|---|---|
| `APP_NAME` | `LynxPrompt` | Name shown in the UI and in mail. |
| `APP_LOGO_URL` | empty | Your own logo in the header. |
| `ENABLE_AI` | `false` | AI editing of blueprints. Needs `ANTHROPIC_API_KEY`. |
| `AI_MODEL` | `claude-3-5-haiku-latest` | Model used for AI editing. |
| `ANTHROPIC_API_KEY` | empty | Your Anthropic key; only read when `ENABLE_AI=true`. |
| `ENABLE_BLOG` | `false` | The blog module (uses the blog schema). |
| `ENABLE_SUPPORT_FORUM` | `false` | The support forum module (uses the support schema). |
| `ENABLE_STRIPE` | `false` | Paid marketplace listings through Stripe. |
| `UMAMI_SCRIPT_URL` | empty | Umami analytics script. |
| `CONTACT_EMAIL` | empty | Where the contact form sends. |
| `STATUS_PAGE_URL` | empty | Status page link in the footer. |
| `ENABLE_FEDERATION` | `true` | Registers the instance's domain with the federation registry at start and every six hours, and serves `/.well-known/lynxprompt.json`. `false` keeps the instance to itself. |
| `FEDERATION_REGISTRY_URL` | `https://lynxprompt.com` | The registry the instance registers with. |

The CLI has two settings of its own: `lynxp config set-url <url>` (stored in the file `lynxp config path`
prints) and the `LYNXPROMPT_API_URL` environment variable, which wins when set. See [Usage](usage.md#the-cli).
