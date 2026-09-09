# Migration strategy

Schema is split per domain under `packages/db/prisma/schema/*.prisma` and applied as controlled
domain migrations rather than one big initial migration:

| # | Migration | Domain |
| - | --------- | ------ |
| 001 | `20260909055937_001_identity` | User, Session, OtpCode, account states |
| 002 | `20260909055939_002_rbac` | Role, Permission, RolePermission, UserRole (+scope) |
| 003 | `20260909055940_003_cms` | SiteSetting, IntegrationConfig, Page, legal pages |
| 004 | `20260909055942_004_audit` | AuditLog |

Planned: 005 events, 006 applications/forms, 007 payments, 008 commerce, 009 competitions, 010 fellowship,
011 certificates, 012 notifications.

Commands: `pnpm db:migrate` (dev, creates migration), `pnpm db:deploy` (apply), `pnpm db:seed`.
Transactional tables use soft-delete; never write a migration that drops historical payment/application rows.
