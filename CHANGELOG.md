# Changelog

All notable changes to LynxPrompt will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

From 3.0.0 the web app and the CLI share one version and one release: the `vX.Y.Z` tag, the Docker image `drumsergio/lynxprompt:X.Y.Z` and `lynxprompt@X.Y.Z` on npm. Each `## [X.Y.Z]` section below covers both and becomes that release's notes. Before 3.0.0 the app and the CLI had their own version lines (`app-v*` and `cli-v*` tags).

## [3.1.0] - 2026-10-28

3.1.0 keeps one copy of the rules in `AGENTS.md`, which most coding agents now read by themselves. It also writes skills, subagents and MCP servers where each agent looks for them, and retires five dead platforms.

### Upgrade notes

**1. Back up the app and users databases before you start the new image.** One migration per schema (`20261028160000_add_agent_definition_type`) adds `AGENT_DEFINITION` to the `TemplateType` enum. It is additive and changes nothing else, but Postgres cannot drop an enum value, so only a backup takes you back to 3.0.0.

**2. Files the web wizard and `lynxp wizard` write now.**
- **Several tools give one `AGENTS.md`.** A tool that reads `AGENTS.md` gets no file of its own. `CLAUDE.md` and `GEMINI.md` become the one-line pointer `@AGENTS.md`. Copilot, Trae, Tabnine and Firebase Studio cannot reach `AGENTS.md`, so they keep a full copy. Picking Claude Code or Gemini CLI alone also writes `AGENTS.md`. To keep a full file per tool, use `--no-pointers` in the CLI or turn pointers off on the web.
- **Antigravity, Junie, Kilo Code, Goose, Warp and OpenHands** now get `AGENTS.md` instead of their own file.
- **Windsurf is now Devin Desktop** and writes `.devin/rules/project.md` with `trigger: always_on`, not `.windsurfrules`. The old paths still work in the tool.
- **Cline** writes `.clinerules/project.md`, or `.cline/rules/project.md` when a legacy `.clinerules` file is already there.
- **Aider** gets `AGENTS.md` plus a `.aider.conf.yml` with `read: [AGENTS.md]`, not `CONVENTIONS.md`. The CLI adds `AGENTS.md` to an existing `.aider.conf.yml` and keeps the rest. Cloud Sync saves `AGENTS.md`, never the config. `lynxp convert <file> aider` no longer writes a file.
- **Tabnine** writes Markdown guidelines to `.tabnine/guidelines/project.md` instead of `.tabnine.yaml`. **Trae** rules get `alwaysApply: true`.
- Regenerate and commit the new files, then delete the old copies you no longer want.

**3. Pulled skills land in two folders.** `lynxp pull` and the web download write a skill to `.agents/skills/<name>/SKILL.md` (only the Agent Skills fields) and `.claude/skills/<name>/SKILL.md` (as written). A skill with no stored path used to pull to `.claude/skills` only. Kiro and Firebender get a copy only when picked or when their folder is already in the project. A local copy that differs is kept unless you pass `--yes`.

**4. Retired platforms: Continue, Sourcegraph Cody, Supermaven, CodeGPT and Void.** They are gone from the wizard, the CLI and the blueprint pickers. Their ids still work and generate `AGENTS.md`, and `devin` resolves to Devin Desktop. Their blueprint types stay in the database, so stored blueprints still load and download as they are.

**5. API changes.**
- **`PUT /api/auth/device` is removed.** Nothing called it. `POST /api/auth/device` stays.
- **Saving a skill with an invalid name returns 400**, on the web API and the v1 API, so on `lynxp push` too. A name is 1 to 64 characters of `a-z`, `0-9` and `-`, with no hyphen at either end, no `--`, and equal to its folder. A skill with no name still saves.
- **`lynxp convert` refuses an MCP config with no known servers key** (`mcpServers`, `servers`, `mcp`, `context_servers`, `mcp_servers`). `lynxp pull` writes such content as it is.
- **`GET /api/blueprints/[id]` returns `repositoryPath`** when the blueprint has one, the path it was pushed from.

**6. Pointer files and the token-mode sync header.**
- `lynxp push` refuses a file whose whole body is `@AGENTS.md` (`--force` overrides) and leaves it out of `--all`. `lynxp sync` never pushes it over the cloud rules. `.aider.conf.yml` is never pushed or synced, since it can hold API keys.
- A Cloud Sync header written in token mode now runs `lynxp pull <id> --yes` and `lynxp push <file>` with `LYNXPROMPT_TOKEN` and `LYNXPROMPT_API_URL` set, instead of curl and jq. Both sync modes now need the CLI installed. Headers already in your files keep working until you regenerate them.

