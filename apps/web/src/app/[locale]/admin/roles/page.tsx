import { prisma } from "@vgmf/db";
import { can } from "@vgmf/auth";
import { ALL_PERMISSIONS } from "@vgmf/core";
import { Link } from "@/i18n/navigation";
import { requireStaff } from "@/lib/admin";

export default async function RolesPage() {
  const actor = await requireStaff("roles:view");
  const roles = await prisma.role.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { permissions: true, userRoles: true } } } });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Roles & Permissions</h1>
        {can(actor, "roles:create") ? <Link href="/admin/roles/new" className="btn-primary">New role</Link> : null}
      </div>
      <p className="text-sm text-stone-600">Permissions follow Module → Action. {ALL_PERMISSIONS.length} permissions are defined in the platform catalogue.</p>
      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase text-stone-500">
            <tr><th className="px-4 py-2">Role</th><th className="px-4 py-2">Key</th><th className="px-4 py-2">For</th><th className="px-4 py-2">Permissions</th><th className="px-4 py-2">Users</th><th className="px-4 py-2">Type</th></tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {roles.map((r) => (
              <tr key={r.id} className="hover:bg-stone-50">
                <td className="px-4 py-2"><Link href={`/admin/roles/${r.id}`} className="font-medium text-brand-700 hover:underline">{r.name}</Link><div className="text-xs text-stone-500">{r.description}</div></td>
                <td className="px-4 py-2 font-mono text-xs">{r.key}</td>
                <td className="px-4 py-2">{r.userKind}</td>
                <td className="px-4 py-2">{r.key === "super_admin" ? "All" : r._count.permissions}</td>
                <td className="px-4 py-2">{r._count.userRoles}</td>
                <td className="px-4 py-2 text-xs">{r.isSystem ? "System" : "Custom"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
