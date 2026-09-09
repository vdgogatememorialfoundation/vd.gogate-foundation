# RBAC

`User → UserRole → Role → RolePermission → Permission(module, action)`, with optional scope
(`EVENT`, `COMPETITION`, `FELLOWSHIP_CYCLE`, `CLINIC`) on a role assignment.

Permission keys are `module:action` strings (e.g. `events:approve`, `orders:ready_for_pickup`).
The full catalogue is `MODULES` in `packages/core/src/rbac/index.ts` and is what the admin role editor renders,
so adding a module/action there is enough to make it assignable.

System roles seeded by `packages/db/prisma/seed.ts`: `super_admin`, `admin`, `staff`, `volunteer`, `judge`,
`reviewer`, `trustee`, `applicant`. System roles cannot be deleted; `super_admin` implicitly holds every permission
and only a super admin can grant it.

Guards:

- `packages/auth/src/access.ts` — `hasPermission`, `assertPermission`, staff detection.
- `apps/web/src/lib/admin.ts` — `requireStaff(permission?)` for server components/actions.
