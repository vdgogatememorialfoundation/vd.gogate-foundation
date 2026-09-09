"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { prisma } from "@vgmf/db";
import { assertCan } from "@vgmf/auth";
import { ALL_PERMISSIONS, audit, parsePermission, type PermissionKey } from "@vgmf/core";
import { auditContext, getSessionUser } from "@/lib/session";
import { localePath } from "@/lib/admin";
import { parseForm, type ActionState } from "@/lib/forms";

const roleSchema = z.object({
  id: z.string().uuid().optional(),
  key: z.string().trim().regex(/^[a-z][a-z0-9_]{1,63}$/, "Lowercase letters, digits and underscores only"),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  userKind: z.enum(["STAFF", "APPLICANT"]).default("STAFF"),
  permissions: z.array(z.string()).optional(),
});

export async function saveRoleAction(_: ActionState, form: FormData): Promise<ActionState> {
  const actor = await getSessionUser();
  const parsed = parseForm(roleSchema, form);
  if ("error" in parsed) return parsed.error;
  const d = parsed.data;
  assertCan(actor, d.id ? "roles:edit" : "roles:create");
  const perms = (d.permissions ?? []).filter((p): p is PermissionKey => (ALL_PERMISSIONS as string[]).includes(p));
  const ctx = await auditContext(actor);

  const existing = d.id ? await prisma.role.findUnique({ where: { id: d.id } }) : null;
  if (d.id && !existing) return { ok: false, error: "Role not found" };
  if (existing?.key === "super_admin") return { ok: false, error: "super_admin always holds every permission and cannot be edited" };
  if (!existing) {
    const dup = await prisma.role.findUnique({ where: { key: d.key } });
    if (dup) return { ok: false, fieldErrors: { key: "A role with this key already exists" } };
  }

  const permissionRows = await prisma.permission.findMany({ where: { OR: perms.map((p) => parsePermission(p)!).map(({ module, action }) => ({ module, action })) } });

  const role = await prisma.$transaction(async (tx) => {
    const r = existing
      ? await tx.role.update({ where: { id: existing.id }, data: { name: d.name, description: d.description || null, ...(existing.isSystem ? {} : { key: d.key, userKind: d.userKind }) } })
      : await tx.role.create({ data: { key: d.key, name: d.name, description: d.description || null, userKind: d.userKind } });
    await tx.rolePermission.deleteMany({ where: { roleId: r.id } });
    if (permissionRows.length) await tx.rolePermission.createMany({ data: permissionRows.map((p) => ({ roleId: r.id, permissionId: p.id })) });
    return r;
  });

  await audit(ctx, {
    module: "roles",
    action: existing ? "role.updated" : "role.created",
    summary: `${existing ? "Updated" : "Created"} role ${role.name} (${role.key}) with ${permissionRows.length} permissions`,
    entityType: "Role",
    entityId: role.id,
    metadata: { permissions: perms },
  });
  revalidatePath("/[locale]/admin/roles", "page");
  const locale = await getLocale();
  redirect(localePath(locale, `/admin/roles/${role.id}?saved=1`));
}

export async function deleteRoleAction(form: FormData): Promise<void> {
  const actor = await getSessionUser();
  assertCan(actor, "roles:delete");
  const id = String(form.get("id"));
  const role = await prisma.role.findUnique({ where: { id }, include: { _count: { select: { userRoles: true } } } });
  if (!role) throw new Error("Role not found");
  if (role.isSystem) throw new Error("System roles cannot be deleted");
  if (role._count.userRoles > 0) throw new Error("Remove this role from all users before deleting it");
  await prisma.role.delete({ where: { id } });
  await audit(await auditContext(actor), { module: "roles", action: "role.deleted", summary: `Deleted role ${role.name} (${role.key})`, entityType: "Role", entityId: id });
  const locale = await getLocale();
  redirect(localePath(locale, "/admin/roles"));
}
