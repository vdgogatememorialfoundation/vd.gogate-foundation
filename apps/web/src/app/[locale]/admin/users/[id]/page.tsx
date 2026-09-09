import { notFound } from "next/navigation";
import { prisma } from "@vgmf/db";
import { can } from "@vgmf/auth";
import { entityTimeline } from "@vgmf/core";
import { requireStaff } from "@/lib/admin";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Timeline } from "@/components/admin/Timeline";
import { adminAnonymizeUserAction, adminAssignRolesAction, adminResendCredentialsAction, adminResetPasswordAction, adminUserStatusAction } from "@/app/actions/admin-users";
import { EditUserForm } from "./EditUserForm";

export default async function UserDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const actor = await requireStaff("users:view");
  const { id } = await params;
  const sp = await searchParams;
  const user = await prisma.user.findUnique({ where: { id }, include: { userRoles: { include: { role: true } }, sessions: { where: { revokedAt: null, expiresAt: { gt: new Date() } }, select: { id: true } } } });
  if (!user) notFound();
  const isStaffUser = user.kind === "STAFF";
  const mod = isStaffUser ? "staff" : "users";
  const [roles, timeline] = await Promise.all([
    isStaffUser ? prisma.role.findMany({ where: { userKind: "STAFF" }, orderBy: { sortOrder: "asc" } }) : Promise.resolve([]),
    entityTimeline("User", user.id),
  ]);
  const self = user.id === actor.id;
  const isSuper = actor.roles.some((r) => r.key === "super_admin");

  return (
    <div className="space-y-6">
      {sp.created ? <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Account created. User ID {user.publicId}.</p> : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{user.firstName} {user.lastName}</h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-stone-600">
            <span className="font-mono">{user.publicId}</span>
            <span>{user.kind}</span>
            <StatusBadge status={user.status} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="mb-3 font-semibold">Profile</h2>
            <dl className="mb-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-stone-500">Email</dt><dd>{user.email} {user.emailVerifiedAt ? <span className="text-xs text-green-700">verified</span> : <span className="text-xs text-amber-700">unverified</span>}</dd></div>
              <div><dt className="text-xs text-stone-500">Created</dt><dd>{user.createdAt.toISOString().slice(0, 16).replace("T", " ")}</dd></div>
              <div><dt className="text-xs text-stone-500">Last login</dt><dd>{user.lastLoginAt?.toISOString().slice(0, 16).replace("T", " ") ?? "—"}</dd></div>
              <div><dt className="text-xs text-stone-500">Active sessions</dt><dd>{user.sessions.length}</dd></div>
            </dl>
            {can(actor, `${mod}:edit`) && user.status !== "DELETED" ? <EditUserForm user={{ id: user.id, firstName: user.firstName, lastName: user.lastName, phone: user.phone, locale: user.locale }} /> : null}
          </section>

          {isStaffUser && can(actor, "staff:assign_roles") && user.status !== "DELETED" ? (
            <section className="rounded-xl border border-stone-200 bg-white p-5">
              <h2 className="mb-3 font-semibold">Roles</h2>
              <form action={adminAssignRolesAction} className="space-y-3">
                <input type="hidden" name="id" value={user.id} />
                <div className="grid gap-2 sm:grid-cols-2">
                  {roles.map((r) => {
                    const granted = user.userRoles.some((ur) => ur.roleId === r.id && !ur.scopeType);
                    const locked = r.key === "super_admin" && !isSuper;
                    return (
                      <label key={r.id} className={`flex items-start gap-2 rounded-md border p-2 text-sm ${locked ? "opacity-50" : "border-stone-200"}`}>
                        <input type="checkbox" name="roles[]" value={r.key} defaultChecked={granted} disabled={locked} className="mt-0.5" />
                        <span><span className="font-medium">{r.name}</span>{r.description ? <span className="block text-xs text-stone-500">{r.description}</span> : null}</span>
                      </label>
                    );
                  })}
                </div>
                <button className="btn-primary">Save roles</button>
              </form>
            </section>
          ) : null}

          <section className="rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="mb-3 font-semibold">Activity timeline</h2>
            <Timeline rows={timeline} />
          </section>
        </div>

        <aside className="space-y-3">
          <h2 className="font-semibold">Account actions</h2>
          {user.status === "DELETED" ? <p className="text-sm text-stone-500">This account has been anonymized.</p> : null}
          {user.status !== "DELETED" && can(actor, `${mod}:resend_credentials`) ? (
            <form action={adminResendCredentialsAction}><input type="hidden" name="id" value={user.id} /><button className="btn-secondary w-full">Resend account details</button></form>
          ) : null}
          {user.status !== "DELETED" && can(actor, `${mod}:reset_password`) ? (
            <form action={adminResetPasswordAction}><input type="hidden" name="id" value={user.id} /><button className="btn-secondary w-full">Reset password (emails temporary password)</button></form>
          ) : null}
          {!self && user.status !== "DELETED" ? (
            <>
              {user.status !== "ACTIVE" && can(actor, `${mod}:edit`) ? (
                <form action={adminUserStatusAction}><input type="hidden" name="id" value={user.id} /><input type="hidden" name="status" value="ACTIVE" /><button className="btn-secondary w-full">Re-activate</button></form>
              ) : null}
              {user.status === "ACTIVE" && can(actor, "users:disable") ? (
                <form action={adminUserStatusAction}><input type="hidden" name="id" value={user.id} /><input type="hidden" name="status" value="DISABLED" /><button className="btn-secondary w-full">Disable account</button></form>
              ) : null}
              {user.status !== "BANNED" && can(actor, "users:ban") ? (
                <form action={adminUserStatusAction} className="space-y-2"><input type="hidden" name="id" value={user.id} /><input type="hidden" name="status" value="BANNED" /><input name="reason" placeholder="Reason (optional)" className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm" /><button className="w-full rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50">Ban account</button></form>
              ) : null}
              {can(actor, `${mod}:delete`) ? (
                <form action={adminAnonymizeUserAction}><input type="hidden" name="id" value={user.id} /><button className="w-full rounded-md bg-red-700 px-3 py-2 text-sm text-white hover:bg-red-800">Delete & anonymize</button></form>
              ) : null}
            </>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
