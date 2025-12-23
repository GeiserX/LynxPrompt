# LynxPrompt Dependencies Tracking

> **Last Updated**: December 23, 2024  
> **Current Version**: 0.10.0

This document tracks all dependencies and their latest available versions.

## Runtime Dependencies

| Package | Current | Latest | Notes |
|---------|---------|--------|-------|
| `next` | 16.1.1 | ✅ Latest | Upgraded Dec 23, 2024 |
| `react` | 19.2.3 | ✅ Latest | |
| `react-dom` | 19.2.3 | ✅ Latest | |
| `@auth/prisma-adapter` | 2.11.1 | 🔍 Check | |
| `@hookform/resolvers` | 3.9.1 | 🔍 Check | |
| `@marsidev/react-turnstile` | 1.4.0 | 🔍 Check | Cloudflare Turnstile wrapper |
| `@prisma/client` | 7.2.0 | ✅ Latest | **Upgraded to v7!** |
| `@radix-ui/*` | Various | 🔍 Check | UI component library |
| `@simplewebauthn/browser` | 9.0.1 | 🔍 Check | Passkey authentication |
| `@simplewebauthn/server` | 9.0.3 | 🔍 Check | Passkey authentication |
| `@tanstack/react-query` | 5.90.12 | 🔍 Check | Data fetching |
| `class-variance-authority` | 0.7.1 | 🔍 Check | |
| `clsx` | 2.1.1 | 🔍 Check | |
| `jszip` | 3.10.1 | 🔍 Check | ZIP file generation |
| `lucide-react` | 0.562.0 | 🔍 Check | Icon library |
| `next-auth` | 4.24.13 | ⚠️ | v5 available but breaking |
| `next-themes` | 0.4.4 | 🔍 Check | Theme management |
| `nodemailer` | 7.0.12 | ✅ Latest | Updated Dec 23, 2024 |
| `react-hook-form` | 7.54.2 | 🔍 Check | Form management |
| `sonner` | 2.0.7 | ✅ Latest | Updated Dec 23, 2024 |
| `stripe` | 20.1.0 | 🔍 Check | Payment processing |
| `tailwind-merge` | 2.6.0 | 🔍 Check | |
| `tailwindcss-animate` | 1.0.7 | 🔍 Check | |
| `zod` | 4.0.1 | ✅ Latest | **Upgraded to v4** Dec 23, 2024 |
| `zustand` | 5.0.9 | 🔍 Check | State management |

## Development Dependencies

| Package | Current | Latest | Notes |
|---------|---------|--------|-------|
| `@tailwindcss/typography` | 0.5.15 | 🔍 Check | |
| `@tailwindcss/postcss` | 4.0.6 | ✅ Latest | **Tailwind v4** Dec 23, 2024 |
| `@testing-library/jest-dom` | 6.9.1 | 🔍 Check | |
| `@testing-library/react` | 16.3.1 | 🔍 Check | |
| `@types/node` | 22.10.2 | 🔍 Check | |
| `@types/nodemailer` | 7.0.4 | 🔍 Check | |
| `@types/react` | 19.2.7 | 🔍 Check | |
| `@types/react-dom` | 19.2.3 | 🔍 Check | |
| `@vitejs/plugin-react` | 4.3.4 | 🔍 Check | |
| `@vitest/coverage-v8` | 2.1.9 | 🔍 Check | |
| `eslint` | 9.39.2 | 🔍 Check | |
| `eslint-config-next` | 16.1.1 | ✅ Latest | Upgraded Dec 23, 2024 |
| `eslint-config-prettier` | 10.1.8 | 🔍 Check | |
| `husky` | 9.1.7 | 🔍 Check | Git hooks |
| `jsdom` | 27.3.0 | 🔍 Check | |
| `lint-staged` | 16.2.7 | 🔍 Check | |
| `postcss` | 8.5.6 | 🔍 Check | |
| `preact` | 10.28.0 | ✅ Latest | Updated Dec 23, 2024 |
| `prettier` | 3.7.4 | 🔍 Check | |
| `prettier-plugin-tailwindcss` | 0.7.2 | ✅ Latest | Updated Dec 23, 2024 |
| `prisma` | 7.2.0 | ✅ Latest | **Upgraded to v7!** |
| `tailwindcss` | 4.0.6 | ✅ Latest | **Upgraded to v4** Dec 23, 2024 |
| `tsx` | 4.19.2 | 🔍 Check | TypeScript executor |
| `typescript` | 5.9.3 | 🔍 Check | |
| `vitest` | 2.1.9 | 🔍 Check | Testing framework |

