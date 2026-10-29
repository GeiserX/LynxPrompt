# Troubleshooting

## The sign-in mail never arrives

The default login sends a link by mail through `SMTP_HOST`, and the self-host compose file sets no mail
server. `docker compose -f docker-compose.selfhost.yml logs lynxprompt` shows a nodemailer connection error
after each attempt. Fix: set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` and `SMTP_FROM` in `.env`
and restart, or add `-f docker-compose.mailpit.yml` to try it out and read the link at http://localhost:8025.
See [First sign-in](getting-started.md#first-sign-in).

## The link in the mail points at localhost, or at the wrong port

The link is built from `APP_URL`. Set it to the URL the browser uses (`https://lynxprompt.example.com`, or
`http://localhost:8080` when `PORT=8080`) and restart.

## "Registration is disabled" on sign-in

`ENABLE_USER_REGISTRATION=false` and the address has no account yet. Invite the address to a team first: a
pending, unexpired team invitation lets that address create its account and accept. Or create the account
with registration on.

## My account is not the superadmin

The promotion happens at sign-in when the address equals `SUPERADMIN_EMAIL`, ignoring case (the compose file copies
`ADMIN_EMAIL` into it). Check the value with `docker compose ... exec lynxprompt printenv SUPERADMIN_EMAIL`,
fix `.env`, restart and sign in again.

## The container fails to start with a database error

The entrypoint runs `prisma migrate deploy` on four schemas and exits if one fails. The log names the schema. Usual
causes: PostgreSQL not ready yet (the compose file waits for its healthcheck, a hand-written one may not),
a wrong `DB_*_PASSWORD`, or a PostgreSQL 18 volume mounted at `/var/lib/postgresql/data` instead of
`/var/lib/postgresql` (the compose file has the right path and a comment).

## Start fails with "DB predates 0_init and holds data of features since removed"

The database comes from a release older than 2.0.43 that still holds rows of a feature LynxPrompt has since
removed, such as the seller payouts and blueprint prices. The entrypoint brings an old database to the first
migration with one `prisma db push`, which refuses to drop data, and lists above that line what it would drop.
The database it names is left as it was, though another one may already have been upgraded in the same start,
so go back to the earlier image only with the backup. To upgrade, back up the databases, then start once with
`BASELINE_ACCEPT_DATA_LOSS=true` in `.env` (on Kubernetes, in the chart's `extraEnv`); the listed data is
deleted and every later migration runs. Remove the variable afterwards. Old blueprint tiers are kept without it: SIMPLE becomes SHORT and
ADVANCED becomes LONG.

## Sign-in fails with "The table `public.User` does not exist"

Two schemas point at the same database. `prisma db push` drops the tables it does not know, so each push at
start deletes the tables of the one before, and only the last schema's tables survive. Self-host compose files
fetched before this page was written had that layout. Take the current `docker-compose.selfhost.yml`, which
gives each schema its own database, and start again; if you set `DB_*_NAME` or `DATABASE_URL_*` yourself, give
each of the four its own database.

## Pull or start fails on an ARM host

The image is built for linux/amd64 and linux/arm64, and Docker pulls the one that matches the host. If it
fails with `exec format error`, an override forces the other architecture: remove any `platform:` line you
added to the compose file, or `DOCKER_DEFAULT_PLATFORM` from the environment, and pull again.

## Port 3000 is already in use

Set `PORT=<free port>` and `APP_URL=http://localhost:<free port>` in `.env`.

## `lynxp` talks to lynxprompt.geiser.cloud instead of my instance

The CLI defaults to the hosted instance, `https://lynxprompt.geiser.cloud` (`lynxp config show` prints the
current value). Run `lynxp config set-url https://lynxprompt.example.com`, or set `LYNXPROMPT_API_URL`, which
wins over the config file, then `lynxp login` again.

The hosted instance moved from `https://lynxprompt.com`. A CLI from 3.1.0 or older keeps that address in
its config file; a newer CLI rewrites it, and the login saved for it, to the new one on its next run.

## Reporting a bug

Open an issue at https://github.com/GeiserX/LynxPrompt/issues with: the image tag (`docker compose ... images`),
the host (OS, architecture, Docker version), the names of the `ENABLE_*` variables you set (never their
values or any secret), and the last 50 lines of `docker compose ... logs lynxprompt`. For a security problem
follow [SECURITY.md](https://github.com/GeiserX/LynxPrompt/blob/main/SECURITY.md) instead.
