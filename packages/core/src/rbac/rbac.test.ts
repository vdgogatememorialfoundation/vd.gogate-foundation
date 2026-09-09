import { describe, expect, it } from "vitest";
import { ALL_PERMISSIONS, SYSTEM_ROLES, hasPermission, type GrantedRole } from "./index.js";

const role = (roleKey: string, perms: string[], scopeType: string | null = null, scopeId: string | null = null): GrantedRole => ({
  roleKey,
  permissions: new Set(perms),
  scopeType,
  scopeId,
});

describe("rbac", () => {
  it("catalogue has no duplicates and system role permissions exist", () => {
    expect(new Set(ALL_PERMISSIONS).size).toBe(ALL_PERMISSIONS.length);
    for (const r of Object.values(SYSTEM_ROLES)) {
      if (r.permissions === "*") continue;
      for (const p of r.permissions) expect(ALL_PERMISSIONS).toContain(p);
    }
  });

  it("super admin has everything", () => {
    expect(hasPermission([role("super_admin", [])], "payments:refund")).toBe(true);
  });

  it("global grant", () => {
    expect(hasPermission([role("staff", ["events:view"])], "events:view")).toBe(true);
    expect(hasPermission([role("staff", ["events:view"])], "events:delete")).toBe(false);
  });

  it("scoped grant only matches its scope", () => {
    const roles = [role("volunteer", ["checkin:scan"], "EVENT", "e1")];
    expect(hasPermission(roles, "checkin:scan", { scopeType: "EVENT", scopeId: "e1" })).toBe(true);
    expect(hasPermission(roles, "checkin:scan", { scopeType: "EVENT", scopeId: "e2" })).toBe(false);
    expect(hasPermission(roles, "checkin:scan")).toBe(false);
  });
});