### Added
- **OpenAI Codex** as a platform, writing `AGENTS.md`.
- **Subagents** as the `AGENT_DEFINITION` blueprint type. They go to `.claude/agents/<name>.md` and `.agents/agents/<name>.md`, plus `.github/agents/<name>.agent.md` for Copilot and `.codex/agents/<name>.toml` for Codex when picked. `lynxp push` also finds subagents in the Cursor, Gemini, OpenCode, Kiro, Junie, Factory, Qwen, Augment, Trae, Kilo, Cline and Devin folders. The web create and edit pages offer the Subagent type.
- **MCP configs for 24 targets**, up from four. These include settings files (`.gemini/settings.json`, `.qwen/settings.json`, `.zed/settings.json`, `.amp/settings.json`, `opencode.json`, `kilo.jsonc` and more) and TOML for Codex (`.codex/config.toml`) and Mistral Vibe (`.vibe/config.toml`). `lynxp convert`, `pull` and `sync` merge only the MCP part into a settings file and keep every other key, and `push` uploads only the servers. The web download gives the MCP part and explains how to merge it.
- **Command targets** for Gemini CLI (TOML), Kiro, Junie, Augment, Trae, Kilo Code, Cline workflows, Roo, Crush, Firebender, Factory, Qwen Code and Pi.
- **`lynxp convert <file> <target>`** writes one copy of a skill or subagent for another tool, for example `codex-agent`, `copilot-agent` or `kiro-skill`.
- **A docs page for skills and subagents** at `/docs/blueprints/skills-and-subagents`.

### Changed
- **`lynxp push` and `lynxp check` find every rules file a tool reads**, from the platform table: `.claude/rules/`, `.github/instructions/`, `.devin/rules/`, `.junie/`, `.agents/rules/`, `QWEN.md`, a legacy `.cursorrules` and the old Windsurf paths. They skip `CLAUDE.local.md`, `AGENTS.local.md` and `AGENTS.override.md`. `lynxp check` does not warn about a pointer file.
- **`lynxp push` reads every agent's skills folder.** Pushing a copy whose sibling is already linked is refused with a pointer to the linked file, and `push --all` pushes each skill or subagent once.
- **The CLI wizard stores the synced file's path** on the blueprint it creates, so `lynxp pull` writes a synced Cursor or Claude file back to its own path instead of `AGENTS.md`.
- **The web wizard toggle reads "Sign in with lynxp login"**, and the CLI wizard asks whether `lynxp login` is possible.
- **Docs** show where each agent reads its rules, list 26 rules platforms and 18 with commands, and say Devin Desktop instead of Windsurf.

### Removed
- **`PUT /api/auth/device`.**
- **The passkey `CredentialsProvider`**, which could never sign anyone in, and the JWT callbacks that existed only for it. Passkeys keep working as the second factor.
- **`.windsurf/mcp_config.json`** as an MCP target. No tool reads it.
- **Unused `cli/src/utils/agents.ts` and `agent-detector.ts`.**

### Fixed
- **`npm ci` works again**: `package-lock.json` lacked eight packages npm 10 needs. The app CI now runs `npm ci` on Node 26, the image's Node.

## [3.0.0] - 2026-10-28

3.0.0 is the first release where the web app and the CLI share one version: the tag `v3.0.0`, the image `drumsergio/lynxprompt:3.0.0`, `lynxprompt@3.0.0` on npm, and the Homebrew, Chocolatey, Snap and AUR packages. It collects the changes released step by step on 2026-10-28 as app 2.1.45 to 2.1.50 and CLI 2.1.38 to 2.1.42, most of them fixes from a full audit of the code, plus what followed. Those releases stay published.

### Upgrade guide

This guide is for an instance or a CLI on app 2.1.44 or CLI 2.1.37 or earlier. Act in this order.

If you already run app 2.1.45 to 2.1.50, the guide still applies from your version on. Migrations that already ran are skipped.

**1. Back up every database before you start the new image.**
- The image now applies reviewed migrations with `prisma migrate deploy` instead of `prisma db push`. On the first start, a database an earlier release built with `db push` is brought to the current schema once from the frozen `0_init` baseline, without `--accept-data-loss`, and recorded as migrated. If that step would lose data, startup stops and nothing is changed.
- Migrations drop `User.subscriptionPlan`, the `SubscriptionPlan` enum, and `userPlan` on support posts and comments. Their values were only FREE or TEAMS and nothing read them, but the drop cannot be undone without a backup.
- A migration recounts blueprint download and favorite counts from the rows that record them, and deletes favorite rows whose type is neither `system` nor `user`. Counts inflated by page views before 2.1.45 go down, and the old numbers cannot be restored without a backup.
- Other migrations add the `AGENT_SKILL` and `MCP_CONFIG` blueprint types and clear the team id of private blueprints (see Fixed).

