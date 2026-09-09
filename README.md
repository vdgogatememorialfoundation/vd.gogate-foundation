# Vaidya Gogate Memorial Foundation — Unified Platform

Monorepo for the foundation website, applicant/staff portals, and (later) the Expo customer and volunteer apps.

```
apps/web            Next.js 15 — public site, applicant portal, admin/staff portals
packages/db         Prisma schema (split per domain) + migrations + seed
packages/core       Domain logic: ids, rbac, realtime contracts, commerce statuses, audit
packages/auth       Password/OTP/session/account-state services
packages/integrations  Payment / shipping / mail provider interfaces + adapters, secret crypto
packages/i18n       Locales (en, mr, hi) and message catalogues
docs/               Architecture, migrations, workflows
```

## Getting started

```bash
nvm use                 # Node 22
corepack enable && pnpm install
cp .env.example .env    # set DATABASE_URL, APP_SECRET, bootstrap admin
pnpm db:generate
pnpm db:deploy          # apply migrations
pnpm db:seed            # system roles, permissions, bootstrap super admin, default settings
pnpm dev                # http://localhost:3000
```

## Verification

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

See `docs/architecture/overview.md` for the domain model and conventions.
