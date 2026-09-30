# Development

## Architecture

- **Frontend + API**: Next.js 16 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Docker Compose with auto-migration on startup
- **Auth**: NextAuth.js with configurable providers
- **Search**: Full-text search via PostgreSQL

Supports single-database or multi-database setups depending on your scale requirements.

## Development

```bash
git clone https://github.com/GeiserX/LynxPrompt.git
cd LynxPrompt
cp env.example .env
docker compose up -d
npm install --legacy-peer-deps
npm run dev
```

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