## Infrastructure

| Service | Current | Latest | Notes |
|---------|---------|--------|-------|
| PostgreSQL | 18.1-alpine3.23 | ✅ Latest | **Upgraded Dec 23, 2024** |
| ClickHouse | 25.11.2.24-alpine | ✅ Latest | **Upgraded Dec 23, 2024** (v25.12 not on Alpine) |
| Node.js (Docker) | 20-alpine | ✅ Latest | Runtime in container |

## Major Upgrade Notes (Dec 23, 2024)

### ✅ Completed
- **Tailwind CSS v4.0.6**: Migrated to CSS-first configuration, removed `tailwind.config.ts`, updated `globals.css` with `@import 'tailwindcss'` and `@theme` directive
- **Zod v4.0.1**: No breaking changes detected in codebase, upgrade seamless
- **PostgreSQL 18.1-alpine3.23**: **COMPLETED** - Migrated from bind mounts to Docker volumes to avoid Unraid BTRFS bug. Data successfully migrated via pg_dump/pg_restore. Backup at `/mnt/user/appdata/lynxprompt/pg-migration-final/`
- **ClickHouse 25.11.2.24-alpine**: **COMPLETED** - Latest Alpine image deployed (25.12 exists but only standard, not Alpine)
  - ⚠️ **Known Issue**: ClickHouse 25.11 rejects ISO 8601 DateTime strings with 'Z' suffix. Analytics events fail but website works. Will fix in application code.
- **Minor updates**: nodemailer (7.0.12), preact (10.28.0), prettier-plugin-tailwindcss (0.7.2), sonner (2.0.7)

### ✅ Additional Completed (Dec 23, 2024)
- **Prisma v7.2.0**: Successfully upgraded using driver adapter approach:
  - Generator: `provider = "prisma-client"` with `importFileExtension = ""`
  - Output: `src/generated/prisma-app` and `src/generated/prisma-users`
  - Runtime: `@prisma/adapter-pg` with `pg.Pool` for database connections
  - Config: `prisma.config-app.ts` and `prisma.config-users.ts` for CLI commands

### ⚠️ Important Note: PostgreSQL 18 Upgrade - COMPLETED

The PostgreSQL major version upgrade from 17 to 18 has been **completed successfully** with the following approach:
- **Migrated from bind mounts to Docker volumes** to avoid Unraid BTRFS mount propagation bug
- Data migrated using `pg_dump`/`pg_restore` workflow
- Full backup created at `/mnt/user/appdata/lynxprompt/pg-migration-final/` containing:
  - `app.backup` (19KB)
  - `users.backup` (46KB)
  - `postgres-app-v17/` (42MB)
  - `postgres-users-v17/` (691KB)
- All containers running on PostgreSQL 18.1-alpine3.23
- Website confirmed operational at https://lynxprompt.com

## Update Strategy

1. **Major versions**: Research breaking changes, test in dev
2. **Minor/Patch**: Update regularly, test builds
3. **Security updates**: Apply immediately
4. **Framework updates**: Follow official migration guides

## Next Steps

- [ ] Complete PostgreSQL 18 data migration
- [ ] Run `npm outdated` to check remaining packages
- [ ] Update @radix-ui packages to latest
- [ ] Update @tanstack/react-query to latest
- [ ] Check if Stripe SDK has updates
- [ ] Research next-auth v5 migration path
- [ ] Monitor Prisma v7 for Next.js compatibility



