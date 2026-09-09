import { hasPermission, type GrantedRole, type PermissionKey, type Scope } from "@vgmf/core";
import type { SessionUser } from "./session.js";

export function grantedRoles(user: SessionUser): GrantedRole[] {
  return user.roles.map((r) => ({ roleKey: r.key, permissions: new Set(r.permissions), scopeType: r.scopeType, scopeId: r.scopeId }));
}

export function can(user: SessionUser | null, permission: PermissionKey, scope?: Scope): boolean {
  if (!user) return false;
  return hasPermission(grantedRoles(user), permission, scope);
}

export function isStaff(user: SessionUser | null): boolean {
  return Boolean(user && user.kind === "STAFF");
}

export class ForbiddenError extends Error {
  constructor(public readonly permission?: PermissionKey) {
    super(permission ? `Missing permission ${permission}` : "Forbidden");
  }
}

export function assertCan(user: SessionUser | null, permission: PermissionKey, scope?: Scope): asserts user is SessionUser {
  if (!can(user, permission, scope)) throw new ForbiddenError(permission);
}
