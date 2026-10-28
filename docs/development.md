# Development

## Architecture

- **Frontend + API**: Next.js 16 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Docker Compose with auto-migration on startup
- **Auth**: NextAuth.js with configurable providers
- **Search**: Full-text search via PostgreSQL

Four Prisma schemas (app, users, blog, support), each in its own database. One PostgreSQL server can hold all
four; two schemas must never share a database, because `prisma db push` drops the tables it does not know.

## Development

```bash
git clone https://github.com/GeiserX/LynxPrompt.git
cd LynxPrompt
docker run -d --name lynxprompt-db -p 5432:5432 -e POSTGRES_USER=lynxprompt -e POSTGRES_PASSWORD=changeme postgres:18-alpine
for db in app users blog support; do docker exec lynxprompt-db createdb -U lynxprompt lynxprompt_$db; done
cp env.example .env   # uncomment the four DATABASE_URL_* lines (Option A)
npm install
set -a; . ./.env; set +a   # Prisma 7 does not read .env by itself
npm run db:generate
npm run db:push
npm run dev
```

`docker compose up -d` with the root `docker-compose.yml` starts the full stack, app included, on port 3000;
its databases publish no port, so `npm run dev` cannot reach them. Use it to run the image, not to develop.

See [CONTRIBUTING.md](https://github.com/GeiserX/LynxPrompt/blob/main/CONTRIBUTING.md) for contribution guidelines.

## Docs

The site is MkDocs Material, built strictly:

```bash
pip install -r docs/requirements-docs.txt
mkdocs build --strict     # any broken link or unreachable page fails it
mkdocs serve
```

`docs.yml` builds every pull request and deploys `main` into the `gh-pages` branch next to the Helm
repository's `index.yaml`, which it never touches.
