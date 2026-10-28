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
`lynxprompt_blog` and `lynxprompt_support`. The first start creates `lynxprompt_users`. The blog and support
databases are only created and migrated while `ENABLE_BLOG` or `ENABLE_SUPPORT_FORUM` is on, so an instance
without those features runs on two databases. Turning a feature off leaves its database as it is, and turning
it back on migrates it from where it stopped. Never point two schemas
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

| Variable | Default | What it does |
|---|---|---|
| `DB_SSL` | `false` | `true` makes the app's own connections to PostgreSQL use TLS. The migrations at start connect with the connection string as written. |
| `DB_SSL_REJECT_UNAUTHORIZED` | `true` | With `DB_SSL=true`, `false` accepts a server certificate that does not verify, such as a self-signed one. |

## Sign-in

| Variable | Default | What it does |
|---|---|---|
| `ENABLE_EMAIL_AUTH` | `true` | Magic-link login by mail. Needs the `SMTP_*` variables. |
| `SMTP_HOST` | empty | Mail server for the sign-in link. Without it, no one can sign in by mail. |
| `SMTP_PORT` | `587` | `465` switches to implicit TLS. |
| `SMTP_USER`, `SMTP_PASSWORD` | empty | Mail server login. The app logs in whenever the server offers AUTH, so a server that offers it needs both. |
| `SMTP_FROM` | `noreply@<host of APP_URL>` | Sender address. |
| `ENABLE_PASSKEYS` | `true` | WebAuthn passkeys, for accounts that already exist. |
| `ENABLE_GITHUB_OAUTH` | `false` | GitHub login. Needs `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`; callback `<APP_URL>/api/auth/callback/github`. |
| `ENABLE_GOOGLE_OAUTH` | `false` | Google login. Needs `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`; callback `<APP_URL>/api/auth/callback/google`. |
| `ENABLE_SSO` | `false` | OpenID Connect sign-in, configured per team in the UI. A team's IdP signs in only addresses on a domain the team verified with a TXT record at `_lynxprompt-sso.<domain>`. Needs `SSO_ENCRYPTION_KEY`. |
| `SSO_ENCRYPTION_KEY` | empty | 64 hex characters (32 bytes, `openssl rand -hex 32`). Encrypts the SSO client secrets at rest; without it a team cannot save an SSO configuration. Keep it: changing it makes the stored secrets unreadable. |
| `SSO_ALLOW_PRIVATE_IDP` | `false` | `true` lets a team's IdP live on a private or loopback address and use plain `http://`. Leave it off on an instance strangers can sign up to: the server calls the IdP's URLs itself. |
| `ENABLE_USER_REGISTRATION` | `true` | `false` lets only existing accounts and addresses with a pending team invitation sign in (others get `RegistrationDisabled`). |
| `ENABLE_TURNSTILE` | `false` | Cloudflare Turnstile on the sign-in forms. Needs both keys below. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | empty | Turnstile site key, read when the container starts. |
| `TURNSTILE_SECRET_KEY` | empty | Turnstile secret key. With `ENABLE_TURNSTILE=true` and no secret, the server skips the check. |

## Client address

Rate limits and download counts key on the client's address, so the app needs to know which header your proxy writes.

| Variable | Default | What it does |
|---|---|---|
| `TRUSTED_PROXY` | `1` | How many reverse proxies sit in front of the app. The app reads the X-Forwarded-For entry that many places from the right, the one your outermost proxy wrote; anything to its left came from the client. `cloudflare` reads CF-Connecting-IP instead; set it only when the app cannot be reached except through Cloudflare. With no proxy at all, a client can choose its own X-Forwarded-For, so put the app behind one. |

## Features

| Variable | Default | What it does |
|---|---|---|
| `APP_NAME` | `LynxPrompt` | Name shown in the UI and in mail. |
| `APP_LOGO_URL` | empty | Your own logo in the sign-in mail and in search-engine metadata. The header keeps the LynxPrompt logo. |
| `ENABLE_AI` | `false` | AI editing of blueprints. Needs `ANTHROPIC_API_KEY`. |
| `AI_MODEL` | `claude-haiku-5-5` | Model used for AI editing. |
| `ANTHROPIC_API_KEY` | empty | Your Anthropic key; only read when `ENABLE_AI=true`. |
| `ENABLE_BLOG` | `false` | The blog module. Its database is migrated only while this is on. |
| `ENABLE_SUPPORT_FORUM` | `false` | The support forum module. Its database is migrated only while this is on. |
| `UMAMI_SCRIPT_URL` | empty | Umami analytics script. Loaded only when `NEXT_PUBLIC_UMAMI_WEBSITE_ID` is set too. |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | empty | Umami website id. |
| `CONTACT_EMAIL` | `info@<host of APP_URL>` | Where the contact form sends. The form needs `SMTP_HOST`, `SMTP_USER` and `SMTP_PASSWORD`, so it does not work against a mail server without a login. |
| `STATUS_PAGE_URL` | empty | Status page link in the footer. |
| `UPLOAD_DIR` | `/data/uploads/blog` | Where blog images go; avatars and team logos go one level up. The self-host compose file mounts the `uploads` volume at `/data/uploads`. |
| `ENABLE_FEDERATION` | `false` | `true` registers the instance's domain with the federation registry at start and every six hours, and serves `/.well-known/lynxprompt.json`. Needs an `APP_URL` on https with a public domain name. Off, the instance makes no call to the registry. |
| `FEDERATION_REGISTRY_URL` | `https://lynxprompt.com` | The registry the instance registers with. |

The CLI has two settings of its own: `lynxp config set-url <url>` (stored in the file `lynxp config path`
prints) and the `LYNXPROMPT_API_URL` environment variable, which wins when set. See [Usage](usage.md#the-cli).
