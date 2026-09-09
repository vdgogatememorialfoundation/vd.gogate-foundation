/**
 * Central permission catalogue: Module -> Action.
 * Roles are rows in the DB; this file is the single source of truth for which
 * (module, action) pairs exist. Seeding upserts the catalogue; the admin UI
 * renders the matrix from it.
 */

export const MODULES = {
  dashboard: ["view"],
  users: ["view", "create", "edit", "delete", "disable", "ban", "reset_password", "resend_credentials", "export"],
  staff: ["view", "create", "edit", "delete", "assign_roles", "resend_credentials", "reset_password"],
  roles: ["view", "create", "edit", "delete"],
  settings: ["view", "edit", "integrations", "api_keys", "branding"],
  cms: ["view", "create", "edit", "delete", "publish"],
  articles: ["view", "create", "edit", "delete", "publish"],
  events: ["view", "create", "edit", "delete", "publish", "configure_forms", "export"],
  applications: ["view", "edit", "approve", "reject", "reject_documents", "transfer", "cancel", "change_fee", "discount", "submit_on_behalf", "export"],
  tickets: ["view", "issue", "resend", "revoke", "export"],
  checkin: ["view", "scan", "manual", "dashboard", "export"],
  certificates: ["view", "configure", "issue", "revoke", "export"],
  competitions: ["view", "create", "edit", "delete", "assign_judges", "set_criteria", "mark_winner", "export"],
  judging: ["view", "score", "review", "contact_applicant"],
  fellowship: ["view", "review", "approve", "trustee_decision", "export"],
  payments: ["view", "collect", "refund", "export"],
  pos: ["view", "sell", "refund"],
  shop: ["view", "create", "edit", "delete", "publish", "inventory"],
  orders: ["view", "pack", "ship", "ready_for_pickup", "complete", "cancel", "refund", "return", "export"],
  support: ["view", "reply", "assign", "close", "export"],
  notifications: ["view", "send", "configure"],
  reports: ["view", "export"],
  audit: ["view", "export"],
} as const;

export type Module = keyof typeof MODULES;
export type ActionOf<M extends Module> = (typeof MODULES)[M][number];
export type PermissionKey = { [M in Module]: `${M}:${ActionOf<M>}` }[Module];

export const ALL_PERMISSIONS: PermissionKey[] = (Object.keys(MODULES) as Module[]).flatMap((m) =>
  (MODULES[m] as readonly string[]).map((a) => `${m}:${a}` as PermissionKey)
);

export function permissionKey<M extends Module>(module: M, action: ActionOf<M>): PermissionKey {
  return `${module}:${action}` as PermissionKey;
}

export function parsePermission(key: string): { module: string; action: string } | null {
  const idx = key.indexOf(":");
  if (idx <= 0) return null;
  return { module: key.slice(0, idx), action: key.slice(idx + 1) };
}

/** System roles. `super_admin` implicitly holds every permission. */
export const SYSTEM_ROLES = {
  super_admin: { name: "Super Admin", userKind: "STAFF", permissions: "*" as const },
  admin: {
    name: "Admin",
    userKind: "STAFF",
    permissions: ALL_PERMISSIONS.filter((p) => !p.startsWith("settings:api_keys") && p !== "roles:delete"),
  },
  staff: {
    name: "Staff",
    userKind: "STAFF",
    permissions: [
      "dashboard:view",
      "users:view",
      "events:view",
      "applications:view",
      "applications:edit",
      "applications:approve",
      "applications:reject_documents",
      "applications:submit_on_behalf",
      "tickets:view",
      "tickets:resend",
      "checkin:view",
      "checkin:manual",
      "checkin:dashboard",
      "payments:view",
      "payments:collect",
      "pos:view",
      "pos:sell",
      "orders:view",
      "orders:pack",
      "orders:ship",
      "orders:ready_for_pickup",
      "orders:complete",
      "support:view",
      "support:reply",
      "reports:view",
      "reports:export",
    ] satisfies PermissionKey[],
  },
  volunteer: {
    name: "Volunteer (Scanner)",
    userKind: "STAFF",
    permissions: ["checkin:view", "checkin:scan", "checkin:manual", "checkin:dashboard"] satisfies PermissionKey[],
  },
  judge: {
    name: "Judge",
    userKind: "STAFF",
    permissions: ["judging:view", "judging:score", "judging:review", "judging:contact_applicant"] satisfies PermissionKey[],
  },
  reviewer: {
    name: "Fellowship Reviewer",
    userKind: "STAFF",
    permissions: ["fellowship:view", "fellowship:review"] satisfies PermissionKey[],
  },
  trustee: {
    name: "Trustee",
    userKind: "STAFF",
    permissions: ["fellowship:view", "fellowship:trustee_decision", "reports:view"] satisfies PermissionKey[],
  },
  applicant: { name: "Applicant / Customer", userKind: "APPLICANT", permissions: [] as PermissionKey[] },
} as const;

export type SystemRoleKey = keyof typeof SYSTEM_ROLES;

export interface GrantedRole {
  roleKey: string;
  permissions: ReadonlySet<string>;
  scopeType: string | null;
  scopeId: string | null;
}

export interface Scope {
  scopeType: string;
  scopeId: string;
}

/** Evaluate whether a set of granted roles satisfies `permission`, optionally within a scope. */
export function hasPermission(roles: readonly GrantedRole[], permission: PermissionKey, scope?: Scope): boolean {
  for (const role of roles) {
    if (role.roleKey === "super_admin") return true;
    if (!role.permissions.has(permission)) continue;
    if (role.scopeType === null) return true; // global grant
    if (scope && role.scopeType === scope.scopeType && role.scopeId === scope.scopeId) return true;
  }
  return false;
}

export function hasAnyPermission(roles: readonly GrantedRole[], permissions: PermissionKey[], scope?: Scope): boolean {
  return permissions.some((p) => hasPermission(roles, p, scope));
}
