# LynxPrompt Dependencies Tracking

> **Last Updated**: December 23, 2024  
> **Current Version**: 0.8.18

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
| `@prisma/client` | 6.19.1 | 🔍 Check | |
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
| `nodemailer` | 7.0.11 | 🔍 Check | Email sending |
| `react-hook-form` | 7.54.2 | 🔍 Check | Form management |
| `sonner` | 1.7.1 | 🔍 Check | Toast notifications |
| `stripe` | 20.1.0 | 🔍 Check | Payment processing |
| `tailwind-merge` | 2.6.0 | 🔍 Check | |
| `tailwindcss-animate` | 1.0.7 | 🔍 Check | |
| `zod` | 3.25.76 | 🔍 Check | Schema validation |
| `zustand` | 5.0.9 | 🔍 Check | State management |

## Development Dependencies

| Package | Current | Latest | Notes |
|---------|---------|--------|-------|
| `@tailwindcss/typography` | 0.5.15 | 🔍 Check | |
| `@testing-library/jest-dom` | 6.9.1 | 🔍 Check | |
| `@testing-library/react` | 16.3.1 | 🔍 Check | |
| `@types/node` | 22.10.2 | 🔍 Check | |
| `@types/nodemailer` | 7.0.4 | 🔍 Check | |
| `@types/react` | 19.2.7 | 🔍 Check | |
| `@types/react-dom` | 19.2.3 | 🔍 Check | |
| `@vitejs/plugin-react` | 4.3.4 | 🔍 Check | |
| `@vitest/coverage-v8` | 2.1.9 | 🔍 Check | |
| `autoprefixer` | 10.4.23 | 🔍 Check | |
| `eslint` | 9.39.2 | 🔍 Check | |
| `eslint-config-next` | 16.1.1 | ✅ Latest | Upgraded Dec 23, 2024 |
| `eslint-config-prettier` | 10.1.8 | 🔍 Check | |
| `husky` | 9.1.7 | 🔍 Check | Git hooks |
| `jsdom` | 27.3.0 | 🔍 Check | |
| `lint-staged` | 16.2.7 | 🔍 Check | |
| `postcss` | 8.5.6 | 🔍 Check | |
| `preact` | 10.11.3 | 🔍 Check | |
| `prettier` | 3.7.4 | 🔍 Check | |
| `prettier-plugin-tailwindcss` | 0.6.9 | 🔍 Check | |
| `prisma` | 6.19.1 | 🔍 Check | ORM CLI |
| `tailwindcss` | 3.4.19 | 🔍 Check | |
| `tsx` | 4.19.2 | 🔍 Check | TypeScript executor |
| `typescript` | 5.9.3 | 🔍 Check | |
| `vitest` | 2.1.9 | 🔍 Check | Testing framework |

## Infrastructure

| Service | Current | Latest | Notes |
|---------|---------|--------|-------|
| PostgreSQL | 17-alpine | ✅ Latest | Two instances (app + users) |
| ClickHouse | 24-alpine | ✅ Latest | Analytics database |
| Node.js (Docker) | 20-alpine | ✅ Latest | Runtime in container |

## Update Strategy

1. **Major versions**: Research breaking changes, test in dev
2. **Minor/Patch**: Update regularly, test builds
3. **Security updates**: Apply immediately
4. **Framework updates**: Follow official migration guides

## Next Steps

- [ ] Run `npm outdated` to check all packages
- [ ] Update @radix-ui packages to latest
- [ ] Update @tanstack/react-query to latest
- [ ] Update Prisma to latest stable
- [ ] Check if Stripe SDK has updates
- [ ] Research next-auth v5 migration path