**2. Set the required configuration.**
- **SSO needs a verified domain.** A team's IdP now signs in only addresses on a domain the team verified with a TXT record at `_lynxprompt-sso.<domain>`. Existing SSO configurations stop signing anyone in until an admin adds the record and presses Verify.
- **`SSO_ENCRYPTION_KEY`** (64 hex characters) is required to save an SSO configuration. `SSO_ALLOW_PRIVATE_IDP=true` lets an IdP live on a private address or plain http, for trusted instances only.
- **`TRUSTED_PROXY`** says which client address to use for rate limits: the number of reverse proxies in front of the app (default 1), or `cloudflare` to read `CF-Connecting-IP`. Use `cloudflare` only when the app cannot be reached except through Cloudflare.
- **`NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `NEXT_PUBLIC_UMAMI_WEBSITE_ID`** are read at runtime, not baked into the image. Set them in the container's environment.
- **`AI_MODEL` must name a model in the price table** (`src/lib/ai-pricing.ts`). The default is now `claude-haiku-5-5`, since the old default is retired. With a model that has no price row, the AI route answers 503 ("AI service not configured") and logs which model is missing, without calling the model or touching the budget.
- **Federation is off by default.** A new or upgraded instance no longer registers with the public registry or serves the federation endpoints unless `ENABLE_FEDERATION=true`. Set it to stay listed. With it on, an `APP_URL` the registry cannot reach (http, localhost, an IP address or a port) is skipped with a warning.
- **The blog and the support forum are off by default, and their databases are only migrated while their feature is on.** With `ENABLE_BLOG` or `ENABLE_SUPPORT_FORUM` off, the image does not create or migrate that database, `/api/blog`, `/api/blog/[slug]` and `/api/upload/blog` answer 404, and the support API answers 404. A database left from earlier releases keeps its rows; turning the flag on migrates it from where it stopped. A default self-host runs on two databases.
- **Content Security Policy**: `script-src` no longer allows `'unsafe-inline'`; the app sends a fresh nonce per request. A reverse proxy that sets its own `Content-Security-Policy` must let the app's header through, or its policy blocks the app's scripts.
- **`docker-compose.selfhost.yml` now loads `.env` into the app**, so settings such as `ENABLE_AI=true` or `ENABLE_SSO=true` written there reach it. Before, they were silently dropped. The explicit environment block still wins, and the app is pinned to `PORT=3000` and `HOSTNAME=0.0.0.0`, so `PORT` in `.env` only moves the published host port. `SMTP_FROM_NAME` and `PLATFORM_OWNER_EMAIL` did nothing and are gone from the chart, the compose files and env.example; values files that still set `smtp.fromName` or `app.platformOwnerEmail` render without them.
- **Helm**: chart 0.1.3 and later give each of the four Prisma schemas its own database (`<name>`, `<name>_users`, `<name>_blog`, `<name>_support`); earlier charts pointed all four at one, so every start dropped the other schemas' tables and sign-in failed. Chart 0.1.4 and later mount the uploads volume at `/data/uploads`, where the app writes; earlier charts mounted `/app/public/uploads`, so uploads never reached the volume.

**3. Behaviour users will notice.**
- **Passkey users must prove the passkey before private reads and any write.** A session that signed in with a magic link or OAuth but has not passed the passkey step gets 403 with `passkeyRequired: true` on every write and on private reads (private blueprints, API tokens, team SSO settings, drafts, profile). Public pages show what a signed-out visitor sees. In the browser, a refused write sends the user to the passkey step and back to the same page; the wizard keeps its unsaved answers. The private team page, admin and blog admin sit behind the passkey guard. Accounts without passkeys see no change.
- **Passkey "trust this device"** no longer skips the passkey prompt.
- **SSO accepts OpenID Connect only.** A SAML or LDAP configuration saved earlier never signed anyone in; it is now refused at sign-in with a 400, and the settings endpoint no longer returns its fields. Replace it with OpenID Connect.
- **`/api/v1/user` and the CLI login poll no longer return `plan`.**
- **Magic links are limited to three per address every 10 minutes.** The fourth request is refused, and the sign-in page says to wait.
- **MCP configs are checked for secrets at every visibility.** A team or private push of an MCP config holding a key asks for confirmation, like a public one. `--allow-sensitive` pushes it anyway; under `-y` it is refused.

**4. Update the CLI** with `npm i -g lynxprompt`, `brew upgrade GeiserX/lynxprompt/lynxprompt`, `snap refresh lynxprompt` or your AUR helper. The Snap and AUR packages were stuck at 2.1.1 and now follow every release.
- **File paths follow the web download.** `lynxp` writes Zed rules to `.rules`, Firebase Studio to `.idx/airules.md`, Roo Code and Kilo Code to `.md` files, Aider to `CONVENTIONS.md`, OpenCode to `AGENTS.md`, Firebender to `.firebender/rules/project.mdc` and Copilot prompts to `.github/prompts/*.prompt.md`. `lynxp push` still recognises the old paths; pull again to get the files where the tools read them.
- **`lynxp wizard` writes the same content as the web wizard**, because both now use one shared generator. Expect different sections and wording in regenerated files. Continue, Cody, Tabnine, Supermaven, CodeGPT and Void get real configs instead of skeletons (Continue now gets `systemMessage`, which it reads, instead of `customInstructions`). The user's email is no longer written into rules files, and the signed-in profile is used only when the user chose to include it.
- **`lynxp wizard` writes CLAUDE.md and GEMINI.md as `@AGENTS.md`** when it also writes AGENTS.md, so the rules live in one file. `--no-pointers` keeps full copies.
- **Logins are kept per instance.** Switching servers with `set-url` keeps the other logins, `lynxp logout` revokes only the current server's token, and `config reset-url` goes back to `https://lynxprompt.com`. Downgrading to an older CLI asks for a new login.
- **`lynxp check --ci` fails on hidden Unicode** in rule files (zero-width characters, bidi overrides and isolates, tag characters, variation selectors). A lone direction mark (LRM, RLM, ALM) next to text, usual in right-to-left files, is only a warning; marks inside a run of other hidden characters are errors. A pipeline that passed before can fail until the characters are removed.
- **`lynxp convert` writes the same file as the web download** for every Markdown tool. JSON and YAML configs are refused as a source or a target; `lynxp wizard` generates those.
- **A file tracked by an older CLI can get one conflict on its first push**, from the checksum fix. `lynxp pull` or `--force` clears it.
- **Logins from lynxp before 2.1.37 are refused from 2027-01-01.** Those CLIs log in without a code challenge. Until then the login works and the response carries a `deprecation` field; from that date it answers 400 with "This version of lynxp is too old to log in. Update lynxp ...".

### Added
- **One version and one release for the app and the CLI**: one tag `vX.Y.Z`, one GitHub release marked Latest with this file's section as notes and install lines for every channel, and one dispatch that publishes the image and every CLI channel. A manual release run takes a `patch`, `minor` or `major` bump and a `dry_run`. Merges close together collapse into at most two releases, and publishes run one at a time in order.
- **Account deletion in Settings** (Security, Delete account). It removes the account and what it owns, anonymizes the user's forum posts and blog posts, and refuses while the user is the only admin of a team with other members.
- **Agent Skills and MCP configs** as blueprint types. `lynxp push` and `pull` know the skills folders and MCP config files of the main tools, and `lynxp convert .mcp.json vscode-mcp` (or `cursor-mcp`, `claude-mcp`, `kiro-mcp`) rewrites the servers for another tool.
- **One download for several tools**: the wizard's "Several Tools (.zip)" button puts each file at its real path.
- **Devin**: rules go to `.devin/rules/project.md` with `trigger: always_on`.
- **Deleting an old blueprint version**, so a secret removed in a later edit can leave the history. Owners only; the current version stays.
- **`lynxp sync`** keeps tracked files current in one command: it pulls cloud changes, pushes local ones, and writes `<file>.remote` on a conflict without touching either side. `--dry-run` previews.
- **`lynxp pull --vars VAR=value,...`** fills blueprint variables the way the web download does, and `sync`, `diff` and `push` keep using the values.
- **`lynxp pull` of a hierarchy in one request**, and several ids in one command (`lynxp pull bp_a bp_b ha_c`).
- **`--json`** on `lynxp check`, `list`, `search` and `whoami`.
- **`lynxp config set-url` and `reset-url` check the saved login** on the new instance (10 second timeout) and say whether it works, was refused, or could not be checked. With no saved login they make no request.
- **ETag and 304** on `GET /api/v1/blueprints/[id]`, so a client can skip downloading an unchanged blueprint.
- **arm64 image**: the image is built natively for linux/amd64 and linux/arm64, with an SBOM, build provenance and a cosign signature.
- **Snap and AUR packages are built on every release** again (Snap on amd64 and arm64), installed and checked with `lynxprompt --version` before upload. The AUR PKGBUILD now lives in the repo under AGPL-3.0-or-later. The snap keeps its config in its own data directory, so a machine that exports `XDG_CONFIG_HOME` no longer makes it fail with EACCES.

### Changed
- **Team pages** show each member's last-seen date and how many seats are taken, and no longer promise paid-plan features.
- **Generated files, web and CLI**: languages, frameworks and databases are written by name (TypeScript, Next.js, PostgreSQL) instead of their ids, and answer ids a label table does not list get the wizard's own label. Zed, Warp, Junie, OpenHands and Crush files carry the tool's name instead of "Claude Code Instructions", and Cline and Goose files are no longer titled "Windsurf AI Rules". A developer background without a skill level is written.
- **The Cloud Sync header** has one implementation, the web wizard's. It names the file in `lynxp link/push/pull/diff`, points at the CLI's server when that is not lynxprompt.com, and is written whenever a blueprint id is passed.
- **The self-host compose file and the Helm chart (0.1.6)** run app 2.1.50; the pins pull request that follows each release moves them to the new version.
- **Docs**: `docs/configuration.md` and the self-hosting page list every variable the server reads, including `SSO_ENCRYPTION_KEY`, `TRUSTED_PROXY`, `UPLOAD_DIR`, `DB_SSL` and the Turnstile and Umami keys.

### Removed
- **SAML and LDAP** from the team SSO settings. Neither ever had a sign-in flow.
- **Billing plan leftovers**: the plan no longer travels through sessions, tokens, the wizard or the support forum, and the "Free" badge is gone.
- **The CLI's own rules generator** (about 1,200 lines), replaced by the shared one. Its generic per-language style tips and "Generated by ... CLI" footer are gone.
- **Dead generator code and CLI docs** for `lynxp agents` and `lynxp import --link`, which do not exist.

### Security
- **SSO account takeover**: a team's IdP could sign in as any existing account by asserting its email. Sign-in now needs a verified domain, `javascript:` and other non-http URLs are refused in the SSO settings, and the server no longer calls IdP token or userinfo URLs on private addresses.
- **Passkey second factor**: it was enforced only by a page guard and a few routes, so a magic link or OAuth login alone could read private data and change blueprints, teams and settings through the API. The server now enforces it on private reads, on every write, before minting API tokens and before managing passkeys.
- **API token scopes**: read-only tokens can no longer write blueprints or use the AI editor.
- **CLI login**: the CLI proves it started the login with a PKCE-style verifier, so someone who sees the login URL cannot collect the token. Tokens are stored with mode 0600 and bound to the server they were issued for, and `lynxp logout` revokes them.
- **Rate limits and captcha**: forged `X-Forwarded-For` headers no longer give a fresh rate-limit bucket, the magic-link form checks Turnstile, the magic-link limit stops anyone flooding one address with links while Turnstile is off, and a slow regular expression in the sensitive-data check is gone.
- **Injected scripts**: removing `'unsafe-inline'` from `script-src` stops injected inline scripts and `javascript:` URLs from running.
- **Blueprint routes**: hierarchy and parent ids must belong to the caller, private blueprints are no longer counted or listed through download and v1 routes, and bad paging values no longer cause 500s. A blueprint switched from team to private through the API stayed readable by its old team through download, stats and version history; one read rule now covers every route, and a private blueprint is never shared.
- **Support forum and privacy**: stored IP hashes are an HMAC keyed with `NEXTAUTH_SECRET` instead of a plain sha256 anyone can reverse.
- **The image no longer trusts the compromised eMudhra intermediates**: it upgrades Alpine's CA bundle to 20261020-r0 and runs Node with `--use-openssl-ca`, because Node's built-in roots still accept certificates issued through the eight eMudhra intermediates whose keys leaked. Outgoing HTTPS and SMTP (GitHub, Google sign-in, Turnstile, mail) verify against the patched system bundle.

### Fixed
- **AI editor**: the budget counted every call at old Haiku rates, about 2.5 times the real spend of the default model, so users hit their limit at roughly 40% of it. Each model is now priced from one table; the cap is unchanged. The budget resets every month instead of stopping after the first 30 days, parallel requests cannot overspend it, and the editor is reachable from the blueprint pages.
- **Final newlines survive push and pull**: the v1 routes trimmed content before storing it, so every pulled file lost its final newline. They store it as sent; a push that differs only in leading or trailing whitespace updates the row without a new version. `lynxp pull` and `sync` end files with exactly one newline, and `lynxp diff` no longer shows a final newline as an added line. A file at the line limit that ends with a newline is accepted.
- **Valid YAML from the CLI**: a project name with quotes or colons made `lynxp wizard` write `.mdc` and `.tabnine.yaml` files the tools could not parse, so they ignored the rules.
- **Private blueprints lose their old team link**: before 2.1.47, making a blueprint private through the v1 API kept its team id. The read rule already ignored it; a data-only migration now clears it.
- **Blueprint types**: the web and the v1 API store the same type for the names older CLIs and web clients send, editing a blueprint on the web keeps its type, and the web editor checks the line cap.
- **Blueprint edits and CLI sync**: every write stores the content checksum, and `lynxp push` no longer reports a conflict, or overwrites edits, because of a checksum mismatch.
- **`lynxp pull` and `push` through the v1 API** follow the same read, visibility and sensitive-data rules as the web.
- **CLI behaviour**: `convert`, `push` and `pull` handle Trae, Amazon Q, Augment, Kiro and legacy `.cursorrules` files, and terminal output escapes control characters from the server.
- **Teams**: invitations are emailed to the invitee, admins can manage members and seats, and an invited address can sign in when registration is off.
- **Wizard**: every answer reaches the generated file, drafts save from the last step too, and downloads use the file name and format each AI tool reads.
- **Support forum categories on a fresh install**: the default categories are seeded on every start. In 2.1.45 the seed failed because the image lacked `@prisma/adapter-pg`, so a new instance's forum could not take posts.
- **Last login**: accounts record `lastLoginAt` on every sign-in.
- **Health check**: `/api/health` checks both databases and returns 503 when one is down; `/api/health/live` answers without touching a database.
- **Privacy policy**: it says accounts are deleted from Settings at once, lists what deletion removes and what stays without your identity, and names Gravatar, which receives an MD5 hash of the email of an account with no profile picture. The security page no longer says deletion requests take 30 days.
- **Homebrew**: the formula's sha256 is the hash of the real npm tarball (2.1.36 shipped the hash of npm's 404 page), and the CLI is built from its release tag.
- **Release pipeline**: a release waits for the full CI and an image build on both platforms, image signing retries its check when the registry lists the signature late, the snap build waits until npm serves the new version, and the self-host pins pull request approves its own held CI runs. Each push to main runs the CI suite once, and pull requests start fewer jobs.

## [2.1.40] - 2026-10-10

### Fixed
- **Sign-in over plain http**: the image always named its auth cookies `__Secure-`/`__Host-` and marked them Secure, which browsers refuse on an `http://` address, `localhost` included. On an instance opened over http the sign-in page said the mail was on its way, but no mail was sent and nobody could sign in. Cookie names and the Secure flag now follow whether `NEXTAUTH_URL` (or `APP_URL`) starts with `https://`; an https instance keeps the same cookies, so nobody is signed out.
- **`SUPERADMIN_EMAIL` on the first sign-in**: the promotion ran before the account existed, so the address only became superadmin on its second sign-in. The new account is now created as superadmin.
- **Uploads**: the image now creates `/data/uploads` owned by the app user (uid 1001). Before, avatar, team logo and blog image uploads failed with a permission error, and a named volume mounted there started out owned by root.

## [2.1.38] - 2026-10-09

App 2.1.38 and CLI 2.1.35.

### Security
- **Repository detection no longer reaches internal hosts**: the wizard's "detect from repository" endpoint matched hosts as substrings of the whole URL, so a URL such as `https://10.0.0.5:8443/gitlab.com/x` was treated as GitLab and the server called the internal address. Hosts are now compared on the parsed hostname, web detection only queries gitlab.com, GitHub owner and repository names are validated and URL-encoded, and the GitHub URL pattern is anchored so long input cannot make it slow. The CLI classifies hosts by hostname the same way.
- **Federation heartbeat calls the registered domain**: the heartbeat built its outgoing request from the domain in the request body. It now uses the domain stored on the registered instance.
- **Read-only CI token**: the CLI tests and Docker Hub description workflows now run with `contents: read`.

### Fixed
- **CLI `convert` to Aider**: backslashes are escaped, so a rule holding a Windows path or ending in a backslash no longer produces a `.aider.conf.yml` that fails to parse.

## [2.0.0] - February 2026

### BREAKING CHANGES
- **Self-hostable platform**: LynxPrompt is now a self-hostable platform. Companies can deploy on their own infrastructure.
- **Subscription tiers removed**: All features are available to all users. No more Free/Pro/Max/Teams tiers.
- **GlitchTip removed**: Error tracking is now optional via generic `SENTRY_DSN` env var.
- **ClickHouse removed**: Analytics engine fully removed from the stack.
- **Database consolidation**: Default deployment uses a single PostgreSQL database.

### Added
- **Feature flags system**: All features configurable via environment variables (`ENABLE_AI`, `ENABLE_BLOG`, `ENABLE_STRIPE`, etc.).
- **Self-hosting docker-compose**: New `docker-compose.selfhost.yml` for minimal 1-Postgres deployment.
- **Custom branding**: `APP_NAME`, `APP_URL`, `APP_LOGO_URL` env vars for white-labeling.
- **Dynamic CSP headers**: Content-Security-Policy built from enabled services at startup.
- **Auto-migration on startup**: `entrypoint.sh` runs Prisma migrations automatically.
- **FeatureFlagsProvider**: Client-side React context for feature flag access.
- **Self-hosting documentation**: Comprehensive `/docs/self-hosting` guide with env var reference.
- **Health check enhancement**: `/api/health` now checks database connectivity.
- **Configurable auth**: Toggle GitHub/Google OAuth, Email, Passkeys, SSO, Turnstile, and user registration independently.
- **Configurable AI**: `ENABLE_AI`, `AI_MODEL` env vars control AI feature availability.
- **Configurable content modules**: Blog and support forum toggled via env vars (default off).
- **Registration control**: `ENABLE_USER_REGISTRATION=false` for invite-only instances.

### Changed
- **Stripe is optional**: Marketplace payments controlled by `ENABLE_STRIPE`. When enabled, platform commission routes through LynxPrompt's Stripe by default.
- **SSO promoted to first-class**: No longer gated behind Teams subscription.
- **Team management simplified**: Billing removed, kept as organizational grouping.
- **Sentry is optional**: Only initializes when DSN is configured.
- **Umami script URL configurable**: `UMAMI_SCRIPT_URL` env var replaces hardcoded URL.
- **CLI simplified**: Removed plan display from `whoami` and `wizard`.
- **README rewritten**: Self-hostable platform positioning with deployment guide.

### Removed
- **Pricing page**: `/pricing` route deleted.
- **Subscription billing**: Stripe subscription checkout, webhooks for subscriptions, plan change API.
- **TeamBillingRecord model**: Schema and all references removed.
- **Upgrade CTAs**: All "Upgrade to Teams" prompts removed from UI, CLI, and docs.
- **GlitchTip infrastructure**: Containers, Caddy entry, DNS record deleted.
- **ClickHouse**: All analytics code, env vars, docker-compose service removed.
- **Percona pg_tde**: Replaced with standard PostgreSQL in dev docker-compose.

---

## [1.6.0] - February 2026

### Added
- **MCP Servers config**: New wizard field (CLI + WebUI) to list MCP servers the developer uses. Generated output tells the AI to use them when relevant.
- **Workaround behavior toggle**: New toggle to control whether the AI should attempt creative workarounds when stuck, or stop and ask.
- **Infrastructure questions**: Conditional wizard questions for SSH server access (key path) and manual deployment method (Portainer, Docker Compose, Kubernetes, bare metal).
- **Burke Holland-inspired AI rules**: New behavior options — "Code for LLMs", "Self-Improving Config", "Always Verify Work", "Terminal Management", "Check Docs First".
- **Paid template variable preview**: Locked paid templates now show their customizable variables (name + default) so users can see what they'll get before purchasing.
- **Socialify banner**: Added dynamic Socialify image to README for better GitHub social previews.
- **XCTest support**: Now available in test frameworks (via shared package import).

### Changed
- **Persona wording**: Generated output now uses "Developer background: X. Adapt your suggestions..." instead of "I am X" or "You are X" — properly tells the AI about the developer's expertise without roleplaying.
- **CLI wizard refactored**: Languages, frameworks, databases, and test frameworks now imported from the shared package instead of being hardcoded in the CLI.
- **CLI agent sessions hint**: Improved explanation for the "multiple AI agent sessions" wizard question.

### Removed
- **ClickHouse references**: Cleaned up remaining ClickHouse mentions from ROADMAP.md documentation.

---

## [1.3.0] - January 2026

### Added
- **AI Agent Commands Support**: Store and manage AI IDE slash commands (like `/deploy`, `/test`)
  - New blueprint types: `CURSOR_COMMAND` and `CLAUDE_COMMAND`
  - CLI: `lynxp import` now detects command files in `.cursor/commands/` and `.claude/commands/`
  - CLI: `lynxp push` automatically infers command type from file path
  - WebUI: Command type selection in blueprint creation with visual badges
  - WebUI: Export commands to different IDEs (Cursor ↔ Claude Code)
  - Commands support variable defaults like regular blueprints
- **Command detection in CLI**: Automatic scanning of common command directories
- **Command badges**: Visual indicators throughout the UI to distinguish commands from rules

### Changed
- Blueprint type selector now has grouped options (AI Rules vs AI Commands)
- Import command output now shows discovered commands alongside config files
- Download modal shows command-specific export options with target directory hints

---

## [1.2.0] - January 2026

### Added
- **Hierarchy as First-Class Entity**: Hierarchies now have their own identity (`ha_xxx` IDs)
  - `GET/POST /api/v1/hierarchies` endpoints
  - `GET/DELETE /api/v1/hierarchies/{id}` with full tree structure
  - CLI: `lynxp hierarchies` to list all hierarchies
  - CLI: `lynxp pull ha_xxx` downloads entire hierarchy with directory structure
- **Optimistic Locking**: Prevent accidental overwrites when collaborating
  - `content_checksum` field on blueprints
  - `expected_checksum` parameter on PUT requests
  - 409 Conflict response when checksum mismatch
  - CLI: `--force` flag to override conflict detection
- Complete docs page rewrite for hierarchy feature

### Changed
- Hierarchies are now stored in a dedicated `Hierarchy` table
- Dashboard shows hierarchies with `ha_` IDs and names
- Removed `repositoryRoot` field from UserTemplate (now on Hierarchy model)
- API responses include `hierarchy_id` instead of `repository_root`

---

## [1.1.0] - January 2026

### Added
- **Monorepo Hierarchy Support**: AGENTS.md files can now be organized in hierarchical structures
  - Parent-child relationships between blueprints
  - Repository path tracking for monorepo organization
  - CLI auto-detects hierarchy when pushing from subdirectories
  - Dashboard shows grouped hierarchical blueprints with expandable tree view
  - Web UI supports manual hierarchy configuration for AGENTS_MD blueprints
- Documentation page for monorepo hierarchy feature (`/docs/blueprints/hierarchy`)

### Changed
- Dashboard API now returns `hierarchicalBlueprints` grouped by repository
- Blueprint create/update APIs accept `parentId`, `repositoryPath`, `repositoryRoot` fields
- CLI push command detects git repository root and calculates relative paths

---

## [1.0.0] - January 2026

### BREAKING CHANGES
- **Pricing Model Simplified**: Removed Pro and Max subscription tiers
  - All individual users now get full wizard access (previously Pro/Max only)
  - AI features (editing, wizard assistant) restricted to Teams tier only
  - Legacy Pro/Max users automatically migrated to Users tier

### Added
- Full wizard access for all Users (formerly "Free" tier)
- All platforms support for Users (Cursor, Claude, Windsurf, etc.)
- API access for blueprint management for all Users
- Database migration script: `prisma/migrations/migrate-pro-max-to-users.ts`

### Changed
- Renamed "Free" tier to "Users" throughout the application
- Pricing page now shows only Users vs Teams comparison
- Updated all documentation to reflect new pricing model
- CLI wizard now gives full access to all users (AI restricted to Teams)
- Settings page shows simplified upgrade options

### Removed
- Pro tier ($12/month)
- Max tier ($20/month)
- Pro/Max badges from wizard steps
- Tier-based wizard step restrictions (all steps now accessible)

### Migration Notes
For database administrators:
```bash
# Run the migration script to convert Pro/Max users to Users tier
npx tsx prisma/migrations/migrate-pro-max-to-users.ts
```

---

## [0.23.x] - December 2025

### Changed
- Repository reorganized for public release
- Moved internal tooling to `tooling/` directory
- Added GitHub Actions workflows for CI/CD
- Added comprehensive documentation (SECURITY.md, RELEASING.md)

---

## [0.21.x] - December 2025

### Added
- Blueprint versioning system
- Teams pricing tier with per-seat billing
- API support for blueprint management
- Wizard drafts auto-save functionality
- Device 2FA authentication
- Infinite scroll for blueprint listings
- Annual billing option (10% discount)

### Changed
- Improved API sync UI and toggle styling
- Enhanced wizard UI and user experience
- Updated homepage tagline

### Fixed
- Enum queries in admin stats API
- Team blueprint access and discounts
- Gravatar fallback for blog author images

### Security
- Rate limiting increased to 5000 requests/minute
- Nice 429 error page for rate limited users

---

## [0.18.x - 0.20.x] - December 2025

### Added
- Contact page with working email form
- Support forum for bug reports and feature requests
- Blog with admin panel
- Team logo upload and display
- Traffic preparation features (503 fallback page)

### Changed
- Docker build optimizations (BuildKit cache, npm ci, parallel Prisma)
- Next.js build optimizations (optimizePackageImports)

### Fixed
- Team billing logic for seat changes
- Stripe checkout flow for team creation
- EU consent requirements for subscription upgrades

### Security
- AGENTS.md removed from version control
- Cloudflare configuration for DDoS protection

---

## [0.15.x - 0.17.x] - November 2025

### Added
- Multi-database architecture (app, users, blog, support)
- ClickHouse analytics integration
- Passkey (WebAuthn) authentication
- Magic link authentication
- Stripe integration for payments
- Subscription management (Free, Pro, Max, Teams)

### Changed
- Migrated from single database to multi-database setup
- Enhanced error tracking with GlitchTip

---

## [0.1.x - 0.14.x] - Earlier 2025

### Added
- Initial wizard for generating AI IDE configuration files
- Support for multiple AI agents (Cursor, Copilot, Claude, etc.)
- User authentication via GitHub and Google OAuth
- Template marketplace foundation
- Blueprint creation and sharing

---

*For detailed commit history, see the [GitHub commits](https://github.com/GeiserX/LynxPrompt/commits/main).*







