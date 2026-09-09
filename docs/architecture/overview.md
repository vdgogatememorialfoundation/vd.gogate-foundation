# Architecture overview

`vaidyagogate-autism` is the **reference implementation**. Its proven event/judge/payment/scanner
logic is ported into domain packages here; nothing in this repo calls the autism server or database.

## Layers

```
apps/web (Next.js 15, server actions + route handlers)
apps/mobile, apps/volunteer (Expo, later phases)
        │  all validation is server-side
        ▼
packages/core, packages/commerce (domain rules, pure TypeScript)
packages/auth (identity services)          packages/integrations (provider adapters)
        ▼
packages/db (Prisma client, one PostgreSQL database)
```

Rules:

- No single giant API file. Each domain lives in its own folder with its own tests.
- Business rules live in `packages/*`; `apps/*` only wire HTTP/UI to them.
- Provider-specific code (Razorpay, Shiprocket, Porter, …) is behind interfaces in `packages/integrations`;
  application code never branches on provider name.

## Identifiers

| Kind                     | Format                          |
| ------------------------ | ------------------------------- |
| Database primary key     | UUID (`@default(uuid())`)       |
| Public user/event/application/competition ID | random 12-digit numeric string |
| Payment / order / ticket ref | prefixed random ref (`PAY-…`, `ORD-…`, `TKT-…`) |

Public IDs come from `packages/core/src/ids` (`generateUniquePublicId`), are never sequential, and
are stored in a `publicId` column with a unique index. See `ids.md`.

## Identity and account lifecycle

```
Account created → 12-digit User ID → email/mobile OTP → set password → ACTIVE
```

States: `PENDING_ACTIVATION`, `ACTIVE`, `DISABLED`, `BANNED`, `DELETED` (anonymised, history kept).
Admins can reset to a temporary password (forced change on next login) but never see a password.
Sessions are random tokens stored hashed; cookie `vgmf_session`.

## RBAC

`User → Roles → Permissions (module:action) → optional Scope (event / competition / fellowship cycle / clinic)`.
The permission catalogue is `MODULES` in `packages/core/src/rbac`. `super_admin` implicitly has all.
See `rbac.md`.

## Audit / timeline

Every important mutation writes an immutable `AuditLog` row (`packages/core/src/audit`). Admin can
inspect a global timeline and per-entity history. Transactional records are soft-deleted only.

## Realtime

Socket.IO rooms and event names are defined once in `packages/core/src/realtime` and shared by web and apps.
See `realtime.md`.

## Commerce statuses

Normalised order statuses per fulfilment mode live in `packages/core/src/commerce`; provider statuses
are mapped into them. Live courier location is only offered when the provider exposes a location API —
it is never simulated. See `order-statuses.md`.

## Localisation

`next-intl` with `en`, `mr`, `hi`. `packages/i18n/scripts/check-keys.mjs` fails lint if catalogues drift.

## Configuration & secrets

Site settings and provider credentials are stored in the DB (`SiteSetting`, `IntegrationConfig`), secrets
encrypted with `APP_SECRET` (`packages/integrations/src/crypto`) and shown masked in the admin UI.
