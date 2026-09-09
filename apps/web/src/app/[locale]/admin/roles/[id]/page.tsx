import { notFound } from "next/navigation";
import { prisma } from "@vgmf/db";
import { can } from "@vgmf/auth";
import { requireStaff } from "@/lib/admin";
import { deleteRoleAction } from "@/app/actions/admin-roles";
import { RoleForm } from "./RoleForm";

export default async function RoleDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const isNew = id === "new";
  const actor = await requireStaff(isNew ? "roles:create" : "roles:view");
  const role = isNew ? null : await prisma.role.findUnique({ where: { id }, include: { permissions: { include: { permission: true } }, _count: { select: { userRoles: true } } } });
  if (!isNew && !role) notFound();
  const granted = role?.permissions.map((p) => `${p.permission.module}:${p.permission.action}`) ?? [];
  const readOnly = role?.key === "super_admin" || (!isNew && !can(actor, "roles:edit"));
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isNew ? "New role" : role!.name}</h1>
        {role && !role.isSystem && can(actor, "roles:delete") ? (
          <form action={deleteRoleAction}><input type="hidden" name="id" value={role.id} /><button className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50">Delete role</button></form>
        ) : null}
      </div>
      {sp.saved ? <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Role saved.</p> : null}
      {role?.key === "super_admin" ? <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">Super Admin implicitly holds every permission.</p> : null}
      <RoleForm
        role={role ? { id: role.id, key: role.key, name: role.name, description: role.description, userKind: role.userKind, isSystem: role.isSystem } : null}
        granted={granted}
        readOnly={readOnly}
      />
    </div>
  );
}
