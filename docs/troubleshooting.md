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

`ENABLE_USER_REGISTRATION=false` and the address has no account yet. Create the account with registration on,
or invite the user to a team first.

## My account is not the superadmin

The promotion happens at sign-in when the address equals `SUPERADMIN_EMAIL` exactly (the compose file copies
`ADMIN_EMAIL` into it). Check the value with `docker compose ... exec lynxprompt printenv SUPERADMIN_EMAIL`,
fix `.env`, restart and sign in again.

## The container fails to start with a database error

The entrypoint runs `prisma db push` on four schemas and exits if one fails. The log names the schema. Usual
causes: PostgreSQL not ready yet (the compose file waits for its healthcheck, a hand-written one may not),
a wrong `DB_*_PASSWORD`, or a PostgreSQL 18 volume mounted at `/var/lib/postgresql/data` instead of
`/var/lib/postgresql` (the compose file has the right path and a comment).

## Sign-in fails with "The table `public.User` does not exist"

Two schemas point at the same database. `prisma db push` drops the tables it does not know, so each push at
start deletes the tables of the one before, and only the last schema's tables survive. Self-host compose files
fetched before this page was written had that layout. Take the current `docker-compose.selfhost.yml`, which
gives each schema its own database, and start again; if you set `DB_*_NAME` or `DATABASE_URL_*` yourself, give
each of the four its own database.

## Pull or start fails on an ARM host

The image is amd64 only. The compose file sets `platform: linux/amd64`, so Docker Desktop and Colima with
Rosetta run it under emulation; a Raspberry Pi needs `qemu-user-static` installed on the host. It is slower
than native.

## Port 3000 is already in use

Set `PORT=<free port>` and `APP_URL=http://localhost:<free port>` in `.env`.

## `lynxp` talks to lynxprompt.com instead of my instance

The CLI defaults to the hosted instance's API, `https://api.lynxprompt.com` (`lynxp config show` prints the
current value). Run `lynxp config set-url https://lynxprompt.example.com`, or set `LYNXPROMPT_API_URL`, which
wins over the config file, then `lynxp login` again.

## Reporting a bug

Open an issue at https://github.com/GeiserX/LynxPrompt/issues with: the image tag (`docker compose ... images`),
the host (OS, architecture, Docker version), the names of the `ENABLE_*` variables you set (never their
values or any secret), and the last 50 lines of `docker compose ... logs lynxprompt`. For a security problem
follow [SECURITY.md](https://github.com/GeiserX/LynxPrompt/blob/main/SECURITY.md) instead.
